package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.yurken.englishtales.data.ListeningQuestion
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ListeningGameTest {
    @get:Rule val compose=createComposeRule()
    private val questions=listOf(
        ListeningQuestion("quiet","quiet","sessiz",listOf("ekmek","sessiz","nehir","köprü")),
        ListeningQuestion("river","river","nehir",listOf("nehir","sessiz","ekmek","köprü")))

    @Test fun theWordStaysHiddenUntilCheckedAndAnswersAreReported() {
        val answers=mutableListOf<Pair<String,Boolean>>(); var completed=-1
        compose.setContent {EnglishTalesTheme {ListeningGame(questions,1,PaddingValues(),{id,ok -> answers+=id to ok},{completed=it},{})}}
        compose.onNodeWithText("Kelime 1 / 2").assertIsDisplayed()
        compose.onNodeWithText("quiet",substring=true).assertDoesNotExist()
        compose.onNodeWithText("Kontrol et").assertIsNotEnabled()
        compose.onNode(hasText("sessiz") and isSelectable()).performClick()
        compose.onNodeWithText("Kontrol et").performClick()
        compose.onNodeWithText("Doğru! Duyduğun kelime: quiet").assertIsDisplayed()
        compose.onNodeWithText("Sonraki kelime").performClick()

        compose.onNodeWithText("Kelime 2 / 2").assertIsDisplayed()
        compose.onNode(hasText("köprü") and isSelectable()).performClick()
        compose.onNodeWithText("Kontrol et").performClick()
        compose.onNodeWithText("Duyduğun kelime: river (nehir)").assertIsDisplayed()
        compose.onNodeWithText("Sonucu gör").performClick()
        assertEquals(listOf("quiet" to true,"river" to false),answers)
        assertEquals(1,completed)
    }

    @Test fun replayButtonIsAnnouncedAsAButton() {
        compose.setContent {EnglishTalesTheme {ListeningGame(questions,1,PaddingValues(),{_,_->},{},{})}}
        compose.onNode(hasClickAction() and (hasContentDescription("Kelimeyi dinle") or hasContentDescription("Seslendirmeyi durdur") or hasContentDescription("Tekrar dinle")))
            .assertExists()
    }
}
