package com.yurken.englishtales.ui

import org.junit.Assert.assertEquals
import org.junit.Test

/** Downloaded covers (up to 4096 px) are decoded near their on-screen size, never below it. */
class CoverSampleSizeTest {
    @Test fun largeCoverIsSubsampledToStayAboveTheSlot() {
        assertEquals(8,sampleSizeFor(4096,4096,400,400))
        assertEquals(16,sampleSizeFor(4096,4096,150,210))
    }

    @Test fun coverNoLargerThanTheSlotIsNotSubsampled() {
        assertEquals(1,sampleSizeFor(300,420,400,560))
        assertEquals(1,sampleSizeFor(400,560,400,560))
        assertEquals(1,sampleSizeFor(799,799,400,400))
        assertEquals(2,sampleSizeFor(800,800,400,400))
    }

    @Test fun fitScalingOnlyNeedsOneSideCovered() {
        // A wide image in a square slot is limited by its width, so the short side may fall below the slot.
        assertEquals(8,sampleSizeFor(4096,1024,400,400))
    }

    @Test fun invalidSizesFallBackToFullDecode() {
        assertEquals(1,sampleSizeFor(0,4096,400,400))
        assertEquals(1,sampleSizeFor(4096,4096,0,0))
    }
}
