package com.yurken.englishtales

import android.os.ParcelFileDescriptor
import android.provider.Settings
import android.os.SystemClock
import android.view.accessibility.AccessibilityNodeInfo
import androidx.lifecycle.ViewModelProvider
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.*
import org.junit.Test
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** The loading UI subscribes before IO publishes readiness, with system motion both off and on. */
class FirstLaunchReadinessTest {
    private val instrumentation get()=InstrumentationRegistry.getInstrumentation()
    private val context get()=instrumentation.targetContext

    // Keep the real Activity's main-thread recomposer. Compose 1.8's unconfined test clock can
    // resume composition on the IO thread that publishes ready, where LazyColumn has no Looper.
    private fun findNode(node: AccessibilityNodeInfo?, matches: (AccessibilityNodeInfo)->Boolean): AccessibilityNodeInfo? {
        if(node==null) return null
        if(matches(node)) return node
        repeat(node.childCount) {findNode(node.getChild(it),matches)?.let {return it}}
        return null
    }

    private fun awaitNode(matches: (AccessibilityNodeInfo)->Boolean) {
        val deadline=SystemClock.uptimeMillis()+20_000
        while(SystemClock.uptimeMillis()<deadline) {
            if(findNode(instrumentation.uiAutomation.rootInActiveWindow,matches)!=null) return
            SystemClock.sleep(50)
        }
        throw AssertionError("Expected accessible startup node was not displayed within 20 seconds")
    }

    private fun animationScale(value: Float?) {
        val command=if(value==null) "settings delete global animator_duration_scale"
            else "settings put global animator_duration_scale $value"
        ParcelFileDescriptor.AutoCloseInputStream(instrumentation.uiAutomation.executeShellCommand(command)).use {it.readBytes()}
    }

    @Test fun restoredGuestLeavesLoadingForTheLanguageChoice() {
        val originalScale=Settings.Global.getString(context.contentResolver,Settings.Global.ANIMATOR_DURATION_SCALE)?.toFloatOrNull()
        val originalConfirmed=AppLanguage.hasConfirmedChoice(context)
        val repetitions=InstrumentationRegistry.getArguments().getString("startupRepetitions")?.toInt()?:1
        // The preceding full journey completed onboarding in this process.
        LearningDatabase.detach(context,LearningOwner.Guest)
        context.deleteDatabase(LearningOwner.Guest.databaseName)
        context.getSharedPreferences("learning_preferences",0).edit().clear().commit()
        context.getSharedPreferences("reminders",0).edit().clear().commit()
        try {
            for(scale in listOf(0f,1f)) {
                animationScale(scale)
                assertEquals(scale,Settings.Global.getFloat(context.contentResolver,Settings.Global.ANIMATOR_DURATION_SCALE),0f)
                repeat(repetitions) {iteration -> checkStartup(scale,iteration)}
            }
        } finally {
            animationScale(originalScale)
            context.getSharedPreferences("app_language",0).edit().putBoolean("confirmed",originalConfirmed).commit()
        }
    }

    private fun checkStartup(scale: Float,iteration: Int) {
        context.getSharedPreferences("app_language",0).edit().putBoolean("confirmed",false).commit()
        val entered=CountDownLatch(1)
        val release=CountDownLatch(1)
        LearningSyncRuntime.resetForTest {object: SessionStorage {
            override fun read(): AccountSession? {
                entered.countDown()
                check(release.await(20,TimeUnit.SECONDS)) {"Fixture did not release session restore"}
                return null
            }
            override fun write(session: AccountSession) {error("Unexpected session write")}
            override fun clear() {}
        }}
        LearningSyncRuntime.resume()
        val scenario=ActivityScenario.launch(MainActivity::class.java)
        try {
            // The brand intro runs on the real clock and exits itself; the held restore keeps loading visible.
            awaitNode {it.contentDescription==context.getString(R.string.yukleniyor)}
            assertTrue("Restore was not reached",entered.await(5,TimeUnit.SECONDS))
            var vm: LearningViewModel?=null
            scenario.onActivity {vm=ViewModelProvider(it)[LearningViewModel::class.java]}
            assertFalse(checkNotNull(vm).ready.value)
            release.countDown()
            try {
                awaitNode {it.viewIdResourceName=="language_continue" && it.isVisibleToUser}
            } catch (failure: Throwable) {
                val model=checkNotNull(vm)
                val window=instrumentation.uiAutomation.rootInActiveWindow
                throw AssertionError("Scale $scale, iteration $iteration: ready=${model.ready.value}, account=${model.account.value.userId}, owner=${model.state.value.ownerId}, writeError=${model.writeError.value}, window=$window",failure)
            }
            assertTrue(checkNotNull(vm).ready.value)
            assertEquals("guest",checkNotNull(vm).state.value.ownerId)
            assertFalse(AppLanguage.hasConfirmedChoice(context))
            android.util.Log.i("FirstLaunchReadiness","Scale $scale, iteration $iteration passed")
        } finally {
            release.countDown()
            scenario.close()
            LearningSyncRuntime.resetForTest()
        }
    }
}
