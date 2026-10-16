package com.yurken.englishtales.data

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

data class ReviewPlan(val correctCount: Int, val state: String, val intervalDays: Int, val dueAt: Long, val successfulDay: String?,
    val memory: Fsrs.Memory? = null, val reviewedAt: Long? = null)
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
    /** A word counts as known once FSRS expects it to be remembered for three weeks (Q5.7). */
    const val KNOWN_STABILITY_DAYS = 21.0

    /**
     * Q5.7: FSRS-5 sets the interval ([Fsrs]); the server replays the same rules in SQL. A wrong answer comes
     * back after ten minutes, and replaying a card today or reviewing early still changes nothing.
     */
    fun review(count: Int, correct: Boolean, successfulDay: String?, dueAt: Long, now: Long,
        memory: Fsrs.Memory? = null, lastReviewedAt: Long? = null): ReviewPlan? {
        val today=dayKey(now)
        val elapsed=lastReviewedAt?.let {(now-it).toDouble()/DAY_MS} ?: 0.0
        if(!correct) return ReviewPlan(0,"learning",0,now+10*60_000L,null,Fsrs.review(memory,false,elapsed),now)
        if(successfulDay==today || dueAt>now) return null
        val next=Fsrs.review(memory,true,elapsed)
        val days=Fsrs.intervalDays(next.stability)
        return ReviewPlan((count+1).coerceAtMost(100),if(next.stability>=KNOWN_STABILITY_DAYS) "known" else "reviewing",days,now+days*DAY_MS,today,next,now)
    }
}
