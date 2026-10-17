package com.yurken.englishtales.widget

import android.content.Context
import android.content.res.Configuration
import android.os.LocaleList
import androidx.glance.appwidget.testing.unit.runGlanceAppWidgetUnitTest
import androidx.glance.testing.unit.hasText
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Test

class LearningWidgetContentTest {
    // Other device tests change resource configuration; each widget case declares its own locale.
    private fun context(language: String): Context {
        val target=InstrumentationRegistry.getInstrumentation().targetContext
        return target.createConfigurationContext(Configuration(target.resources.configuration).apply {
            setLocales(LocaleList.forLanguageTags(language))
        })
    }

    @Test fun showsStreakGoalAndDueWords() = runGlanceAppWidgetUnitTest {
        setContext(context("tr"))
        provideComposable {WidgetContent(WidgetSummary(4,1,2,false,3))}
        onNode(hasText("Seri: 4")).assertExists()
        onNode(hasText("Bugünkü hedef: 1/2")).assertExists()
        onNode(hasText("Tekrar bekleyen kelime: 3")).assertExists()
    }

    @Test fun reachedGoalAndNoDueWordsStayQuiet() = runGlanceAppWidgetUnitTest {
        setContext(context("tr"))
        provideComposable {WidgetContent(WidgetSummary(1,2,2,true,0))}
        onNode(hasText("Bugünkü hedef tamam ✓")).assertExists()
        onNode(hasText("Tekrar bekleyen kelime: 0")).assertDoesNotExist()
    }

    @Test fun englishWidgetShowsTranslatedProgressAndAction() = runGlanceAppWidgetUnitTest {
        setContext(context("en"))
        provideComposable {WidgetContent(WidgetSummary(4,1,2,false,3))}
        onNode(hasText("Streak: 4")).assertExists()
        onNode(hasText("Today's goal: 1/2")).assertExists()
        onNode(hasText("Words to review: 3")).assertExists()
        onNode(hasText("Open daily plan")).assertExists()
        onNode(hasText("Seri: 4")).assertDoesNotExist()
    }

    @Test fun unreadableStoreShowsAnInvitation() = runGlanceAppWidgetUnitTest {
        setContext(context("tr"))
        provideComposable {WidgetContent(null)}
        onNode(hasText("Bugünkü hikâyen seni bekliyor.")).assertExists()
    }
}
