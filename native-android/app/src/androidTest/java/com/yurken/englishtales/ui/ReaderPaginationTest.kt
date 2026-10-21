package com.yurken.englishtales.ui

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.R
import com.yurken.englishtales.data.*
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/** Reader tests that count on a page size use this one; the app itself fills each page by measuring the text. */
internal val EightPerPage: (Int,Int)->Boolean={from,to -> to-from<=8}

/** Pages are cut to the screen: short sentences fill the page, none of them running under the page controls. */
class ReaderPaginationTest {
    @get:Rule val compose=createComposeRule()
    private val context=InstrumentationRegistry.getInstrumentation().targetContext

    @Test fun shortSentencesFillThePageWithoutRunningUnderTheControls() {
        LearningContent.initialize(context)
        val base=LearningContent.stories.minBy {s -> s.sentences.sumOf {it.english.length}/s.sentences.size}
        val story=base.copy(sentences=List(120) {i->base.sentences[i%base.sentences.size].let {it.copy(id="${it.id}-$i")}})
        compose.setContent {EnglishTalesTheme(dark=false) {
            ReaderScreen(story,LearningSnapshot(readerHintSeen=true),onBack={},onSaveWord={},onProgress={_,_->},onComplete={},onHintDismiss={},
                sessionId="reader-pagination",onCheckpoint={_,_->})
        }}
        val label=context.getString(R.string.cumleyi_cevir)
        val page=compose.onAllNodes(SemanticsMatcher("translatable") {n ->
            n.config.getOrNull(SemanticsActions.CustomActions)?.any {it.label.startsWith(label)}==true
        }).fetchSemanticsNodes().single()
        // The text is the paragraph's child; its unclipped bottom tells whether it runs past the visible page.
        val text=page.children.single {SemanticsActions.GetTextLayoutResult in it.config}
        val layouts=mutableListOf<androidx.compose.ui.text.TextLayoutResult>()
        text.config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
        val line=layouts.single().let {it.size.height.toFloat()/it.lineCount}
        val controls=compose.onNode(SemanticsMatcher.keyIsDefined(SemanticsActions.SetProgress)).fetchSemanticsNode().boundsInRoot
        val gap=controls.top-(text.positionInRoot.y+text.size.height)
        assertTrue("The page's last line stays above the page controls",gap>=0f)
        // Under the text only the page's bottom padding and less than one more short sentence stay empty.
        val padding=with(compose.density) {24.dp.toPx()}
        assertTrue("The page is filled: $gap px empty with $line px lines",gap<padding+3*line)
    }
}
