package com.yurken.englishtales.data

import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneId
import java.util.UUID

data class CloudLearningProfile(val name: String, val level: String, val genre: String, val goal: Int,
    val timezone: String, val version: Long, val updatedAt: Long)
data class CloudLearningSession(val id: String, val kind: String, val storyId: String?, val revisionId: String?,
    val day: String, val counted: Boolean, val points: Int, val finishedAt: Long)
data class CloudLearningWord(val id: String, val saved: Boolean, val state: String, val correctCount: Int,
    val dueAt: Long?, val intervalDays: Int, val successDay: String?, val eventId: String,
    val sourceRevisionId: String?, val updatedAt: Long,
    /** Saved glossary words (Q4.3a) carry their text; learning words come from the catalog. */
    val word: String? = null, val gloss: String? = null)
data class CloudLearningProgress(val revisionId: String, val storyId: String, val sentenceId: String,
    val percent: Int, val eventAt: Long, val eventId: String, val updatedAt: Long,
    val eventAtIso: String = Instant.ofEpochMilli(eventAt).toString())
data class CloudLearningBadge(val id: String, val earnedAt: Long)
/** F09b: a removed favorite is kept as `favorite=false` so other devices drop it too. */
data class CloudStoryFavorite(val storyId: String, val favorite: Boolean, val updatedAt: Long)

