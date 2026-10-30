package com.yurken.englishtales.analytics

import android.content.Context
import android.content.ContextWrapper
import android.content.SharedPreferences
import android.database.sqlite.SQLiteDatabase
import android.database.DatabaseErrorHandler
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.LearningStore
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.Assert.*
import java.util.UUID

class ProductLearningSignalsTest {
    private lateinit var context: Context
    private lateinit var store: LearningStore
    private val prefix = "product-signals-${UUID.randomUUID()}-"
    private val events = mutableListOf<LearningSignal>()

    @Before fun open() {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        context = object : ContextWrapper(target) {
            override fun getDatabasePath(name: String) = super.getDatabasePath(prefix + name)
            override fun openOrCreateDatabase(name: String, mode: Int, factory: SQLiteDatabase.CursorFactory?): SQLiteDatabase = super.openOrCreateDatabase(prefix + name, mode, factory)
            override fun openOrCreateDatabase(name: String, mode: Int, factory: SQLiteDatabase.CursorFactory?, handler: DatabaseErrorHandler?): SQLiteDatabase = super.openOrCreateDatabase(prefix + name, mode, factory, handler)
            override fun getSharedPreferences(name: String, mode: Int): SharedPreferences = super.getSharedPreferences(prefix + name, mode)
        }
        store = LearningStore(context)
        store.onProductSignal = { signal ->
            assertFalse("analytics must run after commit", store.writableDatabase.inTransaction())
            events += signal
        }
    }
    @After fun close() { store.close(); context.getDatabasePath("english_tales.db").delete() }

    @Test fun successfulWritesEmitOnceAndNeverContainLearningContent() {
        store.completeOnboarding("A1", "Günlük yaşam", 1); store.completeOnboarding("A1", "Günlük yaşam", 1)
        store.startReading("quiet-morning"); store.startReading("quiet-morning")
        store.completeReading("quiet-morning", "read-one"); store.completeReading("quiet-morning", "read-one")
        store.completeReading("quiet-morning", "another-read-on-same-day")
        store.completeReading("red-umbrella", "read-two")
        store.completeLesson(3, "practice-one"); store.completeLesson(3, "practice-one")
        assertEquals(listOf(LearningSignal.OnboardingCompleted, LearningSignal.StoryStarted,
            LearningSignal.StoryCompleted(true), LearningSignal.StoryCompleted(false),
            LearningSignal.PracticeCompleted(PracticeMode.CHOICE)), events)
    }
    @Test fun rolledBackCompletionEmitsNothingAndRetryEmitsOnce() {
        store.writableDatabase.execSQL("CREATE TRIGGER fail_product BEFORE INSERT ON engagement_events WHEN NEW.name='reading_completed' BEGIN SELECT RAISE(ABORT,'fixture'); END")
        assertTrue(runCatching { store.completeReading("quiet-morning", "retry") }.isFailure)
        assertTrue(events.isEmpty()); assertFalse(store.sessionCompleted("retry"))
        store.writableDatabase.execSQL("DROP TRIGGER fail_product")
        store.completeReading("quiet-morning", "retry"); store.completeReading("quiet-morning", "retry")
        assertEquals(listOf(LearningSignal.StoryCompleted(true)), events)
    }
    @Test fun transportFailureDoesNotMakeCommittedLearningFailOrDuplicate() {
        var calls = 0
        store.onProductSignal = { calls++; error("transport unavailable") }
        store.completeLesson(4, "offline"); store.completeLesson(4, "offline")
        assertTrue(store.sessionCompleted("offline")); assertEquals(1, store.snapshot().completedLessons)
        assertEquals(1, calls)
    }
    @Test fun deviceConsentSurvivesRestartAndClearsItsOwnMarkersOnly() {
        val storage = PreferenceMetricsStorage(context)
        assertFalse(storage.read().enabled)
        val state = MetricsState(true, 1, 2, true, true, true)
        assertTrue(storage.write(state)); assertEquals(state, PreferenceMetricsStorage(context).read())
        assertTrue(storage.write(MetricsState())); assertEquals(MetricsState(), PreferenceMetricsStorage(context).read())
        store.completeLesson(2, "preserved"); assertEquals(1, store.snapshot().completedLessons)
    }
    @Test fun wordSavesEmitAfterCommitForBulkToggleExplicitAndPersonalPathsOnly() {
        store.saveWords(listOf("quiet", "morning", "quiet"))
        store.saveWords(listOf("quiet"))
        store.setWordSaved("quiet", true)
        assertEquals(2, events.size)
        store.toggleWord("quiet") // Removal is not a save.
        store.toggleWord("quiet")
        store.setWordSaved("morning", false)
        store.setWordSaved("morning", true)
        val personal = com.yurken.englishtales.data.WordInfo("glossary:walk", "walk", "yürümek", "", "")
        store.savePersonalWord(personal); store.savePersonalWord(personal)
        assertEquals(List(5) { LearningSignal.WordSaved }, events)
        assertTrue(store.isWordSaved(personal.id))
    }
    @Test fun failedWordBatchRollsBackWithoutSendingAnySaveSignals() {
        assertTrue(runCatching { store.saveWords(listOf("quiet", "not-a-real-word")) }.isFailure)
        assertFalse(store.isWordSaved("quiet")); assertTrue(events.isEmpty())
        store.saveWords(listOf("quiet"))
        assertEquals(listOf(LearningSignal.WordSaved), events)
    }
    @Test fun wordSignalFailureNeverRollsBackSavedWords() {
        var calls = 0
        store.onProductSignal = { calls++; error("offline") }
        store.saveWords(listOf("quiet")); store.saveWords(listOf("quiet"))
        assertTrue(store.isWordSaved("quiet")); assertEquals(1, calls)
    }
}
