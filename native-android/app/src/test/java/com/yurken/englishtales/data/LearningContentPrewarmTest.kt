package com.yurken.englishtales.data

import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotSame
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

class LearningContentPrewarmTest {
    private fun word(id: String, text: String) = WordInfo(id, text, "çeviri", "", "")
    private fun story(id: String, english: String) = Story(id, id, "author", "A1", "Macera", "", "cover", listOf(StorySentence("s1", english, "")))

    @After fun reset() = LearningContent.resetForTest()

    @Test fun installPrewarmsOffTheCallerAndReinstallReplacesTheIndex() = runBlocking {
        val caller = Thread.currentThread()
        LearningContent.initializeForTest(listOf(word("w1", "lion")), listOf(story("a", "The lion sleeps.")))
        checkNotNull(LearningContent.prewarmJob).join()
        val builtOn = checkNotNull(LearningContent.phraseIndexBuiltOn()) { "pre-warm built the index" }
        assertNotEquals("the index is built off the installing thread", caller, builtOn)
        val first = LearningContent.phraseIndex
        assertSame("the reader gets the pre-warmed index instead of building another", builtOn, LearningContent.phraseIndexBuiltOn())
        assertSame("pre-warm is idempotent", first, LearningContent.phraseIndex)
        assertEquals(listOf("w1"), PhraseMatcher.find("The lion sleeps.", first).map { it.word.id })

        // A remote catalog install brings its own index; the reader never sees the old one.
        val tiger = word("w2", "tiger")
        LearningContent.install(listOf(story("b", "A tiger runs.").copy(vocabulary = listOf(tiger), sentenceWordIds = mapOf("s1" to listOf("w2")))))
        checkNotNull(LearningContent.prewarmJob).join()
        assertNotEquals("the new index is built off the installing thread", caller, checkNotNull(LearningContent.phraseIndexBuiltOn()))
        val second = LearningContent.phraseIndex
        assertNotSame("a newer install replaces the index", first, second)
        assertEquals(listOf("w2"), PhraseMatcher.find("A tiger runs.", second).map { it.word.id })
        assertTrue("the old index is not reused", PhraseMatcher.find("A tiger runs.", first).isEmpty())
        assertEquals("tiger", LearningContent.glossary.lookup("tiger")?.lemma)
    }
}
