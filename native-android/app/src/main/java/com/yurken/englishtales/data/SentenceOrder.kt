package com.yurken.englishtales.data

import kotlin.random.Random

/** Q5.9: rebuild a story sentence from its shuffled words. Session wire kind remains `choice`. */
data class OrderQuestion(
    val sentence: String,
    val translation: String,
    val storyTitle: String,
    val level: String,
    val sentenceId: String,
    /** The sentence's words with their punctuation, in shuffled order. */
    val tiles: List<String>,
) {
    /** Duplicate words ("the … the") are interchangeable, so an answer is judged by its text, not tile positions. */
    fun isCorrect(order: List<Int>) = order.size == tiles.size && order.joinToString(" ") { tiles[it] } == SentenceOrder.words(sentence).joinToString(" ")
}

object SentenceOrder {
    const val SESSION_KIND = "choice"
    private const val MIN_WORDS = 4
    private const val MAX_WORDS = 10

    fun words(sentence: String) = sentence.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }

    /** Short, complete sentences only: long ones turn into guessing, and quotes or dashes make tiles ambiguous. */
    fun candidates(stories: List<Story>): List<OrderQuestion> = stories.flatMap { story ->
        story.sentences.mapNotNull { sentence ->
            val words = words(sentence.english)
            if (words.size !in MIN_WORDS..MAX_WORDS || sentence.translation.isBlank()) return@mapNotNull null
            if (sentence.english.any { it in "\"“”‘’—–()" } || words.map { w -> w.lowercase().trim { !it.isLetterOrDigit() } }.distinct().size < 3) return@mapNotNull null
            OrderQuestion(sentence.english.trim(), sentence.translation, story.title, story.level, sentence.id, words)
        }
    }

    /** Five sentences, the learner's level first, each shuffled so it never starts in its correct order. */
    fun session(candidates: List<OrderQuestion>, level: String, random: Random = Random.Default): List<OrderQuestion> =
        candidates.shuffled(random).sortedBy { if (it.level == level) 0 else 1 }.distinctBy { it.sentence }.take(5).map { question ->
            val original = question.tiles.joinToString(" ")
            var tiles = question.tiles.shuffled(random)
            repeat(10) { if (tiles.joinToString(" ") == original) tiles = question.tiles.shuffled(random) }
            if (tiles.joinToString(" ") == original) tiles = question.tiles.reversed()
            question.copy(tiles = tiles)
        }
}
