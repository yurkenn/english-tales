package com.yurken.englishtales.ui

import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performTouchInput
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalTestApi::class)
class ChunkyButtonTest {
    @get:Rule val compose = createComposeRule(effectContext = object : MotionDurationScale {
        override val scaleFactor = 1f
    })

    @Test fun springReleaseKeepsPaddingValid() {
        var clicks = 0
        compose.mainClock.autoAdvance = false
        compose.setContent {
            EnglishTalesTheme {
                ChunkyButton(label = "Continue", onClick = { clicks++ })
            }
        }

        val button = compose.onNodeWithText("Continue")
        repeat(2) {
            button.performTouchInput { down(center) }
            repeat(24) { compose.mainClock.advanceTimeByFrame() }
            button.performTouchInput { up() }
            repeat(24) { compose.mainClock.advanceTimeByFrame() }
        }
        compose.runOnIdle { assertEquals(2, clicks) }
    }
}
