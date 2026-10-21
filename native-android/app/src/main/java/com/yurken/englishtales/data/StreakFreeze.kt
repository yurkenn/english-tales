package com.yurken.englishtales.data

import java.time.LocalDate

/**
 * Streak protection, derived only from the days with a counted session, so every device and the account agree
 * without any stored counter. Each [EARN_EVERY] studied days in a streak earn one freeze (at most [MAX_FREEZES]);
 * a day without study then uses one automatically and the streak survives. Frozen days keep the streak alive but do
 * not add to it, and a missed day with no freeze left ends it.
 */
object StreakFreeze {
    const val EARN_EVERY = 7
    const val MAX_FREEZES = 2

    data class Result(val streak: Int, val freezes: Int, val frozenDays: Set<String>)

    fun compute(studiedDays: Set<String>, today: String): Result {
        val days = studiedDays.mapNotNull { runCatching { LocalDate.parse(it) }.getOrNull() }.toSortedSet()
        val end = LocalDate.parse(today)
        if (days.isEmpty() || days.first() > end) return Result(0, 0, emptySet())
        var streak = 0; var freezes = 0; var earned = 0
        val frozen = mutableSetOf<String>()
        var day = days.first()
        while (day <= end) {
            when {
                day in days -> {
                    streak++; earned++
                    if (earned == EARN_EVERY) { freezes = (freezes + 1).coerceAtMost(MAX_FREEZES); earned = 0 }
                }
                // Today is not over yet: a learner who has not studied so far still keeps the streak.
                day == end -> Unit
                streak > 0 && freezes > 0 -> { freezes--; frozen += day.toString() }
                else -> { streak = 0; earned = 0; frozen.clear() }
            }
            day = day.plusDays(1)
        }
        return Result(streak, freezes, frozen)
    }
}
