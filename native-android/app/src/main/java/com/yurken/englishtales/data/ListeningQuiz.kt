package com.yurken.englishtales.data

data class ListeningQuestion(val wordId: String, val word: String, val answer: String, val options: List<String>)

/** Listen-and-choose (Q5.2): the English word is only heard; the learner picks its meaning. */
object ListeningQuiz {
    /** Recorded as a choice lesson so points, sessions and sync keep their existing contract. */
    const val SESSION_KIND = "choice"

    fun questions(words: List<WordInfo>, dictionary: List<WordInfo>, random: kotlin.random.Random = kotlin.random.Random.Default): List<ListeningQuestion> =
        words.distinctBy { it.id }.map { word ->
            val answer = word.translation.trim()
            // Distractors must differ from the answer as the learner reads it, not only by ID.
            val distractors = dictionary.asSequence().map { it.translation.trim() }
                .filter { it.isNotEmpty() && !it.equals(answer, ignoreCase = true) }
                .distinctBy { it.lowercase() }.toList().shuffled(random).take(3)
            ListeningQuestion(word.id, word.word, answer, (distractors + answer).shuffled(random))
        }
}
