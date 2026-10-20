package com.yurken.englishtales.data

import android.content.ContextWrapper
import androidx.test.platform.app.InstrumentationRegistry
import androidx.work.*
import androidx.work.testing.TestListenableWorkerBuilder
import com.yurken.englishtales.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.io.File
import java.util.UUID
import java.util.concurrent.TimeUnit

/** Explicit service probe: missing configuration fails instead of silently skipping. */
class ServiceDeviceTest {
    private val context get()=InstrumentationRegistry.getInstrumentation().targetContext
    private var session: AccountSession?=null

    @Before fun configure() {
        assertTrue("Build with -PserviceDeviceTest=true",LearningSyncRuntime.configured())
        LearningSyncRuntime.resetForTest {object: SessionStorage {
            override fun read()=session
            override fun write(value: AccountSession) {session=value}
            override fun clear() {session=null}
        }}
        LearningSyncRuntime.resume()
    }

    @After fun restore() {LearningSyncRuntime.resetForTest();LearningSyncRuntime.resume()}

    @Test fun anotherAccountJobDoesNotUseCurrentCredentialsOrCreateItsDatabase()=runBlocking {
        val current=UUID.randomUUID().toString()
        session=AccountSession(current,"fixture@example.invalid","fixture-access-token","fixture-refresh-token",System.currentTimeMillis()+3_600_000)
        val user=UUID.randomUUID().toString()
        val file=context.getDatabasePath(LearningOwner.Account(user).databaseName)
        val currentFile=context.getDatabasePath(LearningOwner.Account(current).databaseName)
        val worker=TestListenableWorkerBuilder<LearningSyncWorker>(context).setInputData(workDataOf("user" to user)).build()
        assertEquals(ListenableWorker.Result.success(),worker.doWork())
        assertEquals(current,LearningSyncRuntime.accounts(context).current?.userId)
        assertFalse(file.exists())
        assertFalse(currentFile.exists())
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

    @Test fun livePublishedContentDownloadsAndRestoresOffline()=runBlocking {
        LearningContent.initialize(context)
        val original=LearningContent.stories;val originalWords=LearningContent.words
        val directory=File(context.cacheDir,"service-content-${UUID.randomUUID()}").apply {mkdirs()}
        val isolated=object: ContextWrapper(context) {override fun getFilesDir()=directory}
        try {
            val repo=ContentRepository(isolated,ContentHttp(BuildConfig.SUPABASE_URL,BuildConfig.SUPABASE_PUBLISHABLE_KEY))
            repo.restore();repo.refresh()
            assertTrue(LearningContent.stories.isNotEmpty())
            val story=repo.download(LearningContent.stories.first())
            assertTrue(story.sentences.isNotEmpty());assertTrue(story.vocabulary!!.isNotEmpty());assertTrue(File(story.coverFile!!).exists())
            val offline=ContentRepository(isolated,null);offline.restore()
            assertEquals(story.revisionId,LearningContent.storyById.getValue(story.id).revisionId)
            assertTrue(offline.isDownloaded(LearningContent.storyById.getValue(story.id)))
        } finally {
            withContext(Dispatchers.Main) {LearningContent.install(original,originalWords)}
            directory.deleteRecursively()
        }
    }
}
