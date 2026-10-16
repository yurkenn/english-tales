package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Test

class StoryTagTest {
    private fun story(genre: String, tags: List<StoryTag> = emptyList()) = Story("s", "S", "", "A1", genre, "", "c", emptyList(), tags = tags)

    @Test fun storiesWithoutTagsFallBackToTheirGenre() {
        assertEquals(listOf(StoryTag("gunluk-yasam", "Günlük yaşam")), StoryTag.of(story("Günlük yaşam")))
        val tagged = listOf(StoryTag("masal", "Masal"))
        assertEquals(tagged, StoryTag.of(story("Macera", tagged)))
    }
}
