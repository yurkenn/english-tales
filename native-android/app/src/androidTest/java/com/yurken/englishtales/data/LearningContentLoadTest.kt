package com.yurken.englishtales.data

import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.concurrent.CountDownLatch
import kotlin.concurrent.thread

class LearningContentLoadTest {
    private val context get() = InstrumentationRegistry.getInstrumentation().targetContext

    @After fun restore() { LearningContent.initialize(context) }

    @Test fun concurrentLoadsInstallOneCatalog() {
        LearningContent.resetForTest()
        assertFalse(LearningContent.ready)
        val start = CountDownLatch(1)
        val seen = java.util.Collections.synchronizedList(mutableListOf<List<Story>>())
        val workers = (1..4).map { thread { start.await(); LearningContent.initialize(context); seen += LearningContent.stories } }
        runBlocking {
            start.countDown()
            (1..2).map { async { LearningContent.load(context) } }.awaitAll()
        }
        workers.forEach { it.join() }
        assertTrue(LearningContent.ready)
        assertEquals(67, LearningContent.stories.size)
        assertTrue("every caller sees the same catalog", seen.all { it === LearningContent.stories })
    }
}
