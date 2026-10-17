package com.yurken.englishtales.data

import androidx.annotation.StringRes
import com.yurken.englishtales.R
import kotlin.math.ceil

/**
 * Estimated reading time for a learner (Q4.4): the story's English words at a level-based pace that
 * leaves room for tapping words. These are planning estimates, not measured reading speeds.
 */
object ReadingTime {
    private val wordsPerMinute = mapOf("A1" to 70, "A2" to 90, "B1" to 110)
    private val word = Regex("[A-Za-z']+")

    /**
     * Library lists ask for every story on each recomposition, so estimates are memoized. The revision
     * alone is not enough: a remote revision has no sentences until downloaded, and stories built without
     * a server revision share the bundled one, so the key also carries the level and the text itself.
     */
    private data class Key(val revisionId: String, val level: String, val sentences: List<StorySentence>)
    private val cache = java.util.concurrent.ConcurrentHashMap<Key, Int>()

    /** Null when the text is not on the device yet (a remote story before download). */
    fun minutes(story: Story): Int? {
        if (story.sentences.isEmpty()) return null
        return cache.getOrPut(Key(story.revisionId, story.level, story.sentences)) { compute(story) }
    }

    internal fun compute(story: Story): Int {
        val words = story.sentences.sumOf { word.findAll(it.english).count() }
        return ceil(words.toDouble() / (wordsPerMinute[story.level] ?: 100)).toInt().coerceAtLeast(1)
    }

    internal val cachedEntries: Int get() = cache.size
}

enum class ReadingLength(@StringRes val label: Int, val range: IntRange) {
    Short(R.string.length_short, 1..2), Medium(R.string.length_medium, 3..5), Long(R.string.length_long, 6..Int.MAX_VALUE);

    companion object {
        fun of(minutes: Int?): ReadingLength? = minutes?.let { m -> entries.firstOrNull { m in it.range } }
    }
}
