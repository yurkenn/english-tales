package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ReviewFocusTest {
    private val now = 1_800_000_000_000L
    private val day = LearningPolicy.DAY_MS
    private fun miss(word: String, daysAgo: Int) = ReviewFocus.missEventId(word, "d$daysAgo") to now - daysAgo * day

    @Test fun eventIdsRoundTripIncludingHyphenatedWords() {
        assertEquals("picked-up", ReviewFocus.wordOf(ReviewFocus.missEventId("picked-up", "2026-10-16")))
        assertNull(ReviewFocus.wordOf("save:quiet:2026-10-16"))
        assertNull(ReviewFocus.wordOf("miss:"))
    }

    @Test fun mostMissedDaysFirstThenLatestMiss() {
        val states = mapOf("a" to "learning", "b" to "reviewing", "c" to "learning")
        val misses = listOf(miss("a", 5), miss("b", 1), miss("b", 3), miss("c", 2))
        assertEquals(listOf("b", "c", "a"), ReviewFocus.weak(misses, states, now))
    }

    @Test fun knownUnsavedAndOldMissesAreLeftOut() {
        val states = mapOf("known" to "known", "old" to "learning", "fresh" to "learning")
        val misses = listOf(miss("known", 1), miss("removed", 1), miss("old", ReviewFocus.WINDOW_DAYS + 1), miss("fresh", ReviewFocus.WINDOW_DAYS))
        assertEquals(listOf("fresh"), ReviewFocus.weak(misses, states, now))
    }

    @Test fun practiceOrderKeepsChosenWordsFirstWithoutDuplicates() {
        assertEquals(listOf("pick", "weak", "due", "saved"),
            ReviewFocus.order(listOf("pick"), listOf("weak", "pick"), listOf("due", "weak"), listOf("saved", "due")))
    }
}
