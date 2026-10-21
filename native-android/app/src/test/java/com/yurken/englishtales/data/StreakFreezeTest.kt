package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.LocalDate

class StreakFreezeTest {
    private val today = LocalDate.parse("2026-10-21")
    private fun days(vararg offsets: Int) = offsets.map { today.minusDays(it.toLong()).toString() }.toSet()
    private fun run(from: Int, to: Int) = (to..from).map { today.minusDays(it.toLong()).toString() }.toSet()
    private fun compute(days: Set<String>) = StreakFreeze.compute(days, today.toString())

    @Test fun plainStreakWithoutFreezes() {
        assertEquals(StreakFreeze.Result(3, 0, emptySet()), compute(days(0, 1, 2)))
        // Not studied yet today: yesterday's streak still shows.
        assertEquals(2, compute(days(1, 2)).streak)
    }

    @Test fun aMissedDayWithoutAFreezeEndsTheStreak() {
        assertEquals(0, compute(days(2, 3, 4)).streak)
        assertEquals(1, compute(days(0, 2, 3)).streak)
    }

    @Test fun sevenStudiedDaysEarnAFreezeThatBridgesOneMissedDay() {
        val result = compute(run(9, 3) + days(1))
        assertEquals(8, result.streak)
        assertEquals(0, result.freezes)
        assertEquals(setOf(today.minusDays(2).toString()), result.frozenDays)
    }

    @Test fun freezesAreCappedAndSpentOneDayEach() {
        val built = compute(run(28, 1))
        assertEquals(StreakFreeze.MAX_FREEZES, built.freezes)
        // Two missed days use both freezes; the third ends the streak.
        assertEquals(28, compute(run(30, 3)).streak)
        assertEquals(0, compute(run(31, 4)).streak)
    }

    @Test fun anUnusedFreezeWaitsForTomorrow() {
        val result = compute(run(7, 1))
        assertEquals(7, result.streak)
        assertEquals(1, result.freezes)
    }
}
