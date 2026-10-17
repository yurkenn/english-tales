package com.yurken.englishtales

import org.junit.Assert.assertEquals
import org.junit.Test
import java.util.Locale

class AppLanguageTest {
    @Test fun shippedLanguageIsKeptInPreferenceOrder() {
        assertEquals("tr", AppLanguage.resolve(listOf(Locale.forLanguageTag("tr-TR"))).language)
        assertEquals("en", AppLanguage.resolve(listOf(Locale.forLanguageTag("en-GB"), Locale.forLanguageTag("tr"))).language)
        assertEquals("tr", AppLanguage.resolve(listOf(Locale.forLanguageTag("es-MX"), Locale.forLanguageTag("tr"))).language)
    }

    @Test fun unsupportedDevicesGetEnglishInsteadOfTurkish() {
        assertEquals(Locale.ENGLISH, AppLanguage.resolve(listOf(Locale.forLanguageTag("es-MX"), Locale.forLanguageTag("pt-BR"))))
        assertEquals(Locale.ENGLISH, AppLanguage.resolve(emptyList()))
    }
}
