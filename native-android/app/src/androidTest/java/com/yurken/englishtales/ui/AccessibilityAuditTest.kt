package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.Composable
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/** Every action on the main journey screens is announced by TalkBack with a name and a role (Q3.2). */
class AccessibilityAuditTest {
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

    @Test fun study() = audit {StudyScreen(snapshot,{},{},PaddingValues(),{},{})}
    @Test fun catalog() = audit {CatalogScreen(snapshot,{},PaddingValues())}
    @Test fun storyDetail() = audit {StoryDetailScreen(story,40,{},{},{},{})}
    @Test fun profile() = audit {ProfileScreen(snapshot,{},PaddingValues(),{})}
    @Test fun savedWords() = audit {SavedWordsScreen(snapshot,{},{})}
    @Test fun reader() = audit {ReaderScreen(story,snapshot,onBack={},onSaveWord={},onProgress={_,_->},
        onComplete={},onHintDismiss={},sessionId="audit",onCheckpoint={_,_->},onOpenWords={})}
    @Test fun readingResult() = audit {ReadingResultScreen(story,snapshot,{},{})}
    @Test fun practice() = audit {PracticeScreen(snapshot,{_,_,_,_,_->},{_,_->},PaddingValues(),{_,_,_->},{_,_->},{})}
    @Test fun settings() = audit {LearningSettingsScreen(snapshot,{},{_,_,_,_->})}
    @Test fun onboarding() = audit {OnboardingScreen(analyticsControls={}) {_,_,_->}}

    private fun audit(screen: @Composable () -> Unit) {
        compose.setContent {EnglishTalesTheme {screen()}}
        compose.waitForIdle()
        val nodes=compose.onAllNodes(hasClickAction()).fetchSemanticsNodes()
        assertTrue("No actions found",nodes.isNotEmpty())
        val problems=nodes.mapNotNull {node ->
            val config=node.config
            val label=(config.getOrNull(SemanticsProperties.ContentDescription).orEmpty()+
                config.getOrNull(SemanticsProperties.Text).orEmpty().map {it.text}).joinToString(" ").trim()
            // Word links are spans of the sentence text; TalkBack lists them with that text.
            val link=config.any {it.key.name=="LinkTestMarker"} && node.parent?.config?.getOrNull(SemanticsProperties.Text)!=null
            when {
                link -> null
                label.isEmpty() -> "unlabelled action at ${node.boundsInRoot}"
                config.getOrNull(SemanticsProperties.Role)==null && SemanticsActions.SetText !in config -> "no role: $label"
                else -> null
            }
        }
        assertEquals(emptyList<String>(),problems)
    }
}
