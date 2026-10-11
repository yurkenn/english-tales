package com.yurken.englishtales.data

import org.junit.Assert.*
import org.junit.Test
import java.util.Calendar

class LearningPolicyTest {
    private val now=Calendar.getInstance().apply {set(2026,Calendar.OCTOBER,10,12,0,0);set(Calendar.MILLISECOND,0)}.timeInMillis

    @Test fun streakExpiresAfterMissingADay() {
        assertEquals(0,LearningPolicy.visibleStreak(7,"2026-10-08","2026-10-10","2026-10-09"))
        assertEquals(7,LearningPolicy.visibleStreak(7,"2026-10-09","2026-10-10","2026-10-09"))
    }
    @Test fun repeatedSessionsDoNotIncreaseTodaysStreak() {
        assertEquals(7,LearningPolicy.nextStreak(7,"2026-10-10","2026-10-10","2026-10-09"))
        assertEquals(8,LearningPolicy.nextStreak(7,"2026-10-09","2026-10-10","2026-10-09"))
        assertEquals(1,LearningPolicy.nextStreak(7,"2026-10-08","2026-10-10","2026-10-09"))
    }
    @Test fun yearBoundaryUsesCalendarDays() {
        val january=Calendar.getInstance().apply {set(2027,Calendar.JANUARY,1,0,30,0)}.timeInMillis
        assertEquals("2026-12-31",LearningPolicy.previousDay(january))
    }
    @Test fun correctReviewSchedulesTomorrow() {
        val plan=LearningPolicy.review(0,true,null,0,now)!!
        assertEquals(1,plan.intervalDays);assertEquals("reviewing",plan.state)
        assertEquals(now+LearningPolicy.DAY_MS,plan.dueAt)
    }
    @Test fun earlyAndSameDayReviewsCannotInflateMastery() {
        assertNull(LearningPolicy.review(2,true,null,now+1,now))
        assertNull(LearningPolicy.review(2,true,LearningPolicy.dayKey(now),0,now))
    }
    @Test fun masteryRequiresThreeScheduledSuccesses() {
        var clock=now
        var plan=LearningPolicy.review(0,true,null,0,clock)!!
        assertEquals("reviewing",plan.state)
        clock=plan.dueAt
        plan=LearningPolicy.review(plan.correctCount,true,plan.successfulDay,plan.dueAt,clock)!!
        assertEquals(3,plan.intervalDays);assertEquals("reviewing",plan.state)
        clock=plan.dueAt
        plan=LearningPolicy.review(plan.correctCount,true,plan.successfulDay,plan.dueAt,clock)!!
        assertEquals(7,plan.intervalDays);assertEquals("known",plan.state)
    }
    @Test fun mistakeResetsWordAndSchedulesShortReview() {
        val plan=LearningPolicy.review(6,false,"2026-10-10",now+LearningPolicy.DAY_MS,now)!!
        assertEquals(0,plan.correctCount);assertEquals("learning",plan.state)
        assertEquals(now+600000,plan.dueAt);assertNull(plan.successfulDay)
        assertNull(LearningPolicy.review(0,true,null,plan.dueAt,now+599999))
    }
    @Test fun longTermIntervalIsCapped() {
        assertEquals(30,LearningPolicy.review(99,true,null,0,now)!!.intervalDays)
    }
}
