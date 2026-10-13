package com.yurken.englishtales.data

import android.content.ContextWrapper
import android.content.SharedPreferences
import android.database.DatabaseErrorHandler
import android.database.sqlite.SQLiteDatabase
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.util.UUID

class DeletedAccountCleanupTest {
    @Test fun restartCleanupOnlyDeletesAcknowledgedOwnerAndRetainsGuestAndOtherAccount() {
        val target=InstrumentationRegistry.getInstrumentation().targetContext
        val namespace="cleanup-test-${UUID.randomUUID()}"
        val folder=File(target.cacheDir,namespace).apply {mkdirs()}
        val context=object: ContextWrapper(target) {
            override fun getDatabasePath(name: String)=File(folder,name)
            override fun deleteDatabase(name: String)=SQLiteDatabase.deleteDatabase(File(folder,name))
            override fun getSharedPreferences(name: String,mode: Int): SharedPreferences=target.getSharedPreferences("$namespace-$name",mode)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?)=SQLiteDatabase.openOrCreateDatabase(File(folder,name),factory)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?,handler: DatabaseErrorHandler?)=SQLiteDatabase.openOrCreateDatabase(File(folder,name).absolutePath,factory,handler)
        }
        val deleted=LearningOwner.Account(UUID.randomUUID().toString());val other=LearningOwner.Account(UUID.randomUUID().toString())
        try {
            LearningStore(context,deleted).use {it.saveWords(listOf("quiet"))}
            LearningStore(context,other).use {it.saveWords(listOf("boat"))}
            LearningStore(context,LearningOwner.Guest).use {it.saveWords(listOf("morning"))}
            DeletedAccountCleanup.record(context,deleted.id)
            assertEquals(setOf(deleted.id),DeletedAccountCleanup.pending(context))
            DeletedAccountCleanup.clean(context);DeletedAccountCleanup.clean(context)
            assertTrue(DeletedAccountCleanup.pending(context).isEmpty());assertFalse(context.getDatabasePath(deleted.databaseName).exists())
            LearningStore(context,other).use {assertEquals(setOf("boat"),it.snapshot().savedWordIds)}
            LearningStore(context,LearningOwner.Guest).use {assertEquals(setOf("morning"),it.snapshot().savedWordIds)}
        } finally {
            context.getSharedPreferences("deleted-account-cleanup",0).edit().clear().commit()
            folder.deleteRecursively()
        }
    }
}
