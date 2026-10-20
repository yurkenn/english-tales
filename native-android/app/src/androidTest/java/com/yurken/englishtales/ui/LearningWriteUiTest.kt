package com.yurken.englishtales.ui

import android.app.Application
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.*
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.lifecycle.ViewModelStore
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import kotlinx.coroutines.test.StandardTestDispatcher
import org.junit.Rule
import org.junit.Test

@OptIn(androidx.compose.ui.test.ExperimentalTestApi::class)
class LearningWriteUiTest {
    // Writes emit StateFlow updates from IO. Queue their Compose continuations on the
    // test clock instead of resuming layout work inline on the emitting IO thread.
    @get:Rule val compose=createComposeRule(effectContext=StandardTestDispatcher())

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
            // The retried save can be the first word event on this catalog, which builds its catalog-wide revision lookup; build it outside the timed retry.
            LearningContent.revisionForWord(word)
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
            // The IO error and its rendered bar are separate milestones.
            compose.waitUntil(5_000) {compose.onNodeWithText("Tekrar dene").isDisplayed()}
            compose.onNodeWithText("Tekrar dene").assertIsDisplayed()
            compose.onNodeWithText("Tekrar dene").performClick()
            // The actor is FIFO: a write queued behind the failed retry proves that retry ran (and failed) before the trigger is dropped.
            vm.refresh()
            compose.waitUntil(5_000) {vm.writeError.value?.pendingCount==2}
            compose.runOnIdle {reading=false}
            compose.onNodeWithText("Kelimelerle oyna").assertIsDisplayed()
            // Practice scans every story off the main thread (SentenceGapGameTest allows 15 s); let it finish so it does not eat the retry's 5 s.
            fun ready(title: String)=compose.onAllNodesWithText(title).fetchSemanticsNodes().all {!it.config.contains(SemanticsProperties.Disabled)}
            compose.waitUntil(15_000) {ready("Cümlede boşluk doldur") && ready("Cümleyi kur")}
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
