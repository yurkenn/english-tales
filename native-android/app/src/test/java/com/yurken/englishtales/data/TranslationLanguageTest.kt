package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Test
import java.util.Locale

class TranslationLanguageTest {
    @Test fun existingInstallationsKeepTheirPreviousFallback() {
        assertEquals("tr", TranslationLanguage.resolve("", Locale.ENGLISH))
        assertEquals("es-419", TranslationLanguage.resolve("", Locale.forLanguageTag("es-MX")))
        assertEquals("id", TranslationLanguage.resolve("", Locale.forLanguageTag("in-ID")))
    }

    @Test fun explicitLanguageSurvivesUiLanguageChanges() {
        for (translation in SupportLanguage.enabled) {
            for (ui in listOf("en", "tr", "ar", "es-MX")) {
                assertEquals(translation, TranslationLanguage.resolve(translation, Locale.forLanguageTag(ui)))
            }
        }
    }

    @Test fun unsupportedStoredValuesUseTheExistingUiFallback() {
        assertEquals("ar", TranslationLanguage.resolve("removed-language", Locale.forLanguageTag("ar-EG")))
        assertEquals("tr", TranslationLanguage.resolve("en", Locale.ENGLISH))
    }
}
