package com.yurken.englishtales.data

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
}
