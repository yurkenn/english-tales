package com.yurken.englishtales.data

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
    private var store = storeFactory(LearningOwner.Guest)
    private data class Mutation(val scope: Long?,val action: ()->Unit)
    private val mutations = Channel<Mutation>(Channel.UNLIMITED)
    @Volatile private var scope=0L
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
    private val writes = LearningWriteRecovery { mutableState.value=readSnapshot(store) }
    val writeError: StateFlow<LearningWriteError?> = writes.error
    private val mutableCompletions=MutableStateFlow<Set<String>>(emptySet())
    val completedSessions: StateFlow<Set<String>> = mutableCompletions

    init {
        if(background) viewModelScope.launch {
            LearningSyncRuntime.updates.collect { (user,status) ->
                if(mutableAccount.value.userId==user) mutations.trySend(Mutation(scope) {
                    if(mutableAccount.value.userId==user && !mutableAccount.value.busy)
                        mutableAccount.value=mutableAccount.value.copy(sync=checkNotNull(cloudSync).status(store).copy(running=status.running,message=status.message),needsSignIn=auth.current==null)
                })
            }
        }
        viewModelScope.launch(Dispatchers.IO) {
            try {
                if(background) runCatching {DeletedAccountCleanup.clean(getApplication())}
                try {
                    auth.restore()?.let {changeOwner(LearningOwner.Account(it.userId),it.email)}
                } catch (_: Exception) {
                    auth.clearLocal()
                    mutableAccount.value=mutableAccount.value.copy(message="Hesap kayıtları açılamadı. Misafir olarak devam edebilir, tekrar giriş yapabilirsin.",messageTone=MessageTone.Error)
                }
                onOwnerChanged(store.owner)
                store.recordVisit();mutableState.value=store.snapshot();mutableReady.value=true
                verifyAccount()
                for(action in mutations) {
                    if(action.scope!=null && action.scope!=scope) continue
                    try {action.action()} catch (failure: Exception) {
                        if(failure is kotlinx.coroutines.CancellationException) throw failure
                        mutableAccount.value=mutableAccount.value.copy(busy=false,message="İşlem tamamlanamadı. Kayıtların korunuyor.",messageTone=MessageTone.Error)
                    }
                    writes.refresh()
                }
            } finally {store.close()}
        }
    }

    fun refresh() = mutate {store.recordVisit()}

    fun completeOnboarding(level: String, genre: String, goal: Int) = mutate {
        store.completeOnboarding(level, genre, goal)
    }

    fun toggleWord(wordId: String) {
        var saved: Boolean?=null
        mutate {
            if(saved==null) saved=wordId !in store.snapshot().savedWordIds
            store.setWordSaved(wordId,checkNotNull(saved))
        }
    }

    /** Saves or removes a glossary word from the reader (Q4.3a). */
    fun toggleGlossaryWord(word: WordInfo) {
        var saved: Boolean?=null
        mutate {
            if(saved==null) saved=word.id !in store.snapshot().savedWordIds
            if(checkNotNull(saved)) store.savePersonalWord(word) else store.setWordSaved(word.id,false)
        }
    }

    fun recordLookup(word: WordInfo) = mutate {store.recordLookup(word)}

    fun toggleFavorite(storyId: String) {
        var favorite: Boolean?=null
        mutate {
            if(favorite==null) favorite=storyId !in store.snapshot().favoriteStoryIds
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
    fun checkpointSession(id: String,millis: Long) = mutate {store.checkpointSession(id,millis)}
    fun abandonSession(id: String) = mutate {store.abandonSession(id)}
    fun startReading(storyId: String) = mutate { store.startReading(storyId) }
    fun dismissReaderHint() = mutate { store.dismissReaderHint() }
    fun saveWords(ids: List<String>) = mutate { store.saveWords(ids) }
    fun updatePreferences(level: String, genre: String, goal: Int, name: String) = mutate { store.updatePreferences(level,genre,goal,name) }

    fun retryLearningWrites() {mutations.trySend(Mutation(scope) {
        writes.retry();scheduleSync()
    })}

    private fun mutate(action: () -> Unit) {mutations.trySend(Mutation(scope) {
        if(writes.submit(action)) scheduleSync()
    })}
    private fun interruptSync() {
        syncEpoch++
        if(background) LearningSyncRuntime.pause()
        mutableAccount.value=mutableAccount.value.copy(sync=mutableAccount.value.sync.copy(running=false))
    }
    // Only the actor accesses a store. Timers enqueue work without touching Room.
    private fun scheduleSync(waitMillis: Long=2_000) {
        if(cloudSync==null || mutableAccount.value.userId==null || mutableAccount.value.needsSignIn || disposed) return
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
        mutableAccount.value=mutableAccount.value.copy(sync=mutableAccount.value.sync.copy(running=true,message="Hesap geçmişin eşitleniyor…"))
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
                                mutableAccount.value=mutableAccount.value.copy(sync=latest.copy(running=result.state.running,message=result.state.message),needsSignIn=auth.current==null)
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
                            sync=sync.status(store).copy(message=if(auth.current==null) "Oturum sona erdi. Tekrar giriş yap." else "Eşitleme tamamlanamadı. Kayıtların cihazında korunuyor; tekrar deneyebilirsin."))
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
        store.close();store=next;scope++;syncEpoch++
        writes.reset()
        mutableCompletions.value=emptySet()
        onOwnerChanged(owner)
        if(background) LearningSyncRuntime.resume()
        mutableAccount.value=AccountState(if(owner is LearningOwner.Account) owner.id else null,email,scope=scope)
        if(owner is LearningOwner.Account && cloudSync!=null) {
            val saved=cloudSync.status(store)
            mutableAccount.value=mutableAccount.value.copy(sync=saved.copy(message=if(saved.lastSuccessAt==null) "Henüz eşitlenmedi." else "Son alınan hesap geçmişi cihazında korunuyor."))
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
            mutableAccount.value=mutableAccount.value.copy(guestTransfer=null,message="Misafir geçmişi şu anda okunamadı. Hesabın açık; kayıtların cihazında korunuyor.",messageTone=MessageTone.Warning)
        }
    }
    fun transferGuestProgress() {
        val user=mutableAccount.value.userId?:return
        if(mutableAccount.value.busy || mutableAccount.value.needsSignIn || mutableAccount.value.guestTransfer?.blocked==true) return
        interruptSync()
        mutableAccount.value=mutableAccount.value.copy(busy=true,message="Misafir ilerlemen aktarılıyor…",messageTone=MessageTone.Progress)
        mutations.trySend(Mutation(scope) {
            try {
                check(store.owner.id==user)
                storeFactory(LearningOwner.Guest).use {GuestTransfer.transfer(it,store)}
                scope++
                mutableAccount.value=mutableAccount.value.copy(busy=false,scope=scope,message="Misafir ilerlemen hesabının cihazdaki kayıtlarına aktarıldı. Gönderilebilen kayıtlar eşitlenecek; eski puanlar bu cihazda korunur.",messageTone=MessageTone.Success)
            } catch (failure: Exception) {
                mutableAccount.value=mutableAccount.value.copy(busy=false,messageTone=MessageTone.Error,message=when((failure as? GuestTransferFailure)?.code) {
                    "different_target" -> "Bekleyen aktarım başka hesabına ait. O hesaba giriş yaparak tamamlayabilirsin."
                    "operation_conflict","payload_conflict" -> "Kayıtlar çakıştığı için aktarım durduruldu. Misafir geçmişin aktarım günlüğünde korunuyor."
                    "snapshot_too_large" -> "Misafir geçmişi aktarım sınırını aşıyor. Kayıtların cihazında korunuyor."
                    else -> "Aktarım tamamlanamadı. Misafir geçmişin korunuyor; aynı hesapta tekrar deneyebilirsin."
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
        mutableAccount.value=mutableAccount.value.copy(busy=true,message="Giriş yapılıyor…",messageTone=MessageTone.Progress)
        mutations.trySend(Mutation(null) {
            try {
                val session=auth.signIn(email,password)
                changeOwner(LearningOwner.Account(session.userId),session.email)
                mutableAccount.value=mutableAccount.value.copy(message="Giriş yapıldı. Bu hesabın cihazdaki kayıtları açıldı.",messageTone=MessageTone.Success)
            } catch (failure: Exception) {
                if(auth.current!=null && auth.current?.userId!=store.owner.id) auth.clearLocal()
                val message=when((failure as? AuthFailure)?.code) {
                    "invalid_input" -> "Geçerli bir e-posta ve parola gir."
                    "invalid_credentials" -> "E-posta veya parola doğru değil."
                    "email_not_confirmed" -> "Girişten önce e-postanı doğrula."
                    "not_configured" -> "Hesap bağlantısı yapılandırılmadı."
                    else -> "Giriş tamamlanamadı. Bilgilerini ve bağlantını kontrol et."
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
        mutableAccount.value=mutableAccount.value.copy(busy=true,message="İşlem yapılıyor…",messageTone=MessageTone.Progress)
        mutations.trySend(Mutation(scope) {
            try {action()} catch(failure: Exception) {
                if(auth.current!=null && auth.current?.userId!=store.owner.id) auth.clearLocal()
                mutableAccount.value=mutableAccount.value.copy(messageTone=MessageTone.Error,message=when((failure as? AuthFailure)?.code) {
                    "invalid_input" -> "Geçerli bir e-posta adresi gir."
                    "weak_password" -> "Parolan 8–128 karakter olmalı. Sunucunun parola koşullarını da karşılamalı."
                    "invalid_code","otp_expired" -> if(mutableAccount.value.emailAction=="signup") "Doğrulama kodu geçersiz veya süresi dolmuş. E-posta doğrulama konulu son mesajı kullan; parola kurtarma kodu burada geçmez." else "Kurtarma kodu geçersiz veya süresi dolmuş. Parola kurtarma konulu son mesajı kullan ya da yeni kod iste."
                    "over_email_send_rate_limit","over_request_rate_limit" -> "Çok sık denedin. Bir süre sonra tekrar dene."
                    "same_password" -> "Öncekinden farklı bir parola belirle."
                    else -> "İşlem tamamlanamadı. Bilgilerini ve bağlantını kontrol edip tekrar dene."
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
            message=if(ready) "Hesap işlemi tamamlandı. E-posta ve parolanla giriş yapabilirsin." else "Kayıt isteği alındı. Yeni hesap için doğrulama e-postasını ve spam klasörünü kontrol et. Bu adresle zaten doğrulanmış hesabın varsa yeni kod gelmeyebilir; giriş ekranına dönüp giriş yapabilirsin.",messageTone=if(ready) MessageTone.Success else MessageTone.Info)
    }
    fun requestRecovery(email: String)=emailOperation {
        auth.requestRecovery(email)
        mutableAccount.value=mutableAccount.value.copy(emailAction="recovery",verificationEmail=email.trim(),message="Bu e-postaya bağlı bir hesap varsa kurtarma kodu gönderildi. Gelen kutunu ve spam klasörünü kontrol et.",messageTone=MessageTone.Info)
    }
    fun resendEmailCode()=emailOperation {
        val state=mutableAccount.value
        when(state.emailAction) {
            "signup" -> auth.resendConfirmation(state.verificationEmail)
            "recovery" -> auth.requestRecovery(state.verificationEmail)
            else -> throw AuthFailure("invalid_input")
        }
        mutableAccount.value=mutableAccount.value.copy(message=if(state.emailAction=="signup") "Doğrulama kodu gönderimi istendi. Bu adresle zaten doğrulanmış hesabın varsa yeni e-posta gelmeyebilir; giriş ekranına dönüp giriş yap. Yeni hesap için gelen kutunu ve spam klasörünü kontrol et." else "Kurtarma kodu gönderimi istendi. Bu adrese bağlı hesap varsa yeni parola kurtarma e-postasını kontrol et; sık isteklerde bir süre beklemen gerekebilir.",messageTone=MessageTone.Info)
    }
    fun completeEmailCode(code: String,password: String)=emailOperation {
        val state=mutableAccount.value
        when(state.emailAction) {
            "signup" -> {
                val session=auth.confirmEmail(state.verificationEmail,code)
                changeOwner(LearningOwner.Account(session.userId),session.email)
                mutableAccount.value=mutableAccount.value.copy(message="E-postan doğrulandı ve giriş yapıldı.",messageTone=MessageTone.Success)
            }
            "recovery" -> {
                auth.resetPassword(state.verificationEmail,code,password)
                mutableAccount.value=mutableAccount.value.copy(emailAction="",verificationEmail="",message="Parolan güncellendi. Yeni parolanla giriş yapabilirsin.",messageTone=MessageTone.Success)
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
        mutableAccount.value=mutableAccount.value.copy(busy=true,message="Çıkış yapılıyor…",messageTone=MessageTone.Progress)
        mutations.trySend(Mutation(null) {
            val revoked=auth.signOut();changeOwner(LearningOwner.Guest)
            viewModelScope.launch {runCatching {GoogleSignIn.clear(getApplication())}}
            mutableAccount.value=mutableAccount.value.copy(message=if(revoked) "Çıkış yapıldı. Misafir kayıtların açıldı." else "Bu cihazdan çıkış yapıldı. Sunucu oturumu bağlantı olmadığı için kapatılamadı.",messageTone=if(revoked) MessageTone.Success else MessageTone.Warning)
        })
    }
    fun deleteAccount() {
        val user=mutableAccount.value.userId?:return
        if(mutableAccount.value.busy || mutableAccount.value.needsSignIn) return
        val expectedScope=scope
        interruptSync()
        mutableAccount.value=mutableAccount.value.copy(busy=true,message="Hesabın siliniyor…",messageTone=MessageTone.Progress)
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
                        mutableAccount.value=mutableAccount.value.copy(message=if(cleaned) "Hesabın ve bu cihazdaki hesap kayıtların silindi. Misafir kayıtların ayrı korunuyor." else "Hesabın sunucuda silindi. Cihazdaki temizlik tamamlanamadı; uygulama yeniden açıldığında tekrar denenecek.",messageTone=if(cleaned) MessageTone.Success else MessageTone.Warning)
                    })
                }
            } catch(failure: Exception) {
                if(failure is kotlinx.coroutines.CancellationException) throw failure
                mutations.trySend(Mutation(expectedScope) {
                    val again=(failure as? AuthFailure)?.code=="reauthentication_required"
                    mutableAccount.value=mutableAccount.value.copy(busy=false,needsSignIn=again || auth.current==null,
                        message=if(again) "Silme için yeniden giriş yapmalısın. Girişten sonra hesabını silmeyi tekrar seç." else "Silme tamamlanamadı veya sonucu doğrulanamadı. Cihazdaki kayıtların korunuyor; tekrar dene veya destek ile iletişime geç.",messageTone=if(again) MessageTone.Warning else MessageTone.Error)
                    if(background) LearningSyncRuntime.resume()
                })
            }
        }
    }
    suspend fun signInGoogle(acquire: suspend ()->GoogleIdentity) {
        if(mutableAccount.value.busy) return
        val expectedScope=scope
        interruptSync()
        mutableAccount.value=mutableAccount.value.copy(busy=true,message="Google hesabını seç…",messageTone=MessageTone.Progress)
        try {
            val identity=acquire()
            mutations.trySend(Mutation(expectedScope) {
                try {
                    val session=auth.signInGoogle(identity)
                    changeOwner(LearningOwner.Account(session.userId),session.email)
                    mutableAccount.value=mutableAccount.value.copy(message="Google hesabınla giriş yapıldı.",messageTone=MessageTone.Success)
                } catch (failure: Exception) {
                    if(auth.current!=null && auth.current?.userId!=store.owner.id) auth.clearLocal()
                    mutableAccount.value=mutableAccount.value.copy(busy=false,message="Google ile giriş tamamlanamadı. Bağlantını kontrol edip tekrar dene.",messageTone=MessageTone.Error)
                    if(background) LearningSyncRuntime.resume()
                    scheduleSync()
                }
            })
        } catch (failure: Exception) {
            if(scope==expectedScope) mutableAccount.value=mutableAccount.value.copy(busy=false,messageTone=if((failure as? AuthFailure)?.code=="google_cancelled") MessageTone.Info else MessageTone.Error,message=when((failure as? AuthFailure)?.code) {
                "google_cancelled" -> "Google girişi iptal edildi. Kayıtların korunuyor."
                "google_not_configured" -> "Google girişi henüz kullanıma açılmadı. Misafir veya e-posta ile devam edebilirsin."
                "google_no_account" -> "Google hesabı bulunamadı. Cihaza Google hesabı ekleyip tekrar dene."
                else -> "Google hesap seçimi tamamlanamadı. Tekrar deneyebilirsin."
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
                resultMessage="Oturum doğrulandı."
            } catch (failure: Exception) {
                requiresSignIn=auth.current==null
                resultMessage=if(requiresSignIn) "Oturum sona erdi. Yerel kayıtların duruyor; tekrar giriş yap." else "Bağlantı kurulamadı. Bu hesabın cihazdaki kayıtları kullanılabilir."
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
