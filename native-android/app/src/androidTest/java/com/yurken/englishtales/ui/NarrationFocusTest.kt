package com.yurken.englishtales.ui

import android.content.Context
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Test

class NarrationFocusTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()

    private class FakeFocus : NarrationFocus {
        override var onLoss: () -> Unit = {}
        var abandons = 0
        override fun request() = true
        override fun abandon() { abandons++ }
    }

    private class CountingNarrator(context: Context, focus: NarrationFocus) : Narrator(context, focus) {
        var stops = 0
        override fun stop() { stops++; super.stop() }
    }

    @Test fun losingAudioFocusStopsNarrationAndEveryExitReleasesFocus() {
        val focus = FakeFocus()
        lateinit var narrator: CountingNarrator
        instrumentation.runOnMainSync { narrator = CountingNarrator(instrumentation.targetContext, focus) }

        focus.onLoss()
        instrumentation.waitForIdleSync()
        assertEquals(1, narrator.stops)
        assertEquals(1, focus.abandons)

        instrumentation.runOnMainSync { narrator.close() }
        assertEquals(2, focus.abandons)
        // A loss after close must not touch the released narrator.
        focus.onLoss()
        instrumentation.waitForIdleSync()
        assertEquals(1, narrator.stops)
    }
}
