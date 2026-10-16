package com.yurken.englishtales.data

import android.content.ContentValues
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.UUID

data class GuestTransferPreview(val words: Int,val points: Int,val stories: Int,val lessons: Int,val pending: Boolean=false,val blocked: Boolean=false)
class GuestTransferFailure(val code: String): Exception("Guest transfer could not be completed")

/** Cross-database saga: claim/reset source, atomic target import, acknowledge source. */
object GuestTransfer {
    private val tables=listOf("saved_words","story_progress","learning_stats","learning_days","engagement_events","earned_badges","local_profile","learning_outbox","session_drafts","favorite_stories","personal_words")
    private fun rows(db: SupportSQLiteDatabase,table: String): JSONArray {
        val result=JSONArray()
        db.query("SELECT * FROM $table").use {c -> while(c.moveToNext()) {
            val row=JSONObject()
            c.columnNames.forEachIndexed {i,name -> row.put(name,when(c.getType(i)) {
                Cursor.FIELD_TYPE_NULL -> JSONObject.NULL
                Cursor.FIELD_TYPE_INTEGER -> c.getLong(i)
                else -> c.getString(i)
            })}
            result.put(row)
        }}
        return result
    }
    private fun pending(db: SupportSQLiteDatabase): JSONObject? {
        db.query("SELECT id,target_user_id,payload FROM guest_transfers WHERE state='pending'").use {c ->
            if(!c.moveToFirst()) return null
            val result=JSONObject().put("id",c.getString(0)).put("target",c.getString(1)).put("payload",c.getString(2))
            check(!c.moveToNext());return result
        }
    }
    private fun capture(db: SupportSQLiteDatabase): JSONObject=JSONObject().also {root -> tables.forEach {root.put(it,rows(db,it))}}
    private fun preview(root: JSONObject,pending: Boolean=false,blocked: Boolean=false): GuestTransferPreview {
        val stats=root.getJSONArray("learning_stats").getJSONObject(0)
        return GuestTransferPreview(root.getJSONArray("saved_words").length(),stats.getInt("points"),root.getJSONArray("story_progress").length(),stats.getInt("completed_lessons"),pending,blocked)
    }
    fun preview(source: LearningStore,target: String): GuestTransferPreview? {
        require(source.owner is LearningOwner.Guest)
        return source.transferTransaction {db ->
            pending(db)?.let {return@transferTransaction preview(JSONObject(it.getString("payload")),true,it.getString("target")!=target)}
            val result=preview(capture(db))
            result.takeIf {it.words>0 || it.points>0 || it.stories>0 || it.lessons>0 || rows(db,"learning_days").length()>0 || rows(db,"learning_outbox").length()>0}
        }
    }
    fun claim(source: LearningStore,target: String): String? {
        require(source.owner is LearningOwner.Guest);UUID.fromString(target)
        return source.transferTransaction {db ->
            pending(db)?.let {
                if(it.getString("target")!=target) throw GuestTransferFailure("different_target")
                return@transferTransaction it.toString()
            }
            val root=capture(db);val summary=preview(root)
            if(summary.words==0 && summary.points==0 && summary.stories==0 && summary.lessons==0 && root.getJSONArray("learning_days").length()==0 && root.getJSONArray("learning_outbox").length()==0) return@transferTransaction null
            val payload=root.toString()
            if(payload.toByteArray(Charsets.UTF_8).size>2_000_000) throw GuestTransferFailure("snapshot_too_large")
            val claim=JSONObject().put("id",UUID.randomUUID().toString()).put("target",target).put("payload",payload)
            db.insert("guest_transfers",SQLiteDatabase.CONFLICT_ABORT,ContentValues().apply {
                put("id",claim.getString("id"));put("target_user_id",target);put("payload",payload);put("state","pending");put("created_at",System.currentTimeMillis())
            })
            tables.filter {it!="local_profile"}.forEach {db.execSQL("DELETE FROM $it")}
            db.execSQL("INSERT INTO learning_stats(id) VALUES(1)")
            db.execSQL("UPDATE local_profile SET last_story_id=NULL WHERE id=1")
            claim.toString()
        }
    }
    fun acknowledge(source: LearningStore,claim: String) {
        require(source.owner is LearningOwner.Guest)
        val data=JSONObject(claim)
        source.transferTransaction {db -> db.execSQL("UPDATE guest_transfers SET state='completed',payload='{}' WHERE id=? AND target_user_id=? AND state='pending'",
            arrayOf(data.getString("id"),data.getString("target")))}
    }
    fun import(target: LearningStore,claim: String): Boolean {
        require(target.owner is LearningOwner.Account)
        val data=JSONObject(claim)
        if(data.getString("target")!=target.owner.id) throw GuestTransferFailure("different_target")
        val id=UUID.fromString(data.getString("id")).toString();val payload=data.getString("payload")
        val hash=MessageDigest.getInstance("SHA-256").digest(payload.toByteArray(Charsets.UTF_8)).joinToString("") {"%02x".format(it)}
        val root=JSONObject(payload)
        return target.transferTransaction {db ->
            find(db,"guest_imports","id",id)?.let {
                if(it.getString("payload_hash")!=hash) throw GuestTransferFailure("payload_conflict")
                return@transferTransaction false
            }
            val outbox=root.getJSONArray("learning_outbox").objects()
            val drafts=root.getJSONArray("session_drafts").objects().filter {it.getString("state")=="completed"}
            if(outbox.any {find(db,"learning_outbox","id",it.getString("id"))!=null} || drafts.any {find(db,"session_drafts","id",it.getString("id"))!=null}) throw GuestTransferFailure("operation_conflict")
            val accountEvents=rows(db,"engagement_events").objects().map {it.getString("event_id")}.toSet()
            val guestEvents=root.getJSONArray("engagement_events").objects()
            if(guestEvents.any {it.getString("event_id").startsWith("lesson:") && it.getString("event_id") in accountEvents}) throw GuestTransferFailure("operation_conflict")
            val duplicateReads=guestEvents.filter {it.getString("event_id").startsWith("read:") && it.getString("event_id") in accountEvents}
                .groupingBy {it.getString("event_id").takeLast(10)}.eachCount()
            // Account word history takes precedence, including tombstones in the outbox.
            val accountWordHistory=rows(db,"learning_outbox").objects().filter {it.getString("rpc")=="apply_word_event"}
                .map {JSONObject(it.getString("payload")).getString("wordId")}.toMutableSet()
            // Another device's cloud tombstone is account history too.
            rows(db,"learning_cloud_state").objects().singleOrNull()?.let { cloud ->
                JSONObject(cloud.getString("snapshot_json")).getJSONArray("words").objects().forEach {accountWordHistory+=it.getString("word_id")}
            }
            root.getJSONArray("saved_words").objects().forEach {word ->
                val key=word.getString("word_id")
                if(key !in accountWordHistory && find(db,"saved_words","word_id",key)==null) insert(db,"saved_words",word)
            }
            root.getJSONArray("story_progress").objects().forEach {guest ->
                val old=find(db,"story_progress","story_id",guest.getString("story_id"))
                val sameRevision=old!=null && old.optString("revision_id")==guest.optString("revision_id")
                val newest=if(old!=null && old.getLong("updated_at")>=guest.getLong("updated_at")) JSONObject(old.toString()) else JSONObject(guest.toString())
                if(sameRevision) newest.put("percent",maxOf(old!!.getInt("percent"),guest.getInt("percent")))
                insert(db,"story_progress",newest,SQLiteDatabase.CONFLICT_REPLACE)
            }
            val sourceDays=JSONObject(payload).getJSONArray("learning_days").objects()
            root.getJSONArray("learning_days").objects().forEach {guest ->
                val day=guest.getString("day");val old=find(db,"learning_days","day",day)
                val deduplicated=duplicateReads[day]?:0
                guest.put("sessions",sum(old?.getInt("sessions")?:0,(guest.getInt("sessions")-deduplicated).coerceAtLeast(0)))
                guest.put("readings",sum(old?.getInt("readings")?:0,(guest.getInt("readings")-deduplicated).coerceAtLeast(0)))
                insert(db,"learning_days",guest,SQLiteDatabase.CONFLICT_REPLACE)
            }
            guestEvents.forEach {insert(db,"engagement_events",it,SQLiteDatabase.CONFLICT_IGNORE)}
            root.getJSONArray("earned_badges").objects().forEach {insert(db,"earned_badges",it,SQLiteDatabase.CONFLICT_IGNORE)}
            // Payloads written before F09 have no favorites; the account keeps its own when both have one.
            root.optJSONArray("favorite_stories")?.objects()?.forEach {insert(db,"favorite_stories",it,SQLiteDatabase.CONFLICT_IGNORE)}
            // Saved glossary words need their meaning on the account device too (Q4.3a); older payloads have none.
            root.optJSONArray("personal_words")?.objects()?.forEach {insert(db,"personal_words",it,SQLiteDatabase.CONFLICT_IGNORE)}
            val guestStats=root.getJSONArray("learning_stats").getJSONObject(0)
            val oldStats=rows(db,"learning_stats").getJSONObject(0)
            oldStats.put("points",sum(oldStats.getInt("points"),guestStats.getInt("points")))
            oldStats.put("completed_lessons",sum(oldStats.getInt("completed_lessons"),guestStats.getInt("completed_lessons")))
            val days=rows(db,"learning_days").objects().filter {it.getInt("sessions")>0}.map {it.getString("day")}.toSet()
            val last=days.maxOrNull()
            var streak=0
            if(last!=null) {
                val format=SimpleDateFormat("yyyy-MM-dd",Locale.US).apply {isLenient=false}
                val calendar=Calendar.getInstance().apply {time=checkNotNull(format.parse(last))}
                while(format.format(calendar.time) in days) {streak++;calendar.add(Calendar.DAY_OF_YEAR,-1)}
            }
            oldStats.put("streak",streak).put("last_study_day",last?:JSONObject.NULL)
            insert(db,"learning_stats",oldStats,SQLiteDatabase.CONFLICT_REPLACE)
            val oldProfile=rows(db,"local_profile").getJSONObject(0)
            if(oldProfile.getInt("onboarding_done")==0) insert(db,"local_profile",root.getJSONArray("local_profile").getJSONObject(0).put("preferences_dirty",1),SQLiteDatabase.CONFLICT_REPLACE)
            val sessions=outbox.filter {it.getString("rpc")=="submit_learning_session" && it.getString("state")=="pending"}.map {JSONObject(it.getString("payload"))}
            val modernPoints=sessions.filter {it.getString("kind")!="reading"}.sumOf {it.getInt("correctAnswers")*5}
            val legacyPoints=(guestStats.getInt("points")-modernPoints).coerceAtLeast(0)
            val legacyLessons=(guestStats.getInt("completed_lessons")-sessions.count {it.getString("kind")!="reading"}).coerceAtLeast(0)
            val legacyDays=JSONObject()
            sourceDays.forEach {day ->
                val key=day.getString("day")
                // Export the device-only baseline; full modern events retain their original timestamps.
                val modernOnDay=sessions.filter {eventDay(it)==key}
                val modernReads=modernOnDay.filter {it.getString("kind")=="reading"}.map {session -> drafts.firstOrNull {it.getString("id")==session.getString("id")}?.optString("story_id")?.takeIf {it.isNotBlank()} ?: session.optString("storyRevisionId")}.distinct().size
                val modernLessons=modernOnDay.count {it.getString("kind")!="reading"}
                val before=day
                legacyDays.put(key,JSONObject().put("sessions",(before.getInt("sessions")-modernReads-modernLessons).coerceAtLeast(0)).put("readings",(before.getInt("readings")-modernReads).coerceAtLeast(0)))
            }
            outbox.forEach {
                if(it.getString("rpc")=="apply_word_event" && JSONObject(it.getString("payload")).getString("wordId") in accountWordHistory) {
                    it.put("state","blocked").put("error_code","account_word_precedence")
                }
                insert(db,"learning_outbox",it.put("owner_id",target.owner.id))
            }
            drafts.forEach {insert(db,"session_drafts",it)}
            insert(db,"guest_imports",JSONObject().put("id",id).put("payload_hash",hash).put("legacy_points",legacyPoints).put("legacy_lessons",legacyLessons).put("legacy_days",legacyDays.toString()).put("imported_at",System.currentTimeMillis()))
            LearningReconciliation.rebaseAfterGuestImport(db,target.owner.id)
            true
        }
    }
    fun transfer(source: LearningStore,target: LearningStore): Boolean {
        val claim=claim(source,target.owner.id)?:return false
        val applied=import(target,claim);acknowledge(source,claim);return applied
    }
    private fun sum(a: Int,b: Int): Int=(a.toLong()+b).also {require(it in 0..Int.MAX_VALUE.toLong())}.toInt()
    private fun eventDay(event: JSONObject): String {
        val utc=SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",Locale.US).apply {timeZone=java.util.TimeZone.getTimeZone("UTC");isLenient=false}
        val day=SimpleDateFormat("yyyy-MM-dd",Locale.US).apply {timeZone=java.util.TimeZone.getTimeZone(event.getString("studyTimezone"))}
        return day.format(checkNotNull(utc.parse(event.getString("finishedAt"))))
    }
    private fun JSONArray.objects(): List<JSONObject> = (0 until length()).map {getJSONObject(it)}
    private fun find(db: SupportSQLiteDatabase,table: String,key: String,value: String): JSONObject? {
        db.query("SELECT * FROM $table WHERE $key=?",arrayOf(value)).use {c ->
            if(!c.moveToFirst()) return null
            return JSONObject().also {row ->c.columnNames.forEachIndexed {i,name ->row.put(name,if(c.isNull(i)) JSONObject.NULL else if(c.getType(i)==Cursor.FIELD_TYPE_INTEGER) c.getLong(i) else c.getString(i))}}
        }
    }
    private fun insert(db: SupportSQLiteDatabase,table: String,row: JSONObject,conflict: Int=SQLiteDatabase.CONFLICT_ABORT) {
        val values=ContentValues()
        row.keys().forEach {key ->val value=row.get(key);when(value) {
            JSONObject.NULL -> values.putNull(key)
            is Number -> values.put(key,value.toLong())
            else -> values.put(key,value.toString())
        }}
        db.insert(table,conflict,values)
    }
}
