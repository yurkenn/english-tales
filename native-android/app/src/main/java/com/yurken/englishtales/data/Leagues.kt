package com.yurken.englishtales.data

import android.content.Context
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
data class LeagueStanding(val tier: Int, val weekStart: String, val endsAt: Long, val joined: Boolean, val optedOut: Boolean,
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
            return LeagueStanding(tier(json.getInt("tier")), json.getString("weekStart").also { require(it.matches(Regex("\\d{4}-\\d{2}-\\d{2}"))) }, Instant.parse(json.getString("endsAt")).toEpochMilli(),
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

/** What the learner's place looked like at the last league read, kept per account for the reminder and for noticing changes. */
data class LeagueSnapshot(val weekStart: String, val endsAt: Long, val rank: Int, val xp: Int, val gap: Int?, val zone: LeagueZone)

object LeagueMemory {
    private fun prefs(context: Context) = context.getSharedPreferences("league_memory", Context.MODE_PRIVATE)

    fun read(context: Context, owner: String): LeagueSnapshot? {
        val p = prefs(context)
        val week = p.getString("$owner:week", null) ?: return null
        val zone = runCatching { LeagueZone.valueOf(p.getString("$owner:zone", "").orEmpty()) }.getOrNull() ?: return null
        return LeagueSnapshot(week, p.getLong("$owner:ends", 0), p.getInt("$owner:rank", 0), p.getInt("$owner:xp", 0),
            p.getInt("$owner:gap", -1).takeIf { it > 0 }, zone)
    }

    /** Stores the learner's current place and returns the previous one; a learner outside this week's group clears it. */
    fun remember(context: Context, owner: String, standing: LeagueStanding): LeagueSnapshot? {
        val previous = read(context, owner)
        val me = standing.me
        val edit = prefs(context).edit()
        if (me == null) listOf("week", "ends", "rank", "xp", "gap", "zone").forEach { edit.remove("$owner:$it") }
        else edit.putString("$owner:week", standing.weekStart).putLong("$owner:ends", standing.endsAt).putInt("$owner:rank", me.rank)
            .putInt("$owner:xp", me.xp).putInt("$owner:gap", standing.xpToNext ?: -1).putString("$owner:zone", standing.zone(me.rank).name)
        edit.apply()
        return previous
    }

    /** True once per finished week: the week-end result is celebrated a single time on each account. */
    fun firstResultView(context: Context, owner: String, weekStart: String): Boolean {
        val key = "$owner:celebrated"
        if (prefs(context).getString(key, null) == weekStart) return false
        prefs(context).edit().putString(key, weekStart).apply()
        return true
    }
}
