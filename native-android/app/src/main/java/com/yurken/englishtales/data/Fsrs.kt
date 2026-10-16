package com.yurken.englishtales.data

import kotlin.math.exp
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt

/**
 * Q5.7: FSRS-5 memory model (stability in days, difficulty 1..10) with the published default weights.
 * Answers are binary: correct is grade 3 (Good), wrong is grade 1 (Again). This mirrors
 * `backend/tools/fsrs.mjs`; `backend/tests/fixtures/fsrs-vectors.csv` pins both to the same numbers.
 * Not wired into scheduling yet: the server replays reviews in SQL and must switch at the same time.
 */
object Fsrs {
    data class Memory(val stability: Double, val difficulty: Double)

    private val w = doubleArrayOf(0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192,
        1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621)
    private const val DECAY = -0.5
    private const val FACTOR = 19.0 / 81.0

    private fun clampD(d: Double) = min(10.0, max(1.0, d))
    private fun initD(grade: Int) = clampD(w[4] - exp(w[5] * (grade - 1)) + 1)
    fun retrievability(elapsedDays: Double, stability: Double) = (1 + FACTOR * elapsedDays / stability).pow(DECAY)
    private fun nextD(d: Double, grade: Int) = clampD(w[7] * initD(4) + (1 - w[7]) * (d - w[6] * (grade - 3) * (10 - d) / 9))
    private fun recallS(d: Double, s: Double, r: Double) = s * (exp(w[8]) * (11 - d) * s.pow(-w[9]) * (exp(w[10] * (1 - r)) - 1) + 1)
    private fun forgetS(d: Double, s: Double, r: Double) = min(w[11] * d.pow(-w[12]) * ((s + 1).pow(w[13]) - 1) * exp(w[14] * (1 - r)), s)

    /** Whole days until recall falls to 90% (for FSRS-5 that is the stability), 1..36500. */
    fun intervalDays(stability: Double) = min(36500, max(1, stability.roundToInt()))

    /** [memory] is null for a word never reviewed; [elapsedDays] counts since the last review. */
    fun review(memory: Memory?, correct: Boolean, elapsedDays: Double): Memory {
        val grade = if (correct) 3 else 1
        if (memory == null) return Memory(w[grade - 1], initD(grade))
        val d = nextD(memory.difficulty, grade)
        if (elapsedDays < 1) return Memory(memory.stability * exp(w[17] * (grade - 3 + w[18])), d)
        val r = retrievability(elapsedDays, memory.stability)
        return Memory(if (correct) recallS(memory.difficulty, memory.stability, r) else forgetS(memory.difficulty, memory.stability, r), d)
    }
}
