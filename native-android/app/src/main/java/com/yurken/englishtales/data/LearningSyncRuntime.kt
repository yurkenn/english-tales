package com.yurken.englishtales.data

import com.yurken.englishtales.R
import android.content.Context
import androidx.work.*
import com.yurken.englishtales.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicLong

internal object LearningSyncLocks {
    private val locks=ConcurrentHashMap<String,Mutex>()
    suspend fun <T> withOwner(user: String,action: suspend ()->T): T = locks.getOrPut(user) {Mutex()}.withLock {action()}
}

internal object LearningSyncRuntime {
    private var service: AccountService?=null
    val generation=AtomicLong()
    @Volatile var paused=false
    val updates=MutableSharedFlow<Pair<String,LearningSyncState>>(extraBufferCapacity=8)
    @Synchronized fun accounts(context: Context): AccountService {
        return service?:AccountService(
            if(configured()) AuthHttp(BuildConfig.SUPABASE_URL,BuildConfig.SUPABASE_PUBLISHABLE_KEY) else null,
            EncryptedSessionStorage(context.applicationContext,BuildConfig.SUPABASE_URL)).also {account ->
                runCatching {account.restore()}.onFailure {account.clearLocal()}
                if(account.current?.userId in DeletedAccountCleanup.pending(context)) account.clearLocal()
                service=account
            }
    }
    fun configured()=BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")
    fun sync()=LearningAccountSync(LearningSyncHttp(BuildConfig.SUPABASE_URL,BuildConfig.SUPABASE_PUBLISHABLE_KEY),BuildConfig.SUPABASE_URL)
    fun pause() {paused=true;generation.incrementAndGet()}
    fun resume() {paused=false}
    fun schedule(context: Context,user: String) {
        if(!configured()) return
        val manager=WorkManager.getInstance(context)
        val constraints=Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
        val data=workDataOf("user" to user)
        val request=OneTimeWorkRequestBuilder<LearningSyncWorker>().setInputData(data).setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL,30,TimeUnit.SECONDS).addTag("learning:$user").build()
        manager.enqueueUniqueWork("learning-once:$user",ExistingWorkPolicy.KEEP,request)
        val periodic=PeriodicWorkRequestBuilder<LearningSyncWorker>(15,TimeUnit.MINUTES).setInputData(data).setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL,30,TimeUnit.SECONDS).addTag("learning:$user").build()
        manager.enqueueUniquePeriodicWork("learning-periodic:$user",ExistingPeriodicWorkPolicy.KEEP,periodic)
    }
    fun cancel(context: Context,user: String) {WorkManager.getInstance(context).cancelAllWorkByTag("learning:$user")}
}

class LearningSyncWorker(context: Context,parameters: WorkerParameters): CoroutineWorker(context,parameters) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val user=inputData.getString("user")?:return@withContext Result.failure()
        if(!LearningSyncRuntime.configured() || LearningSyncRuntime.paused) return@withContext Result.retry()
        val auth=LearningSyncRuntime.accounts(applicationContext)
        if(auth.current?.userId!=user) return@withContext Result.success()
        val generation=LearningSyncRuntime.generation.get()
        val current={ !isStopped && !LearningSyncRuntime.paused && LearningSyncRuntime.generation.get()==generation && auth.current?.userId==user }
        LearningSyncLocks.withOwner(user) {
            if(!current()) return@withOwner Result.success()
            try {
                LearningStore(applicationContext,LearningOwner.Account(user)).use {store ->
                    val sync=LearningSyncRuntime.sync()
                    repeat(100) {
                        if(!current()) return@withOwner Result.success()
                        val result=sync.step(store,auth,user,current)
                        if(!current()) return@withOwner Result.success()
                        LearningSyncRuntime.updates.tryEmit(user to result.state)
                        if(result.verifySession) auth.verifyCurrent()
                        if(!result.continueUpload) return@withOwner if(result.state.pending>0) Result.retry() else Result.success()
                    }
                    LearningSyncRuntime.updates.tryEmit(user to sync.status(store).copy(message=com.yurken.englishtales.AppLanguage.wrap(applicationContext).getString(R.string.sync_background_upload_queued)))
                    Result.retry()
                }
            } catch(failure: Exception) {
                if(failure is kotlinx.coroutines.CancellationException) throw failure
                if(current()) LearningSyncRuntime.updates.tryEmit(user to LearningSyncState(message=com.yurken.englishtales.AppLanguage.wrap(applicationContext).getString(R.string.sync_background_retry)))
                if(current() && failure is LearningSyncFailure && failure.status==401) runCatching {auth.verifyCurrent()}
                if(auth.current?.userId!=user || !current()) Result.success() else Result.retry()
            }
        }
    }
}
