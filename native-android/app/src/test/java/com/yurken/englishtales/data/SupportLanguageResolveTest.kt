package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Test
import java.util.Locale

class SupportLanguageResolveTest {
    private fun locales(vararg tags: String) = tags.map { Locale.forLanguageTag(it) }

    @Test fun onlyPublishedLanguagesAreChosen() {
        assertEquals("es-419", SupportLanguage.resolve(locales("es-MX", "en-US")))
        assertEquals("tr", SupportLanguage.resolve(locales("es-MX", "en-US"), listOf("tr")))
        assertEquals("tr", SupportLanguage.resolve(emptyList()))
    }

    @Test fun regionalVariantsShareOneTranslationInPreferenceOrder() {
        val available = listOf("tr", "es-419", "pt-BR", "ar")
        assertEquals("es-419", SupportLanguage.resolve(locales("es-ES", "tr"), available))
        assertEquals("pt-BR", SupportLanguage.resolve(locales("pt-PT"), available))
        assertEquals("ar", SupportLanguage.resolve(locales("en-GB", "ar-EG"), available))
        assertEquals("tr", SupportLanguage.resolve(locales("tr-TR", "es-MX"), available))
        assertEquals("tr", SupportLanguage.resolve(locales("de-DE"), available))
    }
}
