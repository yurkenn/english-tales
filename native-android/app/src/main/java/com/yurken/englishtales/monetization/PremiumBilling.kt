package com.yurken.englishtales.monetization

import android.app.Activity
import android.content.Context
import com.revenuecat.purchases.*
import com.yurken.englishtales.BuildConfig
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/** Serial identity changes; a delayed login can never purchase for the next learner. */
internal enum class PurchaseOutcome { Completed, Cancelled, Pending }

internal object PremiumBilling {
    private val mutex = Mutex()
    private var owner: String? = null
    val configured get() = BuildConfig.REVENUECAT_PUBLIC_KEY.isNotBlank()
    private suspend fun identify(context: Context, user: String) {
        check(configured && user != "guest")
        if (!Purchases.isConfigured) {
            Purchases.configure(PurchasesConfiguration.Builder(context.applicationContext, BuildConfig.REVENUECAT_PUBLIC_KEY)
                .appUserID(user).build())
            owner = user
        } else if (owner != user) {
            suspendCancellableCoroutine<Unit> { next ->
                Purchases.sharedInstance.logInWith(user, onError = { if(next.isActive) next.resumeWithException(IllegalStateException("billing_identity")) },
                    onSuccess = { _, _ -> if(next.isActive) next.resume(Unit) })
            }
            owner = user
        }
    }
    suspend fun packages(context: Context, user: String, current: () -> Boolean): List<Package> = mutex.withLock {
        identify(context, user); check(current())
        suspendCancellableCoroutine { next ->
            Purchases.sharedInstance.getOfferingsWith(onError = { if(next.isActive) next.resumeWithException(IllegalStateException("billing_offerings")) },
                onSuccess = { if(next.isActive) next.resume(it.all["energy_premium_v1"]?.availablePackages.orEmpty().filter { p -> p.packageType in setOf(PackageType.MONTHLY, PackageType.ANNUAL) }) })
        }
    }
    suspend fun purchase(activity: Activity, user: String, selected: Package, current: () -> Boolean): PurchaseOutcome = mutex.withLock {
        identify(activity, user); check(current())
        suspendCancellableCoroutine { next ->
            Purchases.sharedInstance.purchaseWith(PurchaseParams.Builder(activity, selected).build(),
                onError = { error, cancelled -> if(next.isActive) {
                    when {
                        cancelled -> next.resume(PurchaseOutcome.Cancelled)
                        error.code==PurchasesErrorCode.PaymentPendingError -> next.resume(PurchaseOutcome.Pending)
                        else -> next.resumeWithException(IllegalStateException("billing_purchase"))
                    }
                } },
                onSuccess = { _, _ -> if(next.isActive) next.resume(PurchaseOutcome.Completed) })
        }
    }
    suspend fun restore(context: Context, user: String, current: () -> Boolean): Unit = mutex.withLock {
        identify(context, user); check(current())
        suspendCancellableCoroutine { next ->
            Purchases.sharedInstance.restorePurchasesWith(onError = { if(next.isActive) next.resumeWithException(IllegalStateException("billing_restore")) },
                onSuccess = { if(next.isActive) next.resume(Unit) })
        }
    }
    suspend fun signOut() = mutex.withLock {
        if (!Purchases.isConfigured || owner == null) return@withLock
        suspendCancellableCoroutine<Unit> { next ->
            Purchases.sharedInstance.logOutWith(onError = { if(next.isActive) next.resume(Unit) },
                onSuccess = { if(next.isActive) next.resume(Unit) })
        }
        owner = null
    }
}
