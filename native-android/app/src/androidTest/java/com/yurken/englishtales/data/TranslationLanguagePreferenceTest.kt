package com.yurken.englishtales.data

import android.content.Context
import android.content.ContextWrapper
import android.content.res.Configuration
import android.os.LocaleList
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.AppLanguage
import org.junit.Assert.*
import org.junit.Test
import java.util.UUID

class TranslationLanguagePreferenceTest {
    private val target get() = InstrumentationRegistry.getInstrumentation().targetContext

    @Test fun englishUiAndExplicitTranslationSurviveContextRecreationAndReset() {
        val prefix = "translation-test-${UUID.randomUUID()}"
        fun context(tag: String): Context {
            val base = target.createConfigurationContext(Configuration(target.resources.configuration).apply {
                setLocales(LocaleList.forLanguageTags(tag))
            })
            return object : ContextWrapper(base) {
                override fun getSharedPreferences(name: String, mode: Int) = target.getSharedPreferences("$prefix-$name", mode)
            }
        }
        val english = context("en")
        try {
            assertEquals("tr", TranslationLanguage.effective(english))
            assertTrue(TranslationLanguage.select(english, "es-419"))
            assertEquals("en", AppLanguage.locale(english).language)
            val restored = context("en")
            assertEquals("es-419", TranslationLanguage.effective(restored))
            LearningContent.initialize(restored)
            assertEquals("es-419", SupportLanguage.code)
            val spanishSentence = LearningContent.bundledStories.first().sentences.first().translation
            val spanishGlossary = LearningContent.glossarySource
            assertTrue(TranslationLanguage.select(restored, "ar"))
            LearningContent.initialize(context("en"))
            assertEquals("ar", SupportLanguage.code)
            assertNotEquals(spanishSentence, LearningContent.bundledStories.first().sentences.first().translation)
            assertNotEquals(spanishGlossary, LearningContent.glossarySource)
            assertEquals("ar", TranslationLanguage.effective(context("tr")))
            assertTrue(TranslationLanguage.select(restored, ""))
            assertEquals("tr", TranslationLanguage.effective(restored))
            assertEquals("es-419", TranslationLanguage.effective(context("es-MX")))
            assertTrue(runCatching { TranslationLanguage.select(restored, "en") }.isFailure)
        } finally {
            english.getSharedPreferences("app_language", Context.MODE_PRIVATE).edit().clear().commit()
            LearningContent.resetForTest()
            LearningContent.initialize(target)
        }
    }
}
