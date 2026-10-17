package com.yurken.englishtales.ui

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent

/** Some OEM, Go and work-profile builds lack a settings or share screen; a missing one must not crash the app. */
internal object SafeIntents {
    /** Starts the first of [intents] the device can open; false when none could. */
    fun startFirst(context: Context, vararg intents: Intent): Boolean {
        for (intent in intents) {
            try {
                context.startActivity(intent)
                return true
            } catch (_: ActivityNotFoundException) {
            } catch (_: SecurityException) {
            }
        }
        return false
    }
}
