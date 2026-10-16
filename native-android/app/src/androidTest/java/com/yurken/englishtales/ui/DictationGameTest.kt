package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import com.yurken.englishtales.data.OrderQuestion
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/** Q5.9: a typed sentence is checked word by word, ignoring case and punctuation. */
class DictationGameTest {
    @get:Rule val compose=createComposeRule()

    @Test fun typeCheckAndFinish() {
        var result=-1
        val questions=listOf(OrderQuestion("The cat sat.","","Story","A1","s1",emptyList()),OrderQuestion("A dog ran.","","Story","A1","s2",emptyList()))
        compose.setContent {EnglishTalesTheme(dark=false) {DictationGame(questions,0,PaddingValues(),{result=it},{})}}
        compose.onNodeWithText("Kontrol et").assertIsNotEnabled()
        compose.onNode(hasSetTextAction()).performTextInput("the cat sat")
        compose.onNodeWithText("Kontrol et").performClick()
        compose.onNodeWithText("Doğru! The cat sat.").assertExists()
        compose.onNodeWithText("Sonraki cümle").performClick()
        compose.onNode(hasSetTextAction()).performTextInput("A dog sat")
        compose.onNodeWithText("Kontrol et").performClick()
        compose.onNodeWithText("1 sözcük farklı. Doğrusu: A dog ran.").assertExists()
        compose.onNodeWithText("Sonucu gör").performClick()
        compose.runOnIdle {assertEquals(1,result)}
    }
}
