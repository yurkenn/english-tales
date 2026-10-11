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
    private fun cloud(store: LearningStore,sessions: List<CloudLearningSession> = emptyList()) = LearningCloudSnapshot(
        store.owner.id,Instant.parse("2026-10-11T12:00:00Z").toEpochMilli(),
        CloudLearningProfile("Okuyucu","A1","Günlük yaşam",1,"UTC",1,Instant.parse("2026-10-11T10:00:00Z").toEpochMilli()),
        sessions,emptyList(),emptyList(),emptyList()
    ).json()
    private fun session(id: String,p: JSONObject)=CloudLearningSession(id,p.getString("kind"),null,null,"2026-10-11",true,p.getInt("correctAnswers")*5,Instant.parse(p.getString("finishedAt")).toEpochMilli())

    @Test fun uploadThenSnapshotKeepsLegacyPointsAndDoesNotRewardTwice()=exercise {store,account,_ ->
        store.completeLesson(5,UUID.randomUUID().toString())
        store.writableDatabase.execSQL("UPDATE learning_stats SET points=points+45 WHERE id=1")
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
        assertEquals(70,store.snapshot().points);assertEquals("delivered",store.queuedOperations().single().state)
    }
    @Test fun batchesYieldAndPullOnlyAfterDueQueueDrains()=exercise {store,account,_ ->
        repeat(2) {store.completeLesson(5,UUID.randomUUID().toString())}
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
    @Test fun invalidOwnerSnapshotPreservesAcknowledgedLocalProgress()=exercise {store,account,_ ->
        store.completeLesson(5,UUID.randomUUID().toString())
        val sync=LearningAccountSync(LearningSyncTransport {rpc,_,_ ->
            if(rpc=="submit_learning_session") JSONObject().put("applied",true)
            else cloud(store).put("userId",UUID.randomUUID().toString())
        },"https://fixture.supabase.co")
        sync.step(store,account,store.owner.id) {true}
        assertTrue(runCatching {sync.step(store,account,store.owner.id) {true}}.isFailure)
        assertNull(store.cloudState());assertEquals(25,store.snapshot().points)
        assertEquals("delivered",store.queuedOperations().single().state)
    }
    @Test fun dirtyPreferencesAreVisibleAndNeverWrittenByLearningSync()=exercise {store,account,_ ->
        store.updatePreferences("A2","Günlük yaşam",2,"Yerel")
        val sync=LearningAccountSync(LearningSyncTransport {rpc,_,_ ->assertEquals("get_learning_snapshot",rpc);cloud(store)},"https://fixture.supabase.co")
        val state=sync.step(store,account,store.owner.id) {true}.state
        assertTrue(state.preferencesPending);assertTrue(state.preferencesConflict)
        assertEquals("Yerel",store.snapshot().displayName)
    }
    @Test fun unauthorizedUploadRequestsVerificationAndKeepsTheEvent()=exercise {store,account,_ ->
        store.completeLesson(5,UUID.randomUUID().toString())
        val sync=LearningAccountSync(LearningSyncTransport {_,_,_ ->throw LearningSyncFailure("PGRST301",401)},"https://fixture.supabase.co")
        val result=sync.step(store,account,store.owner.id) {true}
        assertTrue(result.verifySession);assertFalse(result.continueUpload)
        assertEquals(1,result.state.pending);assertEquals(25,store.snapshot().points)
    }
}
