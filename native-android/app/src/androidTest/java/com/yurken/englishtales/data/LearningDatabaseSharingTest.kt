package com.yurken.englishtales.data

import android.content.Context
import android.content.ContextWrapper
import android.content.SharedPreferences
import android.database.DatabaseErrorHandler
import android.database.sqlite.SQLiteDatabase
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.io.File
import java.util.UUID

class LearningDatabaseSharingTest {
    private lateinit var folder: File
    private lateinit var context: Context
    private val owner=LearningOwner.Account(UUID.randomUUID().toString())
    @Before fun setup() {
        val target=InstrumentationRegistry.getInstrumentation().targetContext
        val namespace="sharing-test-${UUID.randomUUID()}"
        folder=File(target.cacheDir,namespace).apply {mkdirs()}
        context=object: ContextWrapper(target) {
            override fun getDatabasePath(name: String)=File(folder,name)
            override fun deleteDatabase(name: String)=SQLiteDatabase.deleteDatabase(File(folder,name))
            override fun getSharedPreferences(name: String,mode: Int): SharedPreferences=target.getSharedPreferences("$namespace-$name",mode)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?)=SQLiteDatabase.openOrCreateDatabase(File(folder,name),factory)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?,handler: DatabaseErrorHandler?)=SQLiteDatabase.openOrCreateDatabase(File(folder,name).absolutePath,factory,handler)
        }
    }
    @After fun cleanup() {folder.deleteRecursively()}

    @Test fun sameOwnerSharesOneInstanceUntilTheLastHolderReleases() {
        val first=LearningDatabase.acquire(context,owner);val second=LearningDatabase.acquire(context,owner)
        val guest=LearningDatabase.acquire(context,LearningOwner.Guest)
        try {
            assertSame(first,second);assertNotSame(first,guest)
            first.offline().profile()
            LearningDatabase.release(first)
            assertTrue(second.isOpen);assertNotNull(second.offline().profile())
            LearningDatabase.release(second)
            assertFalse(second.isOpen)
            val fresh=LearningDatabase.acquire(context,owner)
            try {assertNotSame(second,fresh);assertNotNull(fresh.offline().profile())} finally {LearningDatabase.release(fresh)}
        } finally {LearningDatabase.release(guest)}
    }
    @Test fun storesOfOneOwnerSeeEachOtherAndCloseIsIdempotent() {
        LearningStore(context,owner).use {widget ->
            LearningStore(context,owner).use {app ->
                app.saveWords(listOf("quiet"))
                assertEquals(setOf("quiet"),widget.snapshot().savedWordIds)
                app.close();app.close()
                assertEquals(setOf("quiet"),widget.snapshot().savedWordIds)
            }
        }
    }
    @Test fun erasedAccountIsRebuiltFreshInsteadOfServedFromTheCache() {
        val holder=LearningStore(context,owner)
        try {
            LearningStore(context,owner).use {it.saveWords(listOf("quiet"));it.eraseDeletedAccount()}
            assertFalse(context.getDatabasePath(owner.databaseName).exists())
            LearningStore(context,owner).use {assertTrue(it.snapshot().savedWordIds.isEmpty())}
        } finally {holder.close()}
    }
}
