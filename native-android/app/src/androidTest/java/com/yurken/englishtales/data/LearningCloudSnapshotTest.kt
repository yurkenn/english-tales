package com.yurken.englishtales.data

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.util.UUID

class LearningCloudSnapshotTest {
    private val user = UUID.randomUUID().toString()
    private val revision = UUID.randomUUID().toString()
    private val time = "2026-10-11T10:00:00.123456+00:00"
    private fun empty() = JSONObject().put("schemaVersion", 1).put("userId", user).put("capturedAt", time)
        .put("profile", JSONObject.NULL).put("sessions", JSONArray()).put("words", JSONArray())
        .put("progress", JSONArray()).put("badges", JSONArray())
    private fun full(): JSONObject = empty().put("profile", JSONObject().put("display_name", "Okuyucu").put("level", "A1")
        .put("preferred_genre", "Günlük yaşam").put("daily_goal", 2).put("timezone", "Europe/Istanbul")
        .put("preferences_version", 3).put("updated_at", time)).also { j ->
        j.getJSONArray("sessions").put(JSONObject().put("id", UUID.randomUUID().toString()).put("kind", "reading")
            .put("story_id", "quiet-morning").put("revision_id", revision).put("study_day", "2026-10-11")
            .put("counted", false).put("points", 0).put("finished_at", time))
        j.getJSONArray("words").put(JSONObject().put("word_id", "morning").put("saved", false).put("learning_state", "learning")
            .put("correct_count", 0).put("next_review_at", JSONObject.NULL).put("interval_days", 0)
            .put("last_success_day", JSONObject.NULL).put("last_event_id", UUID.randomUUID().toString())
            .put("source_revision_id", revision).put("updated_at", time))
        j.getJSONArray("progress").put(JSONObject().put("revision_id", revision).put("story_id", "quiet-morning")
            .put("last_sentence_id", "sentence-1").put("percent", 25).put("last_event_at", time)
            .put("last_event_id", UUID.randomUUID().toString()).put("updated_at", time))
        j.getJSONArray("badges").put(JSONObject().put("badge_id", "first_story").put("earned_at", time))
    }
    private fun rejected(json: JSONObject, expected: String = user) {
        val failure = runCatching { LearningCloudSnapshot.decode(json, expected) }.exceptionOrNull()
        assertTrue(failure is LearningSyncFailure)
        assertEquals("invalid_snapshot", (failure as LearningSyncFailure).code)
    }
    @Test fun emptyNewAccountAndFullTombstoneSnapshotAreValid() {
        assertNull(LearningCloudSnapshot.decode(empty(), user).profile)
        val snapshot = LearningCloudSnapshot.decode(full(), user)
        assertEquals(3L, snapshot.profile!!.version)
        assertEquals(2, snapshot.profile.goal)
        assertFalse(snapshot.words.single().saved)
        assertEquals(revision, snapshot.words.single().sourceRevisionId)
        assertFalse(snapshot.sessions.single().counted)
        assertEquals(25, snapshot.progress.single().percent)
    }
    @Test fun wrongAccountUnsupportedProtocolAndMissingArraysAreRejected() {
        rejected(empty(), UUID.randomUUID().toString())
        rejected(empty().put("schemaVersion", 2))
        rejected(empty().also { it.remove("words") })
        rejected(empty().put("profile", "null"))
        rejected(full().put("profile", JSONObject.NULL))
    }
    @Test fun CoercedBooleansNumbersDatesAndDuplicateIdsAreRejected() {
        rejected(full().also { it.getJSONArray("words").getJSONObject(0).put("saved", "false") })
        rejected(full().also { it.getJSONArray("progress").getJSONObject(0).put("percent", 25.5) })
        rejected(full().also { it.getJSONArray("sessions").getJSONObject(0).put("study_day", "2026-02-30") })
        rejected(full().also { it.getJSONArray("progress").put(it.getJSONArray("progress").getJSONObject(0)) })
        rejected(full().also { it.getJSONObject("profile").put("preferences_version", "3") })
        rejected(empty().put("capturedAt", "2026-10-11T10:00:00"))
    }
    @Test fun oversizedArrayIsRejectedAsWhole() {
        val json = full()
        val word = json.getJSONArray("words").getJSONObject(0)
        json.put("words", JSONArray().also { array -> repeat(5_001) { array.put(word) } })
        rejected(json)
    }
    @Test fun profileTimezoneAndScoreContractAreValidated() {
        rejected(full().also { it.getJSONObject("profile").put("timezone", "invalid-zone") })
        rejected(full().also { it.getJSONArray("sessions").getJSONObject(0).put("points", 5) })
        rejected(full().also { it.getJSONArray("words").getJSONObject(0).put("interval_days", 2) })
        rejected(full().also { it.getJSONArray("badges").getJSONObject(0).put("badge_id", "unknown-badge") })
    }
    @Test fun timestampsKeepMicrosecondInputAndExplicitOffsetAtMillisecondPrecision() {
        val utc = LearningCloudSnapshot.decode(empty(), user).capturedAt
        assertEquals(123L, utc % 1000)
        assertEquals(utc, LearningCloudSnapshot.decode(empty().put("capturedAt", "2026-10-11T13:00:00.123456+03:00"), user).capturedAt)
        assertEquals(utc - 123, LearningCloudSnapshot.decode(empty().put("capturedAt", "2026-10-11T10:00:00Z"), user).capturedAt)
    }
    @Test fun readerRejectsResponseWhenAccountScopeChanges() {
        val storage = object : SessionStorage {
            override fun read() = AccountSession(user, "fixture@example.invalid", "fixture-token", "fixture-refresh", Long.MAX_VALUE)
            override fun write(session: AccountSession) {}
            override fun clear() {}
        }
        val accounts = AccountService(null, storage).apply { restore() }
        var current = true
        val reader = LearningSnapshotReader(LearningSyncTransport { rpc, body, _ ->
            assertEquals("get_learning_snapshot", rpc)
            assertEquals(0, body.length())
            current = false
            empty()
        }, accounts)
        val failure = runCatching { reader.read(user) { current } }.exceptionOrNull() as LearningSyncFailure
        assertEquals("account_scope_changed", failure.code)
    }
}
