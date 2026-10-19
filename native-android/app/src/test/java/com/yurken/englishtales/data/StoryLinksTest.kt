package com.yurken.englishtales.data

import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

class StoryLinksTest {
    @Test fun sharedUrlRoundTrips() {
        val url = StoryLinks.url("quiet-morning")
        assertEquals("https://englishtales-app.web.app/story/quiet-morning", url)
        assertEquals("quiet-morning", StoryLinks.storyId(url))
        assertEquals("quiet-morning", StoryLinks.storyId("$url/"))
        assertEquals("quiet-morning", StoryLinks.storyId("$url?utm_source=share#top"))
        assertEquals("quiet-morning", StoryLinks.storyId("https://EnglishTales-App.web.app/story/quiet-morning"))
    }

    @Test fun otherAddressesAreIgnored() {
        listOf(null, "", "not a url", "http://englishtales-app.web.app/story/quiet-morning",
            "https://evil.example/story/quiet-morning", "https://englishtales-app.web.app.evil.example/story/a",
            "https://englishtales-app.web.app:8443/story/quiet-morning", "https://englishtales-app.web.app/privacy",
            "https://englishtales-app.web.app/story/", "https://englishtales-app.web.app/story/a/b",
            "https://englishtales-app.web.app/story/Quiet", "https://englishtales-app.web.app/story/%2e%2e",
            "https://englishtales-app.web.app/story/-dash", "https://englishtales-app.web.app/story/" + "a".repeat(81)
        ).forEach { assertNull(it, StoryLinks.storyId(it)) }
    }

    @Test fun unknownStoryWaitsForOneRefresh() = runBlocking {
        val catalog = mutableSetOf("old-story"); var refreshes = 0
        assertTrue(StoryLinks.resolve("old-story", catalog::contains) { refreshes++ })
        assertEquals(0, refreshes)
        // The cached catalog predates the shared story; the refresh publishes it.
        assertTrue(StoryLinks.resolve("new-story", catalog::contains) { refreshes++; catalog += "new-story" })
        assertEquals(1, refreshes)
        // Offline, or the story is gone: one refresh, then the library.
        assertFalse(StoryLinks.resolve("missing", catalog::contains) { refreshes++ })
        assertEquals(2, refreshes)
    }
}
