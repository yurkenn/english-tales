package com.yurken.englishtales.data

import android.app.Activity
import android.app.Instrumentation
import android.os.Bundle
import android.system.Os
import android.system.OsConstants

/** Framework-only release probe: avoids references to obfuscated app classes or test dependencies. */
class NativeAlignmentInstrumentation : Instrumentation() {
    override fun onCreate(arguments: Bundle?) {
        super.onCreate(arguments)
        start()
    }
    override fun onStart() {
        val result = Bundle()
        try {
            val pageSize = Os.sysconf(OsConstants._SC_PAGESIZE)
            check(pageSize == 16384L) { "Expected 16 KB device" }
            System.loadLibrary("androidx.graphics.path")
            result.putString("stream", "Native path library loaded successfully at $pageSize bytes\n")
            result.putBoolean("nativeLoadPassed", true)
            finish(Activity.RESULT_OK, result)
        } catch (failure: Throwable) {
            result.putString("stream", "Native probe failed: ${failure.javaClass.simpleName}\n")
            result.putBoolean("nativeLoadPassed", false)
            finish(Activity.RESULT_CANCELED, result)
        }
    }
}
