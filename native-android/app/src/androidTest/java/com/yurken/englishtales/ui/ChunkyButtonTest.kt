package com.yurken.englishtales.ui

import android.os.ParcelFileDescriptor
import android.provider.Settings
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performTouchInput
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalTestApi::class)
class ChunkyButtonTest {
    @get:Rule val compose = createComposeRule(effectContext = object : MotionDurationScale {
        override val scaleFactor = 1f
    })

    @Test fun springReleaseKeepsPaddingValid() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val setting = Settings.Global.ANIMATOR_DURATION_SCALE
        val originalScale = Settings.Global.getFloat(instrumentation.targetContext.contentResolver, setting, -1f)
        // CI disables animations, but the regression must exercise the underdamped spring.
        fun setAnimatorScale(scale: Float) {
            val command = if (scale < 0f) "settings delete global $setting"
                else "settings put global $setting $scale"
            val result = instrumentation.uiAutomation.executeShellCommand(command)
            ParcelFileDescriptor.AutoCloseInputStream(result).use { it.readBytes() }
        }
        try {
            setAnimatorScale(1f)
            pressAndReleaseButton()
        } finally {
            setAnimatorScale(originalScale)
        }
    }

    private fun pressAndReleaseButton() {
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
