package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.*
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class PracticeSessionCountTest {
    @get:Rule val compose=createComposeRule()
    @Before fun catalog() {LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext)}

    @Test fun aWordRemovedBySyncMidSessionStillCompletesWithTheStartCount() {
        val personal=(1..5).map {WordInfo("${Glossary.ID_PREFIX}zorvex$it","zorvex$it","zorvexçeviri$it","","")}
        var snapshot by mutableStateOf(LearningSnapshot(savedWordIds=personal.map {it.id}.toSet(),personalWords=personal.associateBy {it.id}))
        val starts=mutableListOf<Triple<String,String,Int>>()
        val completions=mutableListOf<List<Any>>()
        compose.setContent {EnglishTalesTheme {
            PracticeScreen(snapshot,{correct,id,kind,count,millis ->completions+=listOf(correct,id,kind,count,millis)},{_,_ ->},PaddingValues(),
                {id,kind,count ->starts+=Triple(id,kind,count)},{_,_ ->},{})
        }}
        compose.onNodeWithText("Bir çeviri seç").performScrollTo().performClick();compose.waitForIdle()
        val shown=personal.first {compose.onAllNodesWithText(it.word).fetchSemanticsNodes().isNotEmpty()}
        compose.onNodeWithText(shown.translation).performClick()
        compose.waitUntil(5_000) {compose.onAllNodesWithText(shown.word).fetchSemanticsNodes().isEmpty()}
        // A sync removes every other saved personal word while the second question is on screen.
        snapshot=LearningSnapshot(savedWordIds=setOf(shown.id),personalWords=mapOf(shown.id to shown))
        compose.waitUntil(5_000) {completions.isNotEmpty()}
        compose.onNodeWithText("1 / 5 doğru").assertExists()
        compose.runOnIdle {
            assertEquals(Triple(starts.single().first,"choice",5),starts.single())
            assertEquals(listOf(1,starts.single().first,"choice",5),completions.single().take(4))
        }
    }
}
