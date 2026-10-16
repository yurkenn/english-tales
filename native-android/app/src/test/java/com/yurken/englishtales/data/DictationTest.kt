package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Test

class DictationTest {
    @Test fun caseSpacingAndPunctuationDoNotCount() {
        assertEquals(Dictation.Check(true, 0), Dictation.check("The cat sat on the mat.", "the cat  sat on the mat"))
        assertEquals(Dictation.Check(true, 0), Dictation.check("It's late, Tom!", "it’s late tom"))
    }

    @Test fun everyWrongMissingOrExtraWordIsCounted() {
        assertEquals(Dictation.Check(false, 1), Dictation.check("The cat sat on the mat.", "The cat sit on the mat"))
        assertEquals(Dictation.Check(false, 2), Dictation.check("The cat sat on the mat.", "The cat sat on"))
        assertEquals(Dictation.Check(false, 1), Dictation.check("The cat sat.", "The cat sat down"))
        assertEquals(Dictation.Check(false, 3), Dictation.check("The cat sat.", ""))
    }
}
