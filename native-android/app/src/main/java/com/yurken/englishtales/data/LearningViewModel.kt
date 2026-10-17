package com.yurken.englishtales.data

import com.yurken.englishtales.R
import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.channels.Channel
import com.yurken.englishtales.BuildConfig

class LearningViewModel(application: Application,private val auth: AccountService,private val storeFactory: (LearningOwner)->LearningStore,private val cloudSync: LearningAccountSync?=null,private val background: Boolean=false,
    private val onOwnerChanged: (LearningOwner)->Unit={}, private val readSnapshot: (LearningStore)->LearningSnapshot={it.snapshot()}) : AndroidViewModel(application) {
    constructor(application: Application):this(application,LearningSyncRuntime.accounts(application),{LearningStore(application,it)},defaultLearningSync(),true,
        {LearningReminderOwner.select(application,it)})
    private fun text(@androidx.annotation.StringRes id: Int) = com.yurken.englishtales.AppLanguage.wrap(getApplication<Application>()).getString(id)
    private var store = storeFactory(LearningOwner.Guest)
    private data class Mutation(val scope: Long?,val refresh: Boolean=true,val action: ()->Unit)
    private val mutations = Channel<Mutation>(Channel.UNLIMITED)
    // scope is the owner generation: it changes only with the store. Learning writes are stamped under this lock so an owner switch can drain them first.
    @Volatile private var scope=0L
    private val stamping=Any()
    private var switching=false
    @Volatile private var syncEpoch=0L
    @Volatile private var disposed=false
    private val syncing=java.util.concurrent.atomic.AtomicBoolean(false)
    private var syncTimer: kotlinx.coroutines.Job?=null
    private val mutableAccount=MutableStateFlow(AccountState())
    val account: StateFlow<AccountState> = mutableAccount
    private val verifying=java.util.concurrent.atomic.AtomicBoolean(false)
    private val mutableState = MutableStateFlow(LearningSnapshot())
    val state: StateFlow<LearningSnapshot> = mutableState
    private val mutableReady = MutableStateFlow(false)
    val ready: StateFlow<Boolean> = mutableReady
    // A rejected write is dropped (retrying cannot fix it) and reported like any other failed action.
    private val writes = LearningWriteRecovery({mutableAccount.value=mutableAccount.value.copy(message=text(R.string.account_message_action_failed),messageTone=MessageTone.Error)}) { mutableState.value=readSnapshot(store) }
    val writeError: StateFlow<LearningWriteError?> = writes.error
    private val mutableCompletions=MutableStateFlow<Set<String>>(emptySet())
    val completedSessions: StateFlow<Set<String>> = mutableCompletions

    init {
        if(background) viewModelScope.launch {
            LearningSyncRuntime.updates.collect { (user,status) ->
                if(mutableAccount.value.userId==user) mutations.trySend(Mutation(scope) {
                    if(mutableAccount.value.userId==user && !mutableAccount.value.busy)
                        mutableAccount.value=mutableAccount.value.copy(sync=checkNotNull(cloudSync).status(store).copy(running=status.running,message=status.message,tone=status.tone),needsSignIn=auth.current==null)
                })
            }
        }
        viewModelScope.launch(Dispatchers.IO) {
            try {
                // Restore (with its deleted-account check) before cleanup consumes the pending receipts.
                if(background) LearningSyncRuntime.ensureRestored(getApplication())
                if(background) runCatching {DeletedAccountCleanup.clean(getApplication())}
                try {
                    // A failed read keeps the stored session (keystore or I/O errors can pass; storage removes corrupt files itself).
                    val session=try {auth.restore()} catch (_: Exception) {
                        mutableAccount.value=mutableAccount.value.copy(message=text(R.string.account_message_restore_failed),messageTone=MessageTone.Error);auth.current
                    }
                    session?.let {changeOwner(LearningOwner.Account(it.userId),it.email)}
                } catch (_: Exception) {
                    auth.clearLocal()
                    mutableAccount.value=mutableAccount.value.copy(message=text(R.string.account_message_restore_failed),messageTone=MessageTone.Error)
                }
                onOwnerChanged(store.owner)
                // A failing database must not crash every launch: the write bar offers a retry instead.
                writes.submit {store.recordVisit()};writes.refresh();mutableReady.value=true
                verifyAccount()
                for(action in mutations) if(action.scope==null || action.scope==scope) execute(action)
            } finally {store.close()}
        }
    }
    private fun execute(action: Mutation) {
        try {action.action()} catch (failure: Exception) {
            if(failure is kotlinx.coroutines.CancellationException) throw failure
            mutableAccount.value=mutableAccount.value.copy(busy=false,message=text(R.string.account_message_action_failed),messageTone=MessageTone.Error)
        }
        if(action.refresh) writes.refresh()
    }

    fun refresh() = mutate {store.recordVisit()}

    fun completeOnboarding(level: String, genre: String, goal: Int) = mutate {
        store.completeOnboarding(level, genre, goal)
    }

    fun toggleWord(wordId: String) {
        var saved: Boolean?=null
        mutate {
            if(saved==null) saved=!store.isWordSaved(wordId)
            store.setWordSaved(wordId,checkNotNull(saved))
        }
    }

    /** Saves or removes a glossary word from the reader (Q4.3a). */
    fun toggleGlossaryWord(word: WordInfo) {
        var saved: Boolean?=null
        mutate {
            if(saved==null) saved=!store.isWordSaved(word.id)
            if(checkNotNull(saved)) store.savePersonalWord(word) else store.setWordSaved(word.id,false)
        }
    }

    fun recordLookup(word: WordInfo) = mutate {store.recordLookup(word)}

    fun toggleFavorite(storyId: String) {
        var favorite: Boolean?=null
        mutate {
            if(favorite==null) favorite=!store.isFavorite(storyId)
            store.setFavorite(storyId,checkNotNull(favorite))
        }
    }

    fun reviewWord(wordId: String, correct: Boolean) = mutate {
        store.reviewWord(wordId, correct)
    }

    fun updateProgress(storyId: String, percent: Int,sentenceId: String) {
        val source=LearningContent.storyById[storyId]
        mutate {store.updateProgress(storyId, percent,sentenceId,source)}
    }

    fun completeLesson(correctAnswers: Int, sessionId: String,kind: String,questionCount: Int,activeMillis: Long) = mutate {
        val completed=store.sessionCompleted(sessionId)
        store.completeLesson(correctAnswers, sessionId,kind,questionCount,activeMillis)
        if(!completed && store.sessionCompleted(sessionId)) mutableCompletions.value=(mutableCompletions.value+sessionId).toList().takeLast(256).toSet()
    }

    fun completeReading(storyId: String,sessionId: String,activeMillis: Long) {
        val source=LearningContent.storyById[storyId]
        mutate {
            val completed=store.sessionCompleted(sessionId)
            store.completeReading(storyId,sessionId,activeMillis,source)
            if(!completed && store.sessionCompleted(sessionId)) mutableCompletions.value=(mutableCompletions.value+sessionId).toList().takeLast(256).toSet()
        }
    }
    fun beginSession(id: String,kind: String,questionCount: Int,storyId: String?) {
        val source=LearningContent.storyById[storyId]
        val startedAt=System.currentTimeMillis()
        mutate {store.beginSession(id,kind,questionCount,storyId,source,startedAt)}
    }
    // Checkpoints only touch session_drafts (no outbox row), so they must not wake cloud sync or re-read the whole snapshot every few seconds:
    // only activeSessionMillis changes. A held-back or rejected checkpoint still refreshes, as every other write does.
    fun checkpointSession(id: String,millis: Long) = enqueue(refresh=false) {
        var active: Pair<String,Long>?=null
        if(writes.submit {active=store.checkpointSession(id,millis)}) active?.let {(key,value) ->
            mutableState.value=mutableState.value.let {it.copy(activeSessionMillis=it.activeSessionMillis+(key to value))}}
        else writes.refresh()
    }
    fun abandonSession(id: String) = mutate {store.abandonSession(id)}
    fun startReading(storyId: String) = mutate { store.startReading(storyId) }
    fun dismissReaderHint() = mutate { store.dismissReaderHint() }
    fun saveWords(ids: List<String>) = mutate { store.saveWords(ids) }
    fun updatePreferences(level: String, genre: String, goal: Int, name: String) = mutate { store.updatePreferences(level,genre,goal,name) }

    fun retryLearningWrites() = enqueue {writes.retry();scheduleSync()}

    private fun mutate(sync: Boolean=true,action: () -> Unit) = enqueue {
        if(writes.submit(action) && sync) scheduleSync()
    }
    private fun enqueue(refresh: Boolean=true,action: ()->Unit) {synchronized(stamping) {mutations.trySend(Mutation(scope,refresh,action))}}
    private fun interruptSync() {
        syncEpoch++
        if(background) LearningSyncRuntime.pause()
        mutableAccount.value=mutableAccount.value.copy(sync=mutableAccount.value.sync.copy(running=false))
    }
    // Only the actor accesses a store. Timers enqueue work without touching Room.
    private fun scheduleSync(waitMillis: Long=2_000) {
        if(cloudSync==null || mutableAccount.value.userId==null || mutableAccount.value.needsSignIn || disposed || switching) return
        syncTimer?.cancel()
        val expected=scope
        if(background) LearningSyncRuntime.schedule(getApplication(),checkNotNull(mutableAccount.value.userId))
        syncTimer=viewModelScope.launch {
            kotlinx.coroutines.delay(waitMillis)
            if(scope==expected) syncNow()
        }
    }
    fun syncNow() {
        val user=mutableAccount.value.userId?:return
        val sync=cloudSync?:return
        if(disposed || mutableAccount.value.busy || mutableAccount.value.needsSignIn || !syncing.compareAndSet(false,true)) return
        val expectedScope=scope
        val expectedEpoch=syncEpoch
        val current={ !disposed && scope==expectedScope && syncEpoch==expectedEpoch }
        mutableAccount.value=mutableAccount.value.copy(sync=mutableAccount.value.sync.copy(running=true,message=text(R.string.account_message_syncing),tone=MessageTone.Info))
        viewModelScope.launch(Dispatchers.IO) {
            try {LearningSyncLocks.withOwner(user) {
                if(!current()) return@withOwner
                try {
                    storeFactory(LearningOwner.Account(user)).use {syncStore ->
                    var more=true
                    while(more && current()) {
                        val result=sync.step(syncStore,auth,user,current)
                        if(!current()) break
                        more=result.continueUpload
                        mutations.trySend(Mutation(expectedScope) {
                            if(current()) {
                                val latest=sync.status(store)
                                mutableAccount.value=mutableAccount.value.copy(sync=latest.copy(running=result.state.running,message=result.state.message,tone=result.state.tone),needsSignIn=auth.current==null)
                            }
                        })
                        if(result.verifySession) verifyAccount()
                        kotlinx.coroutines.yield()
                    }
                    }
                } catch (failure: Exception) {
                    if(failure is kotlinx.coroutines.CancellationException) throw failure
                    if(current()) mutations.trySend(Mutation(expectedScope) {
                        mutableAccount.value=mutableAccount.value.copy(needsSignIn=auth.current==null,
                            sync=sync.status(store).copy(message=if(auth.current==null) text(R.string.account_message_session_expired) else text(R.string.account_message_sync_failed),tone=MessageTone.Error))
                        if(failure is LearningSyncFailure && failure.status==401) verifyAccount()
                    })
                }
            }} finally {
                syncing.set(false)
                if(current()) mutations.trySend(Mutation(expectedScope) {scheduleSync(60_000)})
            }
        }
    }
    fun resolvePreferences(useLocal: Boolean) {
        if(mutableAccount.value.busy || mutableAccount.value.userId==null) return
        interruptSync()
        mutate {LearningPreferencesSync.resolve(store,useLocal);if(background) LearningSyncRuntime.resume()
            mutableAccount.value=mutableAccount.value.copy(sync=checkNotNull(cloudSync).status(store))}
    }
    private fun changeOwner(owner: LearningOwner,email: String="") {
        val next=storeFactory(owner)
        try {next.snapshot()} catch (failure: Exception) {next.close();throw failure}
        // Writes queued under the old owner belong to it: apply them before switching instead of dropping them.
        val unscoped=mutableListOf<Mutation>()
        switching=true
        try {
            while(true) {
                val queued=synchronized(stamping) {mutations.tryReceive().getOrNull().also {if(it==null) {store.close();store=next;scope++}}}?:break
                if(queued.scope==null) unscoped+=queued else if(queued.scope==scope) execute(queued)
            }
        } finally {switching=false}
        unscoped.forEach {mutations.trySend(it)}
        syncEpoch++
        writes.reset()
        mutableCompletions.value=emptySet()
        onOwnerChanged(owner)
        if(background) LearningSyncRuntime.resume()
        mutableAccount.value=AccountState(if(owner is LearningOwner.Account) owner.id else null,email,scope=mutableAccount.value.scope+1)
        if(owner is LearningOwner.Account && cloudSync!=null) {
            val saved=cloudSync.status(store)
            mutableAccount.value=mutableAccount.value.copy(sync=saved.copy(message=if(saved.lastSuccessAt==null) text(R.string.account_message_not_synced) else text(R.string.account_message_history_kept),tone=MessageTone.Info))
        }
        refreshGuestTransfer()
        scheduleSync()
    }
    private fun refreshGuestTransfer() {
        val user=mutableAccount.value.userId?:return
        try {
            val preview=storeFactory(LearningOwner.Guest).use {GuestTransfer.preview(it,user)}
            mutableAccount.value=mutableAccount.value.copy(guestTransfer=preview)
        } catch (_: Exception) {
            mutableAccount.value=mutableAccount.value.copy(guestTransfer=null,message=text(R.string.account_message_guest_history_unavailable),messageTone=MessageTone.Warning)
        }
    }
    fun transferGuestProgress() {
        val user=mutableAccount.value.userId?:return
        if(mutableAccount.value.busy || mutableAccount.value.needsSignIn || mutableAccount.value.guestTransfer?.blocked==true) return
        interruptSync()
        mutableAccount.value=mutableAccount.value.copy(busy=true,message=text(R.string.account_message_guest_transferring),messageTone=MessageTone.Progress)
        mutations.trySend(Mutation(scope) {
            try {
                check(store.owner.id==user)
                storeFactory(LearningOwner.Guest).use {GuestTransfer.transfer(it,store)}
                // Same owner: remount the UI, but keep the owner generation so writes queued during the transfer still land.
                mutableAccount.value=mutableAccount.value.copy(busy=false,scope=mutableAccount.value.scope+1,message=text(R.string.account_message_guest_transferred),messageTone=MessageTone.Success)
            } catch (failure: Exception) {
                mutableAccount.value=mutableAccount.value.copy(busy=false,messageTone=MessageTone.Error,message=when((failure as? GuestTransferFailure)?.code) {
                    "different_target" -> text(R.string.account_message_transfer_other_account)
                    "operation_conflict","payload_conflict" -> text(R.string.account_message_transfer_conflict)
                    "snapshot_too_large" -> text(R.string.account_message_transfer_too_large)
                    else -> text(R.string.account_message_transfer_failed)
                })
            }
            refreshGuestTransfer()
            if(background) LearningSyncRuntime.resume()
            scheduleSync()
        })
    }
    fun signIn(email: String,password: String) {
        if(mutableAccount.value.busy) return
        interruptSync()
        mutableAccount.value=mutableAccount.value.copy(busy=true,message=text(R.string.account_message_signing_in),messageTone=MessageTone.Progress)
        mutations.trySend(Mutation(null) {
            try {
                val session=auth.signIn(email,password)
                changeOwner(LearningOwner.Account(session.userId),session.email)
                mutableAccount.value=mutableAccount.value.copy(message=text(R.string.account_message_signed_in),messageTone=MessageTone.Success)
            } catch (failure: Exception) {
                if(auth.current!=null && auth.current?.userId!=store.owner.id) auth.clearLocal()
                val message=when((failure as? AuthFailure)?.code) {
                    "invalid_input" -> text(R.string.account_message_invalid_credentials_input)
                    "invalid_credentials" -> text(R.string.account_message_invalid_credentials)
                    "email_not_confirmed" -> text(R.string.account_message_email_unconfirmed)
                    "not_configured" -> text(R.string.account_message_not_configured)
                    else -> text(R.string.account_message_sign_in_failed)
                }
                mutableAccount.value=mutableAccount.value.copy(busy=false,message=message,messageTone=MessageTone.Error)
                if(background) LearningSyncRuntime.resume()
                scheduleSync()
            }
        })
    }
    private fun emailOperation(action: ()->Unit) {
        if(mutableAccount.value.busy) return
        interruptSync()
        mutableAccount.value=mutableAccount.value.copy(busy=true,message=text(R.string.account_message_working),messageTone=MessageTone.Progress)
        mutations.trySend(Mutation(scope) {
            try {action()} catch(failure: Exception) {
                if(auth.current!=null && auth.current?.userId!=store.owner.id) auth.clearLocal()
                mutableAccount.value=mutableAccount.value.copy(messageTone=MessageTone.Error,message=when((failure as? AuthFailure)?.code) {
                    "invalid_input" -> text(R.string.account_message_invalid_email)
                    "weak_password" -> text(R.string.account_message_weak_password)
                    "invalid_code","otp_expired" -> if(mutableAccount.value.emailAction=="signup") text(R.string.account_message_verification_code_invalid) else text(R.string.account_message_recovery_code_invalid)
                    "over_email_send_rate_limit","over_request_rate_limit" -> text(R.string.account_message_rate_limited)
                    "same_password" -> text(R.string.account_message_password_unchanged)
                    else -> text(R.string.account_message_request_failed)
                })
            } finally {
                mutableAccount.value=mutableAccount.value.copy(busy=false)
                if(background) LearningSyncRuntime.resume()
                scheduleSync()
            }
        })
    }
    fun signUp(email: String,password: String)=emailOperation {
        val ready=auth.signUp(email,password)
        mutableAccount.value=mutableAccount.value.copy(emailAction=if(ready) "" else "signup",verificationEmail=email.trim(),
            message=if(ready) text(R.string.account_message_signup_complete) else text(R.string.account_message_signup_requested),messageTone=if(ready) MessageTone.Success else MessageTone.Info)
    }
    fun requestRecovery(email: String)=emailOperation {
        auth.requestRecovery(email)
        mutableAccount.value=mutableAccount.value.copy(emailAction="recovery",verificationEmail=email.trim(),message=text(R.string.account_message_recovery_requested),messageTone=MessageTone.Info)
    }
    fun resendEmailCode()=emailOperation {
        val state=mutableAccount.value
        when(state.emailAction) {
            "signup" -> auth.resendConfirmation(state.verificationEmail)
            "recovery" -> auth.requestRecovery(state.verificationEmail)
            else -> throw AuthFailure("invalid_input")
        }
        mutableAccount.value=mutableAccount.value.copy(message=if(state.emailAction=="signup") text(R.string.account_message_verification_resent) else text(R.string.account_message_recovery_resent),messageTone=MessageTone.Info)
    }
    fun completeEmailCode(code: String,password: String)=emailOperation {
        val state=mutableAccount.value
        when(state.emailAction) {
            "signup" -> {
                val session=auth.confirmEmail(state.verificationEmail,code)
                changeOwner(LearningOwner.Account(session.userId),session.email)
                mutableAccount.value=mutableAccount.value.copy(message=text(R.string.account_message_email_verified),messageTone=MessageTone.Success)
            }
            "recovery" -> {
                auth.resetPassword(state.verificationEmail,code,password)
                mutableAccount.value=mutableAccount.value.copy(emailAction="",verificationEmail="",message=text(R.string.account_message_password_updated),messageTone=MessageTone.Success)
            }
            else -> throw AuthFailure("invalid_input")
        }
    }
    fun cancelEmailCode() {
        if(!mutableAccount.value.busy) mutableAccount.value=mutableAccount.value.copy(emailAction="",verificationEmail="",message="",messageTone=MessageTone.Info)
    }
    fun signOut() {
        if(mutableAccount.value.busy) return
        interruptSync()
        if(background) mutableAccount.value.userId?.let {LearningSyncRuntime.cancel(getApplication(),it)}
        mutableAccount.value=mutableAccount.value.copy(busy=true,message=text(R.string.account_message_signing_out),messageTone=MessageTone.Progress)
        mutations.trySend(Mutation(null) {
            val revoked=auth.signOut();changeOwner(LearningOwner.Guest)
            viewModelScope.launch {runCatching {GoogleSignIn.clear(getApplication())}}
            mutableAccount.value=mutableAccount.value.copy(message=if(revoked) text(R.string.account_message_signed_out) else text(R.string.account_message_signed_out_offline),messageTone=if(revoked) MessageTone.Success else MessageTone.Warning)
        })
    }
    fun deleteAccount() {
        val user=mutableAccount.value.userId?:return
        if(mutableAccount.value.busy || mutableAccount.value.needsSignIn) return
        val expectedScope=scope
        interruptSync()
        mutableAccount.value=mutableAccount.value.copy(busy=true,message=text(R.string.account_message_deleting),messageTone=MessageTone.Progress)
        viewModelScope.launch(Dispatchers.IO) {
            try {
                LearningSyncLocks.withOwner(user) {
                    if(disposed || scope!=expectedScope) return@withOwner
                    auth.deleteAccount(user) {if(background) DeletedAccountCleanup.record(getApplication(),user)}
                    if(background) runCatching {com.yurken.englishtales.analytics.ProductAnalytics.get(getApplication()).setConsent(false)}
                    if(background) LearningSyncRuntime.cancel(getApplication(),user)
                    mutations.trySend(Mutation(expectedScope) {
                        check(store.owner.id==user)
                        val cleaned=runCatching {
                            storeFactory(LearningOwner.Guest).use {it.forgetTransferTarget(user)}
                            store.eraseDeletedAccount()
                            if(background) DeletedAccountCleanup.complete(getApplication(),user)
                        }.isSuccess
                        changeOwner(LearningOwner.Guest)
                        viewModelScope.launch {runCatching {GoogleSignIn.clear(getApplication())}}
                        mutableAccount.value=mutableAccount.value.copy(message=if(cleaned) text(R.string.account_message_deleted) else text(R.string.account_message_cleanup_pending),messageTone=if(cleaned) MessageTone.Success else MessageTone.Warning)
                    })
                }
            } catch(failure: Exception) {
                if(failure is kotlinx.coroutines.CancellationException) throw failure
                mutations.trySend(Mutation(expectedScope) {
                    val again=(failure as? AuthFailure)?.code=="reauthentication_required"
                    mutableAccount.value=mutableAccount.value.copy(busy=false,needsSignIn=again || auth.current==null,
                        message=if(again) text(R.string.account_message_delete_reauth) else text(R.string.account_message_delete_failed),messageTone=if(again) MessageTone.Warning else MessageTone.Error)
                    if(background) LearningSyncRuntime.resume()
                })
            }
        }
    }
    suspend fun signInGoogle(acquire: suspend ()->GoogleIdentity) {
        if(mutableAccount.value.busy) return
        val expectedScope=scope
        interruptSync()
        mutableAccount.value=mutableAccount.value.copy(busy=true,message=text(R.string.account_message_google_select),messageTone=MessageTone.Progress)
        try {
            val identity=acquire()
            mutations.trySend(Mutation(expectedScope) {
                try {
                    val session=auth.signInGoogle(identity)
                    changeOwner(LearningOwner.Account(session.userId),session.email)
                    mutableAccount.value=mutableAccount.value.copy(message=text(R.string.account_message_google_signed_in),messageTone=MessageTone.Success)
                } catch (failure: Exception) {
                    if(auth.current!=null && auth.current?.userId!=store.owner.id) auth.clearLocal()
                    mutableAccount.value=mutableAccount.value.copy(busy=false,message=text(R.string.account_message_google_failed),messageTone=MessageTone.Error)
                    if(background) LearningSyncRuntime.resume()
                    scheduleSync()
                }
            })
        } catch (failure: Exception) {
            if(scope==expectedScope) mutableAccount.value=mutableAccount.value.copy(busy=false,messageTone=if((failure as? AuthFailure)?.code=="google_cancelled") MessageTone.Info else MessageTone.Error,message=when((failure as? AuthFailure)?.code) {
                "google_cancelled" -> text(R.string.account_message_google_cancelled)
                "google_not_configured" -> text(R.string.account_message_google_unavailable)
                "google_no_account" -> text(R.string.account_message_google_no_account)
                else -> text(R.string.account_message_google_selection_failed)
            })
            if(background) LearningSyncRuntime.resume()
            if(failure is kotlinx.coroutines.CancellationException) throw failure
            mutations.trySend(Mutation(expectedScope) {scheduleSync()})
        }
    }
    fun verifyAccount() {
        val expectedScope=scope
        if(mutableAccount.value.userId==null || !verifying.compareAndSet(false,true)) return
        viewModelScope.launch(Dispatchers.IO) {
            var verifiedEmail: String?=null
            var requiresSignIn=false
            var resultMessage: String
            try {
                val session=auth.verifyCurrent() ?: throw AuthFailure("sign_in_required")
                verifiedEmail=session.email
                resultMessage=text(R.string.account_message_session_verified)
            } catch (failure: Exception) {
                requiresSignIn=auth.current==null
                resultMessage=if(requiresSignIn) text(R.string.account_message_session_expired_local) else text(R.string.account_message_offline_history_available)
            } finally {verifying.set(false)}
            mutations.trySend(Mutation(expectedScope) {
                if(!mutableAccount.value.busy) {
                    mutableAccount.value=mutableAccount.value.copy(email=verifiedEmail?:mutableAccount.value.email,needsSignIn=requiresSignIn,message=resultMessage,messageTone=if(requiresSignIn) MessageTone.Warning else MessageTone.Info)
                    scheduleSync()
                }
            })
        }
    }

    override fun onCleared() {
        disposed=true;syncEpoch++;syncTimer?.cancel()
        mutations.close()
        super.onCleared()
    }
}

private fun defaultLearningSync(): LearningAccountSync? =
    if(BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_"))
        LearningAccountSync(LearningSyncHttp(BuildConfig.SUPABASE_URL,BuildConfig.SUPABASE_PUBLISHABLE_KEY),BuildConfig.SUPABASE_URL)
    else null
