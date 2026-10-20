package com.yurken.englishtales

import android.os.ParcelFileDescriptor
import android.provider.Settings
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.lifecycle.ViewModelProvider
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import kotlinx.coroutines.test.StandardTestDispatcher
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** The loading UI subscribes before IO publishes readiness, with system motion both off and on. */
@OptIn(androidx.compose.ui.test.ExperimentalTestApi::class)
class FirstLaunchReadinessTest {
    @get:Rule val compose=createEmptyComposeRule(effectContext=StandardTestDispatcher())
    private val instrumentation get()=InstrumentationRegistry.getInstrumentation()
    private val context get()=instrumentation.targetContext

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
            val brand=context.getString(R.string.yurken)
            if(compose.onAllNodesWithContentDescription(brand).fetchSemanticsNodes().isNotEmpty())
                compose.onNodeWithContentDescription(brand).performClick()
            compose.waitUntil(20_000) {compose.onAllNodesWithContentDescription(context.getString(R.string.yukleniyor)).fetchSemanticsNodes().isNotEmpty()}
            assertTrue("Restore was not reached",entered.await(5,TimeUnit.SECONDS))
            var vm: LearningViewModel?=null
            scenario.onActivity {vm=ViewModelProvider(it)[LearningViewModel::class.java]}
            assertFalse(checkNotNull(vm).ready.value)
            release.countDown()
            try {
                compose.waitUntil(20_000) {compose.onAllNodesWithTag("language_continue").fetchSemanticsNodes().isNotEmpty()}
            } catch (failure: Throwable) {
                val model=checkNotNull(vm)
                throw AssertionError("Scale $scale, iteration $iteration: ready=${model.ready.value}, account=${model.account.value.userId}, owner=${model.state.value.ownerId}, writeError=${model.writeError.value}\n"+compose.onRoot(useUnmergedTree=true).printToString(),failure)
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
