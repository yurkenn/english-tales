package com.yurken.englishtales.widget

import com.yurken.englishtales.data.LearningSnapshot
import org.junit.Assert.assertEquals
import org.junit.Test

class LearningWidgetTest {
    @Test fun summaryComesFromTheLearningSnapshot() {
        val summary=WidgetSummary.from(LearningSnapshot(streak=4,dailyGoal=2,todaySessions=1,dueWordIds=listOf("a","b","c")))
        assertEquals(WidgetSummary(4,1,2,false,3),summary)
    }
}
