package com.yurken.englishtales.data

import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class SupportLanguageTest {
    @Test fun perLanguageMapWinsOverLegacyField() {
        val item=JSONObject().put("turkish","Eski").put("translations",JSONObject().put("tr","Yeni").put("es-419","Nuevo"))
        assertEquals("Yeni",SupportLanguage.pick(item,"translations","turkish"))
        assertEquals("Nuevo",SupportLanguage.pick(item,"translations","turkish","es-419"))
    }
    @Test fun turkishFallsBackToLegacyFieldWhenMapIsMissingOrBlank() {
        assertEquals("Eski",SupportLanguage.pick(JSONObject().put("turkish","Eski"),"translations","turkish"))
        val blank=JSONObject().put("turkish","Eski").put("translations",JSONObject().put("tr"," "))
        assertEquals("Eski",SupportLanguage.pick(blank,"translations","turkish"))
    }
    @Test fun otherLanguagesNeverShowTurkishInstead() {
        val item=JSONObject().put("turkish","Eski")
        assertTrue(runCatching {SupportLanguage.pick(item,"translations","turkish","es-419")}.isFailure)
    }
}
