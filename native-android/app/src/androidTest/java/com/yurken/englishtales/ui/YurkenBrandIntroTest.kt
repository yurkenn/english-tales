package com.yurken.englishtales.ui

import androidx.compose.material3.Text
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.junit4.StateRestorationTester
import org.junit.Rule
import org.junit.Test

class YurkenBrandIntroTest {
    @get:Rule val compose = createComposeRule()

    @Test fun automaticallyContinuesWithoutUserInput() {
        compose.mainClock.autoAdvance = false
        compose.setContent { YurkenBrandIntro { Text("Uygulama hazır") } }
        compose.onNodeWithContentDescription("Yurken").assertExists()
        compose.mainClock.advanceTimeBy(1200)
        compose.onNodeWithText("Uygulama hazır").assertExists()
        compose.onNodeWithContentDescription("Yurken").assertDoesNotExist()
    }

    @Test fun skipSurvivesStateRestoration() {
        compose.mainClock.autoAdvance = false
        val restoration = StateRestorationTester(compose)
        restoration.setContent { YurkenBrandIntro { Text("Uygulama hazır") } }
        compose.onNodeWithContentDescription("Yurken").performClick()
        compose.mainClock.advanceTimeByFrame()
        compose.onNodeWithText("Uygulama hazır").assertExists()
        restoration.emulateSavedInstanceStateRestore()
        compose.mainClock.advanceTimeByFrame()
        compose.onNodeWithText("Uygulama hazır").assertExists()
        compose.onNodeWithContentDescription("Yurken").assertDoesNotExist()
    }
}
