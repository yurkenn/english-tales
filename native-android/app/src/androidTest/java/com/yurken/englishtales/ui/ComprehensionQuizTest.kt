package com.yurken.englishtales.ui

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import java.util.UUID

class ComprehensionQuizTest {
    @get:Rule val compose=createComposeRule()
    private val context get()=InstrumentationRegistry.getInstrumentation().targetContext
    private val name="quiz-test-${UUID.randomUUID()}"
    @After fun cleanup() {context.getSharedPreferences(name,0).edit().clear().commit()}

    @Test fun everyBundledStoryHasValidQuestions() {
        LearningContent.initialize(context)
        LearningContent.stories.forEach { story ->
            assertTrue(story.id,story.questions.size>=3)
            assertTrue(story.id,story.questions.all {it.isValid()})
            assertEquals(story.id,story.questions.size,story.questions.map {it.id}.distinct().size)
        }
    }

    @Test fun invalidQuestionsAreDropped() {
        val array=org.json.JSONArray("""[{"id":"a","kind":"main","prompt":"Q?","options":["Yes","yes"],"answer":0},
            {"id":"b","kind":"other","prompt":"Q?","options":["A","B"],"answer":0},
            {"id":"c","kind":"detail","prompt":"Q?","options":["A","B"],"answer":2},
            {"id":"d","kind":"detail","prompt":"Q?","options":["A","B"],"answer":1}]""")
        assertEquals(listOf("d"),StoryQuestion.parse(array).map {it.id})
    }

    @Test fun answersAreCheckedScoredAndTheBestResultIsKept() {
        val results=ComprehensionResults(context,name)
        val questions=listOf(StoryQuestion("q1","main","Who helps?",listOf("A mouse","A fox"),0),
            StoryQuestion("q2","detail","What breaks?",listOf("A rope","A tree"),0))
        compose.setContent {EnglishTalesTheme {ComprehensionQuiz("story",questions,results=results)}}
        compose.onNodeWithText("Soru 1 / 2",substring=true).assertIsDisplayed()
        compose.onNode(hasText("A mouse") and isSelectable()).performClick()
        compose.onNodeWithText("Kontrol et").performClick()
        compose.onNodeWithText("Doğru!").assertIsDisplayed()
        compose.onNodeWithText("Sonraki soru").performClick()
        compose.onNode(hasText("A tree") and isSelectable()).performClick()
        compose.onNodeWithText("Kontrol et").performClick()
        compose.onNodeWithText("Doğru cevap: A rope").assertIsDisplayed()
        compose.onNodeWithText("Bitir").performClick()
        compose.onNodeWithText("Sonuç: 1/2").assertIsDisplayed()
        assertEquals(QuizScore(1,2),results.best("story"))
        // A worse retry keeps the earlier best result.
        compose.onNodeWithText("Tekrar dene").performClick()
        compose.onNode(hasText("A fox") and isSelectable()).performClick()
        compose.onNodeWithText("Kontrol et").performClick(); compose.onNodeWithText("Sonraki soru").performClick()
        compose.onNode(hasText("A tree") and isSelectable()).performClick()
        compose.onNodeWithText("Kontrol et").performClick(); compose.onNodeWithText("Bitir").performClick()
        compose.onNodeWithText("Sonuç: 0/2").assertIsDisplayed()
        compose.onNodeWithText("En iyi sonucun: 1/2").assertIsDisplayed()
    }
}
