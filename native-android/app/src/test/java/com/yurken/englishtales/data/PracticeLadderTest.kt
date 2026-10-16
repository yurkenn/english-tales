package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Test

class PracticeLadderTest {
    @Test fun newWordsAreRecognisedAndPractisedWordsRecalled() {
        assertEquals(listOf("choice", "choice", "spell", "spell"),
            PracticeLadder.modes(listOf("new", "learning", "reviewing", "known"),
                mapOf("learning" to "learning", "reviewing" to "reviewing", "known" to "known")))
    }
}
