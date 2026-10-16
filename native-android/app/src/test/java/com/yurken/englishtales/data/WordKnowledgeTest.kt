package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Test

/** Q5.5: practice state wins; otherwise a looked-up word is not known, and reading twice without help is. */
class WordKnowledgeTest {
    @Test fun stagesFollowPracticeThenLookupsThenReading() {
        val stages = WordKnowledge.stages(
            reads = mapOf("cat" to 2, "dog" to 1, "lion" to 3, "fox" to 5, "owl" to 2),
            lookups = setOf("lion", "owl"),
            saved = mapOf("fox" to "learning", "owl" to "known", "bee" to "reviewing"))
        assertEquals(WordStage.KNOWN, stages["cat"])      // two stories, never looked up
        assertEquals(WordStage.SEEN, stages["dog"])       // one story only
        assertEquals(WordStage.LOOKED_UP, stages["lion"]) // looked up, not saved: not counted as known
        assertEquals(WordStage.SAVED, stages["fox"])      // saved wins over reading
        assertEquals(WordStage.KNOWN, stages["owl"])      // practice reached known
        assertEquals(WordStage.REVIEWING, stages["bee"])  // saved without being read
        assertEquals(6, stages.size)
    }
}
