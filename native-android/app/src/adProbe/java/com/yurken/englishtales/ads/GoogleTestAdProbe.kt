package com.yurken.englishtales.ads

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.compose.material3.Text
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.test.junit4.createComposeRule
import com.google.android.libraries.ads.mobile.sdk.MobileAds
import com.google.android.libraries.ads.mobile.sdk.common.*
import com.google.android.libraries.ads.mobile.sdk.initialization.InitializationConfig
import com.google.android.libraries.ads.mobile.sdk.interstitial.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

/** Explicit opt-in network probe. Test IDs only; no production consent bypass. */
class GoogleTestAdProbe {
    @get:Rule val compose=createComposeRule()
    @Test fun googleTestInterstitialLoadsShowsAndDismisses() {
        var host: Activity?=null
        val loaded=CountDownLatch(1);val shown=CountDownLatch(1);val dismissed=CountDownLatch(1)
        val failure=AtomicReference<String?>()
        var ad: InterstitialAd?=null
        compose.setContent {
            val context=LocalContext.current
            SideEffect {host=activity(context)}
            Text("Google test reklamı doğrulaması")
        }
        compose.waitForIdle()
        val target=checkNotNull(host)
        Thread {
            try {
                if(!MobileAds.isInitialized) MobileAds.initialize(target.applicationContext,
                    InitializationConfig.Builder("ca-app-pub-3940256099942544~3347511713").disableSdkCrashReporting().build()) {}
                target.runOnUiThread {
                    InterstitialAd.load(AdRequest.Builder("ca-app-pub-3940256099942544/1033173712").build(),object: AdLoadCallback<InterstitialAd> {
                        override fun onAdLoaded(value: InterstitialAd) {ad=value;loaded.countDown()}
                        override fun onAdFailedToLoad(error: LoadAdError) {failure.set(error.message);loaded.countDown()}
                    })
                }
            } catch (error: Exception) {failure.set(error.javaClass.simpleName);loaded.countDown()}
        }.start()
        assertTrue("Test ad load timed out",loaded.await(45,TimeUnit.SECONDS))
        assertNull(failure.get())
        target.runOnUiThread {
            checkNotNull(ad).adEventCallback=object: InterstitialAdEventCallback {
                override fun onAdShowedFullScreenContent() {shown.countDown()}
                override fun onAdDismissedFullScreenContent() {dismissed.countDown()}
                override fun onAdFailedToShowFullScreenContent(error: FullScreenContentError) {failure.set(error.message);shown.countDown()}
            }
            checkNotNull(ad).show(target)
        }
        assertTrue("Test ad did not show",shown.await(15,TimeUnit.SECONDS))
        assertNull(failure.get())
        // Operator closes the visible test creative using its own close control.
        // Back is not a reliable dismissal action for SDK-owned fullscreen ads.
        assertTrue("Close the test ad in the emulator within 120 seconds",dismissed.await(120,TimeUnit.SECONDS))
    }
    private fun activity(context: Context): Activity {
        var current=context
        while(current !is Activity && current is ContextWrapper) current=current.baseContext
        return current as Activity
    }
}
