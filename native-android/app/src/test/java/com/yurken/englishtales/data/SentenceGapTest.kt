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
}
