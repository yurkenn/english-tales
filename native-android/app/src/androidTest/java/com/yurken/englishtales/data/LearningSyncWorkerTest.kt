package com.yurken.englishtales.data

import androidx.test.platform.app.InstrumentationRegistry
import androidx.work.ListenableWorker
import androidx.work.testing.TestListenableWorkerBuilder
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

class LearningSyncWorkerTest {
    private val context get()=InstrumentationRegistry.getInstrumentation().targetContext
    @Test fun missingOwnerFailsWithoutOpeningAnAccountDatabase()=runBlocking {
        val worker=TestListenableWorkerBuilder<LearningSyncWorker>(context).build()
        assertEquals(ListenableWorker.Result.failure(),worker.doWork())
    }
}
