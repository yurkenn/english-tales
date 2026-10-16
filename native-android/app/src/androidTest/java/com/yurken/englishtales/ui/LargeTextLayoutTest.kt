package com.yurken.englishtales.ui

import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.DeviceConfigurationOverride
import androidx.compose.ui.test.FontScale
import androidx.compose.ui.test.ForcedSize
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.then
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/** At fontScale 2.0 on a small 320 x 640 dp phone no main-screen text is cut off or pushed off screen (Q3.4). */
class LargeTextLayoutTest {
    @get:Rule val compose=createComposeRule()
    private lateinit var story: Story
    private lateinit var snapshot: LearningSnapshot

    @Before fun content() {
        LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext)
        story=LearningContent.stories.first {it.sentences.size>8}
        val words=LearningContent.words.take(6).map {it.id}
        snapshot=LearningSnapshot(lastStoryId=story.id,storyProgress=mapOf(story.id to 40),points=125,streak=3,
            savedWordIds=words.toSet(),dueWordIds=words,readerHintSeen=true)
    }

    @Test fun study() = check {Scaffold(bottomBar={TalesBottomBar(0) {}}) {StudyScreen(snapshot,{},{},it,{},{})}}
    @Test fun catalog() = check {Scaffold {CatalogScreen(snapshot,{},it)}}
    @Test fun storyDetail() = check {StoryDetailScreen(story,40,{},{},{},{})}
    @Test fun profile() = check {Scaffold {ProfileScreen(snapshot,{},it,{})}}
    @Test fun savedWords() = check {SavedWordsScreen(snapshot,{},{})}
    @Test fun reader() = check {ReaderScreen(story,snapshot,onBack={},onSaveWord={},onProgress={_,_->},
        onComplete={},onHintDismiss={},sessionId="large-text",onCheckpoint={_,_->},onOpenWords={})}
    @Test fun readingResult() = check {ReadingResultScreen(story,snapshot,{},{})}
    @Test fun practice() = check {Scaffold {PracticeScreen(snapshot,{_,_,_,_,_->},{_,_->},it,{_,_,_->},{_,_->},{})}}
    @Test fun settings() = check {LearningSettingsScreen(snapshot,{},{_,_,_,_->})}
    @Test fun onboarding() = check {OnboardingScreen(analyticsControls={}) {_,_,_->}}

    private fun check(screen: @Composable () -> Unit) {
        compose.setContent {
            DeviceConfigurationOverride(DeviceConfigurationOverride.FontScale(2f) then
                DeviceConfigurationOverride.ForcedSize(DpSize(320.dp,640.dp))) {EnglishTalesTheme(dark=false) {screen()}}
        }
        compose.waitForIdle()
        val width=compose.onRoot().fetchSemanticsNode().boundsInRoot.right
        val problems=compose.onAllNodes(androidx.compose.ui.test.hasText("",substring=true)).fetchSemanticsNodes(atLeastOneRootRequired=true)
            .flatMap {node ->
                val text=node.config.getOrNull(SemanticsProperties.Text)?.joinToString {it.text}.orEmpty()
                val layouts=mutableListOf<TextLayoutResult>()
                node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(layouts)
                buildList {
                    // didOverflowWidth also fires for wrap-content text, so check what the reader actually loses.
                    if(layouts.any {it.lostText()}) add("cut: $text")
                    if(layouts.any {it.splitsWord()}) add("word split: $text")
                    // Horizontally scrolling rows (story shelves) show partial cards on purpose.
                    val scrolls=generateSequence(node.parent) {it.parent}.any {SemanticsProperties.HorizontalScrollAxisRange in it.config}
                    if(!scrolls && node.boundsInRoot.right>width+1 && node.boundsInRoot.left<width) add("off screen: $text")
                }
            }
        assertEquals(emptyList<String>(),problems)
    }

    /** Lines dropped by maxLines/height, ellipsized, or drawn past the text's own bounds. */
    private fun TextLayoutResult.lostText()=didOverflowHeight ||
        (0 until lineCount).any {isLineEllipsized(it) || getLineRight(it)>size.width+1 || getLineLeft(it)< -1}

    /** A line break inside a word ("Kitapları" → "Kitapları / m") because the word is wider than its box. */
    private fun TextLayoutResult.splitsWord()=(0 until lineCount-1).any {line ->
        val end=getLineEnd(line); val text=layoutInput.text
        end in 1 until text.length && text[end-1].isLetterOrDigit() && text[end].isLetterOrDigit()
    }
}
