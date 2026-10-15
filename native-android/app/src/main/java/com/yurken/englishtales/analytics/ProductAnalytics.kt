package com.yurken.englishtales.analytics

import android.content.Context
import android.os.Bundle
import com.google.firebase.analytics.FirebaseAnalytics
import com.yurken.englishtales.BuildConfig

internal class PreferenceMetricsStorage(context: Context) : MetricsStorage {
    private val prefs = context.getSharedPreferences("product_metrics_v1", Context.MODE_PRIVATE)
    override fun read() = MetricsState(
        enabled = prefs.getBoolean("enabled", false),
        firstDay = if (prefs.contains("first_day")) prefs.getLong("first_day", 0) else null,
        lastVisitDay = if (prefs.contains("last_visit_day")) prefs.getLong("last_visit_day", 0) else null,
        nextDayReported = prefs.getBoolean("next_day_reported", false),
        firstStoryReported = prefs.getBoolean("first_story_reported", false)
    )
    override fun write(state: MetricsState): Boolean = prefs.edit().clear().apply {
        putBoolean("enabled", state.enabled)
        state.firstDay?.let { putLong("first_day", it) }
        state.lastVisitDay?.let { putLong("last_visit_day", it) }
        putBoolean("next_day_reported", state.nextDayReported)
        putBoolean("first_story_reported", state.firstStoryReported)
    }.commit()
}

/** No Firebase API is accessed in debug/tests. Release still starts with collection disabled. */
internal class FirebaseMetricsTransport(context: Context) : MetricsTransport {
    private val app = context.applicationContext
    private val analytics by lazy { FirebaseAnalytics.getInstance(app) }
    override fun setEnabled(enabled: Boolean) {
        if (!BuildConfig.PRODUCT_ANALYTICS_AVAILABLE) return
        if (!enabled) analytics.setAnalyticsCollectionEnabled(false)
        analytics.setConsent(mapOf(
            FirebaseAnalytics.ConsentType.ANALYTICS_STORAGE to if (enabled) FirebaseAnalytics.ConsentStatus.GRANTED else FirebaseAnalytics.ConsentStatus.DENIED,
            FirebaseAnalytics.ConsentType.AD_STORAGE to FirebaseAnalytics.ConsentStatus.DENIED,
            FirebaseAnalytics.ConsentType.AD_USER_DATA to FirebaseAnalytics.ConsentStatus.DENIED,
            FirebaseAnalytics.ConsentType.AD_PERSONALIZATION to FirebaseAnalytics.ConsentStatus.DENIED
        ))
        if (enabled) analytics.setAnalyticsCollectionEnabled(true)
    }
    override fun reset() {
        if (BuildConfig.PRODUCT_ANALYTICS_AVAILABLE) {
            analytics.resetAnalyticsData()
            setEnabled(false)
        }
    }
    override fun log(event: ProductEvent, mode: PracticeMode?) {
        if (!BuildConfig.PRODUCT_ANALYTICS_AVAILABLE) return
        // Never add account IDs, session IDs, content IDs, text, answers or free-form properties.
        val parameters = if (event == ProductEvent.PRACTICE_COMPLETED && mode != null)
            Bundle().apply { putString("mode", mode.wireName) } else null
        analytics.logEvent(event.wireName, parameters)
    }
}

internal object ProductAnalytics {
    @Volatile private var instance: ProductMetrics? = null
    fun get(context: Context): ProductMetrics = instance ?: synchronized(this) {
        instance ?: ProductMetrics(PreferenceMetricsStorage(context.applicationContext), FirebaseMetricsTransport(context)).also { instance = it }
    }
}
