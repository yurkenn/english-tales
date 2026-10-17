package com.yurken.englishtales.ui

import android.os.Bundle
import org.junit.Assert.*
import org.junit.Test

/** Q6: a shared link that waits for onboarding survives the activity being recreated. */
class StoryLinkRequestStateTest {
    @Test fun pendingLinkRoundTripsThroughSavedState() {
        val state = Bundle()
        StoryLinkRequest("quiet-morning", 42L).save(state)
        assertEquals(StoryLinkRequest("quiet-morning", 42L), StoryLinkRequest.restore(state))
    }

    @Test fun noPendingLinkRestoresNothing() {
        assertNull(StoryLinkRequest.restore(Bundle()))
        assertNull(StoryLinkRequest.restore(null))
    }

    @Test fun tamperedStateIsIgnored() {
        val state = Bundle().apply { putString("story_link_id", "../privacy") }
        assertNull(StoryLinkRequest.restore(state))
    }
}
