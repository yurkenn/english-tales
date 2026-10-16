package com.yurken.englishtales.data

/**
 * Q5.8: the question type follows the word's stage. A word still being learned is recognised (pick its
 * meaning); once it has been answered correctly it moves to recall (build it from letters). Sentence
 * context and listening stay separate modes; this ladder decides between the two per-word drills.
 */
object PracticeLadder {
    const val SESSION_KIND = "choice"
    const val RECOGNISE = "choice"
    const val RECALL = "spell"

    fun modeFor(state: String?): String = if (state == null || state == "learning") RECOGNISE else RECALL

    fun modes(wordIds: List<String>, states: Map<String, String>): List<String> = wordIds.map { modeFor(states[it]) }
}
