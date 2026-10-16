package com.yurken.englishtales.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class RevisionProgressTest {
    private val sentences = listOf(StorySentence("s-1", "One.", "Bir."), StorySentence("s-2", "Two.", "İki."))
    private val bundled = Story("tale", "Tale", "", "A1", "Macera", "", "cover", sentences)
    private val newer = bundled.copy(revisionId = "33333333-3333-4333-a333-333333333333")
    private fun snapshot(position: ReadingPosition?) =
        LearningSnapshot(storyProgress = mapOf("tale" to 50), readingPositions = position?.let { mapOf("tale" to it) }.orEmpty())

    @Test fun positionCarriesToNewerRevisionWhileItsSentenceExists() {
        val position = ReadingPosition(bundled.revisionId, "s-2")
        assertTrue(position.carriesTo(newer))
        assertEquals(50, snapshot(position).progressFor(newer))
    }

    @Test fun removedSentenceOrUnknownTextStartsOver() {
        val position = ReadingPosition(bundled.revisionId, "s-2")
        val rewritten = newer.copy(sentences = listOf(StorySentence("s-9", "Nine.", "Dokuz.")))
        assertFalse(position.carriesTo(rewritten))
        assertEquals(0, snapshot(position).progressFor(rewritten))
        // Remote metadata without downloaded text cannot confirm the sentence.
        assertEquals(0, snapshot(position).progressFor(newer.copy(sentences = emptyList())))
    }

    @Test fun sameRevisionAndLegacyBundledProgressAreUnchanged() {
        assertEquals(50, snapshot(ReadingPosition(bundled.revisionId, "missing")).progressFor(bundled))
        assertEquals(50, snapshot(null).progressFor(bundled))
        assertEquals(0, snapshot(null).progressFor(newer))
    }
}
