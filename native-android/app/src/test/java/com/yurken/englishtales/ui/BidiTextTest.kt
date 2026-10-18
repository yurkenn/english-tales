package com.yurken.englishtales.ui

import org.junit.Assert.assertEquals
import org.junit.Test

class BidiTextTest {
    @Test fun englishArgumentsAreIsolatedOnlyInRtlMessages() {
        val sentence = "The cat sat."
        assertEquals(sentence, englishArgument(sentence, rtl = false))
        assertEquals("\u2066The cat sat.\u2069", englishArgument(sentence, rtl = true))
    }
}
