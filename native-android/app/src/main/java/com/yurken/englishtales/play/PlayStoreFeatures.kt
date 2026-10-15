package com.yurken.englishtales.play

import android.content.Context
import android.content.SharedPreferences
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability
import com.google.android.play.core.review.ReviewManager
import com.google.android.play.core.review.ReviewManagerFactory

/**
 * Play in-app update (flexible) and review request.
 * - An available update is offered at most once per version every [UPDATE_PROMPT_GAP_MS]; a downloaded
 *   update is surfaced through [updateReady] so the UI can offer a restart.
 * - The review flow is requested once, after the third finished story. Play decides whether it shows.
 * Failures (no Play Store, sideloaded/debug installs) are ignored: neither feature may block learning.
 */
class PlayStoreFeatures(
    private val activity: ComponentActivity,
    private val updates: AppUpdateManager = AppUpdateManagerFactory.create(activity),
    private val reviews: ReviewManager = ReviewManagerFactory.create(activity),
    private val prefs: SharedPreferences = activity.getSharedPreferences("play_store_features", Context.MODE_PRIVATE),
    private val clock: () -> Long = System::currentTimeMillis
) {
    var updateReady by mutableStateOf(false)
        private set

    private val launcher: ActivityResultLauncher<IntentSenderRequest> =
        activity.activityResultRegistry.register("play-flexible-update", ActivityResultContracts.StartIntentSenderForResult()) {}
    private val listener = InstallStateUpdatedListener { state -> if (state.installStatus() == InstallStatus.DOWNLOADED) updateReady = true }

    init { updates.registerListener(listener) }

    fun checkForUpdate() {
        updates.appUpdateInfo.addOnSuccessListener { info ->
            if (info.installStatus() == InstallStatus.DOWNLOADED) { updateReady = true; return@addOnSuccessListener }
            if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE || !info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) return@addOnSuccessListener
            val version = info.availableVersionCode()
            val now = clock()
            if (prefs.getInt(KEY_PROMPTED_VERSION, -1) == version && now - prefs.getLong(KEY_PROMPTED_AT, 0) < UPDATE_PROMPT_GAP_MS) return@addOnSuccessListener
            prefs.edit().putInt(KEY_PROMPTED_VERSION, version).putLong(KEY_PROMPTED_AT, now).apply()
            runCatching { updates.startUpdateFlowForResult(info, launcher, AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build()) }
        }
    }

    fun completeUpdate() { updates.completeUpdate() }

    fun onStoryFinished(finishedStories: Int) {
        if (finishedStories < REVIEW_AFTER_STORIES || prefs.getBoolean(KEY_REVIEW_REQUESTED, false)) return
        prefs.edit().putBoolean(KEY_REVIEW_REQUESTED, true).apply()
        reviews.requestReviewFlow().addOnSuccessListener { info -> runCatching { reviews.launchReviewFlow(activity, info) } }
    }

    fun dispose() {
        updates.unregisterListener(listener)
        launcher.unregister()
    }

    companion object {
        const val REVIEW_AFTER_STORIES = 3
        const val UPDATE_PROMPT_GAP_MS = 3 * 24 * 60 * 60 * 1000L
        private const val KEY_PROMPTED_VERSION = "update_prompted_version"
        private const val KEY_PROMPTED_AT = "update_prompted_at"
        private const val KEY_REVIEW_REQUESTED = "review_requested"
    }
}

val LocalPlayStoreFeatures = staticCompositionLocalOf<PlayStoreFeatures?> { null }
