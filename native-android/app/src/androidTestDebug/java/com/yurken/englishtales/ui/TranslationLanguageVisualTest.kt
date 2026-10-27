package com.yurken.englishtales.ui

import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.graphics.Bitmap
import androidx.activity.compose.setContent
import androidx.test.core.app.ActivityScenario
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.R
import com.yurken.englishtales.TranslationVisualActivity
import org.junit.Rule
import org.junit.Test
import java.io.File
import java.util.UUID

/** Real emulator screenshots of the picker component; not a full app or physical-device audit. */
class TranslationLanguageVisualTest {
    @get:Rule val compose = createEmptyComposeRule()

    @Test fun englishPicker() = inspect("en", 1f, "english")
    @Test fun arabicPicker() = inspect("ar", 1f, "arabic")
    @Test fun largeEnglishPicker() = inspect("en", 1.5f, "english-large")

    private fun inspect(language: String, scale: Float, name: String) {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val target = instrumentation.targetContext
        val prefix = "translation-visual-${UUID.randomUUID()}"
        TranslationVisualActivity.language = language
        TranslationVisualActivity.textScale = scale
        val intent = Intent(target, TranslationVisualActivity::class.java)
        ActivityScenario.launch<TranslationVisualActivity>(intent).use { scenario ->
            lateinit var context: Context
            scenario.onActivity { activity ->
                context = object : ContextWrapper(activity) {
                    override fun getSharedPreferences(name: String, mode: Int) = target.getSharedPreferences("$prefix-$name", mode)
                }
                check(activity.resources.configuration.locales[0].language == language)
                check(activity.resources.configuration.fontScale == scale)
                activity.setContent { CompositionLocalProvider(LocalContext provides context) {
                    EnglishTalesTheme { TranslationLanguageControls {} }
                } }
            }
            try {
                compose.onNodeWithTag("translation_language").performClick()
                compose.onNodeWithText(context.getString(R.string.translation_language_title)).assertIsDisplayed()
                compose.onNodeWithTag("translation_language_save").assertIsDisplayed()
                capture(instrumentation, name)
                compose.onNode(hasScrollToKeyAction()).performScrollToKey("th")
                compose.onNodeWithTag("translation_option_th").assertIsDisplayed().performClick()
                compose.onNodeWithTag("translation_language_save").assertIsDisplayed()
                compose.onNodeWithTag("translation_language_close").assertIsDisplayed()
                capture(instrumentation, "$name-scrolled")
            } finally {
                context.getSharedPreferences("app_language", Context.MODE_PRIVATE).edit().clear().commit()
            }
        }
    }

    private fun capture(instrumentation: android.app.Instrumentation, name: String) {
        compose.waitForIdle()
        val bitmap = checkNotNull(instrumentation.uiAutomation.takeScreenshot())
        try {
            val directory = File(instrumentation.targetContext.filesDir, "translation-visual").apply { mkdirs() }
            File(directory, "$name.png").outputStream().use { check(bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)) }
        } finally { bitmap.recycle() }
    }
}
