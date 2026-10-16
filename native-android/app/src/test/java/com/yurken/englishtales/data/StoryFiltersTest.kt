package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class StoryFiltersTest {
    private fun story(id: String, level: String) = Story(id, id, "", level, "Macera", "", "remote", emptyList())
    private val library = listOf(story("a1-new", "A1") to 0, story("a1-half", "A1") to 40, story("a2-done", "A2") to 100, story("b1-new", "B1") to 0)
    private fun ids(filters: StoryFilters) = library.filter { (story, progress) -> filters.matches(story, progress) }.map { it.first.id }

    @Test fun noFilterKeepsEverything() {
        assertFalse(StoryFilters().active)
        assertEquals(listOf("a1-new", "a1-half", "a2-done", "b1-new"), ids(StoryFilters()))
    }

    @Test fun levelAndStatusCombine() {
        assertEquals(listOf("a1-new", "a1-half"), ids(StoryFilters(level = "A1")))
        assertEquals(listOf("a1-new", "b1-new"), ids(StoryFilters(status = ReadingStatus.Unread)))
        assertEquals(listOf("a1-half"), ids(StoryFilters("A1", ReadingStatus.InProgress)))
        assertEquals(emptyList<String>(), ids(StoryFilters("B1", ReadingStatus.Finished)))
        assertTrue(StoryFilters(status = ReadingStatus.Finished).active)
    }

    @Test fun statusFollowsProgress() {
        assertEquals(ReadingStatus.Unread, ReadingStatus.of(0))
        assertEquals(ReadingStatus.InProgress, ReadingStatus.of(1))
        assertEquals(ReadingStatus.InProgress, ReadingStatus.of(99))
        assertEquals(ReadingStatus.Finished, ReadingStatus.of(100))
    }

    @Test fun offlineFilterKeepsStoriesWhoseTextIsOnTheDevice() {
        val text = listOf(StorySentence("s-1", "A day.", "Bir gün."))
        val onDevice = story("downloaded", "A1").copy(sentences = text)
        val shelf = listOf(onDevice to 0, story("remote", "A1") to 0, story("remote-b1", "B1") to 0)
        fun ids(filters: StoryFilters) = shelf.filter { (story, progress) -> filters.matches(story, progress) }.map { it.first.id }
        assertTrue(StoryFilters(offlineOnly = true).active)
        assertEquals(listOf("downloaded"), ids(StoryFilters(offlineOnly = true)))
        assertEquals(emptyList<String>(), ids(StoryFilters(level = "B1", offlineOnly = true)))
        assertEquals(listOf("downloaded", "remote", "remote-b1"), ids(StoryFilters()))
    }
}
