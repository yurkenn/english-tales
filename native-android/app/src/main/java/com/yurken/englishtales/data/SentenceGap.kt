package com.yurken.englishtales.data

import java.util.Locale
import kotlin.random.Random

data class GapPrompt(
    val wordId: String,
    val word: String,
    val translation: String,
    val sentence: String,
    val start: Int,
    val end: Int,
    val storyTitle: String,
    val revisionId: String,
    val sentenceId: String,
    val level: String,
) {
    val masked: String get() = sentence.replaceRange(start, end, "____")
    val answer: String get() = sentence.substring(start, end)
}

data class GapOption(val wordId: String, val label: String)
data class GapQuestion(val prompt: GapPrompt, val options: List<GapOption>)

/** Multiple-choice presentation of existing vocabulary; session wire kind remains `choice`. */
object SentenceGap {
    const val SESSION_KIND = "choice"
    private fun wordKey(text: String) = PhraseMatcher.tokens(text).joinToString(" ")
    private fun meaningKey(text: String) = text.trim().lowercase(Locale.ROOT)

    fun prompts(stories: List<Story>, dictionary: List<WordInfo>): List<GapPrompt> {
        val bundledIndex = PhraseMatcher.Index(dictionary)
        return stories.flatMap { story ->
            story.sentences.flatMap sentenceLoop@ { sentence ->
                if (sentence.english.length !in 12..240 || sentence.english.contains("____") || PhraseMatcher.tokens(sentence.english).size < 4) return@sentenceLoop emptyList()
                val allowed = story.vocabulary?.filter { it.id in story.sentenceWordIds.orEmpty()[sentence.id].orEmpty() }
                val matches = PhraseMatcher.find(sentence.english, allowed?.let { PhraseMatcher.Index(it) } ?: bundledIndex)
                matches.groupBy { wordKey(it.word.word) }.values.mapNotNull { hits ->
                    // One blank only; a second occurrence must not reveal the answer.
                    if (hits.size != 1) return@mapNotNull null
                    val match = hits.single()
                    val word = match.word
                    if (word.word.count(Char::isLetter) < 2 || word.translation.isBlank()) return@mapNotNull null
                    if (PhraseMatcher.find(sentence.english,listOf(word)).size != 1) return@mapNotNull null
                    GapPrompt(word.id, word.word, word.translation, sentence.english, match.start, match.end,
                        story.title, story.revisionId, sentence.id, story.level)
                }
            }
        }
    }

    fun session(
        prompts: List<GapPrompt>, dictionary: List<WordInfo>, priorityWordIds: List<String>, level: String,
        random: Random = Random.Default,
    ): List<GapQuestion> {
        val priority = priorityWordIds.toSet()
        // Keys are tokenized once per word, not once per word per prompt.
        val keyed = dictionary.mapNotNull { w -> wordKey(w.word).takeIf { it.isNotEmpty() && w.translation.isNotBlank() }?.let { Triple(w, it, meaningKey(w.translation)) } }
        return prompts.shuffled(random)
            .sortedWith(compareBy<GapPrompt> { if (it.wordId in priority) 0 else 1 }.thenBy { if (it.level == level) 0 else 1 })
            .distinctBy { wordKey(it.word) }
            .asSequence()
            .mapNotNull { prompt ->
                val key = wordKey(prompt.word); val meaning = meaningKey(prompt.translation)
                val distractors = keyed.filter { (w, k, m) -> w.id != prompt.wordId && k != key && m != meaning }
                    .shuffled(random).distinctBy { it.second }.distinctBy { it.third }.take(3).map { it.first }
                // Never start a question with an incomplete set of answer choices.
                if (distractors.size != 3) null else GapQuestion(prompt,
                    (listOf(GapOption(prompt.wordId, prompt.word)) + distractors.map { GapOption(it.id, it.word) }).shuffled(random))
            }.take(5).toList()
    }
}
