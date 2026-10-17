package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** Q4.3a: every known word in a sentence can be looked up, without disturbing the learning-word links. */
class GlossaryTest {
    private val walk = WordInfo("walk", "walk", "yürümek", "", "")
    private val story = WordInfo("story", "story", "hikâye", "", "")
    private val pickUp = WordInfo("pick-up", "picked up", "aldı", "", "")
    private val glossary = Glossary(mapOf("go" to "gitmek", "big" to "büyük", "happy" to "mutlu", "news" to "haber", "new" to "yeni"),
        mapOf("went" to "go"), listOf(walk, story, pickUp))

    @Test fun regularFormsFindTheirDictionaryForm() {
        assertEquals("walk", glossary.lookup("Walked")?.lemma)
        assertEquals("walk", glossary.lookup("walking")?.lemma)
        assertEquals("story", glossary.lookup("stories")?.lemma)
        assertEquals("big", glossary.lookup("bigger")?.lemma)
        assertEquals("big", glossary.lookup("biggest")?.lemma)
        assertEquals("happy", glossary.lookup("happily")?.lemma)
        assertEquals("go", glossary.lookup("went")?.lemma)
        assertEquals("yürümek", glossary.lookup("walks")?.gloss)
    }

    @Test fun anExactEntryWinsOverAGuessedStem() {
        assertEquals("haber", glossary.lookup("news")?.gloss)
        assertNull(glossary.lookup("unknown"))
        assertNull(glossary.lookup("a"))
    }

    @Test fun spansSkipLearningWordsAndMarkLookupOnlyWords() {
        val text = "He picked up the stories and walked home."
        val matches = PhraseMatcher.find(text, listOf(walk, story, pickUp))
        val spans = glossary.spans(text, matches)
        // "stories" and "walked" are not learning-word matches (only the exact words are), so the glossary explains them.
        assertEquals(listOf("stories", "walked"), spans.map { text.substring(it.start, it.end) })
        assertTrue(spans.all { Glossary.isLookupOnly(it.word) })
        assertEquals(listOf("story", "walk"), spans.map { Glossary.lemmaOf(it.word) })
        // "picked up" is a learning phrase; neither of its tokens is linked again.
        assertTrue(spans.none { span -> matches.any { span.start < it.end && it.start < span.end } })
    }

    @Test fun learningWordTranslationOverridesTheGlossaryDraft() {
        val g = Glossary(mapOf("walk" to "yürüyüş (taslak)"), emptyMap(), listOf(walk))
        assertEquals("yürümek", g.lookup("walk")?.gloss)
    }

    @Test fun aBlankLearningWordTranslationAddsNoEntry() {
        val blank = WordInfo("lamp", "lamp", " ", "", "")
        assertNull(Glossary(emptyMap(), emptyMap(), listOf(blank)).lookup("lamp"))
        // A blank learning word never hides a usable glossary meaning.
        assertEquals("lamba", Glossary(mapOf("lamp" to "lamba"), emptyMap(), listOf(blank)).lookup("lamp")?.gloss)
    }
}
