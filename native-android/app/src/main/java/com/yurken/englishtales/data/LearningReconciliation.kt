package com.yurken.englishtales.data

import android.content.ContentValues
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import org.json.JSONArray
import org.json.JSONObject
import java.net.URI
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId

/** Caller owns the Room transaction and serial account scope. No network requests occur here. */
internal object LearningReconciliation {
    private data class Session(val id: String, val kind: String, val story: String?, val revision: String?,
        val day: String, val points: Int, val finishedAt: Long)
    private data class Totals(val points: Int, val lessons: Int, val days: Map<String, Pair<Int,Int>>, val reads: Set<String>)
    private fun checked(value: Long): Int { require(value in 0..Int.MAX_VALUE.toLong()); return value.toInt() }
    private fun readKey(story: String, day: String) = "read:$story:$day"
    private fun instant(value: String) = OffsetDateTime.parse(value).toInstant()

    fun apply(db: SupportSQLiteDatabase, owner: LearningOwner, input: LearningCloudSnapshot,
              source: String, now: Long, isCurrentScope: ()->Boolean): Boolean {
        fun scope() {
            if (owner !is LearningOwner.Account || input.userId != owner.id || !isCurrentScope())
                throw LearningSyncFailure("account_scope_changed")
        }
        scope()
        // Validate also callers that construct a DTO directly, before any database mutation.
        val json = input.json()
        val cloud = LearningCloudSnapshot.decode(json, owner.id)
        val uri = URI(source)
        require(uri.scheme == "https" && uri.host != null && uri.userInfo == null && uri.query == null && uri.fragment == null)
        require(uri.path.isNullOrEmpty() || uri.path == "/")
        val normalizedSource = source.trimEnd('/')
        val old = rows(db,"learning_cloud_state").singleOrNull()
        if (old != null) {
            if (old.getString("source") != normalizedSource) throw LearningSyncFailure("cloud_source_changed")
            val previous = JSONObject(old.getString("snapshot_json"))
            if (instant(cloud.capturedAtIso) < instant(previous.getString("capturedAt"))) return false
            // Journals/revisions are append-only; removals are explicit word tombstones.
            // A partial/reset response must never erase an already accepted cloud history.
            val former = LearningCloudSnapshot.decode(previous,owner.id)
            if ((former.profile!=null && cloud.profile==null) ||
                !cloud.sessions.map { it.id }.toSet().containsAll(former.sessions.map { it.id }) ||
                !cloud.words.map { it.id }.toSet().containsAll(former.words.map { it.id }) ||
                !cloud.progress.map { it.revisionId }.toSet().containsAll(former.progress.map { it.revisionId }) ||
                !cloud.badges.map { it.id }.toSet().containsAll(former.badges.map { it.id }))
                throw LearningSyncFailure("learning_snapshot_incomplete")
            val sessionsById = cloud.sessions.associateBy { it.id }
            val progressByRevision = cloud.progress.associateBy { it.revisionId }
            if (former.sessions.any { sessionsById[it.id] != it } ||
                former.progress.any { checkNotNull(progressByRevision[it.revisionId]).percent < it.percent } ||
                (former.profile!=null && checkNotNull(cloud.profile).version < former.profile.version))
                throw LearningSyncFailure("learning_snapshot_inconsistent")
        }
        val operations = rows(db,"learning_outbox")
        require(operations.all { it.getString("owner_id") == owner.id })
        val totals = totals(db, cloud, operations)
        val baseline = old?.let { JSONObject(it.getString("baseline_json")) }
            ?: captureBaseline(db, totals(db,null,operations))
        val days = mutableMapOf<String, Pair<Int,Int>>()
        val legacyKeys = baseline.getJSONArray("readKeys").strings().toSet()
        val duplicateLegacyReads = legacyKeys.intersect(totals.reads).groupingBy { it.takeLast(10) }.eachCount()
        val baseDays = baseline.getJSONArray("days").objects()
        baseDays.forEach { d ->
            val day = d.getString("day")
            val duplicates = duplicateLegacyReads[day] ?: 0
            days[day] = (d.getInt("sessions")-duplicates).coerceAtLeast(0) to (d.getInt("readings")-duplicates).coerceAtLeast(0)
        }
        totals.days.forEach { (day, count) ->
            val before = days[day] ?: (0 to 0)
            days[day] = checked(before.first.toLong()+count.first) to checked(before.second.toLong()+count.second)
        }
        db.execSQL("DELETE FROM learning_days")
        days.filterValues { it.first > 0 || it.second > 0 }.forEach { (day,count) ->
            db.execSQL("INSERT INTO learning_days(day,sessions,readings) VALUES(?,?,?)",arrayOf<Any?>(day,count.first,count.second))
        }
        // Legacy stores may know a streak without retaining individual daily counters.
        // Preserve that evidence for the streak only; never invent sessions or answers.
        val activeDays = days.filterValues { it.first > 0 }.keys + baseline.getJSONArray("knownActiveDays").strings()
        val last = activeDays.maxOrNull()
        var streak = 0
        if (last != null) {
            var day = LocalDate.parse(last)
            while (day.toString() in activeDays) { streak++; day = day.minusDays(1) }
        }
        db.execSQL("UPDATE learning_stats SET points=?,completed_lessons=?,streak=?,last_study_day=? WHERE id=1",
            arrayOf<Any?>(checked(baseline.getLong("points")+totals.points),checked(baseline.getLong("lessons")+totals.lessons),streak,last))

        // Pending, delayed and quarantined actions keep their existing local projection.
        // A later successful upload + full snapshot replaces it with server replay results.
        val protectedWords = operations.filter { it.getString("rpc") == "apply_word_event" && it.getString("state") != "delivered" }
            .filter { it.optString("error_code") != "account_word_precedence" }
            .map { JSONObject(it.getString("payload")).getString("wordId") }.toSet()
        cloud.words.filter { it.id !in protectedWords }.forEach { w ->
            // A glossary word arrives with its text; without it this app cannot show or practise it.
            val personal = Glossary.isLookupOnly(w.id)
            if (personal && w.saved && (w.word.isNullOrBlank() || w.gloss.isNullOrBlank())) return@forEach
            if (!w.saved) {
                db.delete("saved_words","word_id=?",arrayOf(w.id))
                if (personal) db.delete("personal_words","word_id=?",arrayOf(w.id))
            } else {
                if (personal) replace(db,"personal_words",ContentValues().apply {put("word_id",w.id);put("word",w.word);put("gloss",w.gloss);put("added_at",w.updatedAt)})
                replace(db,"saved_words",ContentValues().apply {
                    put("word_id",w.id);put("learning_state",w.state);put("correct_count",w.correctCount)
                    put("next_review_at",w.dueAt ?: 0);put("interval_days",w.intervalDays);put("last_review_day",w.successDay)
                })
            }
        }
        // Q5.5: reading history only grows, so the account's rows are simply added to this device's.
        cloud.lemmaReads?.forEach { (lemma, story) -> db.insert("lemma_reads",SQLiteDatabase.CONFLICT_IGNORE,ContentValues().apply {put("lemma",lemma);put("story_id",story)}) }
        cloud.lemmaLookups?.forEach { lemma -> db.insert("lemma_lookups",SQLiteDatabase.CONFLICT_IGNORE,ContentValues().apply {put("lemma",lemma);put("looked_up_at",now)}) }
        // Favorites follow the same rule: unsent local changes win until the server has replayed them.
        val protectedFavorites = operations.filter { it.getString("rpc") == "apply_favorite_event" && it.getString("state") != "delivered" }
            .map { JSONObject(it.getString("payload")).getString("storyId") }.toSet()
        cloud.favorites?.filter { it.storyId !in protectedFavorites }?.forEach { f ->
            if (!f.favorite) db.delete("favorite_stories","story_id=?",arrayOf(f.storyId))
            else db.insert("favorite_stories",SQLiteDatabase.CONFLICT_IGNORE,ContentValues().apply {put("story_id",f.storyId);put("added_at",f.updatedAt)})
        }
        mergeProgress(db,cloud,operations)
        cloud.badges.forEach { b -> db.execSQL("INSERT OR IGNORE INTO earned_badges(badge_id,earned_at) VALUES(?,?)",arrayOf<Any?>(b.id,b.earnedAt)) }

        val profile = rows(db,"local_profile").single()
        val dirty = profile.getInt("preferences_dirty") != 0
        var conflict = old?.getInt("preferences_conflict") == 1
        cloud.profile?.let { p ->
            val equal = profile.getString("name") == p.name && profile.getString("level") == p.level &&
                profile.getString("genre") == p.genre && profile.getInt("goal") == p.goal
            if (dirty) {
                val knownVersion = old?.let { if (it.isNull("preferences_version")) null else it.getLong("preferences_version") }
                val untouched=p.version==1L && p.name=="Okuyucu" && p.level=="A1" && p.genre=="Günlük yaşam" && p.goal==1
                if (!equal && ((knownVersion == null && !untouched) || (knownVersion!=null && knownVersion != p.version))) conflict = true
            } else {
                db.execSQL("UPDATE local_profile SET name=?,level=?,genre=?,goal=?,onboarding_done=MAX(onboarding_done,?) WHERE id=1",
                    arrayOf<Any?>(p.name,p.level,p.genre,p.goal,if(p.version>1) 1 else 0))
                conflict = false
            }
        }
        // Store all server revisions and unknown word sources, including tombstones.
        replace(db,"learning_cloud_state",ContentValues().apply {
            put("id",1);put("source",normalizedSource);put("snapshot_json",json.toString());put("baseline_json",baseline.toString())
            put("preferences_version",cloud.profile?.version);put("preferences_conflict",conflict);put("applied_at",now)
        })
        // Compact session rows deduplicate totals, but do not prove the full immutable
        // payload matches. Only the original RPC's applied=true/false acknowledges it.
        cloud.sessions.filter { it.counted }.forEach { s ->
            val id = if(s.kind == "reading") readKey(checkNotNull(s.storyId),s.day) else "lesson:${s.id}"
            db.execSQL("INSERT OR IGNORE INTO engagement_events(event_id,name,created_at) VALUES(?,?,?)",
                arrayOf<Any?>(id,if(s.kind=="reading") "reading_completed" else "practice_completed",s.finishedAt))
        }
        scope() // A scope change inside any write causes the whole caller transaction to roll back.
        return true
    }

