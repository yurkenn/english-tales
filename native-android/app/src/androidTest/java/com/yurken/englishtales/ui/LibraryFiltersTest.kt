package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class LibraryFiltersTest {
    @get:Rule val compose=createComposeRule()
    private fun chip(label: String)=compose.onNode(hasText(label) and isSelectable())
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
}
