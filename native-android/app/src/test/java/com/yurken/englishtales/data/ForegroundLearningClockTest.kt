package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Test

class ForegroundLearningClockTest {
    @Test fun backgroundAndRepeatedResumeDoNotInflateActiveTime() {
        var elapsed=0L;val clock=ForegroundLearningClock(1000) {elapsed}
        clock.resume();elapsed=10_000;clock.resume();assertEquals(11_000,clock.pause())
        elapsed=100_000;assertEquals(11_000,clock.totalMillis())
        clock.resume();elapsed=105_000;assertEquals(16_000,clock.pause());assertEquals(16_000,clock.pause())
    }
    @Test fun checkpointRestoreCountsOnlyNewForegroundTime() {
        var elapsed=50_000L;val clock=ForegroundLearningClock(12_000) {elapsed}
        clock.resume();elapsed+=3000;assertEquals(15_000,clock.totalMillis())
    }
    @Test fun bundledRevisionMatchesTheBackendExport() {
        assertEquals("75d7940d-c902-5901-a9f1-7a59ec9eda21",ContentRevisionIds.bundled("quiet-morning"))
    }
}