    /** The guest import already adjusted actual local totals; derive only its new device baseline. */
    fun rebaseAfterGuestImport(db: SupportSQLiteDatabase, owner: String) {
        val old = rows(db,"learning_cloud_state").singleOrNull() ?: return
        val cloud = LearningCloudSnapshot.decode(JSONObject(old.getString("snapshot_json")),owner)
        val baseline = captureBaseline(db,totals(db,cloud,rows(db,"learning_outbox")))
        val former = JSONObject(old.getString("baseline_json"))
        baseline.put("archive",former.getJSONObject("archive"))
        baseline.put("knownActiveDays",JSONArray((baseline.getJSONArray("knownActiveDays").strings()+former.getJSONArray("knownActiveDays").strings()).distinct()))
        db.execSQL("UPDATE learning_cloud_state SET baseline_json=? WHERE id=1",arrayOf(baseline.toString()))
        val active = rows(db,"learning_days").filter { it.getInt("sessions")>0 }.map { it.getString("day") }.toSet() + baseline.getJSONArray("knownActiveDays").strings()
        val last = active.maxOrNull();var streak = 0
        if(last!=null) {var day=LocalDate.parse(last);while(day.toString() in active) {streak++;day=day.minusDays(1)}}
        db.execSQL("UPDATE learning_stats SET streak=?,last_study_day=? WHERE id=1",arrayOf<Any?>(streak,last))
    }

