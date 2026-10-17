package com.yurken.englishtales.data

import androidx.test.platform.app.InstrumentationRegistry
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/** Word events look up their story revision through a per-catalog cache; it must agree with the original scan. */
class WordRevisionCacheTest {
    private val context get() = InstrumentationRegistry.getInstrumentation().targetContext

    @Before fun bundledCatalog() { LearningContent.resetForTest(); LearningContent.initialize(context) }
    @After fun restore() { LearningContent.resetForTest(); LearningContent.initialize(context) }

    @Test fun everyBundledWordMatchesTheLinearScan() {
        val taught = LearningContent.stories.flatMap(LearningContent::wordsForStory).map { it.id }.toSet()
        assertTrue("the bundled stories teach words", taught.isNotEmpty())
        LearningContent.words.forEach { word ->
            assertEquals(word.id, LearningContent.revisionForWordByScan(word.id), LearningContent.revisionForWord(word.id))
            if (word.id in taught) assertNotNull(word.id, LearningContent.revisionForWord(word.id))
        }
    }

    @Test fun pinnedRevisionWinsOverTheCatalog() {
        val story = LearningContent.stories.last()
        val word = LearningContent.wordsForStory(story).first()
        val pinned = story.copy(revisionId = "word-revision-cache-test")
        LearningContent.pin(pinned)
        assertEquals(pinned.revisionId, LearningContent.revisionForWord(word.id))
        LearningContent.words.forEach { assertEquals(it.id, LearningContent.revisionForWordByScan(it.id), LearningContent.revisionForWord(it.id)) }
        assertSame(pinned, LearningContent.storyById[story.id])
        LearningContent.unpin(pinned)
        assertEquals(LearningContent.revisionForWordByScan(word.id), LearningContent.revisionForWord(word.id))
        assertSame(story, LearningContent.storyById[story.id])
    }

    @Test fun retainedRevisionIsTheFallback() {
        val only = WordInfo("word-revision-cache-only", "zephyr", "esinti", "", "")
        val story = LearningContent.stories.first()
        val retained = story.copy(revisionId = "word-revision-cache-retained", vocabulary = listOf(only),
            sentenceWordIds = mapOf(story.sentences.first().id to listOf(only.id)))
        LearningContent.retain(retained)
        assertEquals(retained.revisionId, LearningContent.revisionForWord(only.id))
        assertEquals(LearningContent.revisionForWordByScan(only.id), LearningContent.revisionForWord(only.id))
    }

    @Test fun storyByIdIsTheCatalogMapWhileNothingIsPinned() {
        assertSame(LearningContent.storyById, LearningContent.storyById)
        assertEquals(LearningContent.stories.map { it.id }.toSet(), LearningContent.storyById.keys)
    }
}
