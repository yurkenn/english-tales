package com.yurken.englishtales.data

import android.content.Context
import android.content.ContextWrapper
import android.database.DatabaseErrorHandler
import android.database.sqlite.SQLiteDatabase
import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONObject
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.Assert.*
import java.util.UUID

/** Separate files and preferences: never modifies the real signed-in user's data. */
class GuestTransferTest {
    private lateinit var context: Context
    private val prefix="transfer_test_${UUID.randomUUID()}_"
    private val names=mutableSetOf<String>()
    private val stores=mutableListOf<LearningStore>()
    private lateinit var guest: LearningStore
    private lateinit var target: LearningStore
    private val user=UUID.randomUUID().toString()
    private val now=System.currentTimeMillis()
    private fun open(owner: LearningOwner)=LearningStore(context,owner) {now}.also {stores+=it}
    @Before fun setup() {
        val base=InstrumentationRegistry.getInstrumentation().targetContext
        context=object: ContextWrapper(base) {
            private fun mapped(name: String)=(prefix+name).also {names+=it}
            override fun getDatabasePath(name: String)=super.getDatabasePath(mapped(name))
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?)=super.openOrCreateDatabase(mapped(name),mode,factory)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?,handler: DatabaseErrorHandler?)=super.openOrCreateDatabase(mapped(name),mode,factory,handler)
            override fun getSharedPreferences(name: String,mode: Int)=super.getSharedPreferences(prefix+name,mode)
        }
        guest=open(LearningOwner.Guest);target=open(LearningOwner.Account(user))
    }
    @After fun cleanup() {
        stores.forEach {it.close()}
        val base=InstrumentationRegistry.getInstrumentation().targetContext
        names.forEach {base.deleteDatabase(it)}
        context.getSharedPreferences("learning_preferences",0).edit().clear().commit()
    }
    private fun count(store: LearningStore,table: String): Int=store.readableDatabase.query("SELECT COUNT(*) FROM $table").use {it.moveToFirst();it.getInt(0)}
    private fun seed() {
        guest.completeOnboarding("A2","Macera",3)
        guest.saveWords(listOf("quiet","morning"))
        guest.updateProgress("quiet-morning",88)
        guest.completeLesson(4,UUID.randomUUID().toString())
    }
    @Test fun savedGlossaryWordsMoveWithTheirMeaning() {
        seed();guest.savePersonalWord(WordInfo("glossary:walk","walk","yürümek","",""))
        assertTrue(GuestTransfer.transfer(guest,target))
        assertEquals("yürümek",target.snapshot().personalWords["glossary:walk"]?.translation)
        assertTrue("glossary:walk" in target.snapshot().savedWordIds)
    }
    @Test fun mergesOnceAndPreservesExactOperationsAndAccountPreferences() {
        seed();target.completeOnboarding("B1","Gizem",2)
        val before=guest.queuedOperations()
        assertTrue(GuestTransfer.transfer(guest,target))
        assertEquals(20,target.snapshot().points);assertEquals(2,target.snapshot().savedWordIds.size)
        assertEquals("B1",target.snapshot().level);assertEquals(2,target.snapshot().dailyGoal)
        assertEquals(88,target.snapshot().storyProgress["quiet-morning"])
        before.forEach {operation ->
            val imported=target.queuedOperations().single {it.id==operation.id}
            assertEquals(operation.payload,imported.payload);assertEquals(user,imported.ownerId)
        }
        assertFalse(GuestTransfer.transfer(guest,target));assertEquals(20,target.snapshot().points)
        assertNull(GuestTransfer.preview(guest,user));assertEquals(0,guest.snapshot().points)
        assertEquals("A2",guest.snapshot().level);assertEquals(1,count(target,"guest_imports"))
    }
    @Test fun emptyAccountAdoptsGuestPreferences() {
        seed();GuestTransfer.transfer(guest,target)
        assertEquals("A2",target.snapshot().level);assertEquals("Macera",target.snapshot().preferredGenre)
        assertTrue(target.snapshot().onboardingDone)
    }
    @Test fun interruptedClaimSurvivesReopenAndCannotMoveToAnotherAccount() {
        seed();val claim=GuestTransfer.claim(guest,user)!!
        assertEquals(0,guest.snapshot().points);assertTrue(GuestTransfer.preview(guest,user)!!.pending)
        guest.close();guest=open(LearningOwner.Guest)
        assertEquals(claim,GuestTransfer.claim(guest,user))
        val other=UUID.randomUUID().toString()
        assertTrue(GuestTransfer.preview(guest,other)!!.blocked)
        try {GuestTransfer.claim(guest,other);fail()} catch(e: GuestTransferFailure) {assertEquals("different_target",e.code)}
        try {GuestTransfer.import(open(LearningOwner.Account(other)),claim);fail()} catch(e: GuestTransferFailure) {assertEquals("different_target",e.code)}
        assertTrue(GuestTransfer.transfer(guest,target));assertEquals(20,target.snapshot().points)
    }
    @Test fun crashAfterImportDoesNotRewardAgainAndNewGuestHistoryHasNewClaim() {
        seed();val claim=GuestTransfer.claim(guest,user)!!
        assertTrue(GuestTransfer.import(target,claim));target.close();target=open(LearningOwner.Account(user))
        assertFalse(GuestTransfer.transfer(guest,target));assertEquals(20,target.snapshot().points)
        assertNull(GuestTransfer.preview(guest,user))
        guest.saveWords(listOf("quiet"));val next=GuestTransfer.claim(guest,user)!!
        assertNotEquals(JSONObject(claim).getString("id"),JSONObject(next).getString("id"))
        assertTrue(GuestTransfer.import(target,next));assertEquals(20,target.snapshot().points)
    }
    @Test fun accountRemovalWinsAndGuestSaveCannotResurrectDuringUpload() {
        guest.saveWords(listOf("quiet","morning"));target.saveWords(listOf("quiet"));target.toggleWord("quiet")
        val save=guest.queuedOperations().first {JSONObject(it.payload).getString("wordId")=="quiet"}
        GuestTransfer.transfer(guest,target)
        assertFalse("quiet" in target.snapshot().savedWordIds);assertTrue("morning" in target.snapshot().savedWordIds)
        assertEquals("blocked",target.queuedOperations().single {it.id==save.id}.state)
    }
    @Test fun removalOnlyHistoryStillTransfersWithExactPayloads() {
        guest.saveWords(listOf("quiet"));guest.toggleWord("quiet")
        assertNotNull(GuestTransfer.preview(guest,user))
        val before=guest.queuedOperations()
        assertTrue(GuestTransfer.transfer(guest,target))
        assertTrue(target.snapshot().savedWordIds.isEmpty())
        assertEquals(before.map {it.payload},target.queuedOperations().map {it.payload})
        assertNull(GuestTransfer.preview(guest,user))
    }
    @Test fun duplicateReadingDayCountsOnceAndStreakIsRecomputed() {
        guest.completeReading("quiet-morning");target.completeReading("quiet-morning")
        GuestTransfer.transfer(guest,target)
        assertEquals(1,target.snapshot().todayReadings);assertEquals(1,target.snapshot().todaySessions)
        assertEquals(1,target.snapshot().streak)
    }
    @Test fun legacyTotalsStaySeparateFromMeasuredSessionPayloads() {
        seed();guest.writableDatabase.execSQL("UPDATE learning_stats SET points=65,completed_lessons=3 WHERE id=1")
        GuestTransfer.transfer(guest,target)
        assertEquals(65,target.snapshot().points);assertEquals(3,target.snapshot().completedLessons)
        target.readableDatabase.query("SELECT legacy_points,legacy_lessons FROM guest_imports").use {
            assertTrue(it.moveToFirst());assertEquals(45,it.getInt(0));assertEquals(2,it.getInt(1))
        }
        assertEquals(1,target.queuedOperations().count {it.rpc=="submit_learning_session"})
    }
    @Test fun importFailureRollsBackAndPayloadChangeCannotReuseReceipt() {
        seed();val claim=GuestTransfer.claim(guest,user)!!
        target.writableDatabase.execSQL("CREATE TEMP TRIGGER fail_transfer BEFORE INSERT ON guest_imports BEGIN SELECT RAISE(ABORT,'test_failure'); END")
        try {GuestTransfer.import(target,claim);fail()} catch (_: RuntimeException) {}
        assertEquals(0,target.snapshot().points);assertTrue(target.snapshot().savedWordIds.isEmpty())
        assertTrue(GuestTransfer.preview(guest,user)!!.pending)
        target.writableDatabase.execSQL("DROP TRIGGER fail_transfer")
        assertTrue(GuestTransfer.import(target,claim))
        val changed=JSONObject(claim).put("payload",JSONObject(JSONObject(claim).getString("payload")).put("extra",1).toString()).toString()
        try {GuestTransfer.import(target,changed);fail()} catch(e: GuestTransferFailure) {assertEquals("payload_conflict",e.code)}
        assertEquals(20,target.snapshot().points)
    }
    @Test fun versionFourMigrationPreservesGuestHistory() {
        seed();guest.writableDatabase.execSQL("DROP TABLE guest_transfers");guest.writableDatabase.execSQL("DROP TABLE guest_imports");guest.writableDatabase.execSQL("DROP TABLE learning_cloud_state");guest.writableDatabase.execSQL("DROP TABLE favorite_stories");guest.writableDatabase.execSQL("DROP TABLE personal_words")
        guest.writableDatabase.version=4;guest.close();guest=open(LearningOwner.Guest)
        assertEquals(8,guest.readableDatabase.version);assertEquals(20,guest.snapshot().points)
        assertEquals(2,guest.snapshot().savedWordIds.size);assertNotNull(GuestTransfer.preview(guest,user))
    }
    @Test fun progressKeepsMaximumWithinRevisionAndNewestAcrossRevisions() {
        val story=LearningContent.storyById.getValue("quiet-morning")
        guest.updateProgress(story.id,88,story.sentences.last().id,story);target.updateProgress(story.id,20,story.sentences.first().id,story)
        guest.writableDatabase.execSQL("UPDATE story_progress SET updated_at=1,sentence_id='old'")
        target.writableDatabase.execSQL("UPDATE story_progress SET updated_at=2,sentence_id='new'")
        GuestTransfer.transfer(guest,target)
        assertEquals(88,target.snapshot().storyProgress["quiet-morning"])
        assertEquals("new",target.snapshot().readingPositions["quiet-morning"]!!.sentenceId)
        guest.updateProgress("quiet-morning",10)
        guest.writableDatabase.execSQL("UPDATE story_progress SET revision_id=?,updated_at=3",arrayOf(UUID.randomUUID().toString()))
        GuestTransfer.transfer(guest,target)
        assertEquals(10,target.snapshot().storyProgress["quiet-morning"])
    }
}
