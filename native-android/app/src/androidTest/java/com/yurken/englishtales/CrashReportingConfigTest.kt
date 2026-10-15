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
    }
}
