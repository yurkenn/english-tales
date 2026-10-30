package com.yurken.englishtales.ads

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.os.Build
import androidx.compose.material3.Text
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.google.android.libraries.ads.mobile.sdk.MobileAds
import com.google.android.libraries.ads.mobile.sdk.common.*
import com.google.android.libraries.ads.mobile.sdk.initialization.InitializationConfig
import com.google.android.libraries.ads.mobile.sdk.rewarded.*
import com.yurken.englishtales.BuildConfig
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

/**
 * Explicit adProbe + sandboxDeviceTest operator probe, never part of ordinary CI.
 * Google automatically treats Android emulators as test devices. Physical devices are refused.
 * An operator supplies a staging-only fixture user's fresh begin_ad_reward nonce, watches the
 * labeled test creative and closes it. The operator separately verifies credit and replay in SQL.
 * This checks SDK -> signed Google SSV -> staging; it does not replace consent or app-UI acceptance.
 */
class GoogleRewardedSsvProbe {
    @get:Rule val compose=createComposeRule()

    @Test fun emulatorRewardedAdCompletesWithStagingSsvTicket() {
        check(BuildConfig.MONETIZATION_SANDBOX && BuildConfig.SUPABASE_URL=="https://jukyylozahikjhtokayw.supabase.co") {
            "Run only the signed sandbox variant against staging"
        }
        check(Build.HARDWARE in setOf("ranchu","goldfish")) {"This probe refuses physical devices"}
        val arguments=InstrumentationRegistry.getArguments()
        val user=UUID.fromString(checkNotNull(arguments.getString("ssvFixtureUser"))).toString()
        val nonce=UUID.fromString(checkNotNull(arguments.getString("ssvTicketNonce"))).toString()
        var host: Activity?=null
        compose.setContent {
            val context=LocalContext.current
            SideEffect {host=activity(context)}
            Text("Emulator-only rewarded SSV test. Watch only a labeled Google test ad.")
        }
        compose.waitForIdle()
        val target=checkNotNull(host)
        val loaded=CountDownLatch(1)
        val shown=CountDownLatch(1)
        val dismissed=CountDownLatch(1)
        val failure=AtomicReference<String?>()
        val earned=AtomicBoolean(false)
        var ad: RewardedAd?=null
        Thread {
            try {
                check(!MobileAds.isInitialized) {"Start a fresh instrumentation process for the probe"}
                MobileAds.initialize(target.applicationContext,InitializationConfig.Builder(
                    "ca-app-pub-6012481599277383~8771515308").disableSdkCrashReporting().build()) {}
                target.runOnUiThread {
                    RewardedAd.load(AdRequest.Builder("ca-app-pub-6012481599277383/6069329647").build(),
                        object: AdLoadCallback<RewardedAd> {
                            override fun onAdLoaded(value: RewardedAd) {ad=value;loaded.countDown()}
                            override fun onAdFailedToLoad(error: LoadAdError) {failure.set(error.message);loaded.countDown()}
                        })
                }
            } catch(error: Exception) {failure.set(error.javaClass.simpleName+": "+error.message);loaded.countDown()}
        }.start()
        assertTrue("Rewarded test ad load timed out",loaded.await(45,TimeUnit.SECONDS))
        assertNull(failure.get())
        target.runOnUiThread {
            checkNotNull(ad).setServerSideVerificationOptions(ServerSideVerificationOptions(user,nonce))
            checkNotNull(ad).adEventCallback=object: RewardedAdEventCallback {
                override fun onAdShowedFullScreenContent() {shown.countDown()}
                override fun onAdDismissedFullScreenContent() {dismissed.countDown()}
                override fun onAdFailedToShowFullScreenContent(error: FullScreenContentError) {
                    failure.set(error.message);shown.countDown();dismissed.countDown()
                }
            }
            try {checkNotNull(ad).show(target) {earned.set(true)}}
            catch(error: Exception) {failure.set(error.javaClass.simpleName);shown.countDown();dismissed.countDown()}
        }
        assertTrue("Rewarded test ad did not show",shown.await(15,TimeUnit.SECONDS))
        assertNull(failure.get())
        assertTrue("Watch the labeled test ad and close it within 120 seconds",dismissed.await(120,TimeUnit.SECONDS))
        assertNull(failure.get())
        assertTrue("Ad closed before the SDK reward callback; no server credit is assumed",earned.get())
    }

    private fun activity(context: Context): Activity {
        var current=context
        while(current !is Activity && current is ContextWrapper) current=current.baseContext
        return current as Activity
    }
}
