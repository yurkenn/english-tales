package com.yurken.englishtales.data

import org.junit.Assert.*
import org.junit.Test

class ReadingPlacementTest {
    private val correct = ReadingPlacement.questions.map { it.correctOption }

    @Test fun unknownAnswersStartAtA1() {
        val result = ReadingPlacement.recommend(List(9) { -1 })
        assertEquals("A1", result.level)
        assertEquals(mapOf("A1" to 0, "A2" to 0, "B1" to 0), result.correctByLevel)
    }

    @Test fun eachHigherLevelRequiresTheEarlierFoundations() {
        for (a1 in 0..3) for (a2 in 0..3) for (b1 in 0..3) {
            val counts = listOf(a1, a2, b1)
            val answers = correct.mapIndexed { index, answer -> if (index % 3 < counts[index / 3]) answer else -1 }
            val expected = if (a1 < 2 || a2 < 2) "A1" else if (b1 < 2) "A2" else "B1"
            assertEquals("scores=$counts", expected, ReadingPlacement.recommend(answers).level)
        }
    }

    @Test fun incorrectAnswersAreNotCountedAsCorrect() {
        val answers = correct.map { (it + 1) % 3 }
        assertEquals(mapOf("A1" to 0, "A2" to 0, "B1" to 0), ReadingPlacement.recommend(answers).correctByLevel)
        assertEquals("B1", ReadingPlacement.recommend(correct).level)
    }

    @Test fun partialOrMalformedAttemptsNeverReceiveARecommendation() {
        for (answers in listOf(emptyList(), correct.dropLast(1), correct + 0, correct.toMutableList().apply { this[2] = 3 }, correct.toMutableList().apply { this[0] = -2 })) {
            assertThrows(IllegalArgumentException::class.java) { ReadingPlacement.recommend(answers) }
        }
    }

    @Test fun questionBankHasThreeUnambiguousChoicesAndThreeItemsPerBand() {
        val questions = ReadingPlacement.questions
        assertEquals(9, questions.map { it.id }.distinct().size)
        for (level in ReadingPlacement.levels) assertEquals(3, questions.count { it.level == level })
        for (question in questions) {
            assertTrue(question.passage.isNotBlank())
            assertEquals(3, question.options.distinct().size)
            assertTrue(question.options.all { it.isNotBlank() })
            assertTrue(question.correctOption in question.options.indices)
        }
    }
}
