package com.yurken.englishtales.data

import android.content.Context

/** Durable receipts contain only owners whose deletion was acknowledged by the server. */
internal object DeletedAccountCleanup {
    private fun prefs(context: Context)=context.getSharedPreferences("deleted-account-cleanup",Context.MODE_PRIVATE)
    @Synchronized fun pending(context: Context)=prefs(context).getStringSet("owners",emptySet())!!.toSet()
    @Synchronized fun record(context: Context,user: String) {
        val id=LearningOwner.Account(user).id
        check(prefs(context).edit().putStringSet("owners",pending(context)+id).commit())
    }
    @Synchronized fun complete(context: Context,user: String) {
        check(prefs(context).edit().putStringSet("owners",pending(context)-user).commit())
    }
    fun clean(context: Context) {
        for(user in pending(context)) {
            val owner=LearningOwner.Account(user)
            LearningStore(context,LearningOwner.Guest).use {it.forgetTransferTarget(user)}
            LearningDatabase.detach(context,owner)
            val path=context.getDatabasePath(owner.databaseName)
            check(!path.exists() || context.deleteDatabase(owner.databaseName))
            complete(context,user)
        }
    }
}
