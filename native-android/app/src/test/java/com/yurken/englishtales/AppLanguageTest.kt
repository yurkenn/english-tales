package com.yurken.englishtales

import org.junit.Assert.assertEquals
import org.junit.Test
import java.util.Locale

class AppLanguageTest {
    @Test fun shippedLanguageIsKeptInPreferenceOrder() {
        assertEquals("tr", AppLanguage.resolve(listOf(Locale.forLanguageTag("tr-TR"))).language)
        assertEquals("en", AppLanguage.resolve(listOf(Locale.forLanguageTag("en-GB"), Locale.forLanguageTag("tr"))).language)
        assertEquals("es-419", AppLanguage.resolve(listOf(Locale.forLanguageTag("es-MX"), Locale.forLanguageTag("tr"))).toLanguageTag())
    }

    @Test fun unsupportedDevicesGetEnglishInsteadOfTurkish() {
        assertEquals(Locale.ENGLISH, AppLanguage.resolve(listOf(Locale.forLanguageTag("de-DE"), Locale.forLanguageTag("fr-FR"))))
        assertEquals(Locale.ENGLISH, AppLanguage.resolve(emptyList()))
    }

    @Test fun everyNewLanguageResolvesAndRegionalVariantsUseTheirShippedResources() {
        for (tag in listOf("id", "ar", "vi", "hi", "ru", "bn", "ur", "th"))
            assertEquals(tag, AppLanguage.resolve(listOf(Locale.forLanguageTag(tag))).language)
        assertEquals("pt-BR", AppLanguage.resolve(listOf(Locale.forLanguageTag("pt-PT"))).toLanguageTag())
        assertEquals("es-419", AppLanguage.resolve(listOf(Locale.forLanguageTag("es-ES"))).toLanguageTag())
    }
}
