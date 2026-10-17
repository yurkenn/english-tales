package com.yurken.englishtales.data

import org.junit.Assert.*
import org.junit.Test

class ReadingTimeTest {
    private fun story(level: String, words: Int) = Story("s", "S", "A", level, "Macera", "", "remote",
        if (words == 0) emptyList() else listOf(StorySentence("1", List(words) { "word" }.joinToString(" "), "")))

    @Test fun paceDependsOnLevelAndRoundsUp() {
        assertEquals(2, ReadingTime.minutes(story("A1", 93)))
        assertEquals(3, ReadingTime.minutes(story("A2", 236)))
        assertEquals(4, ReadingTime.minutes(story("B1", 362)))
        assertEquals(1, ReadingTime.minutes(story("A1", 1)))
    }

    @Test fun undownloadedStoriesHaveNoEstimate() {
        assertNull(ReadingTime.minutes(story("A1", 0)))
    }

    @Test fun memoizedEstimateMatchesComputedOneAndRevisionsKeepSeparateEntries() {
        val first = story("A1", 140).copy(revisionId = "11111111-1111-4111-a111-111111111111")
        val second = story("A1", 700).copy(revisionId = "22222222-2222-4222-a222-222222222222")
        val before = ReadingTime.cachedEntries
        assertEquals(ReadingTime.compute(first), ReadingTime.minutes(first))
        assertEquals(ReadingTime.compute(second), ReadingTime.minutes(second))
        assertEquals(before + 2, ReadingTime.cachedEntries)
        assertEquals(2, ReadingTime.minutes(first)); assertEquals(10, ReadingTime.minutes(second))
        assertEquals(before + 2, ReadingTime.cachedEntries)
        // The same revision with other text or level (fixtures share the bundled revision) is not served stale.
        assertEquals(ReadingTime.compute(story("B1", 700).copy(revisionId = second.revisionId)), ReadingTime.minutes(story("B1", 700).copy(revisionId = second.revisionId)))
        assertEquals(ReadingTime.compute(first.copy(sentences = second.sentences)), ReadingTime.minutes(first.copy(sentences = second.sentences)))
        assertEquals(before + 4, ReadingTime.cachedEntries)
    }

    @Test fun lengthBucketsCoverEveryMinute() {
        assertEquals(ReadingLength.Short, ReadingLength.of(2))
        assertEquals(ReadingLength.Medium, ReadingLength.of(3))
        assertEquals(ReadingLength.Medium, ReadingLength.of(5))
        assertEquals(ReadingLength.Long, ReadingLength.of(6))
        assertNull(ReadingLength.of(null))
    }

    @Test fun lengthFilterCombinesWithOtherFiltersAndSkipsUnknownLengths() {
        val short = story("A1", 90); val long = story("B1", 800); val unknown = story("A1", 0)
        val filter = StoryFilters(length = ReadingLength.Short)
        assertTrue(filter.active)
        assertTrue(filter.matches(short, 0)); assertFalse(filter.matches(long, 0)); assertFalse(filter.matches(unknown, 0))
        assertFalse(filter.copy(level = "A2").matches(short, 0))
    }
}
