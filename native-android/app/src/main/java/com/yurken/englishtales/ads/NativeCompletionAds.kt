package com.yurken.englishtales.ads

import com.yurken.englishtales.R
import androidx.activity.ComponentActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.lifecycleScope
import com.google.android.libraries.ads.mobile.sdk.MobileAds
import com.google.android.libraries.ads.mobile.sdk.common.*
import com.google.android.libraries.ads.mobile.sdk.initialization.InitializationConfig
import com.google.android.libraries.ads.mobile.sdk.interstitial.*
import com.google.android.ump.*
import com.yurken.englishtales.BuildConfig
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.util.concurrent.atomic.AtomicBoolean

/** Activity-owned callbacks; never wait for a network ad at a study boundary. */
class NativeCompletionAds(private val activity: ComponentActivity): CompletionAds {
    private val consent=UserMessagingPlatform.getConsentInformation(activity)
    private val policy=AdPolicy(AdLedgerPreferences(activity.applicationContext))
    private val commands=Channel<()->Unit>(Channel.UNLIMITED)
    private val attempted=linkedSetOf<String>()
    private var ad: InterstitialAd?=null
    private var loadedAt=0L
    private var loading=false
    private var showing=false
    private var privacyBusy=false
    private var generation=0
    private var pendingContinue: (() -> Unit)?=null

    init {
        activity.lifecycleScope.launch(Dispatchers.IO) {for(command in commands) command()}
        activity.lifecycle.addObserver(LifecycleEventObserver {_,event ->
            if(event==Lifecycle.Event.ON_RESUME) {
                pendingContinue?.let {pendingContinue=null;it()}
                preload()
            }
            if(event==Lifecycle.Event.ON_DESTROY) {generation++;ad=null;pendingContinue=null;commands.close()}
        })
        gatherConsent()
    }

