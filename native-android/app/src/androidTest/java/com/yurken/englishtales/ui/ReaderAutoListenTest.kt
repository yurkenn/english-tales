package com.yurken.englishtales.ui

import android.content.Context
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.LearningContent
import com.yurken.englishtales.data.LearningSnapshot
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/** "Listen" starts narration once; recreating the reader (rotation, theme, restore) must not restart it. */
class ReaderAutoListenTest {
    @get:Rule val compose=createComposeRule()

    private class CountingNarrator(context: Context,private val calls: MutableList<List<String>>) : Narrator(context) {
        override fun speakAll(texts: List<String>) {calls+=texts;super.speakAll(texts)}
    }

    @Test fun recreatingTheReaderDoesNotRestartAutoListen() {
        LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext)
        val story=LearningContent.stories.first {it.sentences.size>8}
        val calls=mutableListOf<List<String>>()
        val restoration=StateRestorationTester(compose)
        restoration.setContent {EnglishTalesTheme {
            ReaderScreen(story,LearningSnapshot(readerHintSeen=true),onBack={},onSaveWord={},onProgress={_,_->},autoListen=true,
                onComplete={},onHintDismiss={},sessionId="listen",onCheckpoint={_,_->},narratorFactory={CountingNarrator(it,calls)})
        }}
        compose.waitForIdle()
        compose.runOnIdle {assertEquals(1,calls.size)}
        restoration.emulateSavedInstanceStateRestore()
        compose.waitForIdle()
        compose.runOnIdle {assertEquals(1,calls.size)}
    }
}
