package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class GameRewardsTest {
    @Test fun starsRewardAccuracy() {
        assertEquals(3, GameRewards.stars(5, 5))
        assertEquals(2, GameRewards.stars(3, 5))
        assertEquals(1, GameRewards.stars(2, 5))
        assertEquals(1, GameRewards.stars(0, 0))
    }

    @Test fun questsFollowTodaysActivity() {
        val quests = GameRewards.quests(sessions = 4, goal = 2, readings = 0, bestCombo = 7)
        assertEquals(listOf("goal", "story", "combo"), quests.map { it.id })
        assertTrue(quests[0].done)
        assertEquals(2, quests[0].progress)
        assertFalse(quests[1].done)
        assertEquals(GameRewards.COMBO_QUEST, quests[2].progress)
    }

    @Test fun aZeroGoalStillNeedsOneStep() {
        val goal = GameRewards.quests(0, 0, 0, 0).first()
        assertEquals(1, goal.target)
        assertFalse(goal.done)
    }

    @Test fun milestonesAreCelebratedOnce() {
        assertEquals(7, GameRewards.milestoneReached(6, 7, 3))
        assertNull(GameRewards.milestoneReached(7, 8, 7))
        assertNull(GameRewards.milestoneReached(6, 7, 7))
        // A sync that jumps the streak past two milestones celebrates only the larger one.
        assertEquals(14, GameRewards.milestoneReached(5, 15, 3))
        assertNull(GameRewards.milestoneReached(1, 2, 0))
    }
}
