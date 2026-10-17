package com.yurken.englishtales.data

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ContentRefreshPolicyTest {
    private val interval = ContentRefreshPolicy.MIN_INTERVAL_MILLIS

    @Test fun neverRefreshedOrFailedIsStale() {
        assertTrue(ContentRefreshPolicy.isStale(null, 1_000L))
    }

    @Test fun returningSoonAfterARefreshSkipsTheNetwork() {
        assertFalse(ContentRefreshPolicy.isStale(10_000L, 10_000L + interval - 1))
        assertTrue(ContentRefreshPolicy.isStale(10_000L, 10_000L + interval))
    }

    @Test fun aClockThatWentBackwardsRefreshes() {
        assertTrue(ContentRefreshPolicy.isStale(50_000L, 10_000L))
    }
}
