package com.yurken.englishtales.data

import org.junit.Assert.*
import org.junit.Test
import kotlin.random.Random

class ListeningQuizTest {
    private fun word(id: String, meaning: String) = WordInfo(id, id, meaning, "", "")
    private val dictionary = listOf(word("quiet","sessiz"), word("silent","Sessiz "), word("bread","ekmek"), word("river","nehir"),
        word("smile","gülümsemek"), word("bridge","köprü"))

    @Test fun eachQuestionHasTheAnswerAndThreeDistinctReadableDistractors() {
        repeat(20) { seed ->
            val questions = ListeningQuiz.questions(dictionary.take(3), dictionary, Random(seed))
            assertEquals(listOf("quiet","silent","bread"), questions.map { it.wordId })
            questions.forEach { q ->
                assertEquals(4, q.options.size)
                assertTrue(q.answer in q.options)
                // "Sessiz " and "sessiz" read the same, so the other one can never be a distractor.
                assertEquals(1, q.options.count { it.equals(q.answer, ignoreCase = true) })
                assertEquals(4, q.options.map { it.lowercase() }.distinct().size)
            }
        }
    }

    @Test fun duplicateWordsAreAskedOnce() {
        assertEquals(1, ListeningQuiz.questions(listOf(dictionary[0], dictionary[0]), dictionary).size)
    }

    @Test fun smallDictionariesStillProduceAnswerableQuestions() {
        val q = ListeningQuiz.questions(dictionary.take(1), dictionary.take(2)).single()
        assertEquals(listOf("sessiz"), q.options)
    }

    @Test fun recordedAsChoiceLessonsToKeepTheSessionContract() {
        assertEquals("choice", ListeningQuiz.SESSION_KIND)
    }
}
