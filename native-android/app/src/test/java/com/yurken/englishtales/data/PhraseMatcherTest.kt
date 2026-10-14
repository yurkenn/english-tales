package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Test

class PhraseMatcherTest {
    private fun word(id: String, text: String = id) = WordInfo(id, text, "", "", "")
    private fun found(sentence: String, vararg words: WordInfo) =
        PhraseMatcher.find(sentence, words.toList()).map { it.word.id to sentence.substring(it.start, it.end) }

    @Test fun phraseMatchesWithSpaceOrHyphen() {
        val pickedUp = word("picked-up", "picked up")
        assertEquals(listOf("picked-up" to "picked up"), found("She picked up the box.", pickedUp))
        assertEquals(listOf("picked-up" to "picked-up"), found("A picked-up box.", pickedUp))
        assertEquals(listOf("picked-up" to "Picked Up"), found("Picked Up!", pickedUp))
    }

    @Test fun wholeTokensOnly() {
        assertEquals(emptyList<Pair<String, String>>(), found("The category is new.", word("cat")))
        assertEquals(emptyList<Pair<String, String>>(), found("She picked flowers up.", word("picked-up", "picked up")))
        assertEquals(listOf("cat" to "cat"), found("A cat, a dog.", word("cat")))
    }

    @Test fun apostrophesFollowThePublishContract() {
        assertEquals(listOf("lion" to "lion"), found("An ass finds a lion's skin.", word("lion")))
        assertEquals(listOf("dont" to "don't"), found("I don't know.", word("dont", "don't")))
    }

    @Test fun longestEntryWinsAndConsumesItsTokens() {
        val step = word("step"); val stepByStep = word("step-by-step", "step by step")
        assertEquals(listOf("step-by-step" to "Step by step"), found("Step by step, she reaches the line.", step, stepByStep))
        assertEquals(listOf("step" to "step"), found("One step at a time.", step, stepByStep))
    }

    @Test fun matchesAreReturnedInSentenceOrder() {
        assertEquals(listOf("wakes-up" to "wakes up", "runs" to "runs"),
            found("The hare wakes up and runs.", word("runs"), word("wakes-up", "wakes up")))
    }

    @Test fun blankEntriesAreIgnored() {
        assertEquals(emptyList<Pair<String, String>>(), found("Anything.", word("blank", " - ")))
    }
}
