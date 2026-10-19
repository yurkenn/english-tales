package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class PracticeLaunchTest {
    @get:Rule val compose=createComposeRule()
    @Before fun catalog() {LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext)}

    // A reviewing word remembered for over a week belongs on the context rung when a story sentence has it.
    private fun contextSnapshot(): Pair<String,LearningSnapshot> {
        val id=SentenceGap.prompts(LearningContent.stories,LearningContent.words).first().wordId
        return id to LearningSnapshot(savedWordIds=setOf(id),wordStates=mapOf(id to "reviewing"),wordStability=mapOf(id to 10.0))
    }

    @Test fun aLaunchedReviewWaitsForSentencePromptsAndUsesTheContextRung() {
        val (id,snapshot)=contextSnapshot()
        val starts=mutableListOf<String>()
        var consumed=0
        compose.setContent {EnglishTalesTheme {
            PracticeScreen(snapshot,{_,_,_,_,_ ->},{_,_ ->},PaddingValues(),{key,_,_ ->starts+=key},{_,_ ->},{},
                launchId="launch",launchWordIds=listOf(id),onLaunchConsumed={consumed++})
        }}
        compose.waitUntil(10_000) {compose.onAllNodesWithText("İpucuna göre boşluğu doldur.").fetchSemanticsNodes().isNotEmpty()}
        compose.onNodeWithText("Kelimeyi oluştur.").assertDoesNotExist()
        compose.runOnIdle {assertEquals(1,starts.size);assertEquals(1,consumed)}
    }

    @Test fun aRestoredLaunchedSessionIsNotStartedAgain() {
        val (id,snapshot)=contextSnapshot()
        val starts=mutableListOf<String>()
        val restoration=StateRestorationTester(compose)
        // The launch stays pending, as when the screen is restored before the parent saw it consumed.
        restoration.setContent {EnglishTalesTheme {
            PracticeScreen(snapshot,{_,_,_,_,_ ->},{_,_ ->},PaddingValues(),{key,_,_ ->starts+=key},{_,_ ->},{},
                launchId="launch",launchWordIds=listOf(id))
        }}
        compose.waitUntil(10_000) {starts.isNotEmpty()}
        restoration.emulateSavedInstanceStateRestore()
        compose.mainClock.advanceTimeBy(5_000);compose.waitForIdle()
        compose.onNodeWithText("İpucuna göre boşluğu doldur.").assertExists()
        // The restored session reports its own key again; a restart would report a new one.
        compose.runOnIdle {assertEquals(1,starts.toSet().size)}
    }
}
