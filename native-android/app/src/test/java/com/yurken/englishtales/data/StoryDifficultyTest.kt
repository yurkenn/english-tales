package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/** Q5.6: coverage counts running words; new words count distinct forms the learner does not know. */
class StoryDifficultyTest {
    @Test fun coverageAndNewWords() {
        val running = listOf("the", "cat", "see", "the", "dog", "the")
        val stages = mapOf("the" to WordStage.KNOWN, "cat" to WordStage.KNOWN, "dog" to WordStage.REVIEWING)
        assertEquals(StoryDifficulty.Estimate(newWords = 2, coveragePercent = 66), StoryDifficulty.estimate(running, stages))
        assertEquals(StoryDifficulty.Estimate(4, 0), StoryDifficulty.estimate(running, emptyMap()))
        assertNull(StoryDifficulty.estimate(emptyList(), stages))
    }
}
