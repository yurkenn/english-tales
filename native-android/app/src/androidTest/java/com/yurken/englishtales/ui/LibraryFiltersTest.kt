package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class LibraryFiltersTest {
    @get:Rule val compose=createComposeRule()
    private fun chip(label: String): SemanticsNodeInteraction {
        val target=hasText(label) and isSelectable()
        // LazyRow does not compose off-screen chips on narrower CI devices.
        val rows=compose.onAllNodes(hasScrollToIndexAction() and
            SemanticsMatcher.keyIsDefined(SemanticsProperties.HorizontalScrollAxisRange))
        // Level, status and length chips each have their own row; use the one that holds the chip.
        val found=(0 until rows.fetchSemanticsNodes().size).any {runCatching {rows[it].performScrollToNode(target)}.isSuccess}
        check(found) {"No filter row contains $label"}
        return compose.onNode(target)
    }
    private fun title(text: String)=compose.onAllNodesWithText(text).onFirst()

    @Test fun levelAndStatusFiltersCombineClearAndResetWhenLeavingTheList() {
        LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext)
        val snapshot=LearningSnapshot(storyProgress=mapOf("classic-tortoise-hare" to 40,"classic-snow-queen" to 100))
        var opened=""
        compose.setContent {EnglishTalesTheme {CatalogScreen(snapshot,{opened=it},PaddingValues())}}
        compose.onNodeWithText("Kategoriler").performScrollTo().performClick()

        chip("A1").performClick()
        chip("Devam eden").performClick()
        title("The Tortoise and the Hare").assertIsDisplayed().performClick()
        assertEquals("classic-tortoise-hare",opened)
        compose.onNodeWithText("The Snow Queen").assertDoesNotExist()

        chip("B1").performClick()
        compose.onNodeWithText("Bu filtrelere uyan kitap yok.").assertIsDisplayed()
        chip("Bitti").performClick()
        title("The Snow Queen").assertIsDisplayed()

        compose.onNodeWithText("Filtreleri temizle").performClick()
        compose.onNodeWithText("Filtreleri temizle").assertDoesNotExist()
        chip("Tüm seviyeler").assertIsSelected()

        chip("Bitti").performClick()
        compose.onNodeWithContentDescription("Geri",useUnmergedTree=true).performClick()
        compose.onNodeWithText("Kategoriler").performScrollTo().performClick()
        chip("Tümü").assertIsSelected()
    }
    @Test fun tagCategoriesListOnlyTheirStories() {
        LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext)
        compose.setContent {EnglishTalesTheme {CatalogScreen(LearningSnapshot(),{},PaddingValues())}}
        // Tag categories (Q4.5) replace the fixed genre list; genres stay as tags.
        for(category in listOf("Masal","Fabl")) compose.onNodeWithText(category).performScrollTo().assertIsDisplayed()
        compose.onNodeWithText("Fabl").performScrollTo().performClick()
        title("The Tortoise and the Hare").assertIsDisplayed()
        compose.onNodeWithText("The Snow Queen").assertDoesNotExist()
    }
}
