package com.yurken.englishtales.ui

import android.content.Context
import android.content.res.Configuration
import android.graphics.Bitmap
import android.os.LocaleList
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Density
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.LayoutDirection
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.AppLanguage
import com.yurken.englishtales.R
import com.yurken.englishtales.data.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import java.io.File

class MultilingualUiTest {
    @get:Rule val compose = createComposeRule()
    private val target get() = InstrumentationRegistry.getInstrumentation().targetContext
    private fun context(tag: String): Context = AppLanguage.wrap(target.createConfigurationContext(Configuration(target.resources.configuration).apply {
        setLocales(LocaleList.forLanguageTags(tag))
    }))
    @After fun restoreContent() {
        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            LearningContent.resetForTest(); LearningContent.initialize(target)
        }
    }

    @Composable private fun Localized(context: Context, content: @Composable () -> Unit) {
        CompositionLocalProvider(LocalContext provides context, LocalConfiguration provides context.resources.configuration,
            LocalLayoutDirection provides if (context.resources.configuration.layoutDirection == 1) LayoutDirection.Rtl else LayoutDirection.Ltr) {
            EnglishTalesTheme(dark = false, content = content)
        }
    }
    private fun screenshot(name: String) {
        val file = File(target.getExternalFilesDir(null), "localization-$name.png")
        file.outputStream().use { compose.onRoot().captureToImage().asAndroidBitmap().compress(Bitmap.CompressFormat.PNG, 100, it) }
    }

    @Test fun everyLanguageFormatsAccountMessagesAndEveryPluralCategory() {
        val english = context("en")
        for (tag in appLanguages.map { it.first }.filter { it !in listOf("en", "tr") }) {
            val localized = context(tag)
            assertNotEquals(tag, english.getString(R.string.ayarlar), localized.getString(R.string.ayarlar))
            assertFalse(localized.getString(R.string.placement_progress, 1, 9).contains("%"))
            assertFalse(localized.getString(R.string.account_message_invalid_credentials).contains("%"))
            assertFalse(localized.getString(R.string.alert_word_saved, "quiet").contains("\\"))
            for (number in listOf(0, 1, 2, 3, 5, 11, 21, 100)) {
                for (id in listOf(R.plurals.reading_minutes_description, R.plurals.reminder_due_words, R.plurals.story_new_words))
                    assertFalse("$tag/$id/$number", localized.resources.getQuantityString(id, number, number).contains("%"))
                assertTrue(localized.resources.getQuantityString(R.plurals.dictation_incorrect, number, number, "The cat sat.").contains("The cat sat."))
            }
            assertEquals(if (tag in listOf("ar", "ur")) 1 else 0, localized.resources.configuration.layoutDirection)
        }
    }

    @Test fun spanishWelcomeAndLanguagePickerRemainUsable() {
        val localized = context("es-419")
        compose.setContent { Localized(localized) { WelcomeScreen(AccountState(), {}, {}, {}) } }
        compose.onNodeWithText(localized.getString(R.string.misafir_olarak_basla)).performScrollTo().assertIsDisplayed()
        screenshot("es-welcome")
        val selected = appLanguages.firstOrNull { it.first == AppLanguage.selection(localized) }?.second ?: localized.getString(R.string.app_language_system)
        compose.onNodeWithText(localized.getString(R.string.app_language_current, selected)).performScrollTo().performClick()
        compose.onNode(hasScrollToNodeAction()).performScrollToNode(hasText("اردو"))
        compose.onNodeWithText("اردو").assertIsDisplayed()
    }

    @Test fun arabicSentenceTilesStillBuildEnglishFromLeftToRight() {
        val localized = context("ar")
        val question = OrderQuestion("The cat sat.", "جلست القطة.", "Story", "A1", "s1", listOf("sat.", "cat", "The"))
        compose.setContent { Localized(localized) { SentenceOrderGame(listOf(question), 0, PaddingValues(), {}, {}) } }
        listOf("The", "cat", "sat.").forEach { compose.onNodeWithText(it).performClick() }
        val the = compose.onNodeWithContentDescription(localized.getString(R.string.order_remove, "The")).fetchSemanticsNode().boundsInRoot
        val cat = compose.onNodeWithContentDescription(localized.getString(R.string.order_remove, "cat")).fetchSemanticsNode().boundsInRoot
        assertTrue("English tiles must advance left to right inside the RTL screen", the.left < cat.left)
        compose.onNodeWithText(localized.getString(R.string.gap_check)).performScrollTo().performClick()
        compose.onNodeWithText(localized.getString(R.string.order_correct, englishArgument(question.sentence, rtl = true))).assertExists()
        screenshot("ar-order")
    }

    @Test fun urduReaderKeepsItsEnglishSourceAndShowsTheUrduTranslation() {
        val localized = context("ur")
        LearningContent.initialize(localized)
        val story = LearningContent.stories.first()
        compose.setContent { Localized(localized) { ReaderScreen(story, LearningSnapshot(readerHintSeen = true), {}, {}, { _, _ -> },
            onComplete = {}, onHintDismiss = {}, sessionId = "urdu-preview", onCheckpoint = { _, _ -> }) } }
        compose.onAllNodesWithContentDescription(localized.getString(R.string.cumleyi_cevir)).onFirst().performClick()
        compose.onNodeWithText(story.sentences.first().translation).assertExists()
        val layouts = mutableListOf<TextLayoutResult>()
        compose.onNode(hasText(" / ", substring = true)).fetchSemanticsNode().config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
        assertEquals(androidx.compose.ui.text.style.TextDirection.Ltr, layouts.single().layoutInput.style.textDirection)
        screenshot("ur-reader")
    }

    @Test fun thaiWelcomeUsesThaiTextAndAllowsGuestEntry() {
        val localized = context("th")
        var opened = false
        compose.setContent { Localized(localized) { WelcomeScreen(AccountState(), { opened = true }, {}, {}) } }
        compose.onNodeWithText(localized.getString(R.string.misafir_olarak_basla)).performScrollTo().performClick()
        compose.runOnIdle { assertTrue(opened) }
        screenshot("th-welcome")
    }

    @Test fun everyNewLanguageKeepsWelcomeActionsReadableAtLargeText() {
        val language = mutableStateOf("es-419")
        compose.setContent {
            val localized = context(language.value)
            val density = LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(density.density, 1.5f)) {
                Localized(localized) { WelcomeScreen(AccountState(), {}, {}, {}) }
            }
        }
        for (tag in appLanguages.map { it.first }.filter { it !in listOf("en", "tr") }) {
            compose.runOnIdle { language.value = tag }
            val localized = context(tag)
            compose.onNodeWithText(localized.getString(R.string.misafir_olarak_basla)).performScrollTo().assertIsDisplayed()
            for (node in compose.onAllNodes(hasText("", substring = true), useUnmergedTree = true).fetchSemanticsNodes()) {
                val layouts = mutableListOf<TextLayoutResult>()
                node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(layouts)
                assertFalse("$tag: clipped text", layouts.any { result -> result.didOverflowHeight || (0 until result.lineCount).any(result::isLineEllipsized) })
            }
            screenshot("$tag-welcome-large")
        }
    }
}
