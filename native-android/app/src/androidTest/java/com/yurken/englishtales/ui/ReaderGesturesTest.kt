package com.yurken.englishtales.ui

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/** The reader: each sentence has its own line and translate button, a swipe turns the page and translations open per sentence or per page. */
class ReaderGesturesTest {
    @get:Rule val compose=createComposeRule()
    private val context=InstrumentationRegistry.getInstrumentation().targetContext

    private fun open(story: Story, onProgress: (Int,String)->Unit={_,_->}) {
        compose.setContent {EnglishTalesTheme(dark=false) {
            ReaderScreen(story,LearningSnapshot(readerHintSeen=true),onBack={},onSaveWord={},onProgress=onProgress,onComplete={},onHintDismiss={},
                sessionId="reader-gestures",onCheckpoint={_,_->},onOpenWords={},pageFits=EightPerPage)
        }}
    }

    @Test fun swipingSidewaysTurnsThePageAndReportsIt() {
        LearningContent.initialize(context)
        val story=LearningContent.stories.first {it.sentences.size>8}
        val pages=(story.sentences.size+7)/8
        var position=""
        open(story) {_,id -> position=id}
        compose.onNodeWithText(story.sentences.first().english,substring=true).performTouchInput {swipeLeft()}
        compose.onNodeWithText("2 / $pages").assertIsDisplayed()
        assertEquals(story.sentences[8].id,position)
        compose.onNodeWithText(story.sentences[8].english,substring=true).performTouchInput {swipeRight()}
        compose.onNodeWithText("1 / $pages").assertIsDisplayed()
    }

    @Test fun sentencesTranslateOneByOneOrAllTogether() {
        LearningContent.initialize(context)
        val story=LearningContent.stories.first {it.sentences.size>8}
        open(story)
        // Every sentence on the page has its own translate button beside it.
        val buttons=compose.onAllNodesWithContentDescription("Cümleyi çevir")
        buttons.assertCountEquals(8)
        buttons[1].performClick()
        compose.onNodeWithText(story.sentences[1].translation).assertIsDisplayed()
        compose.onNodeWithText(story.sentences[0].translation).assertDoesNotExist()
        compose.onAllNodesWithContentDescription("Çeviriyi gizle").assertCountEquals(1)

        compose.onNodeWithContentDescription("Sayfayı çevir").performClick()
        compose.onNodeWithText(story.sentences[0].translation).assertExists()
        compose.onNodeWithContentDescription("Sayfa çevirisini gizle").performClick()
        compose.onNodeWithText(story.sentences[1].translation).assertDoesNotExist()
    }
}
