package com.yurken.englishtales.data

import com.yurken.englishtales.R
import org.json.JSONObject

data class LearningSyncState(
    val running: Boolean = false,
    val message: String = "",
    val pending: Int = 0,
    val blocked: Int = 0,
    val lastSuccessAt: Long? = null,
    val deviceOnlyPoints: Int = 0,
    val preferencesPending: Boolean = false,
    val preferencesConflict: Boolean = false,
    /** How [message] reads; a running sync is shown as progress whatever its tone. */
    val tone: MessageTone = MessageTone.Info
)

data class LearningSyncStep(val state: LearningSyncState, val continueUpload: Boolean, val verifySession: Boolean=false)

/** One upload per actor turn lets queued local edits and account changes run between requests. */
class LearningAccountSync(private val transport: LearningSyncTransport, private val source: String) {
    internal fun status(store: LearningStore): LearningSyncState {
        val queue = store.queuedOperations()
        val cloud = store.cloudState()
        val dirty = store.readableDatabase.query("SELECT preferences_dirty FROM local_profile WHERE id=1").use {
            it.moveToFirst() && it.getInt(0) != 0
        }
        return LearningSyncState(
            pending = queue.count { it.state == "pending" },
            blocked = queue.count { it.state == "blocked" && it.errorCode != "account_word_precedence" },
            lastSuccessAt = cloud?.appliedAt,
            deviceOnlyPoints = cloud?.let { JSONObject(it.baselineJson).getInt("points") } ?: 0,
            preferencesPending = dirty,
            preferencesConflict = cloud?.preferencesConflict == true
        )
    }

    internal fun step(store: LearningStore, accounts: AccountService, user: String, current: () -> Boolean): LearningSyncStep {
        if(store.cloudState()==null) {
            val first=LearningSnapshotReader(transport,accounts).read(user,current)
            store.reconcileCloud(first,source,current)
            return LearningSyncStep(status(store).copy(running=true,message=store.text(R.string.sync_message_history_received)),true)
        }
        if(LearningPreferencesSync.write(store,accounts,transport,current))
            return LearningSyncStep(status(store).copy(running=true,message=store.text(R.string.sync_message_preferences_saved)),true)
        val upload = LearningQueueSync(transport, accounts).upload(store, user, current, limit = 1)
        if (!current() || accounts.current?.userId != user) throw LearningSyncFailure("account_scope_changed")
        if (upload.stopped) return LearningSyncStep(status(store).copy(message = store.text(R.string.sync_message_upload_failed), tone = MessageTone.Error), false, upload.verifySession)
        // Pull on a separate actor turn even after the final upload.
        if (upload.delivered + upload.blocked > 0 || store.pendingUploads(user, 1).isNotEmpty())
            return LearningSyncStep(status(store).copy(running = true, message = store.text(R.string.sync_message_uploading)), true)
        val snapshot = LearningSnapshotReader(transport, accounts).read(user, current)
        store.reconcileCloud(snapshot, source, current)
        val state = status(store)
        return LearningSyncStep(state.copy(message = when {
            state.blocked > 0 -> store.text(R.string.sync_message_records_blocked)
            state.pending > 0 -> store.text(R.string.sync_message_retry_pending)
            state.preferencesConflict -> store.text(R.string.sync_message_preferences_conflict)
            state.preferencesPending -> store.text(R.string.sync_message_preferences_pending)
            else -> store.text(R.string.sync_message_complete)
        }, tone = when {
            state.blocked > 0 || state.preferencesConflict -> MessageTone.Warning
            state.pending > 0 || state.preferencesPending -> MessageTone.Info
            else -> MessageTone.Success
        }), false)
    }
}
