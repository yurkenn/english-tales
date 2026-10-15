package com.yurken.englishtales

import android.content.pm.PackageManager
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Test

class CrashReportingConfigTest {
    @Test fun debugAndTestBuildsNeverSendCrashReportsOrAnalytics() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val meta = context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA).metaData
        assertEquals(false, meta.getBoolean("firebase_crashlytics_collection_enabled", true))
        assertEquals(true, meta.getBoolean("firebase_analytics_collection_deactivated", false))
        for (key in listOf("firebase_analytics_collection_enabled", "google_analytics_adid_collection_enabled",
            "google_analytics_automatic_screen_reporting_enabled", "google_analytics_default_allow_analytics_storage",
            "google_analytics_default_allow_ad_storage", "google_analytics_default_allow_ad_user_data",
            "google_analytics_default_allow_ad_personalization_signals")) assertEquals(key, false, meta.getBoolean(key, true))
        assertEquals(false, BuildConfig.PRODUCT_ANALYTICS_AVAILABLE)
    }
}
