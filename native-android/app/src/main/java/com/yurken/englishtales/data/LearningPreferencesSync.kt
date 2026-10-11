package com.yurken.englishtales.data

import org.json.JSONObject
import java.time.ZoneId

internal data class LearningPreferenceDraft(val name: String,val level: String,val genre: String,val goal: Int) {
    fun matches(p: CloudLearningProfile)=name==p.name && level==p.level && genre==p.genre && goal==p.goal
}

internal object LearningPreferencesSync {
    fun draft(store: LearningStore): LearningPreferenceDraft? = store.transferTransaction {db ->
        db.query("SELECT name,level,genre,goal,preferences_dirty FROM local_profile WHERE id=1").use {
            check(it.moveToFirst())
            if(it.getInt(4)==0) null else LearningPreferenceDraft(it.getString(0),it.getString(1),it.getString(2),it.getInt(3))
        }
    }
    fun write(store: LearningStore,accounts: AccountService,transport: LearningSyncTransport,current: ()->Boolean): Boolean {
        val state=store.cloudState()?:return false
        if(state.preferencesConflict) return false
        val draft=draft(store)?:return false
        val remote=LearningCloudSnapshot.decode(JSONObject(state.snapshotJson),store.owner.id).profile
        if(remote!=null && remote.version==state.preferencesVersion && draft.matches(remote) && remote.timezone==ZoneId.systemDefault().id) {
            store.transferTransaction {db ->
                if(!current()) throw LearningSyncFailure("account_scope_changed")
                db.execSQL("UPDATE local_profile SET preferences_dirty=0 WHERE id=1 AND name=? AND level=? AND genre=? AND goal=?",
                    arrayOf<Any?>(draft.name,draft.level,draft.genre,draft.goal))
                if(!current()) throw LearningSyncFailure("account_scope_changed")
            }
            return true
        }
        val user=store.owner.id
        fun checkScope() {if(!current() || accounts.current?.userId!=user) throw LearningSyncFailure("account_scope_changed")}
        checkScope()
        val body=JSONObject().put("p_expected_version",state.preferencesVersion?:1L)
            .put("p_name",draft.name).put("p_level",draft.level).put("p_genre",draft.genre).put("p_goal",draft.goal)
            .put("p_timezone",ZoneId.systemDefault().id)
        try {
            val token=accounts.accessToken(user);checkScope()
            val response=transport.call("save_learning_preferences",body,token);checkScope()
            // Reuse the strict profile decoder; a response must acknowledge our exact owner/fields.
            if(response.getString("user_id")!=user) throw LearningSyncFailure("invalid_response")
            val json=LearningCloudSnapshot(user,System.currentTimeMillis(),null,emptyList(),emptyList(),emptyList(),emptyList()).json()
                .put("profile",response)
            val profile=checkNotNull(LearningCloudSnapshot.decode(json,user).profile)
            if(!draft.matches(profile) || profile.timezone!=body.getString("p_timezone") || profile.version!=(state.preferencesVersion?:1L)+1)
                throw LearningSyncFailure("invalid_response")
            store.transferTransaction {db ->
                checkScope()
                val latest=store.cloudState()
                if(latest?.preferencesVersion!=state.preferencesVersion) throw LearningSyncFailure("preferences_scope_changed")
                db.execSQL("UPDATE local_profile SET preferences_dirty=0 WHERE id=1 AND name=? AND level=? AND genre=? AND goal=?",
                    arrayOf<Any?>(draft.name,draft.level,draft.genre,draft.goal))
                db.execSQL("UPDATE learning_cloud_state SET preferences_version=?,preferences_conflict=0 WHERE id=1",arrayOf<Any?>(profile.version))
                checkScope()
            }
            return true
        } catch(failure: LearningSyncFailure) {
            if(failure.code=="40001" && current()) store.transferTransaction {db ->
                checkScope();db.execSQL("UPDATE learning_cloud_state SET preferences_conflict=1 WHERE id=1");checkScope()
            }
            throw failure
        }
    }
    fun resolve(store: LearningStore,useLocal: Boolean) = store.transferTransaction {db ->
        val state=store.cloudState()?:return@transferTransaction
        if(!state.preferencesConflict) return@transferTransaction
        if(!useLocal) {
            val remote=LearningCloudSnapshot.decode(JSONObject(state.snapshotJson),store.owner.id).profile?:return@transferTransaction
            db.execSQL("UPDATE local_profile SET name=?,level=?,genre=?,goal=?,preferences_dirty=0 WHERE id=1",
                arrayOf<Any?>(remote.name,remote.level,remote.genre,remote.goal))
        }
        db.execSQL("UPDATE learning_cloud_state SET preferences_conflict=0 WHERE id=1")
    }
}
