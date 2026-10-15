package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.Density
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class SentenceGapGameTest {
    @get:Rule val compose=createComposeRule()
    @Before fun catalog() {LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext)}
    private fun fixture(word: String="cat",long: Boolean=false): GapQuestion {
        val text=if(long) "Maya noticed a small $word beside the garden gate while she was walking home from school with her brother on a quiet afternoon, and they stopped for a moment to watch it play in the sunshine."
            else "Maya saw a small $word near the garden."
        val start=text.indexOf(word)
        return GapQuestion(GapPrompt(word,word,"ipucu-$word",text,start,start+word.length,"Maya's garden","revision-1","sentence-$word","A1"),
            listOf("cat","dog","bird","fish").map {GapOption(it,it)})
    }
    private fun click(text: String) {compose.onNodeWithText(text).performScrollTo().performClick();compose.waitForIdle()}

    @Test fun checkingShowsContextAndOnlyAdvancingCommitsOneAnswer() {
        val answers=mutableListOf<Pair<String,Boolean>>()
        val completions=mutableListOf<Int>()
        compose.setContent {EnglishTalesTheme {SentenceGapGame(listOf(fixture(),fixture("dog")),1,PaddingValues(),
            {id,correct ->answers+=id to correct},completions::add,{})}}
        compose.onNodeWithText("Kontrol et").performScrollTo().assertIsNotEnabled()
        click("dog");click("Kontrol et")
        compose.onNodeWithText("Birlikte öğrenelim. Doğru cevap: cat").assertExists()
        compose.onNodeWithText(fixture().prompt.sentence).assertExists()
        compose.onNodeWithText("cat").assertIsNotEnabled()
        compose.runOnIdle {assertTrue(answers.isEmpty());assertTrue(completions.isEmpty())}
        click("Sonraki cümle")
        compose.runOnIdle {assertEquals(listOf("cat" to false),answers)}
        click("dog");click("Kontrol et");click("Sonucu gör")
        compose.onNodeWithText("Sonucu gör").assertIsNotEnabled()
        compose.runOnIdle {assertEquals(listOf("cat" to false,"dog" to true),answers);assertEquals(listOf(1),completions)}
    }

    @Test fun restorationKeepsTheCapturedSentenceChoicesAndFeedbackPhase() {
        var source=listOf(fixture())
        var answerCount=0
        val restoration=StateRestorationTester(compose)
        restoration.setContent {EnglishTalesTheme {
            val questions by rememberSaveable(stateSaver=gapQuestionsSaver) {mutableStateOf(source)}
            SentenceGapGame(questions,1,PaddingValues(),{_,_ ->answerCount++},{},{})
        }}
        click("cat");click("Kontrol et")
        source=listOf(fixture("dog"))
        restoration.emulateSavedInstanceStateRestore()
        compose.onNodeWithText(fixture().prompt.sentence).assertExists()
        compose.onNodeWithText("cat").assertIsSelected()
        compose.onNodeWithText("Doğru! Cümleyi tamamladın.").assertExists()
        compose.runOnIdle {assertEquals(0,answerCount)}
        click("Sonucu gör")
        compose.runOnIdle {assertEquals(1,answerCount)}
    }

    @Test fun largeTextCanReachTheChoicesAndCompleteALongSentence() {
        var completed: Int?=null
        compose.setContent {EnglishTalesTheme {
            val density=LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(density.density,2f)) {
                SentenceGapGame(listOf(fixture(long=true)),1,PaddingValues(),{_,_ ->},{completed=it},{})
            }
        }}
        click("cat");click("Kontrol et");click("Sonucu gör")
        compose.runOnIdle {assertEquals(1,completed)}
    }

    @Test fun leavingAnUnfinishedQuestionDoesNotAwardACompletionOrReview() {
        var exited=false
        var reviewed=false
        var completed=false
        compose.setContent {EnglishTalesTheme {SentenceGapGame(listOf(fixture()),1,PaddingValues(),
            {_,_ ->reviewed=true},{completed=true},{exited=true})}}
        click("cat")
        compose.onNodeWithContentDescription("Alıştırmadan çık").performScrollTo().performClick()
        compose.runOnIdle {assertTrue(exited);assertFalse(reviewed);assertFalse(completed)}
    }

    @Test fun practiceMenuCompletesFiveContextQuestionsThroughTheExistingSessionContract() {
        val snapshot=LearningSnapshot(savedWordIds=LearningContent.words.map {it.id}.toSet())
        val starts=mutableListOf<Triple<String,String,Int>>()
        val completions=mutableListOf<List<Any>>()
        val reviews=mutableListOf<Pair<String,Boolean>>()
        val abandoned=mutableListOf<String>()
        compose.setContent {EnglishTalesTheme {
            PracticeScreen(snapshot,{correct,id,kind,count,millis ->completions+=listOf(correct,id,kind,count,millis)},
                {id,correct ->reviews+=id to correct},PaddingValues(),{id,kind,count ->starts+=Triple(id,kind,count)},
                {_,_ ->},abandoned::add)
        }}
        compose.waitUntil(15_000) {
            compose.onAllNodesWithText("Cümlede boşluk doldur").fetchSemanticsNodes().singleOrNull()?.config?.contains(SemanticsProperties.Disabled)==false
        }
        click("Cümlede boşluk doldur")
        repeat(5) {index ->
            val hint=compose.onNode(hasText("İpucu:",substring=true)).fetchSemanticsNode().config[SemanticsProperties.Text].joinToString("") {it.text}.removePrefix("İpucu: ")
            val word=LearningContent.words.first {it.translation==hint && compose.onAllNodesWithText(it.word).fetchSemanticsNodes().isNotEmpty()}
            click(word.word);click("Kontrol et")
            compose.runOnIdle {assertEquals(index,reviews.size);assertTrue(completions.isEmpty())}
            click(if(index==4) "Sonucu gör" else "Sonraki cümle")
        }
        compose.onNodeWithText("5 / 5 doğru").assertExists()
        compose.runOnIdle {
            assertEquals(1,completions.size)
            assertEquals(Triple(starts.single().first,"choice",5),starts.single())
            assertEquals(listOf(5,starts.single().first,"choice",5),completions.single().take(4))
            assertEquals(5,reviews.map {it.first}.distinct().size)
            assertTrue(reviews.all {it.second})
        }
        click("Yeniden çalış")
        compose.runOnIdle {assertEquals(2,starts.size);assertNotEquals(starts[0].first,starts[1].first)}
        compose.onNodeWithContentDescription("Alıştırmadan çık").performScrollTo().performClick()
        compose.onNodeWithText("Kelimelerle oyna").assertExists()
        compose.runOnIdle {assertEquals(1,completions.size);assertTrue(starts.last().first in abandoned)}
    }

    @Test fun metadataOnlyCatalogCannotStartAnEmptySession() {
        val stories=LearningContent.stories
        var starts=0
        try {
            LearningContent.install(stories.map {it.copy(sentences=emptyList())})
            compose.setContent {EnglishTalesTheme {
                PracticeScreen(LearningSnapshot(),{_,_,_,_,_ ->fail("Unexpected completion")},{_,_ ->},PaddingValues(),
                    {_,_,_ ->starts++},{_,_ ->},{})
            }}
            compose.waitUntil(15_000) {compose.onAllNodesWithText("Bu alıştırma için uygun cümle yok. İndirdiğin hikâyelerle tekrar deneyebilirsin.").fetchSemanticsNodes().isNotEmpty()}
            compose.onNodeWithText("Cümlede boşluk doldur").performScrollTo().assertIsNotEnabled()
            compose.runOnIdle {assertEquals(0,starts)}
        } finally {LearningContent.install(stories)}
    }
}
