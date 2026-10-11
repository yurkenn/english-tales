package com.yurken.englishtales.data

import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId
import java.util.UUID

data class CloudLearningProfile(val name: String, val level: String, val genre: String, val goal: Int,
    val timezone: String, val version: Long, val updatedAt: Long)
data class CloudLearningSession(val id: String, val kind: String, val storyId: String?, val revisionId: String?,
    val day: String, val counted: Boolean, val points: Int, val finishedAt: Long)
data class CloudLearningWord(val id: String, val saved: Boolean, val state: String, val correctCount: Int,
    val dueAt: Long?, val intervalDays: Int, val successDay: String?, val eventId: String,
    val sourceRevisionId: String?, val updatedAt: Long)
data class CloudLearningProgress(val revisionId: String, val storyId: String, val sentenceId: String,
    val percent: Int, val eventAt: Long, val eventId: String, val updatedAt: Long)
data class CloudLearningBadge(val id: String, val earnedAt: Long)

/** Fully validated immutable input. Parsing has no database side effects. */
data class LearningCloudSnapshot(val userId: String, val capturedAt: Long, val profile: CloudLearningProfile?,
    val sessions: List<CloudLearningSession>, val words: List<CloudLearningWord>,
    val progress: List<CloudLearningProgress>, val badges: List<CloudLearningBadge>) {
    companion object {
        fun decode(json: JSONObject, expectedUser: String): LearningCloudSnapshot = try {
            require(json.toString().toByteArray(Charsets.UTF_8).size <= LearningSyncHttp.MAX_RESPONSE_BYTES)
            require(number(json, "schemaVersion", 1, 1) == 1L)
            val user = uuid(text(json, "userId"))
            require(user == expectedUser)
            val captured = timestamp(text(json, "capturedAt"))
            val profileValue = json.get("profile")
            val profile = if (profileValue === JSONObject.NULL) null else {
                val p = profileValue as JSONObject
                val name = text(p, "display_name", 30)
                val level = text(p, "level").also { require(it in setOf("A1", "A2", "B1")) }
                val genre = text(p, "preferred_genre").also { require(it in setOf("Günlük yaşam", "Macera", "Gizem")) }
                val timezone = text(p, "timezone").also { ZoneId.of(it) }
                CloudLearningProfile(name, level, genre, number(p, "daily_goal", 1, 3).toInt(), timezone,
                    number(p, "preferences_version", 1, Long.MAX_VALUE), timestamp(text(p, "updated_at")))
            }
            val sessions = rows(json, "sessions", 10_000).map { s ->
                val kind = text(s, "kind").also { require(it in setOf("reading", "choice", "card", "match", "spell")) }
                val story = nullableText(s, "story_id")
                val revision = nullableText(s, "revision_id")?.let(::uuid)
                val counted = boolean(s, "counted")
                val points = number(s, "points", 0, 25).toInt()
                require(points % 5 == 0)
                if (kind == "reading") require(story != null && revision != null && points == 0)
                else require((story == null) == (revision == null) && counted)
                CloudLearningSession(uuid(text(s, "id")), kind, story, revision, day(text(s, "study_day")),
                    counted, points, timestamp(text(s, "finished_at")))
            }.also { unique(it.map { s -> s.id }) }
            val words = rows(json, "words", 5_000).map { w ->
                val state = text(w, "learning_state").also { require(it in setOf("learning", "reviewing", "known")) }
                val interval = number(w, "interval_days", 0, 30).toInt().also { require(it in setOf(0, 1, 3, 7, 14, 30)) }
                CloudLearningWord(text(w, "word_id"), boolean(w, "saved"), state, number(w, "correct_count", 0, 100).toInt(),
                    nullableText(w, "next_review_at")?.let(::timestamp), interval, nullableText(w, "last_success_day")?.let(::day),
                    uuid(text(w, "last_event_id")), nullableText(w, "source_revision_id")?.let(::uuid), timestamp(text(w, "updated_at")))
            }.also { unique(it.map { w -> w.id }) }
            val progress = rows(json, "progress", 5_000).map { p ->
                CloudLearningProgress(uuid(text(p, "revision_id")), text(p, "story_id"), text(p, "last_sentence_id"),
                    number(p, "percent", 0, 100).toInt(), timestamp(text(p, "last_event_at")),
                    uuid(text(p, "last_event_id")), timestamp(text(p, "updated_at")))
            }.also { unique(it.map { p -> p.revisionId }) }
            val badges = rows(json, "badges", 5).map { b ->
                val id = text(b, "badge_id").also { require(it in setOf("first_story", "first_practice", "five_words", "three_day_streak", "seven_day_streak")) }
                CloudLearningBadge(id, timestamp(text(b, "earned_at")))
            }.also { unique(it.map { b -> b.id }) }
            require(profile != null || (sessions.isEmpty() && words.isEmpty() && progress.isEmpty() && badges.isEmpty()))
            LearningCloudSnapshot(user, captured, profile, sessions, words, progress, badges)
        } catch (_: Exception) { throw LearningSyncFailure("invalid_snapshot") }

        private fun rows(json: JSONObject, field: String, limit: Int): List<JSONObject> {
            val array = json.get(field) as JSONArray
            require(array.length() <= limit)
            return List(array.length()) { array.get(it) as JSONObject }
        }
        private fun text(json: JSONObject, field: String, limit: Int = 512): String = (json.get(field) as String).also {
            require(it.isNotBlank() && it.codePointCount(0, it.length) <= limit)
        }
        private fun nullableText(json: JSONObject, field: String): String? =
            if (json.get(field) === JSONObject.NULL) null else text(json, field)
        private fun boolean(json: JSONObject, field: String) = json.get(field) as Boolean
        private fun number(json: JSONObject, field: String, min: Long, max: Long): Long {
            val value = json.get(field)
            require(value is Int || value is Long)
            return (value as Number).toLong().also { require(it in min..max) }
        }
        private fun uuid(value: String): String {
            require(value.matches(Regex("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")))
            return UUID.fromString(value).toString()
        }
        private fun timestamp(value: String) = OffsetDateTime.parse(value).toInstant().toEpochMilli()
        private fun day(value: String) = LocalDate.parse(value).toString().also { require(it == value) }
        private fun unique(ids: List<String>) { require(ids.toSet().size == ids.size) }
    }
}

/** Transport is bound to the configured project, never a URL supplied by the response. */
class LearningSnapshotReader(private val transport: LearningSyncTransport, private val accounts: AccountService) {
    fun read(expectedUser: String, isCurrentScope: () -> Boolean): LearningCloudSnapshot {
        fun checkScope() {
            if (!isCurrentScope() || accounts.current?.userId != expectedUser) throw LearningSyncFailure("account_scope_changed")
        }
        checkScope()
        val token = accounts.accessToken(expectedUser)
        checkScope()
        val response = transport.call("get_learning_snapshot", JSONObject(), token)
        checkScope()
        val snapshot = LearningCloudSnapshot.decode(response, expectedUser)
        checkScope()
        return snapshot
    }
}
