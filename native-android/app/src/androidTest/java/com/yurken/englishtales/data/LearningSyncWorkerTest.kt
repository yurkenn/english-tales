package com.yurken.englishtales.data

import androidx.test.platform.app.InstrumentationRegistry
import androidx.work.*
import androidx.work.testing.TestListenableWorkerBuilder
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import java.util.UUID
import java.util.concurrent.TimeUnit

class LearningSyncWorkerTest {
    private val context get()=InstrumentationRegistry.getInstrumentation().targetContext
    @Test fun missingOwnerFailsWithoutOpeningAnAccountDatabase()=runBlocking {
        val worker=TestListenableWorkerBuilder<LearningSyncWorker>(context).build()
        assertEquals(ListenableWorker.Result.failure(),worker.doWork())
    }
    @Test fun anotherAccountJobDoesNotUseCurrentCredentialsOrCreateItsDatabase()=runBlocking {
        val user=UUID.randomUUID().toString()
        val file=context.getDatabasePath(LearningOwner.Account(user).databaseName)
        val worker=TestListenableWorkerBuilder<LearningSyncWorker>(context).setInputData(workDataOf("user" to user)).build()
        assertEquals(ListenableWorker.Result.success(),worker.doWork())
        assertFalse(file.exists())
    }
    @Test fun repeatedSchedulingKeepsOneNetworkConstrainedPeriodicJob() {
        val user=UUID.randomUUID().toString();val manager=WorkManager.getInstance(context)
        try {
            LearningSyncRuntime.schedule(context,user);LearningSyncRuntime.schedule(context,user)
            val jobs=manager.getWorkInfosForUniqueWork("learning-periodic:$user").get(5,TimeUnit.SECONDS)
            assertEquals(1,jobs.size)
            assertEquals(NetworkType.CONNECTED,jobs.single().constraints.requiredNetworkType)
            assertTrue(jobs.single().tags.contains("learning:$user"))
            assertEquals(user,manager.getWorkInfosForUniqueWork("learning-once:$user").get(5,TimeUnit.SECONDS).single().tags.single {it.startsWith("learning:")}.removePrefix("learning:"))
        } finally {LearningSyncRuntime.cancel(context,user)}
    }
}
