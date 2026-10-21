package com.yurken.englishtales.data

import org.json.JSONObject
import java.time.Instant

/** One row of the learner's weekly league group; other learners appear only by display name and XP. */
data class LeagueMember(val rank: Int, val name: String, val xp: Int, val me: Boolean)

/** Last week's settled place, shown once the new week begins. */
data class LeagueResult(val tier: Int, val rank: Int, val outcome: String)

/**
 * The learner's weekly league from `get_my_league`. XP is counted on the server from synced sessions
 * (5 per right answer, 20 per finished story, at most 500 a day), so the app only displays it.
 */
data class LeagueStanding(val tier: Int, val endsAt: Long, val joined: Boolean, val optedOut: Boolean,
    val promote: Int, val relegate: Int, val members: List<LeagueMember>, val lastWeek: LeagueResult?) {
    val me get() = members.firstOrNull { it.me }

    /** XP still needed to pass the learner just above, or null when the learner leads the group. */
    val xpToNext get() = me?.let { mine -> members.getOrNull(mine.rank - 2)?.let { it.xp - mine.xp + 1 } }

    fun zone(rank: Int) = when {
        rank <= promote -> LeagueZone.Promotion
        relegate > 0 && rank > members.size - relegate -> LeagueZone.Relegation
        else -> LeagueZone.Safe
    }

    companion object {
        const val TIERS = 5

        fun parse(json: JSONObject): LeagueStanding {
            val members = json.getJSONArray("members").let { rows -> (0 until rows.length()).map { i ->
                val row = rows.getJSONObject(i)
                LeagueMember(row.getInt("rank"), row.getString("name").take(30), row.getInt("xp").coerceAtLeast(0), row.getBoolean("me"))
            } }
            require(members.size <= 30 && members.withIndex().all { (i, m) -> m.rank == i + 1 } && members.count { it.me } <= 1)
            val last = json.optJSONObject("lastWeek")?.let {
                LeagueResult(tier(it.getInt("tier")), it.getInt("rank"), it.getString("outcome").also { o -> require(o in OUTCOMES) })
            }
            return LeagueStanding(tier(json.getInt("tier")), Instant.parse(json.getString("endsAt")).toEpochMilli(),
                json.getBoolean("joined"), json.getBoolean("optedOut"), json.getInt("promote").coerceIn(0, 5),
                json.getInt("relegate").coerceIn(0, 5), members, last)
        }

        private val OUTCOMES = setOf("promoted", "stayed", "relegated")
        private fun tier(value: Int) = value.also { require(it in 1..TIERS) }
    }
}

enum class LeagueZone { Promotion, Safe, Relegation }

/** Reads and changes the signed-in learner's league over the learning RPC transport. */
class LeagueService(private val transport: LearningSyncTransport, private val accounts: AccountService) {
    fun load(user: String) = LeagueStanding.parse(transport.call("get_my_league", JSONObject(), accounts.accessToken(user)))
    fun setOptedOut(user: String, optedOut: Boolean) =
        LeagueStanding.parse(transport.call("set_league_opt_out", JSONObject().put("p_opted_out", optedOut), accounts.accessToken(user)))
}
