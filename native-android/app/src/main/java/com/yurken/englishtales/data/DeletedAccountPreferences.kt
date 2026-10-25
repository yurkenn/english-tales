package com.yurken.englishtales.data

import android.content.Context

/** Device-local preferences keyed by a learning owner; only the deleted account's own keys are removed. */
internal object DeletedAccountPreferences {
    /** Files whose keys are `OWNER:...`: chest points, league place and game records. */
    private val prefixed=listOf("quest_chests","league_memory","game_records")
    /** Files whose key is exactly the owner id. */
    private val exact=listOf("avatar_choice")

    /** Idempotent; each file is written synchronously so a confirmed receipt is only completed after the keys are gone. */
    fun erase(context: Context,owner: LearningOwner.Account) {
        val id=owner.id
        for(name in prefixed) remove(context,name) {it.length>id.length && it[id.length]==':' && it.startsWith(id,ignoreCase=true)}
        for(name in exact) remove(context,name) {it.equals(id,ignoreCase=true)}
    }

    private fun remove(context: Context,name: String,matches: (String)->Boolean) {
        val prefs=context.getSharedPreferences(name,Context.MODE_PRIVATE)
        val keys=prefs.all.keys.filter(matches)
        if(keys.isEmpty()) return
        val edit=prefs.edit()
        keys.forEach {edit.remove(it)}
        check(edit.commit()) {"Deleted account preferences cleanup is pending"}
    }
}
