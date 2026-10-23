package com.yurken.englishtales.data

import android.content.Context
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
    private val files=listOf("deleted-account-cleanup","quest_chests","league_memory","game_records","avatar_choice")

    private fun isolated(test: (Context)->Unit) {
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
        try {test(context)} finally {
            files.forEach {context.getSharedPreferences(it,0).edit().clear().commit()}
            folder.deleteRecursively()
        }
    }

    private fun seed(context: Context,owner: String) {
        context.getSharedPreferences("quest_chests",0).edit().putInt("$owner:total",50).putInt("$owner:day:2026-10-22",30).commit()
        context.getSharedPreferences("league_memory",0).edit().putString("$owner:week","2026-10-19").putInt("$owner:rank",3).putString("$owner:celebrated","2026-10-12").commit()
        context.getSharedPreferences("game_records",0).edit().putInt("$owner:combo:2026-10-22",7).putLong("$owner:match:6",12_000L).putString("$owner:freeze_shown","2026-10-21").commit()
        context.getSharedPreferences("avatar_choice",0).edit().putInt(owner,2).commit()
    }

    private fun keys(context: Context,owner: String)=files.drop(1).flatMap {name ->
        context.getSharedPreferences(name,0).all.keys.filter {it==owner || it.startsWith("$owner:")}.map {"$name/$it"}
    }.toSet()

    private fun assertRetained(context: Context,owner: String) {
        assertEquals(50,context.getSharedPreferences("quest_chests",0).getInt("$owner:total",0))
        assertEquals(3,context.getSharedPreferences("league_memory",0).getInt("$owner:rank",0))
        assertEquals(7,context.getSharedPreferences("game_records",0).getInt("$owner:combo:2026-10-22",0))
        assertEquals(2,context.getSharedPreferences("avatar_choice",0).getInt(owner,-1))
        assertEquals(9,keys(context,owner).size)
    }

    @Test fun restartCleanupOnlyDeletesAcknowledgedOwnerAndRetainsGuestAndOtherAccount() = isolated {context ->
        val deleted=LearningOwner.Account(UUID.randomUUID().toString());val other=LearningOwner.Account(UUID.randomUUID().toString())
        LearningStore(context,deleted).use {it.saveWords(listOf("quiet"))}
        LearningStore(context,other).use {it.saveWords(listOf("boat"))}
        LearningStore(context,LearningOwner.Guest).use {it.saveWords(listOf("morning"))}
        seed(context,deleted.id);seed(context,other.id);seed(context,LearningOwner.Guest.id)
        DeletedAccountCleanup.record(context,deleted.id)
        assertEquals(setOf(deleted.id),DeletedAccountCleanup.pending(context))
        DeletedAccountCleanup.clean(context);DeletedAccountCleanup.clean(context)
        assertTrue(DeletedAccountCleanup.pending(context).isEmpty());assertFalse(context.getDatabasePath(deleted.databaseName).exists())
        assertTrue(keys(context,deleted.id).isEmpty())
        assertRetained(context,other.id);assertRetained(context,LearningOwner.Guest.id)
        LearningStore(context,other).use {assertEquals(setOf("boat"),it.snapshot().savedWordIds)}
        LearningStore(context,LearningOwner.Guest).use {assertEquals(setOf("morning"),it.snapshot().savedWordIds)}
    }

    @Test fun restartCleanupRemovesPreferencesLeftAfterDatabaseWasAlreadyDeleted() = isolated {context ->
        val deleted=LearningOwner.Account(UUID.randomUUID().toString())
        seed(context,deleted.id);seed(context,LearningOwner.Guest.id)
        DeletedAccountCleanup.record(context,deleted.id)
        DeletedAccountCleanup.clean(context)
        assertTrue(DeletedAccountCleanup.pending(context).isEmpty());assertTrue(keys(context,deleted.id).isEmpty())
        assertRetained(context,LearningOwner.Guest.id)
    }

    @Test fun directEraseRemovesOnlyThatAccountsPreferencesAndIsIdempotent() = isolated {context ->
        val deleted=LearningOwner.Account(UUID.randomUUID().toString());val other=LearningOwner.Account(UUID.randomUUID().toString())
        seed(context,deleted.id);seed(context,other.id);seed(context,LearningOwner.Guest.id)
        // Exact avatar key only: a look-alike key for the deleted owner in that file is not owner data.
        context.getSharedPreferences("avatar_choice",0).edit().putInt("${deleted.id}:other",4).commit()
        context.getSharedPreferences("quest_chests",0).edit().putInt("${deleted.id.uppercase()}:total",20).commit()
        LearningStore(context,deleted).use {it.saveWords(listOf("quiet"));it.eraseDeletedAccount()}
        assertFalse(context.getDatabasePath(deleted.databaseName).exists())
        assertEquals(setOf("avatar_choice/${deleted.id}:other"),keys(context,deleted.id))
        assertFalse(context.getSharedPreferences("quest_chests",0).contains("${deleted.id.uppercase()}:total"))
        LearningStore(context,deleted).use {it.eraseDeletedAccount()}
        DeletedAccountPreferences.erase(context,deleted)
        assertEquals(setOf("avatar_choice/${deleted.id}:other"),keys(context,deleted.id))
        assertRetained(context,other.id);assertRetained(context,LearningOwner.Guest.id)
    }

    @Test fun failedPreferenceCommitKeepsReceiptUntilRestartRetrySucceeds() = isolated {context ->
        val deleted=LearningOwner.Account(UUID.randomUUID().toString())
        seed(context,deleted.id)
        DeletedAccountCleanup.record(context,deleted.id)
        val failing=object: ContextWrapper(context) {
            override fun getSharedPreferences(name: String,mode: Int): SharedPreferences {
                val original=context.getSharedPreferences(name,mode)
                if(name!="quest_chests") return original
                return object: SharedPreferences by original {
                    override fun edit(): SharedPreferences.Editor {
                        val edit=original.edit()
                        return object: SharedPreferences.Editor by edit {override fun commit()=false}
                    }
                }
            }
        }
        try {DeletedAccountCleanup.clean(failing);fail("Failed preference commit must not complete cleanup")}
        catch(expected: IllegalStateException) {assertEquals(setOf(deleted.id),DeletedAccountCleanup.pending(context))}
        DeletedAccountCleanup.clean(context)
        assertTrue(DeletedAccountCleanup.pending(context).isEmpty());assertTrue(keys(context,deleted.id).isEmpty())
    }

    @Test fun completeAcceptsNonCanonicalUserId() = isolated {context ->
        val user=UUID.randomUUID().toString()
        DeletedAccountCleanup.record(context,user.uppercase())
        assertEquals(setOf(user),DeletedAccountCleanup.pending(context))
        DeletedAccountCleanup.complete(context,user.uppercase())
        assertTrue(DeletedAccountCleanup.pending(context).isEmpty())
    }
}
