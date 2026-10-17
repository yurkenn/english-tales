package com.yurken.englishtales.data

/**
 * Q5.8: the question type follows the word's stage, from easiest to hardest: recognise (pick the meaning),
 * recall (build it from letters), context (fill it into a story sentence) and listening (hear it, pick the
 * meaning). Step 2 places words on this ladder by their FSRS stability (Q5.7). A rung that cannot be built
 * for a word (no story sentence, no English voice) falls back to the rung below it.
 */
object PracticeLadder {
    const val SESSION_KIND = "choice"
    const val RECOGNISE = "choice"
    const val RECALL = "spell"
    const val CONTEXT = "cloze"
    const val LISTEN = "listen"
    /** A reviewing word remembered for about a week has outgrown letter building. */
    const val CONTEXT_STABILITY_DAYS = 7.0

    private val order = listOf(RECOGNISE, RECALL, CONTEXT, LISTEN)

    fun modeFor(state: String?, stability: Double?, hasContext: Boolean, canListen: Boolean): String {
        val rung = when {
            state == null || state == "learning" -> RECOGNISE
            state == "known" -> LISTEN
            stability == null || stability < CONTEXT_STABILITY_DAYS -> RECALL
            else -> CONTEXT
        }
        return when {
            rung == LISTEN && canListen -> LISTEN
            (rung == LISTEN || rung == CONTEXT) && hasContext -> CONTEXT
            rung == RECOGNISE -> RECOGNISE
            else -> RECALL
        }
    }

    /**
     * The session's words with their drills, ordered by rung so the session climbs the ladder: the per-word
     * drills first, then the context questions, then listening. Words on the same rung keep their order.
     */
    fun plan(wordIds: List<String>, states: Map<String, String>, stability: Map<String, Double>,
             contextWordIds: Set<String>, canListen: Boolean): List<Pair<String, String>> =
        wordIds.map { it to modeFor(states[it], stability[it], it in contextWordIds, canListen) }
            .sortedBy { order.indexOf(it.second) }

    fun modes(wordIds: List<String>, states: Map<String, String>): List<String> =
        wordIds.map { modeFor(states[it], null, hasContext = false, canListen = false) }

    /** Recognise and recall are drawn one word at a time; context and listening run as their own games. */
    fun isWordDrill(mode: String) = mode == RECOGNISE || mode == RECALL
}
