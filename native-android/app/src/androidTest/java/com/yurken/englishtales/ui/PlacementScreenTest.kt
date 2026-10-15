package com.yurken.englishtales.ui

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.Density
import com.yurken.englishtales.data.LearningSnapshot
import com.yurken.englishtales.data.ReadingPlacement
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class PlacementScreenTest {
    @get:Rule val compose = createComposeRule()

    private fun click(label: String) {
        compose.onNodeWithText(label).performScrollTo().performClick()
        compose.waitForIdle()
    }

    private fun finish(answers: List<Int>) {
        click("Teste başla")
        answers.forEachIndexed { index, option ->
            click(if (option == -1) "Bilmiyorum" else ReadingPlacement.questions[index].options[option])
            click(if (index == answers.lastIndex) "Önerimi gör" else "Sonraki soru")
        }
    }

    @Test fun choiceIsRequiredAndUnknownAdvancesWithoutInventingAnAnswer() {
        compose.setContent { EnglishTalesTheme { PlacementScreen({}, {}) } }
        click("Teste başla")
        compose.onNodeWithText("Sonraki soru").performScrollTo().assertIsNotEnabled()
        click("Bilmiyorum")
        compose.onNodeWithText("Bilmiyorum").assertIsSelected()
        click("Sonraki soru")
        compose.onNodeWithText("Soru 2 / 9").assertExists()
        compose.onNodeWithText("Sonraki soru").performScrollTo().assertIsNotEnabled()
    }

    @Test fun answersAndCurrentSelectionSurviveStateRestoration() {
        val restoration = StateRestorationTester(compose)
        restoration.setContent { EnglishTalesTheme { PlacementScreen({}, {}) } }
        click("Teste başla"); click("Bilmiyorum"); click("Sonraki soru"); click("Blue")
        restoration.emulateSavedInstanceStateRestore()
        compose.onNodeWithText("Soru 2 / 9").assertExists()
        compose.onNodeWithText("Blue").assertIsSelected()
        click("Sonraki soru")
        compose.onNodeWithText("Soru 3 / 9").assertExists()
    }

    @Test fun onboardingAcceptsRecommendationAndKeepsGenreAndGoalFlow() {
        var completed: Triple<String, String, Int>? = null
        compose.setContent { EnglishTalesTheme {
            OnboardingScreen(analyticsControls={}) { level, genre, goal -> completed=Triple(level,genre,goal) }
        } }
        click("Başlayalım"); click("Seviyemi kısa testle bul")
        finish(List(9) { -1 })
        click("A1 ile devam et"); click("Macera"); click("Günde 2 adım · Düzenli çalışma"); click("İlk hikâyeme başla")
        compose.runOnIdle { assertEquals(Triple("A1","Macera",2), completed) }
    }

    @Test fun settingsOnlyApplyRecommendationWhenChangesAreSaved() {
        var saved: List<Any>? = null
        compose.setContent { EnglishTalesTheme {
            LearningSettingsScreen(LearningSnapshot(level="B1",preferredGenre="Gizem",dailyGoal=3,displayName="Ada"),{},
                { level,genre,goal,name -> saved=listOf(level,genre,goal,name) })
        } }
        click("Seviyemi kısa testle bul")
        finish(ReadingPlacement.questions.mapIndexed { index,q -> if(index<6) q.correctOption else -1 })
        click("A2 ile devam et")
        compose.runOnIdle { assertNull(saved) }
        compose.onNodeWithText("Ayarlar").assertExists()
        click("Değişiklikleri kaydet")
        compose.runOnIdle { assertEquals(listOf("A2","Gizem",3,"Ada"),saved) }
    }

    @Test fun cancellingAnAttemptKeepsTheExistingLevel() {
        var cancelled = false
        var applied = false
        compose.setContent { EnglishTalesTheme { PlacementScreen({ applied=true }, { cancelled=true }) } }
        click("Teste başla"); click("Bilmiyorum"); click("Sonraki soru"); click("Testten çık")
        compose.onNodeWithText("Testten çıkılsın mı?").assertExists()
        compose.onNodeWithText("Teste dön").performClick()
        compose.onNodeWithText("Soru 2 / 9").assertExists()
        click("Testten çık")
        compose.onAllNodesWithText("Testten çık", useUnmergedTree=true).filterToOne(hasAnyAncestor(isDialog())).performClick()
        compose.runOnIdle { assertTrue(cancelled); assertFalse(applied) }
    }

    @Test fun decliningTheResultKeepsTheExistingSettingsLevel() {
        var savedLevel: String? = null
        compose.setContent { EnglishTalesTheme {
            LearningSettingsScreen(LearningSnapshot(level="B1"),{}, { level,_,_,_ -> savedLevel=level })
        } }
        click("Seviyemi kısa testle bul")
        finish(List(9) { -1 })
        click("Seviyeyi kendim seçeceğim")
        click("Değişiklikleri kaydet")
        compose.runOnIdle { assertEquals("B1",savedLevel) }
    }

    @Test fun largeTextCanReachAndSubmitTheLastQuestion() {
        var level: String? = null
        compose.setContent { EnglishTalesTheme {
            val density=LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(density.density,2f)) {
                PlacementScreen({ level=it }, {})
            }
        } }
        finish(ReadingPlacement.questions.map {it.correctOption})
        click("B1 ile devam et")
        compose.runOnIdle { assertEquals("B1",level) }
    }
}
