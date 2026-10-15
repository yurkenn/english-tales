package com.yurken.englishtales.ui

import android.content.Context
import androidx.activity.ComponentActivity
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.Lifecycle
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Rule
import org.junit.Test

class NarratorLifecycleTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()

    private class CountingNarrator(context: Context) : Narrator(context) {
        var stops = 0
        override fun stop() { stops++; super.stop() }
    }

    @Test fun leavingTheForegroundStopsSpeechAndDisposeReleasesTheEngine() {
        var narrator: CountingNarrator? = null
        var shown by mutableStateOf(true)
        rule.setContent { if (shown) rememberNarrator { context -> CountingNarrator(context).also { narrator = it } } }
        rule.waitForIdle()
        val created = checkNotNull(narrator)
        assertEquals(0, created.stops)

        rule.activityRule.scenario.moveToState(Lifecycle.State.CREATED)
        assertEquals(1, created.stops)
        rule.activityRule.scenario.moveToState(Lifecycle.State.RESUMED)
        rule.waitForIdle()
        assertEquals(1, created.stops)

        rule.runOnIdle { shown = false }
        rule.waitForIdle()
        rule.runOnIdle { created.speak("A closed narrator stays silent.") }
        assertFalse(created.speaking || created.preparing)
        // Removed observer: another background transition no longer reaches the closed narrator.
        rule.activityRule.scenario.moveToState(Lifecycle.State.CREATED)
        assertEquals(1, created.stops)
    }
}
