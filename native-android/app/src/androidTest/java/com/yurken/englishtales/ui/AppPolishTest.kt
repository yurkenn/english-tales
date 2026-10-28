package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/** Library header captions, downloads entry, today's line, empty-screen actions and the app theme choice. */
class AppPolishTest {
    @get:Rule val compose=createComposeRule()
    private val context get()=InstrumentationRegistry.getInstrumentation().targetContext

    @Before fun content() { LearningContent.initialize(context) }
    @After fun resetTheme() { AppTheme.select(context,AppThemeMode.SYSTEM) }

    @Test fun libraryHeaderNamesEachNumberAndOffersDownloads() {
        var downloads=0
        compose.setContent {EnglishTalesTheme {CatalogScreen(LearningSnapshot(streak=2,points=40),{},PaddingValues(),LibraryActions(false,{}) {downloads++})}}
        // The playful header shows level, streak and points as pills, each with its caption.
        for(caption in listOf("Seviye","Seri","Puan")) compose.onNodeWithText(caption).assertIsDisplayed()
        compose.onNodeWithText("İndirilenler").performScrollTo().performClick()
        assertEquals(1,downloads)
    }

    @Test fun weekSaysWhatTodayStillNeeds() {
        val week=List(7) {DailyActivity("d$it","G$it",0)}
        compose.setContent {EnglishTalesTheme {WeeklyActivity(LearningSnapshot(weeklyActivity=week,dailyGoal=2))}}
        compose.onNodeWithText("Bugün henüz çalışmadın",substring=true).assertIsDisplayed()
    }

    @Test fun weekShowsReachedGoalAndStreak() {
        val week=List(7) {DailyActivity("d$it","G$it",if(it>=5) 1 else 0)}
        compose.setContent {EnglishTalesTheme {WeeklyActivity(LearningSnapshot(weeklyActivity=week,dailyGoal=1,todaySessions=1,streak=2))}}
        compose.onNodeWithText("Bugünkü hedefini tamamladın.").assertIsDisplayed()
        compose.onNodeWithText("2 · Seri").assertIsDisplayed()
    }

    @Test fun emptyWordListLeadsToStories() {
        var browsed=false
        compose.setContent {EnglishTalesTheme {SavedWordsScreen(LearningSnapshot(),{},{},onBrowse={browsed=true})}}
        compose.onNodeWithText("Hikâyelere göz at").performClick()
        assertTrue(browsed)
    }

    @Test fun emptySearchOffersToClearIt() {
        compose.setContent {EnglishTalesTheme {CatalogScreen(LearningSnapshot(),{},PaddingValues())}}
        compose.onNodeWithText("Arama").performClick()
        compose.onNode(hasSetTextAction()).performTextInput("zzqx")
        compose.onNodeWithText("Aramayı temizle").performClick()
        compose.onNodeWithText("Aramayı temizle").assertDoesNotExist()
    }

    @Test fun themeChoiceOverridesTheSystemAndIsKept() {
        val colors=mutableStateOf<TaleColors?>(null)
        compose.setContent {EnglishTalesTheme {colors.value=LocalTaleColors.current; ThemeControls()}}
        compose.onNodeWithText("Koyu").performClick()
        compose.waitForIdle()
        assertEquals(DarkTaleColors,colors.value)
        compose.onNodeWithText("Açık").performClick()
        compose.waitForIdle()
        assertEquals(LightTaleColors,colors.value)
        assertEquals(AppThemeMode.LIGHT,AppTheme.load(context))
    }
}
