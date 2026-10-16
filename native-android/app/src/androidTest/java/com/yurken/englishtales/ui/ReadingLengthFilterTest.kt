package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class ReadingLengthFilterTest {
    @get:Rule val compose=createComposeRule()

    private val minutesText=Regex("~(\\d+) dk")
    // Card texts merge into one node; read the individual text nodes instead.
    private fun shownMinutes()=compose.onAllNodes(hasText("~",substring=true),useUnmergedTree=true).fetchSemanticsNodes()
        .flatMap {it.config.getOrNull(SemanticsProperties.Text).orEmpty()}
        .mapNotNull {minutesText.matchEntire(it.text)?.groupValues?.get(1)?.toInt()}

    @Test fun shortFilterKeepsOnlyShortStoriesAndCardsShowMinutes() {
        LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext)
        compose.setContent {EnglishTalesTheme {CatalogScreen(LearningSnapshot(),{},PaddingValues())}}
        compose.onNodeWithText("Kategoriler").performScrollTo().performClick()
        // The first stories are short A1 tales, so check each bucket from its own filtered list.
        compose.onNode(hasText("Orta · 3–5 dk") and isSelectable()).performClick()
        compose.waitForIdle()
        val medium=shownMinutes()
        assertTrue(medium.toString(),medium.isNotEmpty() && medium.all {it in 3..5})
        compose.onNode(hasText("Kısa · ≤ 2 dk") and isSelectable()).performClick()
        compose.waitForIdle()
        val short=shownMinutes()
        assertTrue(short.toString(),short.isNotEmpty() && short.all {it<=2})
        compose.onNodeWithText("Filtreleri temizle").performClick()
        compose.onNodeWithText("Filtreleri temizle").assertDoesNotExist()
    }
}
