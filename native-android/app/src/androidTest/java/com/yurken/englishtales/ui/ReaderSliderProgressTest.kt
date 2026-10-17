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
    // The bundled catalog's stories are short, so repeat the longest one's sentences until it spans six pages.
    private val story by lazy {
        LearningContent.initialize(context)
        val base=LearningContent.stories.maxBy {it.sentences.size}
        base.copy(sentences=List(48) {i->base.sentences[i%base.sentences.size].let {it.copy(id="${it.id}-$i")}})
    }
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
            down(androidx.compose.ui.geometry.Offset(left+width*0.02f,centerY))
            repeat(20) {moveTo(androidx.compose.ui.geometry.Offset(left+width*(0.02f+0.97f*(it+1)/20f),centerY))}
        }
        compose.runOnIdle {assertEquals("Nothing is reported while the thumb is still held",emptyList<Pair<Int,String>>(),reports)}
        slider.performTouchInput {up()}
        // Where the thumb lands depends on the emulator's track geometry; what matters is one report for a far page.
        val landed=compose.runOnIdle {
            assertEquals("One report per drag",1,reports.size)
            (1 until pageCount).single {expected(it)==reports.single()}
        }
        assertTrue("The drag crossed several pages",landed>=pageCount/2)
        compose.onNodeWithText("${landed+1} / $pageCount").assertIsDisplayed()
        // Buttons keep reporting each page immediately.
        compose.onNodeWithText(context.getString(com.yurken.englishtales.R.string.onceki)).performClick()
        compose.runOnIdle {assertEquals(listOf(expected(landed),expected(landed-1)),reports)}
    }

    @Test fun settingTheSliderProgressReportsTheChosenPageOnce() {
        reader()
        slider.performSemanticsAction(SemanticsActions.SetProgress) {it((pageCount-2).toFloat())}
        compose.onNodeWithText("${pageCount-1} / $pageCount").assertIsDisplayed()
        compose.runOnIdle {assertEquals(listOf(expected(pageCount-2)),reports)}
    }
}
