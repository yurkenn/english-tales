package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/** Q5.7: the Kotlin model reproduces the JavaScript reference vectors exactly enough to schedule the same day. */
class FsrsTest {
    private val vectors = File("../backend/tests/fixtures/fsrs-vectors.csv").readLines().drop(1).filter { it.isNotBlank() }.map { it.split(',') }

    @Test fun matchesTheReferenceVectors() {
        assertTrue(vectors.size >= 20)
        vectors.groupBy { it[0] }.values.forEach { steps ->
            var memory: Fsrs.Memory? = null
            steps.forEach { row ->
                memory = Fsrs.review(memory, row[2].toBoolean(), row[3].toDouble())
                val m = memory!!
                assertEquals(row.joinToString(), row[4].toDouble(), m.stability, 1e-9)
                assertEquals(row.joinToString(), row[5].toDouble(), m.difficulty, 1e-9)
                assertEquals(row.joinToString(), row[6].toInt(), Fsrs.intervalDays(m.stability))
            }
        }
    }

    @Test fun successGrowsAndFailureShrinksStability() {
        val first = Fsrs.review(null, true, 0.0)
        val later = Fsrs.review(first, true, Fsrs.intervalDays(first.stability).toDouble())
        assertTrue(later.stability > first.stability)
        val lapse = Fsrs.review(later, false, 20.0)
        assertTrue(lapse.stability < later.stability && lapse.difficulty > later.difficulty)
        assertEquals(0.9, Fsrs.retrievability(later.stability, later.stability), 1e-9)
    }
}
