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
import java.util.UUID

class LearningSyncTest {
    private class Memory(private var session: AccountSession?) : SessionStorage {
        override fun read() = session
        override fun write(session: AccountSession) { this.session = session }
        override fun clear() { session = null }
    }
    private fun exercise(block: (LearningStore, AccountService, () -> Unit) -> Unit) {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        val directory = File(target.cacheDir, "learning-sync-${UUID.randomUUID()}").apply { mkdirs() }
        val context = object : ContextWrapper(target) {
            override fun getDatabasePath(name: String) = File(directory, name)
            override fun openOrCreateDatabase(name: String, mode: Int, factory: SQLiteDatabase.CursorFactory?) =
                SQLiteDatabase.openOrCreateDatabase(File(directory, name), factory)
            override fun openOrCreateDatabase(name: String, mode: Int, factory: SQLiteDatabase.CursorFactory?, handler: DatabaseErrorHandler?) =
                SQLiteDatabase.openOrCreateDatabase(File(directory, name).absolutePath, factory, handler)
        }
        val user = UUID.randomUUID().toString()
        var now = System.currentTimeMillis()
        val accounts = AccountService(null, Memory(AccountSession(user, "fixture@example.invalid", "fixture-token", "fixture-refresh", now + 3_600_000))) { now }
        accounts.restore()
        val store = LearningStore(context, LearningOwner.Account(user)) { now }
        try {
            store.completeLesson(5, UUID.randomUUID().toString())
            block(store, accounts) { now += 60_000 }
        } finally { store.close(); directory.deleteRecursively() }
    }
    @Test fun duplicateAcknowledgementDoesNotRewardAgain() = exercise { store, accounts, _ ->
        val original = store.queuedOperations().single()
        val sync = LearningQueueSync(LearningSyncTransport { rpc, body, _ ->
            assertEquals(original.rpc, rpc)
            assertEquals(JSONObject(original.payload).toString(), body.getJSONObject("p_event").toString())
            assertFalse(body.has("userId"))
            JSONObject().put("applied", false)
        }, accounts)
        assertEquals(1, sync.upload(store, store.owner.id, { true }).delivered)
        assertEquals("delivered", store.queuedOperations().single().state)
        assertEquals(25, store.snapshot().points)
        assertEquals(0, sync.upload(store, store.owner.id, { true }).delivered)
    }
    @Test fun lostAcknowledgementRetriesIdenticalOperationAfterBackoff() = exercise { store, accounts, advance ->
        val bodies = mutableListOf<String>()
        val sync = LearningQueueSync(LearningSyncTransport { _, body, _ ->
            bodies += body.toString()
            if (bodies.size == 1) throw IOException("Fixture lost acknowledgement")
            JSONObject().put("applied", false)
        }, accounts)
        assertTrue(sync.upload(store, store.owner.id, { true }).stopped)
        assertEquals(1, store.queuedOperations().single().attempts)
        assertEquals(0, sync.upload(store, store.owner.id, { true }).delivered)
        advance()
        assertEquals(1, sync.upload(store, store.owner.id, { true }).delivered)
        assertEquals(bodies.first(), bodies.last())
        assertEquals(25, store.snapshot().points)
    }
    @Test fun changedScopeDoesNotAcknowledgeLateResponse() = exercise { store, accounts, _ ->
        var current = true
        val sync = LearningQueueSync(LearningSyncTransport { _, _, _ ->
            current = false
            JSONObject().put("applied", true)
        }, accounts)
        assertTrue(sync.upload(store, store.owner.id, { current }).stopped)
        assertEquals("pending", store.queuedOperations().single().state)
        assertEquals(0, store.queuedOperations().single().attempts)
    }
    @Test fun signedOutAccountDoesNotAcknowledgeOrSendAgain() = exercise { store, accounts, _ ->
        var calls = 0
        val sync = LearningQueueSync(LearningSyncTransport { _, _, _ ->
            calls++; accounts.clearLocal()
            JSONObject().put("applied", true)
        }, accounts)
        assertTrue(sync.upload(store, store.owner.id, { true }).stopped)
        assertEquals("pending", store.queuedOperations().single().state)
        assertTrue(sync.upload(store, store.owner.id, { true }).stopped)
        assertEquals(1, calls)
    }
    @Test fun payloadConflictIsQuarantinedWithoutRemovingLocalHistory() = exercise { store, accounts, _ ->
        val sync = LearningQueueSync(LearningSyncTransport { _, _, _ -> throw LearningSyncFailure("23505", 409) }, accounts)
        assertEquals(1, sync.upload(store, store.owner.id, { true }).blocked)
        val event = store.queuedOperations().single()
        assertEquals("blocked", event.state)
        assertEquals("23505", event.errorCode)
        assertEquals(25, store.snapshot().points)
    }
    @Test fun malformedSuccessAndAuthenticationFailureRemainPending() = exercise { store, accounts, advance ->
        var first = true
        val sync = LearningQueueSync(LearningSyncTransport { _, _, _ ->
            if (first) { first = false; JSONObject().put("applied", "false") }
            else throw LearningSyncFailure("PGRST301", 401)
        }, accounts)
        assertTrue(sync.upload(store, store.owner.id, { true }).stopped)
        assertEquals("invalid_response", store.queuedOperations().single().errorCode)
        advance()
        assertTrue(sync.upload(store, store.owner.id, { true }).stopped)
        assertEquals("pending", store.queuedOperations().single().state)
        assertEquals("PGRST301", store.queuedOperations().single().errorCode)
    }
    @Test fun wrongOwnerCannotSendOperations() = exercise { store, accounts, _ ->
        val sync = LearningQueueSync(LearningSyncTransport { _, _, _ -> error("Must not send") }, accounts)
        assertTrue(sync.upload(store, UUID.randomUUID().toString(), { true }).stopped)
        assertEquals("pending", store.queuedOperations().single().state)
    }
    @Test fun responseDecoderPreservesSqlStateAndRejectsIncompleteObjects() {
        val conflict = runCatching { LearningSyncHttp.decode(409, "{\"code\":\"23505\",\"message\":\"private data\"}") }.exceptionOrNull() as LearningSyncFailure
        assertEquals("23505", conflict.code)
        assertFalse(conflict.toString().contains("private data"))
        listOf("", "null", "[]", "{} trailing", "{\"applied\":").forEach {
            assertEquals("invalid_response", (runCatching { LearningSyncHttp.decode(200, it) }.exceptionOrNull() as LearningSyncFailure).code)
        }
        assertEquals(false, LearningSyncHttp.decode(200, "{\"applied\":false}").getBoolean("applied"))
    }
}
