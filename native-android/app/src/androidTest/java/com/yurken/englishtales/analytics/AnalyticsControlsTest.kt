package com.yurken.englishtales.analytics

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.yurken.englishtales.ui.EnglishTalesTheme
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class AnalyticsControlsTest {
    @get:Rule val compose = createComposeRule()
    @Test fun sharingIsOffByDefaultAndCanBeEnabledThenWithdrawn() {
        val choices = java.util.Collections.synchronizedList(mutableListOf<Boolean>())
        compose.setContent { EnglishTalesTheme { AnalyticsConsentControl(false) { choices += it; true } } }
        val control = compose.onNodeWithContentDescription("Kullanım istatistiklerini paylaş")
        control.assertIsOff().performClick()
        compose.waitUntil { choices.size == 1 }; compose.waitForIdle(); control.assertIsOn().performClick()
        compose.waitUntil { choices.size == 2 }; compose.waitForIdle(); control.assertIsOff()
        assertEquals(listOf(true, false), choices.toList())
    }
    @Test fun failedPreferenceWriteExplainsTheFailureAndKeepsSwitchOff() {
        compose.setContent { EnglishTalesTheme { AnalyticsConsentControl(false) { false } } }
        compose.onNodeWithContentDescription("Kullanım istatistiklerini paylaş").performClick()
        compose.waitUntil { compose.onAllNodesWithText("Tercihin kaydedilemedi. Lütfen tekrar dene.").fetchSemanticsNodes().isNotEmpty() }
        compose.onNodeWithContentDescription("Kullanım istatistiklerini paylaş").assertIsOff()
    }
}
