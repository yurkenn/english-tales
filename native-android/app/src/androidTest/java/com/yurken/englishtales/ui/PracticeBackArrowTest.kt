package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.LearningContent
import com.yurken.englishtales.data.LearningSnapshot
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/** The in-game back arrow returns to the Practice menu; only the result screen's button leads to the daily plan. */
class PracticeBackArrowTest {
    @get:Rule val compose=createComposeRule()

    @Before fun content() {LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext)}

    private fun backArrowReturnsToTheMenu(mode: String) {
        val snapshot=LearningSnapshot(savedWordIds=LearningContent.words.take(8).map {it.id}.toSet())
        var plans=0
        val abandoned=mutableListOf<String>()
        compose.setContent {EnglishTalesTheme {
            PracticeScreen(snapshot,{_,_,_,_,_ ->},{_,_ ->},PaddingValues(),{_,_,_ ->},{_,_ ->},abandoned::add,onDailyPlan={plans++})
        }}
        compose.onNodeWithText(mode).performScrollTo().performClick()
        compose.waitUntil(5_000) {compose.onAllNodesWithContentDescription("Alıştırmadan çık").fetchSemanticsNodes().isNotEmpty()}
        compose.onNodeWithContentDescription("Alıştırmadan çık").performClick()
        compose.onNodeWithText("Kelimelerle oyna").assertExists()
        compose.runOnIdle {assertEquals(0,plans);assertEquals(1,abandoned.size)}
    }

    @Test fun wordCardsBackArrowStaysInPractice()=backArrowReturnsToTheMenu("Kelime kartları")
    @Test fun matchBackArrowStaysInPractice()=backArrowReturnsToTheMenu("Kelimeleri eşleştir")
}
