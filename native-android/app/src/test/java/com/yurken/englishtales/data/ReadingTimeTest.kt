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
