package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.yurken.englishtales.data.OrderQuestion
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/** Q5.9: words are placed and taken back by tapping; the answer is checked before moving on. */
class SentenceOrderGameTest {
    @get:Rule val compose=createComposeRule()

    @Test fun buildCheckAndFinish() {
        var result=-1
        val question=OrderQuestion("The cat sat.","Kedi oturdu.","Story","A1","s1",listOf("sat.","The","cat"))
        compose.setContent {EnglishTalesTheme(dark=false) {SentenceOrderGame(listOf(question),0,PaddingValues(),{result=it},{})}}
        compose.onNodeWithText("Kontrol et").assertIsNotEnabled()
        compose.onNodeWithText("cat").performClick()
        // A wrongly placed word goes back to the pool when tapped.
        compose.onNodeWithContentDescription("cat sözcüğünü cümleden çıkar").performClick()
        listOf("The","cat","sat.").forEach {compose.onNodeWithText(it).performClick()}
        compose.onNodeWithText("Kontrol et").assertIsEnabled().performClick()
        compose.onNodeWithText("Doğru! The cat sat.").assertExists()
        compose.onNodeWithText("Sonucu gör").performClick()
        compose.runOnIdle {assertEquals(1,result)}
    }
}
