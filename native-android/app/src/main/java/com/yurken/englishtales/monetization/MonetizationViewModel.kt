package com.yurken.englishtales.monetization

import android.app.Activity
import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.revenuecat.purchases.Package
import com.yurken.englishtales.BuildConfig
import com.yurken.englishtales.ads.CompletionAds
import com.yurken.englishtales.ads.EnergyAdOutcome
import com.yurken.englishtales.analytics.*
import com.yurken.englishtales.data.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/** All IO is serialized. A generation also isolates sign-out/sign-in to the same UUID. */
class MonetizationViewModel(application: Application): AndroidViewModel(application) {
    private val repository = EnergyRepository(application, LearningSyncRuntime.accounts(application),
        if(LearningSyncRuntime.configured()) LearningSyncHttp(BuildConfig.SUPABASE_URL,BuildConfig.SUPABASE_PUBLISHABLE_KEY) else null)
    private val serial=Mutex()
    private var owner="guest"
    private var scope=Long.MIN_VALUE
    private var legacy=emptySet<String>()
    @Volatile private var generation=0L
    private var lastPremiumCheck=0L
    private val mutable=MutableStateFlow(MonetizationUi())
    val state: StateFlow<MonetizationUi> = mutable
    private fun signal(event: MonetizationEvent) {viewModelScope.launch(Dispatchers.IO) {ProductAnalytics.get(getApplication()).monetization(event)}}
    fun paywallViewed() {signal(MonetizationEvent.PAYWALL)}

