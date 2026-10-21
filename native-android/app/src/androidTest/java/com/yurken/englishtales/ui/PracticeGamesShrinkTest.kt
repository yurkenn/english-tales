package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.*
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.createComposeRule
import com.yurken.englishtales.data.LearningSnapshot
import com.yurken.englishtales.data.WordInfo
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/** A sync can remove a saved glossary word while a flashcard or matching session is on screen. */
class PracticeGamesShrinkTest {
    @get:Rule val compose=createComposeRule()
    private val first=WordInfo("glossary:zorvex1","zorvex1","zorvexçeviri1","","")
    private val second=WordInfo("glossary:zorvex2","zorvex2","zorvexçeviri2","","")
    private val snapshot=LearningSnapshot(savedWordIds=setOf(first.id,second.id))

    private fun click(text: String) {compose.onNodeWithText(text).performClick();compose.waitForIdle()}

    @Test fun lateAnswerFromPreviousCardCannotSkipOrCompleteTheNextCard() {
        val reviews=mutableListOf<String>(); val completions=mutableListOf<Int>()
        compose.setContent {EnglishTalesTheme {FlashcardGame(listOf(first,second),1,snapshot.savedWordIds,PaddingValues(),
            {id,_ ->reviews+=id},{completions+=it},{},{},snapshot)}}
        click("Öğren")
        // Keep the old card's callback, as a swipe animation does while its answer button remains usable.
        val oldAnswer=compose.onNodeWithText("Hatırladım").fetchSemanticsNode().config[SemanticsActions.OnClick].action!!
        compose.runOnIdle {oldAnswer()}
        compose.onNodeWithText(second.word).assertExists()
        compose.runOnIdle {oldAnswer(); assertEquals(listOf(first.id),reviews); assertEquals(emptyList<Int>(),completions)}
        click("Öğren"); click("Hatırladım")
        compose.runOnIdle {oldAnswer(); assertEquals(listOf(first.id,second.id),reviews); assertEquals(listOf(2),completions)}
    }

    @Test fun flashcardSessionKeepsItsDeckWhenTheLastWordIsRemoved() {
        var words by mutableStateOf(listOf(first,second)); val completions=mutableListOf<Int>()
        compose.setContent {EnglishTalesTheme {FlashcardGame(words,1,snapshot.savedWordIds,PaddingValues(),{_,_ ->},{completions+=it},{},{},snapshot)}}
        click("Öğren"); click("Hatırladım")
        compose.onNodeWithText(second.word).assertExists()
        words=listOf(first)
        compose.waitForIdle()
        compose.onNodeWithText(second.word).assertExists()
        click("Öğren"); click("Hatırladım")
        compose.runOnIdle {assertEquals(listOf(2),completions)}
    }

    @Test fun flashcardSessionEndsWhenRestoredWithAShorterList() {
        var words by mutableStateOf(listOf(first,second)); val completions=mutableListOf<Int>()
        val restoration=StateRestorationTester(compose)
        restoration.setContent {EnglishTalesTheme {FlashcardGame(words,1,snapshot.savedWordIds,PaddingValues(),{_,_ ->},{completions+=it},{},{},snapshot)}}
        click("Öğren"); click("Hatırladım")
        words=listOf(first)
        restoration.emulateSavedInstanceStateRestore()
        compose.waitUntil(5_000) {completions.isNotEmpty()}
        compose.runOnIdle {assertEquals(listOf(1),completions)}
    }

    @Test fun matchingSessionCompletesWhenAMatchedWordIsRemoved() {
        var words by mutableStateOf(listOf(first,second)); val completions=mutableListOf<Int>()
        compose.setContent {EnglishTalesTheme {MatchingGame(words,1,snapshot.savedWordIds,PaddingValues(),{_,_ ->},{completions+=it},{},{},snapshot)}}
        click(first.word); click(first.translation)
        words=listOf(second)
        compose.waitForIdle()
        click(second.word); click(second.translation)
        compose.runOnIdle {assertEquals(listOf(2),completions)}
    }

    @Test fun matchingSessionEndsWhenRestoredWithOnlyMatchedWordsLeft() {
        var words by mutableStateOf(listOf(first,second)); val completions=mutableListOf<Int>()
        val restoration=StateRestorationTester(compose)
        restoration.setContent {EnglishTalesTheme {MatchingGame(words,1,snapshot.savedWordIds,PaddingValues(),{_,_ ->},{completions+=it},{},{},snapshot)}}
        click(first.word); click(first.translation)
        words=listOf(first)
        restoration.emulateSavedInstanceStateRestore()
        compose.waitUntil(5_000) {completions.isNotEmpty()}
        compose.runOnIdle {assertEquals(listOf(1),completions)}
    }
}
