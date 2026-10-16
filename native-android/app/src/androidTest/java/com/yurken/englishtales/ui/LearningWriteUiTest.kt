package com.yurken.englishtales.ui

import android.app.Application
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.*
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.lifecycle.ViewModelStore
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class LearningWriteUiTest {
    @get:Rule val compose=createComposeRule()

    @Test fun readerAndPracticeKeepTheErrorVisibleUntilTheRetryButtonSaves() {
        val context=LearningReliabilityTest().isolated()
        val memory=object: SessionStorage {
            override fun read(): AccountSession?=null
            override fun write(session: AccountSession) {}
            override fun clear() {}
        }
        val holder=ViewModelStore()
        val vm=LearningViewModel(context.applicationContext as Application,AccountService(null,memory),{
            LearningStore(context,it).also {store ->
                store.writableDatabase.execSQL("CREATE TRIGGER fail_save BEFORE INSERT ON saved_words BEGIN SELECT RAISE(ABORT,'fixture'); END")
            }
        })
        holder.put("ui-reliability",vm)
        var reading by mutableStateOf(true)
        try {
            compose.waitUntil(5_000) {vm.ready.value}
            val story=LearningContent.stories.first()
            val word=LearningContent.words.first().id
            compose.setContent {
                val error by vm.writeError.collectAsState()
                val snapshot by vm.state.collectAsState()
                EnglishTalesTheme {
                    LearningWriteHost(error,vm::retryLearningWrites) {
                        if(reading) ReaderScreen(story,snapshot,onBack={},onSaveWord=vm::toggleWord,
                            onProgress={_,_->},onComplete={},onHintDismiss={},sessionId="ui-reader",onCheckpoint={_,_->})
                        else PracticeScreen(snapshot,vm::completeLesson,vm::reviewWord,PaddingValues(),
                            onSessionStart={_,_,_->},onCheckpoint={_,_->},onSessionAbandoned={})
                    }
                }
            }
            vm.toggleWord(word)
            compose.waitUntil(5_000) {vm.writeError.value!=null}
            compose.onNodeWithText("Tekrar dene").assertIsDisplayed()
            compose.onNodeWithText("Tekrar dene").performClick()
            compose.waitForIdle()
            assertTrue(vm.writeError.value!=null)
            compose.runOnIdle {reading=false}
            compose.onNodeWithText("Kelimelerle oyna").assertIsDisplayed()
            compose.onNodeWithText("Tekrar dene").assertIsDisplayed()
            LearningStore(context).use {it.writableDatabase.execSQL("DROP TRIGGER fail_save")}
            compose.onNodeWithText("Tekrar dene").performClick()
            compose.waitUntil(5_000) {vm.writeError.value==null && word in vm.state.value.savedWordIds}
            // The cleared error reaches the bar on the next recomposition, not with the state change itself.
            compose.waitUntil(5_000) {compose.onAllNodesWithText("Tekrar dene").fetchSemanticsNodes().isEmpty()}
            compose.onNodeWithText("Tekrar dene").assertDoesNotExist()
        } finally {
            InstrumentationRegistry.getInstrumentation().runOnMainSync {holder.clear()}
        }
    }
}