    private fun localSessions(db: SupportSQLiteDatabase, operations: List<JSONObject>): List<Session> {
        val drafts = rows(db,"session_drafts").associateBy { it.getString("id") }
        return operations.filter { it.getString("rpc") == "submit_learning_session" }.map { row ->
            val p = JSONObject(row.getString("payload"));val id = p.getString("id")
            require(id == row.getString("id"))
            val kind = p.getString("kind");require(kind in setOf("reading","choice","card","match","spell"))
            val finish = instant(p.getString("finishedAt"))
            val day = finish.atZone(ZoneId.of(p.getString("studyTimezone"))).toLocalDate().toString()
            val revision = if (p.isNull("storyRevisionId")) null else p.getString("storyRevisionId")
            val story = if (kind=="reading") drafts[id]?.let { if(it.isNull("story_id")) null else it.getString("story_id") } else null
            require(kind!="reading" || (story!=null && revision!=null))
            val correct = p.getInt("correctAnswers");require(correct in 0..5)
            Session(id,kind,story,revision,day,if(kind=="reading") 0 else correct*5,finish.toEpochMilli())
        }
    }
    private fun totals(db: SupportSQLiteDatabase, cloud: LearningCloudSnapshot?, operations: List<JSONObject>): Totals {
        val local = localSessions(db,operations)
        val operationById = operations.associateBy { it.getString("id") }
        val remote = cloud?.sessions ?: emptyList()
        val ids = remote.associateBy { it.id }
        local.forEach { s -> ids[s.id]?.let { r ->
            val row = checkNotNull(operationById[s.id])
            if(row.optString("error_code") == "23505" || r.kind!=s.kind || r.points!=s.points || r.revisionId!=s.revision || r.day!=s.day || r.finishedAt!=s.finishedAt)
                throw LearningSyncFailure("local_cloud_operation_conflict")
        } }
        val reads = linkedSetOf<String>();val days = mutableMapOf<String, Pair<Int,Int>>()
        var points = 0L;var lessons = 0L
        fun add(kind: String, story: String?, day: String, reward: Int) {
            val reading = kind == "reading"
            if (reading && !reads.add(readKey(checkNotNull(story),day))) return
            val before = days[day] ?: (0 to 0)
            days[day] = checked(before.first.toLong()+1) to checked(before.second.toLong()+if(reading) 1 else 0)
            points += reward; if(!reading) lessons++
        }
        remote.filter { it.counted }.forEach { add(it.kind,it.storyId,it.day,it.points) }
        local.filter { it.id !in ids }.forEach { add(it.kind,it.story,it.day,it.points) }
        return Totals(checked(points),checked(lessons),days,reads)
    }
    private fun captureBaseline(db: SupportSQLiteDatabase, modern: Totals): JSONObject {
        val stats = rows(db,"learning_stats").single()
        val days = JSONArray()
        rows(db,"learning_days").forEach { d ->
            val count = modern.days[d.getString("day")] ?: (0 to 0)
            days.put(JSONObject().put("day",d.getString("day"))
                .put("sessions",(d.getInt("sessions")-count.first).coerceAtLeast(0))
                .put("readings",(d.getInt("readings")-count.second).coerceAtLeast(0)))
        }
        val keys = rows(db,"engagement_events").map { it.getString("event_id") }
            .filter { it.startsWith("read:") && it !in modern.reads }
        val streak = stats.getInt("streak").also { require(it in 0..10_000) }
        val knownDays = if(streak>0 && !stats.isNull("last_study_day")) {
            val last=LocalDate.parse(stats.getString("last_study_day"))
            List(streak) { last.minusDays(it.toLong()).toString() }
        } else emptyList()
        return JSONObject().put("points",checked(stats.getLong("points")-modern.points))
            .put("lessons",checked(stats.getLong("completed_lessons")-modern.lessons))
            .put("days",days).put("readKeys",JSONArray(keys)).put("knownActiveDays",JSONArray(knownDays))
            .put("archive",JSONObject().put("savedWords",JSONArray(rows(db,"saved_words"))).put("progress",JSONArray(rows(db,"story_progress"))))
    }

