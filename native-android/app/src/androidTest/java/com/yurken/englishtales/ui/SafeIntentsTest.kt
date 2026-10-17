package com.yurken.englishtales.ui

import android.content.ActivityNotFoundException
import android.content.ContextWrapper
import android.content.Intent
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test

/** A device without a settings or share screen must not crash the app. */
class SafeIntentsTest {
    private class Recorder(private val missing: Set<String>) : ContextWrapper(InstrumentationRegistry.getInstrumentation().targetContext) {
        val started = mutableListOf<String?>()
        override fun startActivity(intent: Intent) {
            if (intent.action in missing) throw ActivityNotFoundException(intent.action)
            started += intent.action
        }
    }

    @Test fun missingScreenFallsBackToTheNextOne() {
        val context = Recorder(setOf("first"))
        assertTrue(SafeIntents.startFirst(context, Intent("first"), Intent("second"), Intent("third")))
        assertEquals(listOf<String?>("second"), context.started)
    }

    @Test fun noScreenAtAllReturnsFalseWithoutThrowing() {
        val context = Recorder(setOf("first", "second"))
        assertFalse(SafeIntents.startFirst(context, Intent("first"), Intent("second")))
        assertTrue(context.started.isEmpty())
    }
}
