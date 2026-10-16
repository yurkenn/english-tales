package com.yurken.englishtales.data

/**
 * F01: words the learner keeps getting wrong. Misses are local engagement events (one per word and day),
 * so the selection only changes which saved words come first; the review intervals stay those of [LearningPolicy].
 */
object ReviewFocus {
    const val WINDOW_DAYS = 30
    private const val PREFIX = "miss:"

    fun missEventId(wordId: String, day: String) = "$PREFIX$wordId:$day"
    fun wordOf(eventId: String): String? = eventId.takeIf { it.startsWith(PREFIX) }?.removePrefix(PREFIX)?.substringBeforeLast(':', "")?.takeIf { it.isNotEmpty() }

    /** Saved, not yet known words missed within the window: most missed days first, then the latest miss. */
    fun weak(misses: List<Pair<String, Long>>, states: Map<String, String>, now: Long): List<String> {
        val since = now - WINDOW_DAYS * LearningPolicy.DAY_MS
        return misses.mapNotNull { (eventId, at) ->
            val word = wordOf(eventId) ?: return@mapNotNull null
            val state = states[word] ?: return@mapNotNull null // no longer saved
            if (at < since || state == "known") null else word to at
        }
            .groupBy({ it.first }, { it.second })
            .entries.sortedWith(compareByDescending<Map.Entry<String, List<Long>>> { it.value.size }.thenByDescending { it.value.max() }.thenBy { it.key })
            .map { it.key }
    }

    /** Practice order: chosen words, then weak, then due, then the rest of the saved list. */
    fun order(seeded: List<String>, weak: List<String>, due: List<String>, saved: List<String>) = (seeded + weak + due + saved).distinct()
}
