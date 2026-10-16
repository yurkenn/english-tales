package com.yurken.englishtales.widget

import androidx.glance.appwidget.testing.unit.runGlanceAppWidgetUnitTest
import androidx.glance.testing.unit.hasText
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Test

class LearningWidgetContentTest {
    @Test fun showsStreakGoalAndDueWords() = runGlanceAppWidgetUnitTest {
        setContext(InstrumentationRegistry.getInstrumentation().targetContext)
        provideComposable {WidgetContent(WidgetSummary(4,1,2,false,3))}
        onNode(hasText("Seri: 4")).assertExists()
        onNode(hasText("Bugünkü hedef: 1/2")).assertExists()
        onNode(hasText("Tekrar bekleyen kelime: 3")).assertExists()
    }

    @Test fun reachedGoalAndNoDueWordsStayQuiet() = runGlanceAppWidgetUnitTest {
        setContext(InstrumentationRegistry.getInstrumentation().targetContext)
        provideComposable {WidgetContent(WidgetSummary(1,2,2,true,0))}
        onNode(hasText("Bugünkü hedef tamam ✓")).assertExists()
        onNode(hasText("Tekrar bekleyen kelime: 0")).assertDoesNotExist()
    }

    @Test fun unreadableStoreShowsAnInvitation() = runGlanceAppWidgetUnitTest {
        setContext(InstrumentationRegistry.getInstrumentation().targetContext)
        provideComposable {WidgetContent(null)}
        onNode(hasText("Bugünkü hikâyen seni bekliyor.")).assertExists()
    }
}
