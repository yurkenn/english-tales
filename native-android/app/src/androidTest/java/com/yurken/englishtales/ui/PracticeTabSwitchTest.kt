package com.yurken.englishtales.ui

import androidx.compose.runtime.*
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class PracticeTabSwitchTest {
    @get:Rule val compose=createComposeRule()
    @Before fun catalog() {LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext)}

    // A reminder or widget tap mid-practice switches to the home tab; coming back must resume the same session, not show the menu.
    @Test fun aPracticeSessionSurvivesSwitchingToAnotherTabAndBack() {
        val personal=(1..5).map {WordInfo("${Glossary.ID_PREFIX}zorvex$it","zorvex$it","zorvexçeviri$it","","")}
        val snapshot=LearningSnapshot(savedWordIds=personal.map {it.id}.toSet(),personalWords=personal.associateBy {it.id})
        var tab by mutableIntStateOf(2)
        val starts=mutableListOf<String>()
        val abandoned=mutableListOf<String>()
        compose.setContent {EnglishTalesTheme {
            MainTabs(snapshot,tab,{tab=it},{},{},{_,_,_,_,_ ->},{_,_ ->},{},{},{},{},null,emptyList(),{},{tab=0},
                {id,_,_ ->starts+=id},{_,_ ->},{abandoned+=it},{_,active,next ->if(active()) next()})
        }}
        compose.onNodeWithText("Bir çeviri seç").performScrollTo().performClick();compose.waitForIdle()
        val first=personal.first {compose.onAllNodesWithText(it.word).fetchSemanticsNodes().isNotEmpty()}
        compose.onNodeWithText(first.translation).performClick()
        compose.waitUntil(5_000) {compose.onAllNodesWithText(first.word).fetchSemanticsNodes().isEmpty()}
        val second=personal.first {compose.onAllNodesWithText(it.word).fetchSemanticsNodes().isNotEmpty()}
        compose.runOnIdle {tab=0};compose.waitForIdle()
        compose.runOnIdle {tab=2};compose.waitForIdle()
        compose.onNodeWithText(second.word).assertExists()
        compose.onAllNodesWithText("Bir çeviri seç").assertCountEquals(0)
        // Returning re-announces the same session (beginSession is insert-or-ignore), so every start names one session.
        compose.runOnIdle {assertEquals(1,starts.distinct().size);assertTrue(abandoned.isEmpty())}
    }
}
