package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.assertFalse
import org.junit.Test

class LemmatizerTest {
    private fun has(token: String, lemma: String) = assertTrue("$token → $lemma: ${Lemmatizer.candidates(token)}", lemma in Lemmatizer.candidates(token))

    @Test fun regularInflections() {
        has("stories", "story"); has("boxes", "box"); has("makes", "make"); has("cats", "cat")
        has("liked", "like"); has("stopped", "stop"); has("carried", "carry"); has("played", "play")
        has("making", "make"); has("running", "run"); has("lying", "lie"); has("sing", "sing")
        has("bigger", "big"); has("larger", "large"); has("happiest", "happy"); has("quickly", "quick"); has("happily", "happy")
    }

    @Test fun theTokenComesFirstAndShortStemsAreNeverGuessed() {
        assertEquals("bed", Lemmatizer.candidates("bed").first())
        assertFalse("b" in Lemmatizer.candidates("bed"))
        assertFalse("th" in Lemmatizer.candidates("thing"))
        assertFalse("glas" in Lemmatizer.candidates("glass"))
        assertFalse("bu" in Lemmatizer.candidates("bus"))
        // "fall" keeps its double l: "falling" must not become "fal".
        assertFalse("fal" in Lemmatizer.candidates("falling")); has("falling", "fall")
    }
}
