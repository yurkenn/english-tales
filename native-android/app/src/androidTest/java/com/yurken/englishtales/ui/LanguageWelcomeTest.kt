package com.yurken.englishtales.ui

import android.content.Context
import android.content.ContextWrapper
import android.content.res.Configuration
import android.os.LocaleList
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.AppLanguage
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import java.util.UUID

class LanguageWelcomeTest {
    @get:Rule val compose = createComposeRule()
    private val target get() = InstrumentationRegistry.getInstrumentation().targetContext
    private fun isolated(): Context {
        val suffix = UUID.randomUUID().toString()
        val configured = target.createConfigurationContext(Configuration(target.resources.configuration).apply {
            setLocales(LocaleList.forLanguageTags("tr"))
        })
        return object : ContextWrapper(configured) {
            override fun getSharedPreferences(name: String, mode: Int) = target.getSharedPreferences("language-test-$suffix-$name", mode)
        }
    }

    @Test fun choosingPreviewsCopyAndRtlButDoesNotApplyUntilContinue() {
        var chosen = ""
        val before = AppLanguage.selection(target)
        compose.setContent { EnglishTalesTheme {
            LanguageWelcomeScreen(initialTag = "tr", onContinue = { chosen = it })
        } }
        compose.onNodeWithTag("language_continue").assertIsDisplayed()
        compose.onNodeWithTag("language_option_es-419").performScrollTo().performClick()
        compose.onNodeWithText("¿En qué idioma empezamos?").assertIsDisplayed()
        assertEquals("", chosen)
        assertEquals(before, AppLanguage.selection(target))
        compose.onNodeWithTag("language_continue").performClick()
        assertEquals("es-419", chosen)
    }

    @Test fun smallScreenWithLargeTypeKeepsContinueVisibleAndAllLanguagesReachable() {
        var chosen = ""
        compose.setContent {
            CompositionLocalProvider(LocalDensity provides Density(LocalDensity.current.density, 1.8f)) {
                EnglishTalesTheme { Box(Modifier.size(320.dp, 480.dp)) {
                    LanguageWelcomeScreen(initialTag = "ar", onContinue = { chosen = it })
                } }
            }
        }
        compose.onNodeWithTag("language_continue").assertIsDisplayed()
        compose.onNode(hasScrollToNodeAction()).performScrollToNode(hasTestTag("language_option_th"))
        compose.onNodeWithTag("language_option_th").performClick()
        compose.onNodeWithTag("language_continue").assertIsDisplayed().performClick()
        assertEquals("th", chosen)
    }

    @Test fun firstChoiceIsPersistedAndDoesNotShowAgain() {
        val context = isolated()
        assertFalse(AppLanguage.hasConfirmedChoice(context))
        compose.setContent {
            CompositionLocalProvider(LocalContext provides context, LocalConfiguration provides context.resources.configuration) {
                EnglishTalesTheme { FirstLanguageGate(onboardingDone = false) { Text("Welcome after choice") } }
            }
        }
        compose.onNodeWithTag("language_continue").performClick()
        compose.onNodeWithText("Welcome after choice").assertIsDisplayed()
        assertTrue(AppLanguage.hasConfirmedChoice(context))
    }

    @Test fun existingLearnerSkipsTheGateAndRecordsDeviceChoice() {
        val context = isolated()
        compose.setContent {
            CompositionLocalProvider(LocalContext provides context) {
                EnglishTalesTheme { FirstLanguageGate(onboardingDone = true) { Text("Existing learner") } }
            }
        }
        compose.onNodeWithText("Existing learner").assertIsDisplayed()
        compose.onNodeWithTag("language_continue").assertDoesNotExist()
        compose.runOnIdle { assertTrue(AppLanguage.hasConfirmedChoice(context)) }
    }
}
