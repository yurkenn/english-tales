package com.yurken.englishtales.data

import android.content.ContextWrapper
import android.database.DatabaseErrorHandler
import android.database.sqlite.SQLiteDatabase
import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.io.IOException
import java.time.Instant
import java.util.UUID

class LearningAccountSyncTest {
    private class Memory(private var session: AccountSession?) : SessionStorage {
        override fun read() = session
        override fun write(session: AccountSession) { this.session=session }
        override fun clear() { session=null }
    }
    private fun exercise(block: (LearningStore,AccountService,()->Unit)->Unit) {
        val target=InstrumentationRegistry.getInstrumentation().targetContext
        val directory=File(target.cacheDir,"account-sync-${UUID.randomUUID()}").apply { mkdirs() }
        val context=object:ContextWrapper(target) {
            override fun getDatabasePath(name: String)=File(directory,name)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?)=SQLiteDatabase.openOrCreateDatabase(File(directory,name),factory)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?,handler: DatabaseErrorHandler?)=SQLiteDatabase.openOrCreateDatabase(File(directory,name).absolutePath,factory,handler)
        }
        val user=UUID.randomUUID().toString()
        var now=Instant.parse("2026-10-11T10:00:00Z").toEpochMilli()
        val account=AccountService(null,Memory(AccountSession(user,"fixture@example.test","fixture-token","fixture-refresh",System.currentTimeMillis()+3_600_000)))
        account.restore()
        try { LearningStore(context,LearningOwner.Account(user)) { now }.use { block(it,account,{now+=60_000}) } }
        finally {directory.deleteRecursively()}
    }
    private fun cloud(store: LearningStore,sessions: List<CloudLearningSession> = emptyList(),version: Long=1) = LearningCloudSnapshot(
        store.owner.id,Instant.parse("2026-10-11T12:00:00Z").toEpochMilli(),
        CloudLearningProfile("Okuyucu","A1","Günlük yaşam",1,"UTC",version,Instant.parse("2026-10-11T10:00:00Z").toEpochMilli()),
        sessions,emptyList(),emptyList(),emptyList()
    ).json()
    private fun session(id: String,p: JSONObject)=CloudLearningSession(id,p.getString("kind"),null,null,"2026-10-11",true,p.getInt("correctAnswers")*5,Instant.parse(p.getString("finishedAt")).toEpochMilli())

    @Test fun uploadThenSnapshotKeepsLegacyPointsAndDoesNotRewardTwice()=exercise {store,account,_ ->
        store.completeLesson(5,UUID.randomUUID().toString())
        store.writableDatabase.execSQL("UPDATE learning_stats SET points=points+45 WHERE id=1")
        store.reconcileCloud(LearningCloudSnapshot.decode(cloud(store),store.owner.id),"https://fixture.supabase.co") {true}
        val remote=mutableListOf<CloudLearningSession>();val calls=mutableListOf<String>()
        val sync=LearningAccountSync(LearningSyncTransport {rpc,body,_ ->
            calls+=rpc
            if(rpc=="submit_learning_session") {
                val p=body.getJSONObject("p_event");remote+=session(p.getString("id"),p)
                JSONObject().put("applied",true)
            } else cloud(store,remote)
        },"https://fixture.supabase.co")
        assertTrue(sync.step(store,account,store.owner.id) {true}.continueUpload)
        val result=sync.step(store,account,store.owner.id) {true}
        assertFalse(result.continueUpload);assertEquals(0,result.state.pending)
        assertEquals(45,result.state.deviceOnlyPoints);assertNotNull(result.state.lastSuccessAt)
        assertEquals(listOf("submit_learning_session","get_learning_snapshot"),calls)
        assertEquals(70,store.snapshot().points)
        sync.step(store,account,store.owner.id) {true}
        assertEquals(70,store.snapshot().points)
        // The snapshot lists the delivered session, so its outbox row is pruned.
        assertTrue(store.queuedOperations().isEmpty())
    }
    @Test fun batchesYieldAndPullOnlyAfterDueQueueDrains()=exercise {store,account,_ ->
        repeat(2) {store.completeLesson(5,UUID.randomUUID().toString())}
        store.reconcileCloud(LearningCloudSnapshot.decode(cloud(store),store.owner.id),"https://fixture.supabase.co") {true}
        val remote=mutableListOf<CloudLearningSession>();var pulls=0
        val sync=LearningAccountSync(LearningSyncTransport {rpc,body,_ ->
            if(rpc=="submit_learning_session") {
                val p=body.getJSONObject("p_event");remote+=session(p.getString("id"),p);JSONObject().put("applied",true)
            } else {pulls++;cloud(store,remote)}
        },"https://fixture.supabase.co")
        assertTrue(sync.step(store,account,store.owner.id) {true}.continueUpload)
        assertEquals(0,pulls);assertEquals(1,sync.status(store).pending)
        assertTrue(sync.step(store,account,store.owner.id) {true}.continueUpload)
        assertEquals(0,pulls)
        assertFalse(sync.step(store,account,store.owner.id) {true}.continueUpload)
        assertEquals(1,pulls);assertEquals(50,store.snapshot().points)
    }
    @Test fun lostAcknowledgementRetriesOriginalIdAndAcceptsDuplicate()=exercise {store,account,advance ->
        store.completeLesson(5,UUID.randomUUID().toString())
        store.reconcileCloud(LearningCloudSnapshot.decode(cloud(store),store.owner.id),"https://fixture.supabase.co") {true}
        var saved: CloudLearningSession?=null;val payloads=mutableListOf<String>()
        val sync=LearningAccountSync(LearningSyncTransport {rpc,body,_ ->
            if(rpc=="submit_learning_session") {
                val p=body.getJSONObject("p_event");payloads+=p.toString()
                if(saved==null) {saved=session(p.getString("id"),p);throw IOException("fixture disconnect")}
                JSONObject().put("applied",false)
            } else cloud(store,listOf(saved!!))
        },"https://fixture.supabase.co")
        assertEquals(1,sync.step(store,account,store.owner.id) {true}.state.pending)
        advance()
        assertEquals(0,sync.step(store,account,store.owner.id) {true}.state.pending)
        sync.step(store,account,store.owner.id) {true}
        assertEquals(payloads.first(),payloads.last());assertEquals(25,store.snapshot().points)
    }
    @Test fun lateSnapshotCannotChangeStoreAfterAccountSwitchRequested()=exercise {store,account,_ ->
        var current=true
        val sync=LearningAccountSync(LearningSyncTransport {_,_,_ ->current=false;cloud(store)},"https://fixture.supabase.co")
        val failure=runCatching {sync.step(store,account,store.owner.id) {current}}.exceptionOrNull() as LearningSyncFailure
        assertEquals("account_scope_changed",failure.code);assertNull(store.cloudState())
    }
    @Test fun invalidInitialOwnerSnapshotPreventsUploadAndPreservesProgress()=exercise {store,account,_ ->
        store.completeLesson(5,UUID.randomUUID().toString())
        val sync=LearningAccountSync(LearningSyncTransport {rpc,_,_ ->
            if(rpc=="submit_learning_session") JSONObject().put("applied",true)
            else cloud(store).put("userId",UUID.randomUUID().toString())
        },"https://fixture.supabase.co")
        assertTrue(runCatching {sync.step(store,account,store.owner.id) {true}}.isFailure)
        assertNull(store.cloudState());assertEquals(25,store.snapshot().points)
        assertEquals("pending",store.queuedOperations().single().state)
    }
    @Test fun dirtyPreferencesAreVisibleAndNeverWrittenByLearningSync()=exercise {store,account,_ ->
        store.updatePreferences("A2","Günlük yaşam",2,"Yerel")
        val sync=LearningAccountSync(LearningSyncTransport {rpc,_,_ ->assertEquals("get_learning_snapshot",rpc);cloud(store,version=3)},"https://fixture.supabase.co")
        val state=sync.step(store,account,store.owner.id) {true}.state
        assertTrue(state.preferencesPending);assertTrue(state.preferencesConflict)
        assertEquals("Yerel",store.snapshot().displayName)
    }
    @Test fun unauthorizedUploadRequestsVerificationAndKeepsTheEvent()=exercise {store,account,_ ->
        store.completeLesson(5,UUID.randomUUID().toString())
        store.reconcileCloud(LearningCloudSnapshot.decode(cloud(store),store.owner.id),"https://fixture.supabase.co") {true}
        val sync=LearningAccountSync(LearningSyncTransport {_,_,_ ->throw LearningSyncFailure("PGRST301",401)},"https://fixture.supabase.co")
        val result=sync.step(store,account,store.owner.id) {true}
        assertTrue(result.verifySession);assertFalse(result.continueUpload)
        assertEquals(1,result.state.pending);assertEquals(25,store.snapshot().points)
    }
    @Test fun statusCountsMatchQueueSemanticsWithManyDeliveredRows()=exercise {store,_,_ ->
        val payload=JSONObject().put("fixture","x".repeat(512)).toString()
        fun row(state: String,code: String?,retryAt: Long=0) = store.writableDatabase.execSQL(
            "INSERT INTO learning_outbox(id,owner_id,rpc,payload,created_at,state,attempts,next_attempt_at,error_code,delivered_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
            arrayOf(UUID.randomUUID().toString(),store.owner.id,"apply_word_event",payload,1L,state,0,retryAt,code,if(state=="delivered") 1L else null))
        val db=store.writableDatabase;db.beginTransaction()
        try {
            repeat(2_000) {row("delivered",null)}
            repeat(3) {row("pending",null)};row("pending","invalid_response",Long.MAX_VALUE)
            repeat(2) {row("blocked",null)};row("blocked","invalid_payload")
            repeat(4) {row("blocked","account_word_precedence")}
            db.setTransactionSuccessful()
        } finally {db.endTransaction()}
        val queue=store.queuedOperations()
        val status=LearningAccountSync(LearningSyncTransport {_,_,_ ->error("No network in status")},"https://fixture.supabase.co").status(store)
        assertEquals(queue.count {it.state=="pending"},status.pending)
        assertEquals(queue.count {it.state=="blocked" && it.errorCode!="account_word_precedence"},status.blocked)
        assertEquals(4,status.pending);assertEquals(3,status.blocked)
    }
    private fun preferenceResponse(store: LearningStore,body: JSONObject)=cloud(store).getJSONObject("profile")
        .put("user_id",store.owner.id).put("display_name",body.getString("p_name")).put("level",body.getString("p_level"))
        .put("preferred_genre",body.getString("p_genre")).put("daily_goal",body.getInt("p_goal"))
        .put("timezone",body.getString("p_timezone")).put("preferences_version",body.getLong("p_expected_version")+1)
    private fun prime(store: LearningStore,version: Long=1) {
        store.reconcileCloud(LearningCloudSnapshot.decode(cloud(store,version=version),store.owner.id),"https://fixture.supabase.co") {true}
    }
    @Test fun preferenceSaveUsesCasAndAcknowledgesExactFields()=exercise {store,account,_ ->
        prime(store);store.updatePreferences("A2","Macera",3,"Ada")
        assertTrue(LearningPreferencesSync.write(store,account,LearningSyncTransport {rpc,body,_ ->
            assertEquals("save_learning_preferences",rpc);assertEquals(1L,body.getLong("p_expected_version"))
            assertEquals(3,body.getInt("p_goal"));preferenceResponse(store,body)
        }) {true})
        assertNull(LearningPreferencesSync.draft(store));assertEquals(2L,store.cloudState()!!.preferencesVersion)
    }
    @Test fun preferenceEditDuringNetworkCallIsNotClearedByOldAcknowledgement()=exercise {store,account,_ ->
        prime(store);store.updatePreferences("A2","Macera",3,"Ada")
        LearningPreferencesSync.write(store,account,LearningSyncTransport {_,body,_ ->
            store.updatePreferences("B1","Gizem",1,"Yeni");preferenceResponse(store,body)
        }) {true}
        assertEquals("Yeni",LearningPreferencesSync.draft(store)!!.name)
        assertEquals(2L,store.cloudState()!!.preferencesVersion)
    }
    @Test fun casConflictIsRetainedUntilExplicitChoice()=exercise {store,account,_ ->
        prime(store);store.updatePreferences("A2","Macera",3,"Ada")
        assertTrue(runCatching {LearningPreferencesSync.write(store,account,LearningSyncTransport {_,_,_ ->throw LearningSyncFailure("40001",409)}) {true}}.isFailure)
        assertTrue(store.cloudState()!!.preferencesConflict);assertNotNull(LearningPreferencesSync.draft(store))
        assertFalse(LearningPreferencesSync.write(store,account,LearningSyncTransport {_,_,_ ->error("Must not overwrite")}) {true})
        LearningPreferencesSync.resolve(store,false)
        assertEquals("Okuyucu",store.snapshot().displayName);assertNull(LearningPreferencesSync.draft(store))
        assertFalse(store.cloudState()!!.preferencesConflict)
    }
    @Test fun choosingLocalPreferencesUsesTheObservedRemoteVersion()=exercise {store,account,_ ->
        store.updatePreferences("A2","Macera",2,"Yerel");prime(store,3)
        assertTrue(store.cloudState()!!.preferencesConflict)
        LearningPreferencesSync.resolve(store,true)
        LearningPreferencesSync.write(store,account,LearningSyncTransport {_,body,_ ->
            assertEquals(3L,body.getLong("p_expected_version"));preferenceResponse(store,body)
        }) {true}
        assertNull(LearningPreferencesSync.draft(store));assertEquals(4L,store.cloudState()!!.preferencesVersion)
    }
    @Test fun preferenceAcknowledgementForAnotherOwnerCannotClearLocalEdit()=exercise {store,account,_ ->
        prime(store);store.updatePreferences("A2","Macera",2,"Ada")
        assertTrue(runCatching {LearningPreferencesSync.write(store,account,LearningSyncTransport {_,body,_ ->
            preferenceResponse(store,body).put("user_id",UUID.randomUUID().toString())
        }) {true}}.isFailure)
        assertNotNull(LearningPreferencesSync.draft(store));assertEquals(1L,store.cloudState()!!.preferencesVersion)
    }
}