    private fun mergeProgress(db: SupportSQLiteDatabase, cloud: LearningCloudSnapshot, operations: List<JSONObject>) {
        val local = rows(db,"story_progress").associateBy { it.getString("story_id") }
        val pending = operations.filter { it.getString("rpc")=="apply_progress_event" && it.getString("state")!="delivered" }
            .map { JSONObject(it.getString("payload")) }
        // Multiple server revisions stay in snapshot_json. Display one latest cursor per story.
        cloud.progress.groupBy { it.storyId }.forEach { (story, revisions) ->
            val remote = revisions.maxWith(compareBy<CloudLearningProgress> { instant(it.eventAtIso) }.thenBy { it.eventId })
            val old = local[story]
            val oldRevision = old?.let { if(it.isNull("revision_id")) null else it.getString("revision_id") }
            val localPending = pending.filter { it.optString("storyRevisionId")==oldRevision }
            val remoteHasPending = pending.any { it.optString("storyRevisionId")==remote.revisionId }
            if (old != null && oldRevision != remote.revisionId && localPending.isNotEmpty()) return@forEach
            var percent = remote.percent
            var sentence = remote.sentenceId
            var updatedAt = remote.eventAt
            if(oldRevision == remote.revisionId && remoteHasPending) {
                percent = maxOf(percent,old.getInt("percent"))
                val last = localPending.maxWithOrNull(compareBy<JSONObject> { instant(it.getString("occurredAt")) }.thenBy { it.getString("id") })
                if(last != null && (instant(last.getString("occurredAt")) > instant(remote.eventAtIso) ||
                    (instant(last.getString("occurredAt")) == instant(remote.eventAtIso) && last.getString("id") > remote.eventId))) {
                    sentence = last.getString("sentenceId");updatedAt = instant(last.getString("occurredAt")).toEpochMilli()
                }
            }
            replace(db,"story_progress",ContentValues().apply {
                put("story_id",story);put("percent",percent);put("revision_id",remote.revisionId)
                put("sentence_id",sentence);put("updated_at",updatedAt)
            })
        }
    }
    private fun replace(db: SupportSQLiteDatabase, table: String, values: ContentValues) = db.insert(table,SQLiteDatabase.CONFLICT_REPLACE,values)
    private fun rows(db: SupportSQLiteDatabase, table: String): List<JSONObject> = db.query("SELECT * FROM $table").use { c ->
        buildList { while(c.moveToNext()) add(JSONObject().also { row -> c.columnNames.forEachIndexed { i,name ->
            row.put(name,when(c.getType(i)) { Cursor.FIELD_TYPE_NULL -> JSONObject.NULL;Cursor.FIELD_TYPE_INTEGER -> c.getLong(i);else -> c.getString(i) })
        } }) }
    }
    private fun JSONArray.objects() = List(length()) { getJSONObject(it) }
    private fun JSONArray.strings() = List(length()) { getString(it) }
}