/** Fully validated immutable input. Parsing has no database side effects. */
data class LearningCloudSnapshot(val userId: String, val capturedAt: Long, val profile: CloudLearningProfile?,
    val sessions: List<CloudLearningSession>, val words: List<CloudLearningWord>,
    val progress: List<CloudLearningProgress>, val badges: List<CloudLearningBadge>,
    val capturedAtIso: String = Instant.ofEpochMilli(capturedAt).toString(),
    /** Null when the server predates favorite sync: local favorites are then left as they are. */
    val favorites: List<CloudStoryFavorite>? = null,
    /** Q5.5 reading history as (lemma, storyId); null when the server predates known-word sync. */
    val lemmaReads: List<Pair<String, String>>? = null,
    val lemmaLookups: List<String>? = null) {
    internal fun json(): JSONObject = JSONObject().put("schemaVersion", 1).put("userId", userId).put("capturedAt", capturedAtIso)
        .put("profile", profile?.let { p -> JSONObject().put("display_name", p.name).put("level", p.level)
            .put("preferred_genre", p.genre).put("daily_goal", p.goal).put("timezone", p.timezone)
            .put("preferences_version", p.version).put("updated_at", Instant.ofEpochMilli(p.updatedAt).toString()) } ?: JSONObject.NULL)
        .put("sessions", JSONArray().also { a -> sessions.forEach { s -> a.put(JSONObject().put("id", s.id).put("kind", s.kind)
            .put("story_id", s.storyId ?: JSONObject.NULL).put("revision_id", s.revisionId ?: JSONObject.NULL).put("study_day", s.day)
            .put("counted", s.counted).put("points", s.points).put("finished_at", Instant.ofEpochMilli(s.finishedAt).toString())) } })
        .put("words", JSONArray().also { a -> words.forEach { w -> a.put(JSONObject().put("word_id", w.id).put("saved", w.saved)
            .put("learning_state", w.state).put("correct_count", w.correctCount)
            .put("next_review_at", w.dueAt?.let { Instant.ofEpochMilli(it).toString() } ?: JSONObject.NULL).put("interval_days", w.intervalDays)
            .put("last_success_day", w.successDay ?: JSONObject.NULL).put("last_event_id", w.eventId)
            .put("source_revision_id", w.sourceRevisionId ?: JSONObject.NULL).put("updated_at", Instant.ofEpochMilli(w.updatedAt).toString())
            .also { o -> if (w.word != null && w.gloss != null) o.put("word", w.word).put("gloss", w.gloss) }) } })
        .put("progress", JSONArray().also { a -> progress.forEach { p -> a.put(JSONObject().put("revision_id", p.revisionId)
            .put("story_id", p.storyId).put("last_sentence_id", p.sentenceId).put("percent", p.percent).put("last_event_at", p.eventAtIso)
            .put("last_event_id", p.eventId).put("updated_at", Instant.ofEpochMilli(p.updatedAt).toString())) } })
        .put("badges", JSONArray().also { a -> badges.forEach { b -> a.put(JSONObject().put("badge_id", b.id)
            .put("earned_at", Instant.ofEpochMilli(b.earnedAt).toString())) } })
        .also { root -> favorites?.let { list -> root.put("favorites", JSONArray().also { a -> list.forEach { f -> a.put(JSONObject()
            .put("story_id", f.storyId).put("favorite", f.favorite).put("updated_at", Instant.ofEpochMilli(f.updatedAt).toString())) } }) } }
        .also { root -> lemmaReads?.let { list -> root.put("lemmaReads", JSONArray().also { a -> list.forEach { (lemma, story) -> a.put(JSONObject().put("lemma", lemma).put("story_id", story)) } }) } }
        .also { root -> lemmaLookups?.let { list -> root.put("lemmaLookups", JSONArray(list)) } }
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
                    uuid(text(w, "last_event_id")), nullableText(w, "source_revision_id")?.let(::uuid), timestamp(text(w, "updated_at")),
                    if (w.has("word") && !w.isNull("word")) text(w, "word", 100) else null, if (w.has("gloss") && !w.isNull("gloss")) text(w, "gloss", 1000) else null)
            }.also { unique(it.map { w -> w.id }) }
            val progress = rows(json, "progress", 5_000).map { p ->
                CloudLearningProgress(uuid(text(p, "revision_id")), text(p, "story_id"), text(p, "last_sentence_id"),
                    number(p, "percent", 0, 100).toInt(), timestamp(text(p, "last_event_at")),
                    uuid(text(p, "last_event_id")), timestamp(text(p, "updated_at")), text(p, "last_event_at"))
            }.also { unique(it.map { p -> p.revisionId }) }
            val badges = rows(json, "badges", 5).map { b ->
                val id = text(b, "badge_id").also { require(it in setOf("first_story", "first_practice", "five_words", "three_day_streak", "seven_day_streak")) }
                CloudLearningBadge(id, timestamp(text(b, "earned_at")))
            }.also { unique(it.map { b -> b.id }) }
            val favorites = if (!json.has("favorites")) null else rows(json, "favorites", 5_000).map { f ->
                CloudStoryFavorite(text(f, "story_id", 80).also { require(it.matches(Regex("[a-z0-9][a-z0-9_-]{0,79}"))) },
                    boolean(f, "favorite"), timestamp(text(f, "updated_at")))
            }.also { unique(it.map { f -> f.storyId }) }
            val lemma = Regex("[\\p{L}\\p{N}]{1,100}")
            val lemmaReads = if (!json.has("lemmaReads")) null else rows(json, "lemmaReads", 50_000).map { r ->
                text(r, "lemma", 100).also { require(it.matches(lemma)) } to text(r, "story_id", 80).also { require(it.matches(Regex("[a-z0-9][a-z0-9_-]{0,79}"))) }
            }
            val lemmaLookups = if (!json.has("lemmaLookups")) null else json.getJSONArray("lemmaLookups").let { a ->
                require(a.length() <= 20_000); List(a.length()) { (a.get(it) as String).also { l -> require(l.matches(lemma)) } }
            }
            require(profile != null || (sessions.isEmpty() && words.isEmpty() && progress.isEmpty() && badges.isEmpty() && favorites.isNullOrEmpty()
                && lemmaReads.isNullOrEmpty() && lemmaLookups.isNullOrEmpty()))
            LearningCloudSnapshot(user, captured, profile, sessions, words, progress, badges, text(json, "capturedAt"), favorites, lemmaReads, lemmaLookups)
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
