package com.yurken.englishtales.data

import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** Q4.3a: the bundled glossary loads, and every single-word learning word is also a lookup entry. */
class GlossaryAssetTest {
    private val context = InstrumentationRegistry.getInstrumentation().targetContext

    @Test fun bundledGlossaryParsesAndCoversLearningWords() {
        val (entries, forms) = Glossary.parse(context.assets.open("glossary/tr.json").bufferedReader().use { it.readText() })
        assertTrue(forms.isNotEmpty())
        assertTrue(forms.all { (form, lemma) -> form == form.lowercase() && lemma == lemma.lowercase() && form != lemma })
        assertTrue(entries.values.all { it.isNotBlank() })

        LearningContent.initialize(context)
        val single = LearningContent.words.filter { PhraseMatcher.tokens(it.word).size == 1 }
        assertTrue(single.isNotEmpty())
        single.forEach { word -> assertEquals(word.word, word.translation, LearningContent.glossary.lookup(word.word)?.gloss) }
        // Some story token that is not itself a learning word is now explained (e.g. an inflected form).
        val explained = LearningContent.stories.flatMap { story -> story.sentences.flatMap { sentence ->
            LearningContent.glossary.spans(sentence.english, PhraseMatcher.find(sentence.english, LearningContent.phraseIndex)) } }
        assertTrue(explained.isNotEmpty())
    }
}
