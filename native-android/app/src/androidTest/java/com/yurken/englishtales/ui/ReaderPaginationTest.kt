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
        // Sentence lines: their text (which carries "listen from here") and the translate button beside it.
        val listen=context.getString(R.string.listen_from_sentence)
        val texts=compose.onAllNodes(SemanticsMatcher("listenable") {n ->
            n.config.getOrNull(SemanticsActions.CustomActions)?.any {it.label==listen}==true
        }).fetchSemanticsNodes()
        val buttons=compose.onAllNodesWithContentDescription(context.getString(R.string.cumleyi_cevir)).fetchSemanticsNodes()
        // Unclipped bottoms: a line running past the visible page would show up below the controls' top.
        val bottom=(texts+buttons).maxOf {it.positionInRoot.y+it.size.height}
        val line=texts.maxBy {it.positionInRoot.y}.size.height.toFloat()
        val controls=compose.onNode(SemanticsMatcher.keyIsDefined(SemanticsActions.SetProgress)).fetchSemanticsNode().boundsInRoot
        val gap=controls.top-bottom
        assertTrue("The page's last line stays above the page controls",gap>=0f)
        // Under the last line only the page's bottom padding and less than one more short sentence line stay empty.
        val padding=with(compose.density) {(24+14).dp.toPx()}
        assertTrue("The page is filled: $gap px empty with $line px lines",gap<padding+2*line)
        assertTrue("A page shows several sentence lines, not one or two",texts.size>=3)
    }
}
