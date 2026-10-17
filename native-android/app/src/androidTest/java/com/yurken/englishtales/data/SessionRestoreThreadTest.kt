package com.yurken.englishtales.data

import android.app.Application
import android.content.Context
import android.os.Looper
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelStore
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.TimeUnit

/** Opening the app must not decrypt the stored session on the main thread (ANR risk on slow keystores). */
class SessionRestoreThreadTest {
    private class Recording: SessionStorage {
        val reads=CopyOnWriteArrayList<Boolean>()
        override fun read(): AccountSession? {reads+=Looper.myLooper()==Looper.getMainLooper();return null}
        override fun write(session: AccountSession) {}
        override fun clear() {}
    }
    private fun await(predicate: ()->Boolean) {
        val deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(10)
        while(!predicate() && System.nanoTime()<deadline) Thread.sleep(20)
        assertTrue(predicate())
    }

    @Test fun constructingTheAppViewModelReadsTheSessionOnlyOffTheMainThread() {
        val instrumentation=InstrumentationRegistry.getInstrumentation()
        val application=instrumentation.targetContext.applicationContext as Application
        val reminders=application.getSharedPreferences("reminders",Context.MODE_PRIVATE)
        val owner=reminders.getString("learning_owner",null)
        val storage=Recording();val holder=ViewModelStore()
        LearningSyncRuntime.resetForTest {storage}
        try {
            // Each read records its thread, so a read during construction on the main thread shows up below.
            var vm: LearningViewModel?=null
            instrumentation.runOnMainSync {vm=ViewModelProvider(holder,ViewModelProvider.AndroidViewModelFactory.getInstance(application))[LearningViewModel::class.java]}
            await {vm!!.ready.value}
            assertTrue(storage.reads.isNotEmpty())
            assertFalse("Session storage was read on the main thread",storage.reads.any {it})
            // The once-only restore is not repeated by later callers such as the sync worker.
            val count=storage.reads.size
            assertSame(LearningSyncRuntime.accounts(application),LearningSyncRuntime.ensureRestored(application))
            assertEquals(count,storage.reads.size)
        } finally {
            instrumentation.runOnMainSync {holder.clear()}
            LearningSyncRuntime.resetForTest()
            reminders.edit().putString("learning_owner",owner).commit()
        }
    }
}
