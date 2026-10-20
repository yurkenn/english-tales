package com.yurken.englishtales.ui

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/** Q4.8: every sentence on the page offers "listen from here", also to TalkBack, and the first-use tip explains holding a sentence. */
class SentenceNarrationTest {
    @get:Rule val compose=createComposeRule()
    private val context=InstrumentationRegistry.getInstrumentation().targetContext

    @Test fun eachSentenceCanStartNarrationFromItself() {
        LearningContent.initialize(context)
        val story=LearningContent.stories.first {it.sentences.size>8}
        compose.setContent {EnglishTalesTheme(dark=false) {
            ReaderScreen(story,LearningSnapshot(),onBack={},onSaveWord={},onProgress={_,_->},onComplete={},onHintDismiss={},
                sessionId="sentence-narration",onCheckpoint={_,_->},onOpenWords={})
        }}
        val label=context.getString(com.yurken.englishtales.R.string.listen_from_sentence)
        val listenable=SemanticsMatcher("has '$label'") {node ->
            node.config.getOrNull(SemanticsActions.CustomActions)?.any {it.label.startsWith(label)}==true
        }
        // The page reads as one paragraph, whose actions name each of its eight sentences.
        val actions=compose.onAllNodes(listenable).fetchSemanticsNodes().flatMap {n -> n.config[SemanticsActions.CustomActions].filter {it.label.startsWith(label)}}
        assertEquals(8,actions.size)
        // Without a voice on the test device this only queues; it must not crash or change the page.
        val action=actions[3]
        compose.runOnIdle {action.action()}
        compose.onNodeWithText(context.getString(com.yurken.englishtales.R.string.reader_hint_sentence)).performScrollTo().assertIsDisplayed()
        compose.onNodeWithText("1 / ${(story.sentences.size+7)/8}").assertIsDisplayed()
    }
}
