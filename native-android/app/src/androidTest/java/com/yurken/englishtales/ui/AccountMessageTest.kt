package com.yurken.englishtales.ui

import androidx.compose.runtime.*
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.yurken.englishtales.data.AccountState
import com.yurken.englishtales.data.MessageTone
import org.junit.Rule
import org.junit.Test

class AccountMessageTest {
    @get:Rule val compose=createComposeRule()

    @Test fun newFailureAlsoSlidesInAsAnAlert() {
        var state by mutableStateOf(AccountState(message="Giriş yapılıyor…",messageTone=MessageTone.Progress))
        compose.setContent {EnglishTalesTheme {TaleAlertHost {AccountMessage(state)}}}
        // The result already on screen is not replayed as an alert.
        compose.onAllNodesWithText("Giriş yapılıyor…").assertCountEquals(1)
        state=state.copy(message="E-posta veya parola doğru değil.",messageTone=MessageTone.Error)
        compose.onAllNodesWithText("E-posta veya parola doğru değil.").assertCountEquals(2)
    }

    @Test fun progressStaysInlineOnly() {
        var state by mutableStateOf(AccountState())
        compose.setContent {EnglishTalesTheme {TaleAlertHost {AccountMessage(state)}}}
        state=state.copy(message="Çıkış yapılıyor…",messageTone=MessageTone.Progress)
        compose.onAllNodesWithText("Çıkış yapılıyor…").assertCountEquals(1)
    }
}
