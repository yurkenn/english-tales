package com.yurken.englishtales.data

import org.junit.Assert.*
import org.junit.Test
import kotlin.random.Random

class SentenceGapTest {
    private fun word(id: String, text: String=id, meaning: String="anlam-$id") = WordInfo(id,text,meaning,"","")
    private fun story(text: String, vocabulary: List<WordInfo>?=null, links: List<String>?=null, level: String="A1") =
        Story("story","A story","Author",level,"Macera","","cover",listOf(StorySentence("sentence",text,"")),
            vocabulary=vocabulary,sentenceWordIds=links?.let {mapOf("sentence" to it)})

    @Test fun wholeTokensAndOriginalPunctuationSurviveMasking() {
        val words=listOf(word("cat"),word("picked-up","picked up"))
        val prompts=SentenceGap.prompts(listOf(story("The category was clear when she picked-up the bag.")),words)
        assertEquals(1,prompts.size)
        val prompt=prompts.single()
        assertEquals("The category was clear when she ____ the bag.",prompt.masked)
        assertEquals("picked-up",prompt.answer)
        assertEquals(prompt.sentence,prompt.masked.replace("____",prompt.answer))
    }

    @Test fun repeatedOrOverlappingVisibleAnswersAreExcluded() {
        assertTrue(SentenceGap.prompts(listOf(story("The cat watched another CAT near the tree.")),listOf(word("cat"))).isEmpty())
        val words=listOf(word("look"),word("care","look after"))
        val prompts=SentenceGap.prompts(listOf(story("Look here and look after the little child.")),words)
        assertFalse(prompts.any {it.wordId=="look"})
        assertTrue(prompts.any {it.wordId=="care"})
    }

    @Test fun publishedContentUsesOnlyEditorLinkedWordsAndAvailableSentences() {
        val cat=word("cat");val bag=word("bag")
        val source=story("The cat sat near the bag.",listOf(cat,bag),listOf("bag"))
        val prompts=SentenceGap.prompts(listOf(source),listOf(cat,bag,word("near")))
        assertEquals(listOf("bag"),prompts.map {it.wordId})
        assertEquals(source.revisionId,prompts.single().revisionId)
        assertTrue(SentenceGap.prompts(listOf(source.copy(sentenceWordIds=emptyMap())),listOf(cat,bag)).isEmpty())
        assertTrue(SentenceGap.prompts(listOf(source.copy(sentences=emptyList())),listOf(cat,bag)).isEmpty())
    }

    @Test fun tinyOrUnreasonablyLongSentencesDoNotBecomeQuestions() {
        val cat=word("cat")
        assertTrue(SentenceGap.prompts(listOf(story("The cat."),story("The cat "+"walked ".repeat(40)),story("The cat was waiting near ____ today.")),listOf(cat)).isEmpty())
    }

    @Test fun sessionUsesFiveDistinctWordsAndFourDifferentChoices() {
        val words=(1..8).map {word("word$it")}
        val prompts=SentenceGap.prompts(words.map {story("She found ${it.word} near the tree.")},words)
        val session=SentenceGap.session(prompts,words,emptyList(),"A1",Random(1))
        assertEquals(5,session.size)
        assertEquals(5,session.map {it.prompt.wordId}.distinct().size)
        session.forEach {q ->
            assertEquals(4,q.options.size)
            assertEquals(4,q.options.map {it.label}.distinct().size)
            assertEquals(1,q.options.count {it.wordId==q.prompt.wordId})
        }
    }

    @Test fun duplicateSpellingsAndMeaningsCannotBeDistractorsForTheAnswer() {
        val words=listOf(word("cat"),word("alias","CAT"),word("same-meaning","kitten","anlam-cat"),word("dog"),word("bird"),word("fish"))
        val prompt=SentenceGap.prompts(listOf(story("The cat was waiting near the tree.")),listOf(words.first())).single()
        val question=SentenceGap.session(listOf(prompt),words,emptyList(),"A1",Random(1)).single()
        assertEquals(setOf("cat","dog","bird","fish"),question.options.map {it.wordId}.toSet())
    }

