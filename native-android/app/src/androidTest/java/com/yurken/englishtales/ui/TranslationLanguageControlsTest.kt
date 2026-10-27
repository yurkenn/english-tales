package com.yurken.englishtales.ui

import android.content.Context
import android.content.ContextWrapper
import android.content.res.Configuration
import android.os.LocaleList
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.AppLanguage
import com.yurken.englishtales.data.TranslationLanguage
import org.junit.After
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import java.util.UUID

class TranslationLanguageControlsTest {
    @get:Rule val compose = createComposeRule()
    private val target = InstrumentationRegistry.getInstrumentation().targetContext
    private val prefix = "translation-ui-${UUID.randomUUID()}"
    private val context by lazy {
        val base = target.createConfigurationContext(Configuration(target.resources.configuration).apply {
            setLocales(LocaleList.forLanguageTags("en"))
        })
        object : ContextWrapper(base) {
            override fun getSharedPreferences(name: String, mode: Int) = target.getSharedPreferences("$prefix-$name", mode)
        }
    }
    @After fun cleanup() { context.getSharedPreferences("app_language", Context.MODE_PRIVATE).edit().clear().commit() }

    @Test fun selectionOnlyAppliesOnSaveAndDoesNotChangeEnglishUi() {
        var reloads = 0
        compose.setContent { CompositionLocalProvider(LocalContext provides context) {
            EnglishTalesTheme { TranslationLanguageControls { reloads++ } }
        } }
        compose.onNodeWithTag("translation_language").performClick()
        compose.onNodeWithTag("translation_option_es-419").performScrollTo().performClick()
        compose.runOnIdle {
            assertEquals("", TranslationLanguage.selection(context))
            assertEquals(0, reloads)
        }
        compose.onNodeWithTag("translation_language_save").performClick()
        compose.waitUntil(5_000) { reloads == 1 }
        compose.runOnIdle {
            assertEquals("es-419", TranslationLanguage.selection(context))
            assertEquals("en", AppLanguage.locale(context).language)
        }
        compose.onNodeWithTag("translation_language").performClick()
        compose.onNodeWithTag("translation_option_es-419").assertIsSelected()
        compose.onNodeWithTag("translation_option_ar").performScrollTo().performClick()
        compose.onNodeWithText(context.getString(com.yurken.englishtales.R.string.kapat)).performClick()
        compose.runOnIdle { assertEquals("es-419", TranslationLanguage.selection(context)); assertEquals(1, reloads) }
        compose.onNodeWithTag("translation_language").performClick()
        compose.onNodeWithTag("translation_option_auto").performScrollTo().performClick()
        compose.onNodeWithTag("translation_language_save").performClick()
        compose.waitUntil(5_000) { reloads == 2 }
        compose.runOnIdle { assertEquals("tr", TranslationLanguage.effective(context)) }
    }
}
