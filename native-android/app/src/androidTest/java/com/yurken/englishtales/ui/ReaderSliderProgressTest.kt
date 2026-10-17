package com.yurken.englishtales.ui

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

/** Scrubbing the page slider reports the reading position once, when the drag ends, not once per page crossed. */
class ReaderSliderProgressTest {
    @get:Rule val compose=createComposeRule()
    private val context get()=InstrumentationRegistry.getInstrumentation().targetContext
    private val story by lazy {LearningContent.initialize(context);LearningContent.stories.maxBy {it.sentences.size}}
    private val pageCount get()=(story.sentences.size+7)/8
    private val reports=mutableListOf<Pair<Int,String>>()
    private val slider get()=compose.onNode(SemanticsMatcher.keyIsDefined(SemanticsActions.SetProgress))

    private fun reader() {
        assertTrue("Needs a story with many pages",pageCount>=5)
        compose.setContent {EnglishTalesTheme(dark=false) {
            ReaderScreen(story,LearningSnapshot(readerHintSeen=true),onBack={},onSaveWord={},onProgress={p,s->reports+=p to s},
                onComplete={},onHintDismiss={},sessionId="reader-slider-progress",onCheckpoint={_,_->})
        }}
    }
    private fun expected(page: Int)=(page*8*100/story.sentences.size).coerceAtMost(99) to story.sentences[page*8].id

    @Test fun draggingTheSliderAcrossManyPagesReportsOnlyTheFinalPage() {
        reader()
        slider.performTouchInput {
            down(centerLeft)
            repeat(40) {moveTo(androidx.compose.ui.geometry.Offset(left+(right-left)*(it+1)/40f,centerY))}
        }
        compose.onNodeWithText("$pageCount / $pageCount").assertIsDisplayed()
        compose.runOnIdle {assertEquals("Nothing is reported while the thumb is still held",emptyList<Pair<Int,String>>(),reports)}
        slider.performTouchInput {up()}
        compose.runOnIdle {assertEquals(listOf(expected(pageCount-1)),reports)}
        // Buttons keep reporting each page immediately.
        compose.onNodeWithText(context.getString(com.yurken.englishtales.R.string.onceki)).performClick()
        compose.runOnIdle {assertEquals(listOf(expected(pageCount-1),expected(pageCount-2)),reports)}
    }

    @Test fun settingTheSliderProgressReportsTheChosenPageOnce() {
        reader()
        slider.performSemanticsAction(SemanticsActions.SetProgress) {it((pageCount-2).toFloat())}
        compose.onNodeWithText("${pageCount-1} / $pageCount").assertIsDisplayed()
        compose.runOnIdle {assertEquals(listOf(expected(pageCount-2)),reports)}
    }
}
