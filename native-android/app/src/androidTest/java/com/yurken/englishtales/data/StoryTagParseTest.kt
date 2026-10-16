package com.yurken.englishtales.data

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test

/** org.json is only a stub in JVM unit tests, so tag parsing is checked on the device. */
class StoryTagParseTest {
    @Test fun bundledIdsTakeNamesFromTheVocabulary() {
        val tags = StoryTag.parse(JSONArray(listOf("fabl", "macera", "fabl")), mapOf("fabl" to "Fabl", "macera" to "Macera"))
        assertEquals(listOf(StoryTag("fabl", "Fabl"), StoryTag("macera", "Macera")), tags)
    }

    @Test fun revisionDocumentsCarryTheirOwnNames() {
        val array = JSONArray().put(JSONObject().put("id", "masal").put("name", "Masal")).put(JSONObject().put("id", "yeni").put("name", ""))
        assertEquals(listOf(StoryTag("masal", "Masal"), StoryTag("yeni", "yeni")), StoryTag.parse(array))
        assertEquals(emptyList<StoryTag>(), StoryTag.parse(null))
    }
}
