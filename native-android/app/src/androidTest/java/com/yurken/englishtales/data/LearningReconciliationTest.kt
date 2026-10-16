package com.yurken.englishtales.data

import android.content.ContextWrapper
import android.database.DatabaseErrorHandler
import android.database.sqlite.SQLiteDatabase
import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.io.File
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneId
import java.util.UUID

class LearningReconciliationTest {
    private lateinit var directory: File
    private val stores = mutableListOf<LearningStore>()
    private val user = UUID.randomUUID().toString()
    private val source = "https://fixture.supabase.co"
    private val now = Instant.parse("2026-10-11T10:00:00Z").toEpochMilli()
    private val capture = "2026-10-11T11:00:00.000002Z"
    @Before fun setup() {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        directory = File(target.cacheDir,"reconcile-${UUID.randomUUID()}").apply { mkdirs() }
    }
    @After fun cleanup() { stores.forEach { runCatching { it.close() } }; directory.deleteRecursively() }
    private fun context(device: String): ContextWrapper {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        val files = File(directory,device).apply { mkdirs() }
        return object : ContextWrapper(target) {
            override fun getDatabasePath(name: String) = File(files,name)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?) = SQLiteDatabase.openOrCreateDatabase(File(files,name),factory)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?,handler: DatabaseErrorHandler?) = SQLiteDatabase.openOrCreateDatabase(File(files,name).absolutePath,factory,handler)
        }
    }
    private fun store(device: String="a",owner: LearningOwner=LearningOwner.Account(user)) = LearningStore(context(device),owner) { now }.also { stores+=it }
    private fun profile(version: Long=3) = CloudLearningProfile("Ada","A1","Günlük yaşam",2,"UTC",version,now)
    private fun cloud(sessions: List<CloudLearningSession> = emptyList(),words: List<CloudLearningWord> = emptyList(),
                      progress: List<CloudLearningProgress> = emptyList(),captured: String=capture) =
        LearningCloudSnapshot(user,OffsetDateTime.parse(captured).toInstant().toEpochMilli(),profile(),sessions,words,progress,emptyList(),captured)
    private fun session(store: LearningStore, excluding: Set<String> = emptySet()): CloudLearningSession {
        val row = store.queuedOperations().single { it.rpc=="submit_learning_session" && it.id !in excluding }
        val p = JSONObject(row.payload)
        val finish = OffsetDateTime.parse(p.getString("finishedAt"))
        val revision = if(p.isNull("storyRevisionId")) null else p.getString("storyRevisionId")
        return CloudLearningSession(row.id,p.getString("kind"),if(p.getString("kind")=="reading") "quiet-morning" else null,revision,
            finish.atZoneSameInstant(ZoneId.of(p.getString("studyTimezone"))).toLocalDate().toString(),true,p.getInt("correctAnswers")*5,finish.toInstant().toEpochMilli())
    }
    private fun word(id: String,saved: Boolean,sourceRevision: String?=ContentRevisionIds.bundled("quiet-morning")) =
        CloudLearningWord(id,saved,if(saved) "known" else "learning",if(saved) 3 else 0,
            if(saved) now+7*LearningPolicy.DAY_MS else null,if(saved) 7 else 0,if(saved) "2026-10-11" else null,UUID.randomUUID().toString(),sourceRevision,now)
    private fun apply(store: LearningStore,snapshot: LearningCloudSnapshot) = store.reconcileCloud(snapshot,source) { true }

    @Test fun legacy45AndModern25Stay70AcrossAcknowledgementReplayAndReopen() {
        var local = store()
        local.completeLesson(5,UUID.randomUUID().toString())
        local.writableDatabase.execSQL("UPDATE learning_stats SET points=points+45,completed_lessons=completed_lessons+2 WHERE id=1")
        local.writableDatabase.execSQL("UPDATE learning_days SET sessions=sessions+2")
        val remote = cloud(listOf(session(local)))
        assertTrue(apply(local,remote));assertEquals(70,local.snapshot().points)
        assertEquals(3,local.snapshot().completedLessons)
        assertEquals(45,JSONObject(local.cloudState()!!.baselineJson).getInt("points"))
        // The snapshot is compact; an RPC duplicate acknowledgement is still required.
        assertEquals("pending",local.queuedOperations().single().state)
        local.markDelivered(local.queuedOperations().single().id,user)
        local.close();local=store()
        assertTrue(apply(local,remote));assertEquals(70,local.snapshot().points)
        assertEquals(3,local.snapshot().completedLessons)
    }
    @Test fun twoDevicesConvergeWithoutCountingPendingOrDeliveredSessionTwice() {
        val a = store("a");val b = store("b")
        a.completeLesson(5,UUID.randomUUID().toString());val first=session(a)
        apply(a,cloud(listOf(first)));apply(b,cloud(listOf(first)))
        b.completeLesson(4,UUID.randomUUID().toString());val second=session(b)
        apply(b,cloud(listOf(first)));assertEquals(45,b.snapshot().points)
        val both=cloud(listOf(first,second))
        apply(a,both);apply(b,both);apply(a,both);apply(b,both)
        assertEquals(45,a.snapshot().points);assertEquals(45,b.snapshot().points)
        assertEquals(2,a.snapshot().completedLessons);assertEquals(2,b.snapshot().completedLessons)
        assertTrue(b.queuedOperations().all { it.state=="pending" })
        b.queuedOperations().forEach { b.markDelivered(it.id,user) }
        apply(b,both);assertEquals(45,b.snapshot().points)
    }
    @Test fun pendingRemovalIsProtectedAndCloudTombstonesRemoveKnownWords() {
        val local=store()
        local.saveWords(listOf("quiet"));local.toggleWord("quiet")
        local.writableDatabase.execSQL("INSERT INTO saved_words(word_id) VALUES('morning')")
        local.writableDatabase.execSQL("INSERT INTO saved_words(word_id) VALUES('device-only-legacy')")
        val remote=cloud(words=listOf(word("quiet",true),word("morning",false),word("archived-source-word",true,null)))
        apply(local,remote)
        assertFalse("quiet" in local.snapshot().savedWordIds)
        assertFalse("morning" in local.snapshot().savedWordIds)
        assertTrue("device-only-legacy" in local.snapshot().savedWordIds)
        assertTrue("archived-source-word" in local.snapshot().savedWordIds)
        assertEquals(3,JSONObject(local.cloudState()!!.snapshotJson).getJSONArray("words").length())
        assertTrue(local.queuedOperations().all { it.state=="pending" })
    }
    @Test fun favoritesFollowTheAccountWhilePendingTapsAndOldServersAreRespected() {
        val local=store()
        local.setFavorite("quiet-morning",true);local.setFavorite("quiet-morning",true)
        assertEquals(1,local.queuedOperations().count { it.rpc=="apply_favorite_event" })
        local.writableDatabase.execSQL("INSERT INTO favorite_stories(story_id,added_at) VALUES('lost-map',0),('device-only',0)")
        val favorites=listOf(CloudStoryFavorite("quiet-morning",false,now),CloudStoryFavorite("lost-map",false,now),CloudStoryFavorite("paper-boat",true,now))
        // A server that predates favorite sync sends no list: nothing local changes.
        apply(local,cloud())
        assertEquals(setOf("quiet-morning","lost-map","device-only"),local.snapshot().favoriteStoryIds.toSet())
        apply(local,cloud().copy(favorites=favorites))
        // The unsent add wins over the cloud tombstone; other tombstones remove, cloud adds arrive.
        assertEquals(setOf("quiet-morning","device-only","paper-boat"),local.snapshot().favoriteStoryIds.toSet())
        assertTrue(JSONObject(local.cloudState()!!.snapshotJson).has("favorites"))
        val op=local.queuedOperations().single { it.rpc=="apply_favorite_event" }
        assertEquals(JSONObject().put("storyId","quiet-morning").put("favorite",true).toString(),
            JSONObject(op.payload).let { JSONObject().put("storyId",it.getString("storyId")).put("favorite",it.getBoolean("favorite")).toString() })
        assertTrue(local.markDelivered(op.id,user))
        apply(local,cloud().copy(favorites=favorites))
        assertFalse("quiet-morning" in local.snapshot().favoriteStoryIds)
    }
    @Test fun pendingReviewKeepsScheduleUntilDeliveryAndNextSnapshot() {
        val local=store();local.saveWords(listOf("quiet"));local.reviewWord("quiet",true)
        val before=local.snapshot().nextReviewAt
        apply(local,cloud(words=listOf(word("quiet",false))))
        assertTrue("quiet" in local.snapshot().savedWordIds);assertEquals(before,local.snapshot().nextReviewAt)
        local.queuedOperations().forEach { local.markDelivered(it.id,user) }
        apply(local,cloud(words=listOf(word("quiet",true))))
        assertEquals("known",local.snapshot().wordStates["quiet"])
        assertEquals(now+7*LearningPolicy.DAY_MS,local.snapshot().nextReviewAt)
    }
    @Test fun revisionProgressProtectsPendingCursorAndPreservesAllServerRevisions() {
        val local=store();val original=LearningContent.storyById.getValue("quiet-morning")
        local.updateProgress(original.id,88,"qm-8",original)
        val first=CloudLearningProgress(original.revisionId,original.id,"qm-2",40,now-60_000,UUID.randomUUID().toString(),now)
        apply(local,cloud(progress=listOf(first)))
        assertEquals(88,local.snapshot().storyProgress[original.id]);assertEquals("qm-8",local.snapshot().readingPositions[original.id]!!.sentenceId)
        val newer=first.copy(revisionId=UUID.randomUUID().toString(),percent=25,sentenceId="new-sentence",eventAt=now+60_000,eventAtIso=Instant.ofEpochMilli(now+60_000).toString())
        apply(local,cloud(progress=listOf(first,newer)))
        assertEquals(original.revisionId,local.snapshot().readingPositions[original.id]!!.revisionId)
        local.queuedOperations().forEach { local.markDelivered(it.id,user) }
        apply(local,cloud(progress=listOf(first,newer)))
        assertEquals(25,local.snapshot().storyProgress[original.id])
        assertEquals(newer.revisionId,local.snapshot().readingPositions[original.id]!!.revisionId)
        assertEquals(2,JSONObject(local.cloudState()!!.snapshotJson).getJSONArray("progress").length())
    }
    @Test fun dirtyPreferencesArePreservedAndRemoteVersionConflictIsRecorded() {
        val local=store();local.updatePreferences("B1","Gizem",3,"Yerel")
        local.dismissReaderHint();local.startReading("quiet-morning")
        apply(local,cloud())
        assertEquals("Yerel",local.snapshot().displayName);assertEquals("B1",local.snapshot().level)
        assertEquals(3,local.snapshot().dailyGoal);assertTrue(local.cloudState()!!.preferencesConflict)
        assertEquals(3L,local.cloudState()!!.preferencesVersion)
        assertTrue(local.snapshot().readerHintSeen);assertEquals("quiet-morning",local.snapshot().lastStoryId)
        val clean=store("b");apply(clean,cloud())
        assertEquals("Ada",clean.snapshot().displayName);assertTrue(clean.snapshot().onboardingDone)
        assertFalse(clean.cloudState()!!.preferencesConflict)
    }
    @Test fun accountChangeDuringTransactionRollsBackEveryProjectionAndMetadata() {
        val local=store();local.completeLesson(5,UUID.randomUUID().toString())
        val before=local.snapshot();var checks=0
        val result=runCatching { local.reconcileCloud(cloud(),source) { ++checks==1 } }
        assertEquals("account_scope_changed",(result.exceptionOrNull() as LearningSyncFailure).code)
        assertEquals(before,local.snapshot());assertNull(local.cloudState())
        assertEquals("pending",local.queuedOperations().single().state)
    }
    @Test fun failedWriteRollsBackBaselineAndLearningHistory() {
        val local=store();val before=local.snapshot()
        local.writableDatabase.execSQL("CREATE TEMP TRIGGER fail_cloud BEFORE INSERT ON learning_cloud_state BEGIN SELECT RAISE(ABORT,'fixture'); END")
        assertTrue(runCatching { apply(local,cloud(words=listOf(word("quiet",true)))) }.isFailure)
        assertEquals(before,local.snapshot());assertNull(local.cloudState())
    }
    @Test fun staleMicrosecondSnapshotAndChangedProjectCannotOverwriteHistory() {
        val local=store();apply(local,cloud(words=listOf(word("quiet",true))))
        assertFalse(apply(local,cloud(words=listOf(word("quiet",false)),captured="2026-10-11T11:00:00.000001Z")))
        assertTrue("quiet" in local.snapshot().savedWordIds)
        val changed=runCatching { local.reconcileCloud(cloud(),"https://other.supabase.co") { true } }
        assertEquals("cloud_source_changed",(changed.exceptionOrNull() as LearningSyncFailure).code)
        assertTrue("quiet" in local.snapshot().savedWordIds)
    }
    @Test fun mismatchedAcceptedIdIsRejectedWithoutLosingLocalReward() {
        val local=store();local.completeLesson(5,UUID.randomUUID().toString())
        val wrong=cloud(listOf(session(local).copy(points=20)))
        assertTrue(runCatching { apply(local,wrong) }.isFailure)
        assertEquals(25,local.snapshot().points);assertNull(local.cloudState())
        assertEquals("pending",local.queuedOperations().single().state)
    }
    @Test fun legacyReadingAndNewOfflineReadingDoNotDuplicateServerStoryDay() {
        val local=store();val story=LearningContent.storyById.getValue("quiet-morning")
        val day=LearningPolicy.dayKey(now)
        local.writableDatabase.execSQL("INSERT INTO learning_days(day,sessions,readings) VALUES(?,1,1)",arrayOf(day))
        local.writableDatabase.execSQL("INSERT INTO engagement_events(event_id,name,created_at) VALUES(?,'reading_completed',?)",arrayOf<Any?>("read:${story.id}:$day",now))
        val read=CloudLearningSession(UUID.randomUUID().toString(),"reading",story.id,story.revisionId,day,true,0,now)
        apply(local,cloud(listOf(read)));assertEquals(1,local.snapshot().todaySessions)
        local.completeReading(story.id)
        apply(local,cloud(listOf(read)));assertEquals(1,local.snapshot().todaySessions)
        assertEquals(1,local.snapshot().todayReadings)
    }
    @Test fun guestImportAfterCloudBaselineAddsLegacyOnlyOnce() {
        val account=store();account.completeLesson(5,UUID.randomUUID().toString());val first=session(account)
        apply(account,cloud(listOf(first)))
        val guest=store("guest",LearningOwner.Guest)
        guest.completeLesson(4,UUID.randomUUID().toString())
        guest.writableDatabase.execSQL("UPDATE learning_stats SET points=points+45,completed_lessons=completed_lessons+2")
        guest.writableDatabase.execSQL("UPDATE learning_days SET sessions=sessions+2")
        val claim=GuestTransfer.claim(guest,user)!!
        assertTrue(GuestTransfer.import(account,claim));assertFalse(GuestTransfer.import(account,claim))
        val second=session(account,setOf(first.id))
        apply(account,cloud(listOf(first)));assertEquals(90,account.snapshot().points)
        assertEquals(45,JSONObject(account.cloudState()!!.baselineJson).getInt("points"))
        apply(account,cloud(listOf(first,second)));assertEquals(90,account.snapshot().points)
        assertEquals(4,account.snapshot().completedLessons)
    }
    @Test fun guestWordCannotResurrectAnotherDevicesCloudRemoval() {
        val account=store();apply(account,cloud(words=listOf(word("quiet",false))))
        val guest=store("guest",LearningOwner.Guest);guest.saveWords(listOf("quiet"))
        assertTrue(GuestTransfer.transfer(guest,account))
        assertFalse("quiet" in account.snapshot().savedWordIds)
        assertEquals("account_word_precedence",account.queuedOperations().single().errorCode)
    }
    @Test fun versionFiveMigrationPreservesQueueProfileAndImportReceipts() {
        var local=store();local.completeLesson(5,UUID.randomUUID().toString())
        local.updatePreferences("B1","Gizem",3,"Yerel")
        val before=local.queuedOperations()
        local.writableDatabase.execSQL("INSERT INTO guest_imports VALUES('receipt','hash',45,2,'{}',?)",arrayOf(now))
        local.writableDatabase.execSQL("DROP TABLE learning_cloud_state");local.writableDatabase.execSQL("DROP TABLE favorite_stories")
        local.writableDatabase.version=5
        local.close();local=store()
        assertEquals(7,local.readableDatabase.version);assertEquals(25,local.snapshot().points)
        assertEquals("Yerel",local.snapshot().displayName);assertEquals(before,local.queuedOperations())
        local.readableDatabase.query("SELECT legacy_points FROM guest_imports WHERE id='receipt'").use { c -> assertTrue(c.moveToFirst());assertEquals(45,c.getInt(0)) }
        assertNull(local.cloudState())
    }
    @Test fun incompleteLaterSnapshotCannotErasePreviouslyAcceptedHistory() {
        val local=store();local.completeLesson(5,UUID.randomUUID().toString())
        apply(local,cloud(listOf(session(local)),words=listOf(word("quiet",true))))
        val before=local.snapshot();val metadata=local.cloudState()
        val result=runCatching { apply(local,cloud(captured="2026-10-11T12:00:00Z")) }
        assertEquals("learning_snapshot_incomplete",(result.exceptionOrNull() as LearningSyncFailure).code)
        assertEquals(before,local.snapshot());assertEquals(metadata,local.cloudState())
    }
    @Test fun laterSnapshotCannotRewriteAnImmutableSessionOrLowerRevisionProgress() {
        val local=store();local.completeLesson(5,UUID.randomUUID().toString())
        val s=session(local)
        val p=CloudLearningProgress(ContentRevisionIds.bundled("quiet-morning"),"quiet-morning","qm-8",88,now,UUID.randomUUID().toString(),now)
        apply(local,cloud(listOf(s),progress=listOf(p)))
        val before=local.snapshot()
        val changed=runCatching { apply(local,cloud(listOf(s.copy(points=20)),progress=listOf(p))) }
        assertEquals("learning_snapshot_inconsistent",(changed.exceptionOrNull() as LearningSyncFailure).code)
        val lowered=runCatching { apply(local,cloud(listOf(s),progress=listOf(p.copy(percent=25)))) }
        assertEquals("learning_snapshot_inconsistent",(lowered.exceptionOrNull() as LearningSyncFailure).code)
        assertEquals(before,local.snapshot())
    }
    @Test fun knownLegacyStreakSurvivesWithoutFabricatingDailySessions() {
        val local=store()
        local.writableDatabase.execSQL("UPDATE learning_stats SET points=45,completed_lessons=2,streak=2,last_study_day='2026-10-10'")
        val s=CloudLearningSession(UUID.randomUUID().toString(),"choice",null,null,"2026-10-11",true,25,now)
        apply(local,cloud(listOf(s)))
        assertEquals(70,local.snapshot().points);assertEquals(3,local.snapshot().streak)
        assertEquals(1,local.snapshot().todaySessions)
        local.readableDatabase.query("SELECT COUNT(*) FROM learning_days WHERE day<'2026-10-11'").use {c -> assertTrue(c.moveToFirst());assertEquals(0,c.getInt(0))}
        val guest=store("guest",LearningOwner.Guest);guest.completeLesson(1,UUID.randomUUID().toString())
        GuestTransfer.transfer(guest,local)
        assertEquals(3,local.snapshot().streak)
        apply(local,cloud(listOf(s)));assertEquals(3,local.snapshot().streak)
    }
}
