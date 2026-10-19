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
        assertEquals(0, store.queuedOperations().single().attempts)
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
    @Test fun permanentServerCodesAreBlockedWhileTheRestOfTheQueueIsDelivered() = listOf("23505" to 409, "22023" to 400, "23503" to 409).forEach { (code, status) ->
        exercise { store, accounts, _ ->
            store.completeLesson(4, UUID.randomUUID().toString())
            val rejected = store.queuedOperations().first().id
            val sent = mutableListOf<String>()
            val sync = LearningQueueSync(LearningSyncTransport { _, body, _ ->
                val id = body.getJSONObject("p_event").getString("id"); sent += id
                if (id == rejected) throw LearningSyncFailure(code, status)
                JSONObject().put("applied", true)
            }, accounts)
            assertEquals(code, LearningUploadResult(1, 1, false), sync.upload(store, store.owner.id, { true }))
            val event = store.queuedOperations().single { it.id == rejected }
            assertEquals(code, "blocked", event.state); assertEquals(code, event.errorCode); assertEquals(1, event.attempts)
            assertEquals(code, LearningUploadResult(0, 0, false), sync.upload(store, store.owner.id, { true }))
            assertEquals(code, 2, sent.size)
        }
    }
    @Test fun corruptLocalOperationsAreBlockedWithoutBeingSent() = listOf(
        "get_learning_snapshot" to { id: String -> JSONObject().put("id", id).toString() },
        "apply_word_event" to { _: String -> "{" },
        "apply_word_event" to { _: String -> JSONObject().put("id", UUID.randomUUID().toString()).toString() },
    ).forEach { (rpc, payload) ->
        exercise { store, accounts, _ ->
            store.queuedOperations().forEach { store.markDelivered(it.id, store.owner.id) }
            val id = UUID.randomUUID().toString()
            store.writableDatabase.execSQL("INSERT INTO learning_outbox(id,owner_id,rpc,payload,created_at,state,attempts,next_attempt_at) VALUES(?,?,?,?,0,'pending',0,0)",
                arrayOf<Any?>(id, store.owner.id, rpc, payload(id)))
            val sync = LearningQueueSync(LearningSyncTransport { _, _, _ -> error("Must not send") }, accounts)
            assertEquals(rpc, LearningUploadResult(0, 1, false), sync.upload(store, store.owner.id, { true }))
            val event = store.queuedOperations().single { it.id == id }
            assertEquals("blocked", event.state); assertEquals("invalid_local_operation", event.errorCode)
        }
    }
    @Test fun onlyUnauthorizedRetryableFailureAsksToVerifyTheSession() = listOf(
        LearningSyncFailure("PGRST301", 401) to true, LearningSyncFailure("PGRST303", 401) to true,
        LearningSyncFailure("http_rejected", 403) to false, LearningSyncFailure("http_rejected", 500) to false,
        LearningSyncFailure("http_rejected", 503) to false, LearningSyncFailure("invalid_response") to false,
    ).forEach { (failure, verify) ->
        exercise { store, accounts, _ ->
            val sync = LearningQueueSync(LearningSyncTransport { _, _, _ -> throw failure }, accounts)
            val label = "${failure.code}/${failure.status}"
            assertEquals(label, LearningUploadResult(0, 0, true, verify), sync.upload(store, store.owner.id, { true }))
            val event = store.queuedOperations().single()
            assertEquals(label, "pending", event.state); assertEquals(failure.code, event.errorCode)
            assertEquals(label, event.createdAt + 30_000, event.nextAttemptAt)
        }
    }
    @Test fun networkFailureSchedulesShortRetryAndDoesNotResendBeforeItIsDue() = exercise { store, accounts, advance ->
        var calls = 0
        val sync = LearningQueueSync(LearningSyncTransport { _, _, _ -> calls++; throw IOException("Fixture offline") }, accounts)
        assertEquals(LearningUploadResult(0, 0, true, false), sync.upload(store, store.owner.id, { true }))
        val first = store.queuedOperations().single()
        assertEquals("pending", first.state); assertEquals("network_unavailable", first.errorCode)
        assertEquals(0, first.attempts); assertEquals(first.createdAt + 30_000, first.nextAttemptAt)
        assertEquals(LearningUploadResult(0, 0, false), sync.upload(store, store.owner.id, { true }))
        assertEquals(1, calls)
        advance()
        assertTrue(sync.upload(store, store.owner.id, { true }).stopped)
        val second = store.queuedOperations().single()
        assertEquals(2, calls); assertEquals(0, second.attempts)
        assertEquals(first.createdAt + 60_000 + 30_000, second.nextAttemptAt)
    }
    @Test fun repeatedOfflineFailuresDoNotDelayDeliveryAfterReconnecting() = exercise { store, accounts, advance ->
        var online = false
        val sync = LearningQueueSync(LearningSyncTransport { _, _, _ ->
            if (!online) throw IOException("Fixture offline")
            JSONObject().put("applied", true)
        }, accounts)
        val createdAt = store.queuedOperations().single().createdAt
        repeat(5) {
            advance()
            assertTrue(sync.upload(store, store.owner.id, { true }).stopped)
        }
        val waiting = store.queuedOperations().single()
        assertEquals(0, waiting.attempts); assertEquals("network_unavailable", waiting.errorCode)
        assertEquals(createdAt + 5 * 60_000 + 30_000, waiting.nextAttemptAt)
        online = true
        advance()
        assertEquals(LearningUploadResult(1, 0, false), sync.upload(store, store.owner.id, { true }))
        assertEquals("delivered", store.queuedOperations().single().state)
    }
    @Test fun failureBackoffDoublesThenStaysCappedForAnyAttemptCount() = listOf(
        0 to 30_000L, 1 to 60_000L, 5 to 960_000L, 10 to 30_720_000L, 11 to 61_440_000L,
        12 to 61_440_000L, 31 to 61_440_000L, 63 to 61_440_000L, 64 to 61_440_000L, Int.MAX_VALUE to 61_440_000L,
    ).forEach { (attempts, delay) ->
        exercise { store, _, _ ->
            val event = store.queuedOperations().single()
            store.writableDatabase.execSQL("UPDATE learning_outbox SET attempts=? WHERE id=?", arrayOf<Any?>(attempts, event.id))
            assertTrue(store.markUploadFailed(event.id, store.owner.id, "network_unavailable", true))
            val retry = store.queuedOperations().single().nextAttemptAt - event.createdAt
            assertEquals("attempts=$attempts", delay, retry)
            assertTrue(retry in 1..86_400_000L)
        }
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
