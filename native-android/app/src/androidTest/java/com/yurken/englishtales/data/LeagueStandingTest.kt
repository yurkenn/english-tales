package com.yurken.englishtales.data

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.assertFalse
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.ui.LearningReminders
import org.junit.Assert.assertThrows
import org.junit.Test
import java.time.Instant

/** org.json is only a stub in JVM unit tests, so the league response is checked on the device. */
class LeagueStandingTest {
    private fun member(rank: Int, xp: Int, me: Boolean = false) =
        JSONObject().put("rank", rank).put("name", "L$rank").put("xp", xp).put("me", me)
    private fun response(members: List<JSONObject>, relegate: Int = 0, last: JSONObject? = null) = JSONObject()
        .put("weekStart", "2026-10-19").put("endsAt", "2026-10-26T00:00:00Z").put("tier", 2).put("optedOut", false)
        .put("joined", members.isNotEmpty()).put("promote", 5).put("relegate", relegate).put("members", JSONArray(members))
        .put("lastWeek", last ?: JSONObject.NULL)

    @Test fun parsesTheGroupAndTheGapToTheLearnerAbove() {
        val rows = (1..12).map { member(it, 300 - it * 20, me = it == 4) }
        val standing = LeagueStanding.parse(response(rows, relegate = 5, last = JSONObject().put("tier", 1).put("rank", 2).put("outcome", "promoted")))
        assertEquals(Instant.parse("2026-10-26T00:00:00Z").toEpochMilli(), standing.endsAt)
        assertEquals(4, standing.me?.rank)
        assertEquals(21, standing.xpToNext)
        assertEquals(LeagueZone.Promotion, standing.zone(5))
        assertEquals(LeagueZone.Safe, standing.zone(7))
        assertEquals(LeagueZone.Relegation, standing.zone(8))
        assertEquals(LeagueResult(1, 2, "promoted"), standing.lastWeek)
    }

    @Test fun leaderAndEmptyGroupsHaveNoGap() {
        assertNull(LeagueStanding.parse(response(listOf(member(1, 40, me = true), member(2, 20)))).xpToNext)
        val empty = LeagueStanding.parse(response(emptyList()))
        assertNull(empty.me)
        assertNull(empty.xpToNext)
        assertNull(empty.lastWeek)
    }

    @Test fun rejectsRanksOutOfOrderAndUnknownTiers() {
        assertThrows(IllegalArgumentException::class.java) { LeagueStanding.parse(response(listOf(member(2, 10)))) }
        assertThrows(IllegalArgumentException::class.java) { LeagueStanding.parse(response(emptyList()).put("tier", 6)) }
    }

    @Test fun memoryKeepsThePreviousPlaceAndCelebratesAWeekOnce() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val owner = java.util.UUID.randomUUID().toString()
        val first = LeagueStanding.parse(response((1..12).map { member(it, 300 - it * 20, me = it == 6) }, relegate = 5))
        assertNull(LeagueMemory.remember(context, owner, first))
        val second = LeagueStanding.parse(response((1..12).map { member(it, 300 - it * 20, me = it == 3) }, relegate = 5))
        val previous = LeagueMemory.remember(context, owner, second)
        assertEquals(6, previous?.rank)
        assertEquals(LeagueZone.Safe, previous?.zone)
        assertEquals(21, LeagueMemory.read(context, owner)?.gap)
        assertTrue(LeagueMemory.firstResultView(context, owner, "2026-10-19"))
        assertFalse(LeagueMemory.firstResultView(context, owner, "2026-10-19"))
        val line = LearningReminders.leagueLine(context, LearningOwner.Account(owner), now = Instant.parse("2026-10-20T00:00:00Z").toEpochMilli())
        assertTrue(line.orEmpty().contains("21"))
        assertNull(LearningReminders.leagueLine(context, LearningOwner.Account(owner), now = Instant.parse("2026-10-27T00:00:00Z").toEpochMilli()))
        assertNull(LearningReminders.leagueLine(context, LearningOwner.Guest))
    }
    @Test fun friendListKeepsValidCodesAndMemberTokens() {
        val rows = JSONArray(listOf(member(1, 60, me = true), member(2, 40).put("id", "0123456789abcdef0123"), member(3, 0).put("id", "not-a-token")))
        val list = FriendList.parse(JSONObject().put("code", "AB2C9Z").put("weekStart", "2026-10-19").put("friends", rows))
        assertEquals("AB2C9Z", list.code)
        assertEquals(listOf("", "0123456789abcdef0123", ""), list.members.map { it.id })
        assertNull(FriendList.parse(JSONObject().put("code", JSONObject.NULL).put("friends", JSONArray())).code)
        assertNull(FriendList.parse(JSONObject().put("code", "AB0CDE").put("friends", JSONArray())).code)
    }

    @Test fun typedInviteCodesForgiveCaseAndSpaces() {
        assertEquals("AB2C9Z", FriendList.normalizeCode(" ab2-c9z "))
        assertEquals("ABCDEF", FriendList.normalizeCode("abcdefgh"))
        assertEquals("ABC", FriendList.normalizeCode("aOb1cI"))
    }
}
