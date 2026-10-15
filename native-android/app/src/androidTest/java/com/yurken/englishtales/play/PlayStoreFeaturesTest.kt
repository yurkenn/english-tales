package com.yurken.englishtales.play

import android.app.Activity
import android.content.Context
import androidx.activity.ComponentActivity
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import com.google.android.gms.tasks.Task
import com.google.android.gms.tasks.TaskCompletionSource
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.testing.FakeAppUpdateManager
import com.google.android.play.core.review.ReviewInfo
import com.google.android.play.core.review.ReviewManager
import com.google.android.play.core.review.testing.FakeReviewManager
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class PlayStoreFeaturesTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val prefs get() = instrumentation.targetContext.getSharedPreferences("play-store-features-test", Context.MODE_PRIVATE)
    private lateinit var scenario: ActivityScenario<ComponentActivity>

    private class CountingReviews(private val fake: ReviewManager) : ReviewManager {
        var requests = 0
        override fun requestReviewFlow(): Task<ReviewInfo> { requests++; return fake.requestReviewFlow() }
        override fun launchReviewFlow(activity: Activity, info: ReviewInfo): Task<Void> = fake.launchReviewFlow(activity, info)
    }

    @Before fun open() { prefs.edit().clear().commit(); scenario = ActivityScenario.launch(ComponentActivity::class.java) }
    @After fun close() { scenario.close(); prefs.edit().clear().commit() }

    private class Setup(val updates: FakeAppUpdateManager, val reviews: CountingReviews, val play: PlayStoreFeatures)

    /** Builds on the main thread; steps run on the main thread and then let posted Task listeners run. */
    private fun features(now: () -> Long = { 0L }, block: (Setup, (() -> Unit) -> Unit) -> Unit) {
        lateinit var setup: Setup
        scenario.onActivity { activity ->
            val updates = FakeAppUpdateManager(activity)
            val reviews = CountingReviews(FakeReviewManager(activity))
            setup = Setup(updates, reviews, PlayStoreFeatures(activity, updates, reviews, prefs, now))
        }
        val step: (() -> Unit) -> Unit = { action -> instrumentation.runOnMainSync(action); instrumentation.waitForIdleSync() }
        try { block(setup, step) } finally { instrumentation.runOnMainSync { setup.play.dispose() } }
    }

    @Test fun reviewIsRequestedOnceAfterTheThirdFinishedStory() = features { s, step ->
        step { s.play.onStoryFinished(2) }
        assertEquals(0, s.reviews.requests)
        step { s.play.onStoryFinished(3) }
        step { s.play.onStoryFinished(4) }
        assertEquals(1, s.reviews.requests)
    }

    @Test fun flexibleUpdateIsOfferedOnceAndRestartInstallsIt() {
        var now = 0L
        features({ now }) { s, step ->
            step { s.updates.setUpdateAvailable(49) }
            step { s.play.checkForUpdate() }
            assertTrue(s.updates.isConfirmationDialogVisible)
            step { s.updates.userRejectsUpdate() }
            step { s.play.checkForUpdate() }
            assertFalse("same version is not offered again within three days", s.updates.isConfirmationDialogVisible)
            now = PlayStoreFeatures.UPDATE_PROMPT_GAP_MS
            step { s.play.checkForUpdate() }
            assertTrue(s.updates.isConfirmationDialogVisible)
            step { s.updates.userAcceptsUpdate(); s.updates.downloadStarts(); s.updates.downloadCompletes() }
            assertTrue(s.play.updateReady)
            step { s.play.completeUpdate() }
            assertTrue(s.updates.isInstallSplashScreenVisible)
        }
    }
    @Test fun downloadedUpdateIsRecoveredAfterActivityRecreation() = features { s, step ->
        step { s.updates.setUpdateAvailable(49); s.play.checkForUpdate() }
        step { s.updates.userAcceptsUpdate(); s.updates.downloadStarts(); s.updates.downloadCompletes() }
        assertTrue(s.play.updateReady)
        lateinit var recreated: PlayStoreFeatures
        step { s.play.dispose() }
        scenario.onActivity { activity -> recreated = PlayStoreFeatures(activity, s.updates, s.reviews, prefs) }
        try {
            step { recreated.checkForUpdate() }
            assertTrue("downloaded update must survive activity recreation", recreated.updateReady)
        } finally { step { recreated.dispose() } }
    }

    @Test fun pendingUpdateResultCannotLaunchAfterDisposal() {
        val result = TaskCompletionSource<AppUpdateInfo>()
        lateinit var fake: FakeAppUpdateManager
        lateinit var play: PlayStoreFeatures
        scenario.onActivity { activity ->
            fake = FakeAppUpdateManager(activity)
            fake.setUpdateAvailable(49)
            val delayed = object : AppUpdateManager by fake {
                override fun getAppUpdateInfo(): Task<AppUpdateInfo> = result.task
            }
            play = PlayStoreFeatures(activity, delayed, FakeReviewManager(activity), prefs)
            play.checkForUpdate()
            play.dispose()
        }
        instrumentation.runOnMainSync { fake.appUpdateInfo.addOnSuccessListener { result.setResult(it) } }
        instrumentation.waitForIdleSync()
        assertFalse("late update result must not launch a destroyed activity", fake.isConfirmationDialogVisible)
        assertFalse(prefs.contains("update_prompted_version"))
    }

}