    private fun gatherConsent(onMessage: ((String)->Unit)?=null) {
        privacyBusy=true;generation++;ad=null;loading=false
        fun finish(error: Boolean) {
            privacyBusy=false
            if(!activity.isDestroyed) {
                onMessage?.invoke(if(error) activity.getString(R.string.ad_message_privacy_unavailable)
                    else activity.getString(R.string.ad_message_privacy_updated))
                initializeIfAllowed()
            }
        }
        try {
            consent.requestConsentInfoUpdate(activity,ConsentRequestParameters.Builder().build(),{
                if(!activity.isDestroyed) {
                    try {UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) {finish(it!=null)}}
                    catch (_: Exception) {finish(true)}
                }
            },{finish(true)})
        } catch (_: Exception) {finish(true)}
    }

    private fun initializeIfAllowed() {
        if(!consent.canRequestAds() || privacyBusy || activity.isDestroyed) return
        activity.lifecycleScope.launch {
            try {
                initialization.withLock {
                    if(!initialized) {
                        withContext(Dispatchers.IO) {
                            // The replacement AgeRestrictedTreatment has no explicit "not child-directed" value
                            // (UNSPECIFIED/CHILD/TEEN), so switching would change the declared audience.
                            @Suppress("DEPRECATION")
                            val requests=RequestConfiguration.Builder().setTagForChildDirectedTreatment(
                                RequestConfiguration.TagForChildDirectedTreatment.TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE).build()
                            MobileAds.initialize(activity.applicationContext,InitializationConfig.Builder(BuildConfig.ADMOB_APP_ID)
                                .setRequestConfiguration(requests).disableSdkCrashReporting().build()) {}
                        }
                        initialized=true
                    }
                }
                preload()
            } catch (failure: Exception) {
                if(failure is kotlinx.coroutines.CancellationException) throw failure
                // Ads are optional; a failed SDK must not affect study navigation.
            }
        }
    }

    private fun preload() {
        if(!initialized || !consent.canRequestAds() || privacyBusy || activity.isDestroyed || loading || showing) return
        if(ad!=null && System.currentTimeMillis()-loadedAt in 0 until MAX_AGE) return
        ad=null;loading=true
        val expected=generation
        try {
            InterstitialAd.load(AdRequest.Builder(BuildConfig.ADMOB_INTERSTITIAL_ID).build(),object: AdLoadCallback<InterstitialAd> {
                override fun onAdLoaded(loaded: InterstitialAd) {activity.runOnUiThread {
                    if(expected==generation && !activity.isDestroyed) {
                        loading=false
                        if(consent.canRequestAds() && !privacyBusy) {ad=loaded;loadedAt=System.currentTimeMillis()}
                    }
                }}
                override fun onAdFailedToLoad(error: LoadAdError) {activity.runOnUiThread {
                    if(expected==generation) {loading=false;ad=null}
                }}
            })
        } catch (_: Exception) {loading=false;ad=null}
    }

    override fun recordCompletion(id: String) {
        commands.trySend {policy.recordCompletion(id)}
    }

    override fun afterCompletion(id: String,isCurrent: ()->Boolean,onContinue: ()->Unit) {
        if(showing) return
        if(!attempted.add(id)) {if(isCurrent()) onContinue();return}
        if(attempted.size>256) attempted.remove(attempted.first())
        val available=ad
        val valid={isCurrent() && !activity.isDestroyed}
        val proceed={if(valid()) onContinue()}
        if(!valid()) return
        if(!activity.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED) || privacyBusy ||
            !consent.canRequestAds() || available==null || System.currentTimeMillis()-loadedAt !in 0 until MAX_AGE) {
            proceed();preload();return
        }
        showing=true;ad=null
        activity.lifecycleScope.launch {
            val booked=CompletableDeferred<Long?>()
            if(commands.trySend {booked.complete(runCatching {policy.reserve()}.getOrNull())}.isFailure) {
                showing=false;proceed();return@launch
            }
            val reservation=booked.await()
            if(reservation==null) {showing=false;proceed();preload();return@launch}
            if(!valid() || privacyBusy || !consent.canRequestAds() || !activity.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) {
                commands.trySend {policy.failedToShow(reservation)}
                showing=false;proceed();return@launch
            }
            val finished=AtomicBoolean(false)
            fun finish(failed: Boolean) {activity.runOnUiThread {
                if(!finished.compareAndSet(false,true)) return@runOnUiThread
                showing=false
                if(failed) commands.trySend {policy.failedToShow(reservation)}
                if(activity.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) proceed()
                else if(valid()) pendingContinue=proceed
                preload()
            }}
            available.adEventCallback=object: InterstitialAdEventCallback {
                override fun onAdDismissedFullScreenContent() {finish(false)}
                override fun onAdFailedToShowFullScreenContent(error: FullScreenContentError) {finish(true)}
            }
            try {available.show(activity)} catch (_: Exception) {finish(true)}
        }
    }

    override fun privacyOptions(onMessage: (String)->Unit) {
        if(showing || privacyBusy) return
        when(consent.privacyOptionsRequirementStatus) {
            ConsentInformation.PrivacyOptionsRequirementStatus.UNKNOWN -> {gatherConsent(onMessage);return}
            ConsentInformation.PrivacyOptionsRequirementStatus.NOT_REQUIRED -> {
                onMessage(activity.getString(R.string.ad_message_form_not_required));return
            }
            else -> Unit
        }
        privacyBusy=true;generation++;ad=null;loading=false
        fun finish(error: Boolean) {
            privacyBusy=false
            if(!activity.isDestroyed) {
                onMessage(if(!error) activity.getString(R.string.ad_message_preferences_updated) else activity.getString(R.string.ad_message_preferences_unavailable))
                initializeIfAllowed()
            }
        }
        try {UserMessagingPlatform.showPrivacyOptionsForm(activity) {finish(it!=null)}}
        catch (_: Exception) {finish(true)}
    }

    companion object {
        private const val MAX_AGE=55*60_000L
        private val initialization=Mutex()
        @Volatile private var initialized=false
    }
}
