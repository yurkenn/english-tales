package com.yurken.englishtales.data

import android.system.Os
import android.system.OsConstants
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Test

/** Forces the native binary to load even when newer Android uses platform Path APIs. */
class NativePageSizeTest {
    @Test fun nativePathLibraryLoadsAtRequiredPageSize() {
        val required = InstrumentationRegistry.getArguments().getString("requiredPageSize")?.toLong()
        if (required != null) assertEquals(required, Os.sysconf(OsConstants._SC_PAGESIZE))
        System.loadLibrary("androidx.graphics.path")
    }
}