    @Test fun dueWordsAndThenCurrentLevelTakePriority() {
        val words=(1..8).map {word("word$it")}
        val sources=words.mapIndexed {i,w ->story("She found ${w.word} near the tree.",level=if(i<4) "A1" else "B1")}
        val prompts=SentenceGap.prompts(sources,words)
        val session=SentenceGap.session(prompts,words,listOf("word8"),"A1",Random(2))
        assertEquals("word8",session.first().prompt.wordId)
        assertTrue(session.drop(1).all {it.prompt.level=="A1"})
    }

    @Test fun insufficientChoicesOrContentNeverStartAnEmptyQuestion() {
        val words=listOf(word("cat"),word("dog"),word("bird"))
        val prompts=SentenceGap.prompts(listOf(story("The cat was waiting near the tree.")),words)
        assertTrue(SentenceGap.session(prompts,words,emptyList(),"A1").isEmpty())
        assertTrue(SentenceGap.session(emptyList(),words,emptyList(),"A1").isEmpty())
    }

    @Test fun precomputedDictionaryKeysKeepSessionsIdentical() {
        // The pre-change session, with keys recomputed per dictionary word for every prompt.
        fun key(text: String)=PhraseMatcher.tokens(text).joinToString(" ")
        fun meaning(text: String)=text.trim().lowercase(java.util.Locale.ROOT)
        fun reference(prompts: List<GapPrompt>, dictionary: List<WordInfo>, priorityIds: List<String>, level: String, random: Random): List<GapQuestion> {
            val priority=priorityIds.toSet()
            return prompts.shuffled(random).sortedWith(compareBy<GapPrompt> {if(it.wordId in priority) 0 else 1}.thenBy {if(it.level==level) 0 else 1})
                .distinctBy {key(it.word)}.asSequence().mapNotNull {prompt ->
                    val distractors=dictionary.filter {it.id!=prompt.wordId && key(it.word).isNotEmpty() && key(it.word)!=key(prompt.word) &&
                        it.translation.isNotBlank() && meaning(it.translation)!=meaning(prompt.translation)}
                        .shuffled(random).distinctBy {key(it.word)}.distinctBy {meaning(it.translation)}.take(3)
                    if(distractors.size!=3) null else GapQuestion(prompt,(listOf(GapOption(prompt.wordId,prompt.word))+distractors.map {GapOption(it.id,it.word)}).shuffled(random))
                }.take(5).toList()
        }
        // Duplicate spellings, case variants, shared and blank meanings, and words with no tokens.
        val dictionary=(1..3000).map {i ->when(i%11) {
            0->word("w$i","Word${i/2}","anlam-${i/3}")
            1->word("w$i","word${i/2}"," ANLAM-${i/3} ")
            2->word("w$i","w$i","  ")
            3->word("w$i","--","anlam-$i")
            4->word("w$i","look after $i","bakmak-$i")
            else->word("w$i","word$i","anlam-$i")
        }}
        val prompts=dictionary.filter {it.word.any(Char::isLetter)}.take(400).mapIndexed {i,w ->
            GapPrompt(w.id,w.word,w.translation,"She found ${w.word} near the tree.",10,10+w.word.length,"t","r$i","s$i",if(i%3==0) "B1" else "A1")
        }
        val priority=dictionary.shuffled(Random(7)).take(40).map {it.id}
        listOf(1,2,3,42,1234).forEach {seed ->
            listOf(prompts,prompts.take(3),prompts.filter {it.wordId in priority}).forEach {sample ->
                listOf(dictionary,dictionary.take(5)).forEach {dict ->
                    assertEquals(reference(sample,dict,priority,"A1",Random(seed)),SentenceGap.session(sample,dict,priority,"A1",Random(seed)))
                }
            }
        }
        assertEquals(5,SentenceGap.session(prompts,dictionary,priority,"A1",Random(1)).size)
    }
}