    fun bind(owner: String,scope: Long,legacy: Set<String>) {
        if(this.owner==owner && this.scope==scope) return
        this.owner=owner;this.scope=scope;this.legacy=legacy;generation++;lastPremiumCheck=0
        mutable.value=MonetizationUi()
        if(owner=="guest") viewModelScope.launch {PremiumBilling.signOut()}
        refresh()
    }
    private fun applyEnergy(value: EnergyState,enabled: Boolean=mutable.value.policyEnabled) {
        mutable.value=mutable.value.copy(energy=value,policyEnabled=enabled && value.enabled,
            adPending=value.pendingAdRewards>0,purchasePending=mutable.value.purchasePending && !value.premium(System.currentTimeMillis()))
    }
    fun refresh() {
        if(!BuildConfig.MONETIZATION_ENABLED) return
        val request=generation;val user=owner;val old=legacy
        viewModelScope.launch {serial.withLock {
            val local=withContext(Dispatchers.IO) {runCatching {
                Triple(repository.cached(user,old),repository.cachedPolicy(),repository.purchasePending(user))
            }.getOrNull()}
            if(request!=generation) return@withLock
            mutable.value=mutable.value.copy(energy=local?.first ?: mutable.value.energy,
                policyEnabled=local?.second ?: mutable.value.policyEnabled,purchasePending=local?.third ?: mutable.value.purchasePending)
            val result=withContext(Dispatchers.IO) {runCatching {
                val enabled=repository.policy()
                val shouldVerify=user!="guest" && PremiumBilling.configured && mutable.value.purchasePending &&
                    System.currentTimeMillis()-lastPremiumCheck>30_000
                val value=if(shouldVerify) {
                    lastPremiumCheck=System.currentTimeMillis();repository.syncPremium(user,old)
                } else repository.refresh(user,old)
                if(value.premium(System.currentTimeMillis())) repository.purchasePending(user,false)
                value to enabled
            }}
            if(request==generation) result.onSuccess {(value,enabled) -> applyEnergy(value,enabled)}
        }}
    }
    fun authorize(story: String,onAllowed: ()->Unit) {
        if(!BuildConfig.MONETIZATION_ENABLED) {onAllowed();return}
        val request=generation;val user=owner;val old=legacy
        viewModelScope.launch {serial.withLock {
            if(request!=generation) return@withLock
            mutable.value=mutable.value.copy(busy=true,error=false)
            val result=withContext(Dispatchers.IO) {runCatching {
                // Policy is refreshed in the background; cached/offline unlocks never wait on a network policy call.
                if(!repository.cachedPolicy()) null to true else repository.open(user,old,story)
            }}
            if(request!=generation) return@withLock
            mutable.value=mutable.value.copy(busy=false,error=result.isFailure)
            result.getOrNull()?.first?.let {applyEnergy(it)}
            if(result.getOrNull()?.second==true) onAllowed()
            else if(result.isSuccess) signal(MonetizationEvent.LIMIT)
        }}
    }
    fun offers(force: Boolean=false) {
        if(owner=="guest" || !PremiumBilling.configured || mutable.value.busy || (mutable.value.offersLoaded && !force)) return
        val request=generation;val user=owner
        viewModelScope.launch {
            mutable.value=mutable.value.copy(busy=true,error=false,offersLoaded=true)
            val result=runCatching {PremiumBilling.packages(getApplication(),user) {request==generation}}
            if(request==generation) mutable.value=mutable.value.copy(packages=result.getOrDefault(emptyList()),busy=false,error=result.isFailure)
        }
    }
    fun buy(activity: Activity,selected: Package)=billing(activity,selected)
    fun restore(activity: Activity)=billing(activity,null)
    private fun billing(activity: Activity,selected: Package?) {
        if(owner=="guest" || !PremiumBilling.configured || mutable.value.busy) return
        val request=generation;val user=owner;val old=legacy
        viewModelScope.launch {
            mutable.value=mutable.value.copy(busy=true,error=false)
            val result=runCatching {
                val outcome=if(selected==null) {
                    PremiumBilling.restore(activity,user) {request==generation};PurchaseOutcome.Completed
                } else PremiumBilling.purchase(activity,user,selected) {request==generation}
                if(request!=generation || outcome==PurchaseOutcome.Cancelled) return@runCatching
                // Restore cannot clear a pending Play payment before server verification succeeds.
                if(selected!=null) {
                    withContext(Dispatchers.IO) {repository.purchasePending(user,true)}
                    mutable.value=mutable.value.copy(purchasePending=true)
                }
                if(outcome==PurchaseOutcome.Pending) return@runCatching
                val value=serial.withLock {withContext(Dispatchers.IO) {repository.syncPremium(user,old)}}
                if(request!=generation) return@runCatching
                applyEnergy(value)
                if(value.premium(System.currentTimeMillis())) {
                    withContext(Dispatchers.IO) {repository.purchasePending(user,false)}
                    signal(if(selected==null) MonetizationEvent.RESTORE else MonetizationEvent.PURCHASE)
                }
            }
            if(request==generation) mutable.value=mutable.value.copy(busy=false,error=result.isFailure)
        }
    }
    fun verifyPremium() {
        if(owner=="guest" || !PremiumBilling.configured || mutable.value.busy) {refresh();return}
        val request=generation;val user=owner;val old=legacy
        viewModelScope.launch {
            mutable.value=mutable.value.copy(busy=true,error=false)
            val result=serial.withLock {withContext(Dispatchers.IO) {runCatching {
                lastPremiumCheck=System.currentTimeMillis()
                repository.syncPremium(user,old).also {if(it.premium(System.currentTimeMillis())) repository.purchasePending(user,false)}
            }}}
            if(request==generation) {
                result.onSuccess {applyEnergy(it)}
                mutable.value=mutable.value.copy(busy=false,error=result.isFailure)
            }
        }
    }
    fun reward(ads: CompletionAds) {
        val energy=mutable.value.energy
        if(owner=="guest" || mutable.value.busy || mutable.value.adPending || energy==null ||
            energy.adCredits+energy.pendingAdRewards>=3) return
        if(!ads.canRewardEnergy()) {mutable.value=mutable.value.copy(error=true);return}
        val request=generation;val user=owner;val old=legacy
        viewModelScope.launch {
            mutable.value=mutable.value.copy(busy=true,error=false)
            val nonce=serial.withLock {withContext(Dispatchers.IO) {runCatching {repository.beginReward(user)}}}
            if(request!=generation) return@launch
            if(nonce.isFailure) {
                val code=(nonce.exceptionOrNull() as? LearningSyncFailure)?.code
                mutable.value=mutable.value.copy(busy=false,error=code !in setOf("pending_reward","ad_limit_reached","energy_disabled","premium_active"),
                    adPending=code=="pending_reward")
                refresh();return@launch
            }
            signal(MonetizationEvent.REWARD_START)
            ads.rewardEnergy(user,nonce.getOrThrow(),{request==generation}) {outcome ->
                if(request==generation) viewModelScope.launch {
                    if(outcome==EnergyAdOutcome.NoReward) {
                        serial.withLock {withContext(Dispatchers.IO) {runCatching {repository.cancelReward(user,nonce.getOrThrow())}}}
                        if(request==generation) {mutable.value=mutable.value.copy(busy=false,error=true);refresh()}
                    } else {
                        mutable.value=mutable.value.copy(busy=false,adPending=true)
                        if(outcome==EnergyAdOutcome.Completed) signal(MonetizationEvent.REWARD_COMPLETE)
                        pollReward(request,user,old)
                    }
                }
            }
        }
    }
    private fun pollReward(request: Long,user: String,old: Set<String>) {
        val before=mutable.value.energy
        viewModelScope.launch {
            for(wait in listOf(1500L,2000L,3000L,5000L,8000L,13000L,21000L,30000L,30000L)) {
                delay(wait)
                if(request!=generation) return@launch
                val result=serial.withLock {withContext(Dispatchers.IO) {runCatching {repository.refresh(user,old)}}}
                if(request!=generation) return@launch
                result.onSuccess {applyEnergy(it)}
                val value=result.getOrNull() ?: continue
                if(value.hasNewAdCreditSince(before)) {
                    signal(MonetizationEvent.REWARD_VERIFY);return@launch
                }
                if(value.pendingAdRewards==0) return@launch
            }
        }
    }
}

data class MonetizationUi(val policyEnabled: Boolean=BuildConfig.DEBUG,val energy: EnergyState?=null,
    val busy: Boolean=false,val error: Boolean=false,val adPending: Boolean=false,val purchasePending: Boolean=false,
    val offersLoaded: Boolean=false,val packages: List<Package> = emptyList()) {
    val pending get()=adPending || purchasePending
}
