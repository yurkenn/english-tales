package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.*
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.navigation.compose.*
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class IconActionsTest {
    @get:Rule val compose=createComposeRule()

    @Test fun wordShortcutReturnsToTheSameReaderPage() {
        LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext)
        val story=LearningContent.stories.first {it.sentences.size>8}
        val snapshot=LearningSnapshot(savedWordIds=setOf(LearningContent.words.first().id),readerHintSeen=true)
        val pages=(story.sentences.size+7)/8
        compose.setContent {EnglishTalesTheme {
            val nav=rememberNavController()
            NavHost(nav,startDestination="reader") {
                composable("reader") {ReaderScreen(story,snapshot,onBack={},onSaveWord={},onProgress={_,_->},
                    onComplete={},onHintDismiss={},sessionId="shortcut",onCheckpoint={_,_->},onOpenWords={nav.navigate("words")},pageFits=EightPerPage)}
                composable("words") {SavedWordsScreen(snapshot,{nav.popBackStack()},{})}
            }
        }}
        compose.onNodeWithText("Sonraki ›").performClick()
        compose.onNodeWithText("2 / $pages").assertIsDisplayed()
        compose.onNodeWithContentDescription("Kelimelerim, 1 kayıtlı kelime").performClick()
        compose.onNodeWithText("Kelimelerim").assertIsDisplayed()
        compose.onNodeWithContentDescription("Geri").performClick()
        compose.onNodeWithText("2 / $pages").assertIsDisplayed()
    }

    @Test fun indicatorsExplainCurrentDataAndRankShowsNextTarget() {
        compose.setContent {EnglishTalesTheme {
            androidx.compose.foundation.layout.Column {
                StatsHeader(LearningSnapshot(streak=3,points=125))
                RankProgress(125)
            }
        }}
        compose.onNodeWithContentDescription("Çalışma serin: 3, bilgi").performClick()
        compose.onNodeWithText("Şu an 3 günlük çalışma serin var.",substring=true).assertIsDisplayed()
        compose.onNodeWithText("Anladım").performClick()
        compose.onNodeWithContentDescription("Puanların: 125, bilgi").performClick()
        compose.onNodeWithText("Puan para veya harcanan enerji değildir.",substring=true).assertIsDisplayed()
        compose.onNodeWithText("Anladım").performClick()
        compose.onNodeWithText("Okuyucu 2").assertIsDisplayed()
        compose.onNodeWithText("75 puan sonra Okuyucu 3").assertIsDisplayed()
    }

    @Test fun onlyCompletedPracticeExitOffersAnAdBoundary() {
        LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext)
        val word=LearningContent.words.first()
        var boundary=0
        var active: ()->Boolean={false}
        var delayedContinue: ()->Unit={}
        var started=""
        var completed=""
        compose.setContent {EnglishTalesTheme {
            PracticeScreen(LearningSnapshot(savedWordIds=setOf(word.id)),
                {_,id,_,_,_->completed=id},{_,_->},PaddingValues(),{id,_,_->started=id},{_,_->},{},
                launchId="test",launchWordIds=listOf(word.id),onCompletedExit={id,current,next ->
                    assertEquals(completed,id);boundary++;active=current;delayedContinue=next
                })
        }}
        compose.waitUntil(5_000) {started.isNotBlank()}
        compose.onNodeWithText(word.translation).performClick()
        compose.waitUntil(5_000) {completed.isNotBlank()}
        assertEquals(0,boundary)
        compose.onNodeWithText("Günlük planıma dön").performScrollTo().performClick()
        assertEquals(1,boundary)
        compose.runOnIdle {assertTrue(active())}
        compose.onNodeWithText("Yeniden çalış").performScrollTo().performClick()
        // The ladder's gap questions are built off the main thread, which the idle check does not track.
        compose.waitUntil(5_000) {!active()}
        compose.runOnIdle {assertFalse(active());delayedContinue()}
        // Restart selects a fresh randomized batch; its first word need not be the old one.
        compose.waitUntil(5_000) {started.isNotBlank() && started!=completed}
        compose.onNodeWithText("Bir çeviri seçin").assertIsDisplayed()
        compose.onNodeWithText("Kelimelerle oyna").assertDoesNotExist()
    }
}
