package com.yurken.englishtales.analytics

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.yurken.englishtales.ui.EnglishTalesTheme
import com.yurken.englishtales.ui.OnboardingScreen
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class OnboardingAnalyticsTest {
    @get:Rule val compose = createComposeRule()
    private fun finishChoices() {
        for (label in listOf("Başlayalım", "Yeni başlıyorum", "Günlük yaşam", "Günde 1 adım · Rahat başlangıç")) {
            compose.onNodeWithText(label, useUnmergedTree = true).performScrollTo().performClick()
            compose.waitForIdle()
        }
    }
    @Test fun learningCanStartWithoutSharingAnyMetrics() {
        var continued = false
        var consentChanges = 0
        compose.setContent { EnglishTalesTheme {
            OnboardingScreen(analyticsControls = { AnalyticsConsentControl(false) { consentChanges++; true } }) { level, genre, goal ->
                assertEquals("A1", level); assertEquals("Günlük yaşam", genre); assertEquals(1, goal)
                continued = true
            }
        } }
        finishChoices()
        compose.onNodeWithContentDescription("Kullanım istatistiklerini paylaş").performScrollTo().assertIsOff()
        compose.onNodeWithText("İlk hikâyeme başla").performScrollTo().performClick()
        compose.runOnIdle { assertTrue(continued); assertEquals(0, consentChanges) }
    }
    @Test fun optionalConsentIsAvailableBeforeOnboardingCompletion() {
        var consent = false
        var consentAtCompletion = false
        compose.setContent { EnglishTalesTheme {
            OnboardingScreen(analyticsControls = { AnalyticsConsentControl(false) { consent = it; true } }) { _, _, _ -> consentAtCompletion = consent }
        } }
        finishChoices()
        compose.onNodeWithContentDescription("Kullanım istatistiklerini paylaş").performScrollTo().assertIsOff().performClick()
        compose.waitUntil { consent }; compose.waitForIdle()
        compose.onNodeWithText("İlk hikâyeme başla").performScrollTo().performClick()
        compose.runOnIdle { assertTrue(consentAtCompletion) }
    }
}
