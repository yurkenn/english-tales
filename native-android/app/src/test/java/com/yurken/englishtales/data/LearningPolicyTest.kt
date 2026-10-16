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
    @Test fun firstCorrectReviewFollowsFsrs() {
        val plan=LearningPolicy.review(0,true,null,0,now)!!
        val first=Fsrs.review(null,true,0.0)
        assertEquals(Fsrs.intervalDays(first.stability),plan.intervalDays);assertEquals("reviewing",plan.state)
        assertEquals(now+plan.intervalDays*LearningPolicy.DAY_MS,plan.dueAt);assertEquals(first,plan.memory);assertEquals(now,plan.reviewedAt)
    }
    @Test fun earlyAndSameDayReviewsCannotInflateMastery() {
        assertNull(LearningPolicy.review(2,true,null,now+1,now))
        assertNull(LearningPolicy.review(2,true,LearningPolicy.dayKey(now),0,now))
    }
    @Test fun knownOnceFsrsExpectsThreeWeeksOfRecall() {
        var clock=now
        var plan=LearningPolicy.review(0,true,null,0,clock)!!
        val states=mutableListOf(plan.state)
        repeat(3) {
            clock=plan.dueAt
            plan=LearningPolicy.review(plan.correctCount,true,plan.successfulDay,plan.dueAt,clock,plan.memory,plan.reviewedAt)!!
            states+=plan.state
        }
        // Intervals grow with each on-time success (3, 11, 35 days with the default weights).
        assertEquals(listOf("reviewing","reviewing","known","known"),states)
        assertTrue(plan.intervalDays>30)
    }
    @Test fun mistakeResetsWordAndSchedulesShortReview() {
        val memory=Fsrs.Memory(20.0,5.0)
        val plan=LearningPolicy.review(6,false,"2026-10-10",now+LearningPolicy.DAY_MS,now,memory,now-10*LearningPolicy.DAY_MS)!!
        assertEquals(0,plan.correctCount);assertEquals("learning",plan.state)
        assertEquals(now+600000,plan.dueAt);assertNull(plan.successfulDay)
        assertTrue(plan.memory!!.stability<memory.stability)
        assertNull(LearningPolicy.review(0,true,null,plan.dueAt,now+599999))
    }
}
