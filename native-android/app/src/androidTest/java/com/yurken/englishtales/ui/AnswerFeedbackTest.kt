package com.yurken.englishtales.ui

import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.yurken.englishtales.R
import org.junit.Rule
import org.junit.Test

@OptIn(androidx.compose.ui.test.ExperimentalTestApi::class)
class AnswerFeedbackTest {
    // CI disables system animations; the regression specifically needs the intermediate exit frames.
    @get:Rule val compose = createComposeRule(effectContext = object : androidx.compose.ui.MotionDurationScale {
        override val scaleFactor = 1f
    })

    @Test fun correctVerdictStaysCorrectWhileExiting() = checkExit(correct = true)

    @Test fun wrongVerdictKeepsItsExplanationWhileExiting() = checkExit(correct = false)

    private fun checkExit(correct: Boolean) {
        val visible = mutableStateOf(false)
        val result = mutableStateOf(correct)
        val message = mutableStateOf("Previous answer")
        var correctTitle = ""
        var wrongTitle = ""
        compose.mainClock.autoAdvance = false
        compose.setContent {
            correctTitle = stringResource(R.string.feedback_correct_title)
            wrongTitle = stringResource(R.string.feedback_wrong_title)
            EnglishTalesTheme { AnswerFeedback(visible.value, result.value, message.value) }
        }
        compose.runOnIdle { visible.value = true }
        compose.mainClock.advanceTimeBy(1000)
        val title = if (correct) correctTitle else wrongTitle
        val otherTitle = if (correct) wrongTitle else correctTitle
        compose.onNodeWithText(title, useUnmergedTree = true).assertExists()

        // A new question hides the panel and resets both the verdict and explanation.
        compose.runOnIdle {
            visible.value = false
            result.value = !correct
            message.value = "Next answer"
        }
        compose.mainClock.advanceTimeByFrame()
        compose.mainClock.advanceTimeBy(48)
        compose.onNodeWithText(title, useUnmergedTree = true).assertExists()
        compose.onNodeWithText(otherTitle, useUnmergedTree = true).assertDoesNotExist()
        compose.onNodeWithText("Previous answer", useUnmergedTree = true).assertExists()
        compose.onNodeWithText("Next answer", useUnmergedTree = true).assertDoesNotExist()

        compose.mainClock.advanceTimeBy(1000)
        compose.onNodeWithText("Previous answer", useUnmergedTree = true).assertDoesNotExist()
        compose.runOnIdle { visible.value = true }
        compose.mainClock.advanceTimeBy(1000)
        compose.onNodeWithText(otherTitle, useUnmergedTree = true).assertExists()
        compose.onNodeWithText("Next answer", useUnmergedTree = true).assertExists()
    }
}
