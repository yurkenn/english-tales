package com.yurken.englishtales.data

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

data class ReviewPlan(val correctCount: Int, val state: String, val intervalDays: Int, val dueAt: Long, val successfulDay: String?)
data class DailyActivity(val day: String, val label: String, val sessions: Int)

/** Clock-independent decisions, shared by storage and the daily plan. */
object LearningPolicy {
    const val DAY_MS = 86_400_000L
    fun dayKey(now: Long) = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(now))
    fun previousDay(now: Long): String = dayKey(Calendar.getInstance().apply { timeInMillis=now; add(Calendar.DAY_OF_YEAR,-1) }.timeInMillis)
    fun visibleStreak(streak: Int, lastDay: String?, today: String, yesterday: String) = if(lastDay==today || lastDay==yesterday) streak else 0
    fun nextStreak(streak: Int, lastDay: String?, today: String, yesterday: String) = when(lastDay) {
        today -> streak.coerceAtLeast(1)
        yesterday -> streak+1
        else -> 1
    }
    fun review(count: Int, correct: Boolean, successfulDay: String?, dueAt: Long, now: Long): ReviewPlan? {
        val today=dayKey(now)
        if(!correct) return ReviewPlan(0,"learning",0,now+10*60_000L,null)
        // Replaying a card today, or reviewing early, must not inflate mastery.
        if(successfulDay==today || dueAt>now) return null
        val next=(count+1).coerceAtMost(100)
        val interval=listOf(1,3,7,14,30)[(next-1).coerceIn(0,4)]
        return ReviewPlan(next,if(next>=3) "known" else "reviewing",interval,now+interval*DAY_MS,today)
    }
}
