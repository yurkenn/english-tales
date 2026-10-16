package com.yurken.englishtales.ui

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.DeviceConfigurationOverride
import androidx.compose.ui.test.ForcedSize
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/** Tablets and landscape phones: story lists use the width, running text keeps a readable line length. */
class TabletLayoutTest {
    @get:Rule val compose=createComposeRule()
    private lateinit var stories: List<Story>
    private lateinit var snapshot: LearningSnapshot

    @Before fun content() {
        LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext)
        stories=LearningContent.stories.take(4)
        snapshot=LearningSnapshot(readerHintSeen=true)
    }

    @Test fun storyListShowsColumnsOnTabletsAndOneColumnOnPhones() {
        show(DpSize(1280.dp,800.dp)) {StoryList(stories,{Text(it.title,Modifier.testTag(it.id))})}
        val first=compose.onNodeWithTag(stories[0].id).getBoundsInRoot()
        val second=compose.onNodeWithTag(stories[1].id).getBoundsInRoot()
        assertEquals("cards share a row on a tablet",first.top,second.top)
        assertTrue(second.left>first.left)
    }

    @Test fun storyListStaysSingleColumnOnPhones() {
        show(DpSize(411.dp,800.dp)) {StoryList(stories,{Text(it.title,Modifier.testTag(it.id))})}
        val first=compose.onNodeWithTag(stories[0].id).getBoundsInRoot()
        val second=compose.onNodeWithTag(stories[1].id).getBoundsInRoot()
        assertEquals(first.left,second.left)
        assertTrue(second.top>first.top)
    }

    @Test fun readerCentresTheTextColumnOnWideScreens() {
        val story=LearningContent.stories.first {it.sentences.size>1}
        val screen=DpSize(1280.dp,800.dp)
        show(screen) {
            ReaderScreen(story,snapshot,onBack={},onSaveWord={},onProgress={_,_->},onComplete={},onHintDismiss={},
                sessionId="tablet",onCheckpoint={_,_->},onOpenWords={})
        }
        val sentence=compose.onNodeWithText(story.sentences.first().english,substring=true).getBoundsInRoot()
        assertTrue("text column is capped: $sentence",sentence.right-sentence.left<=ReadingWidth)
        // Centred: the empty margins on both sides are about the same. The forced size, not the emulator window
        // (onRoot), is the screen the content was laid out on.
        val left=sentence.left; val right=screen.width-sentence.right
        assertTrue("left=$left right=$right",left>200.dp && right>200.dp)
    }

    private fun show(size: DpSize, screen: @Composable () -> Unit) {
        compose.setContent {
            DeviceConfigurationOverride(DeviceConfigurationOverride.ForcedSize(size)) {EnglishTalesTheme(dark=false) {screen()}}
        }
        compose.waitForIdle()
    }
}
