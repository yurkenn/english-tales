package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PracticeLadderTest {
    @Test fun newWordsAreRecognisedAndPractisedWordsRecalled() {
        assertEquals(listOf("choice", "choice", "spell", "spell"),
            PracticeLadder.modes(listOf("new", "learning", "reviewing", "known"),
                mapOf("learning" to "learning", "reviewing" to "reviewing", "known" to "known")))
    }

    @Test fun stabilityMovesWordsUpTheLadder() {
        fun mode(state: String?, stability: Double?) = PracticeLadder.modeFor(state, stability, hasContext = true, canListen = true)
        assertEquals("choice", mode(null, null))
        assertEquals("choice", mode("learning", 30.0))
        assertEquals("spell", mode("reviewing", null))
        assertEquals("spell", mode("reviewing", 6.9))
        assertEquals("cloze", mode("reviewing", 7.0))
        assertEquals("listen", mode("known", 25.0))
        // A word known before FSRS has no stability yet; its state still places it.
        assertEquals("listen", mode("known", null))
    }

    @Test fun missingRungsFallBackDownTheLadder() {
        assertEquals("cloze", PracticeLadder.modeFor("known", 30.0, hasContext = true, canListen = false))
        assertEquals("spell", PracticeLadder.modeFor("known", 30.0, hasContext = false, canListen = false))
        assertEquals("spell", PracticeLadder.modeFor("reviewing", 10.0, hasContext = false, canListen = true))
        assertEquals("choice", PracticeLadder.modeFor("learning", null, hasContext = false, canListen = false))
    }

    @Test fun sessionClimbsFromWordDrillsToGames() {
        val plan = PracticeLadder.plan(listOf("k", "r", "n", "c", "r2"),
            mapOf("k" to "known", "r" to "reviewing", "c" to "reviewing", "r2" to "reviewing"),
            mapOf("k" to 40.0, "r" to 2.0, "c" to 9.0, "r2" to 3.0), contextWordIds = setOf("c", "k"), canListen = true)
        assertEquals(listOf("n" to "choice", "r" to "spell", "r2" to "spell", "c" to "cloze", "k" to "listen"), plan)
        assertTrue(PracticeLadder.isWordDrill("spell"))
        assertFalse(PracticeLadder.isWordDrill("cloze"))
    }
}
