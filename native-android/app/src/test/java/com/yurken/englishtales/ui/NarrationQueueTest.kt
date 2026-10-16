package com.yurken.englishtales.ui

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** Q4.8: the reader highlights the sentence the engine is reading and ends only after the last one. */
class NarrationQueueTest {
    @Test fun followsEachSentenceAndEndsAfterTheLast() {
        val queue=NarrationQueue()
        val ids=queue.start(3)
        assertEquals(3,ids.toSet().size)
        assertTrue(queue.started(ids[0])); assertEquals(0,queue.current)
        assertFalse(queue.done(ids[0]))
        assertTrue(queue.started(ids[1])); assertEquals(1,queue.current)
        assertFalse(queue.done(ids[1]))
        assertTrue(queue.started(ids[2])); assertEquals(2,queue.current)
        assertTrue(queue.done(ids[2])); assertNull(queue.current)
    }

    @Test fun callbacksFromAFlushedBatchAreIgnored() {
        val queue=NarrationQueue()
        val old=queue.start(2)
        val now=queue.start(12)
        // Stop/done callbacks of the flushed batch arrive late; they must not end or move the new one.
        assertFalse(queue.owns(old[0])); assertFalse(queue.started(old[1])); assertFalse(queue.done(old[1]))
        assertTrue(queue.started(now[11])); assertEquals(11,queue.current)
        assertFalse(queue.owns("english-tales-2-12")); assertFalse(queue.owns(null)); assertFalse(queue.owns("other"))
    }

    @Test fun finishingStopsTrackingUntilTheNextBatch() {
        val queue=NarrationQueue()
        val ids=queue.start(2)
        queue.started(ids[0]); queue.finish()
        assertNull(queue.current); assertFalse(queue.owns(ids[1])); assertFalse(queue.done(ids[1]))
        val next=queue.start(1)
        assertTrue(queue.started(next[0])); assertTrue(queue.done(next[0]))
    }
}
