package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.random.Random

/** Q5.9: short story sentences become five shuffled ordering questions that are judged by their text. */
class SentenceOrderTest {
    private fun story(level: String, vararg sentences: String) = Story("s-$level", "Title $level", "", level, "Macera", "", "c",
        sentences.mapIndexed { i, text -> StorySentence("$level-$i", text, "çeviri $i") })

    @Test fun onlyShortCompleteSentencesAreCandidates() {
        val candidates = SentenceOrder.candidates(listOf(story("A1",
            "The cat sat on the mat.",
            "Go home.",
            "She said, \"Come here now please.\"",
            "One two three four five six seven eight nine ten eleven.",
            "The the the the.")))
        assertEquals(listOf("The cat sat on the mat."), candidates.map { it.sentence })
        assertEquals(listOf("The", "cat", "sat", "on", "the", "mat."), candidates.single().tiles)
    }

    @Test fun sessionPrefersTheLevelAndNeverStartsSolved() {
        val stories = listOf(story("A1", *Array(6) { "The small cat number $it sat down." }), story("B1", *Array(6) { "A tall dog called $it ran away fast." }))
        repeat(20) { seed ->
            val session = SentenceOrder.session(SentenceOrder.candidates(stories), "B1", Random(seed))
            assertEquals(5, session.size)
            assertTrue(session.all { it.level == "B1" })
            session.forEach { q ->
                assertNotEquals(q.sentence, q.tiles.joinToString(" "))
                assertEquals(SentenceOrder.words(q.sentence).sorted(), q.tiles.sorted())
            }
        }
    }

    @Test fun repeatedWordsAreInterchangeable() {
        val q = OrderQuestion("The cat saw the dog.", "", "", "A1", "x", listOf("the", "dog.", "The", "cat", "saw"))
        assertTrue(q.isCorrect(listOf(2, 3, 4, 0, 1)))
        assertFalse(q.isCorrect(listOf(0, 3, 4, 2, 1)))
        assertFalse(q.isCorrect(listOf(2, 3, 4, 0)))
    }
}
