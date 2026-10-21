package com.yurken.englishtales.data

import android.content.Context
import org.json.JSONObject

/** Points from one day's quest chest. */
data class ChestReward(val day: String, val points: Int)

/** The account's chest points from `open_quest_chest` / `get_quest_chests`: the running total and the last few days. */
data class ChestState(val total: Int, val recent: List<ChestReward>) {
    companion object {
        fun parse(json: JSONObject): ChestState {
            val rows = json.getJSONArray("recent")
            val recent = (0 until minOf(rows.length(), 7)).map { i ->
                val row = rows.getJSONObject(i)
                ChestReward(row.getString("day").also { require(it.matches(DAY)) }, row.getInt("points").also { require(it in QuestChests.REWARDS) })
            }
            return ChestState(json.getInt("total").also { require(it >= 0) }, recent)
        }
        private val DAY = Regex("\\d{4}-\\d{2}-\\d{2}")
    }
}

/**
 * Device copy of the daily quest chests, per learning owner. A guest's chests are rolled and kept here; an account's
 * come from the server, which checks the quests and rolls the reward, and are mirrored here so points show offline.
 */
object QuestChests {
    val REWARDS = setOf(20, 30, 50)

    /** Same odds as the server: 60% 20 points, 30% 30 points, 10% 50 points. */
    fun roll(random: Double) = when { random < 0.6 -> 20; random < 0.9 -> 30; else -> 50 }

    private fun prefs(context: Context) = context.getSharedPreferences("quest_chests", Context.MODE_PRIVATE)

    fun opened(context: Context, owner: String, day: String): Int? = prefs(context).getInt("$owner:day:$day", 0).takeIf { it > 0 }
    fun total(context: Context, owner: String) = prefs(context).getInt("$owner:total", 0)

    /** Keeps a guest's newly opened chest; returns its points. */
    fun openLocally(context: Context, owner: String, day: String, random: Double = Math.random()): Int {
        opened(context, owner, day)?.let { return it }
        val points = roll(random)
        prefs(context).edit().putInt("$owner:day:$day", points).putInt("$owner:total", total(context, owner) + points).apply()
        return points
    }

    /** Replaces an account's copy with the server's; the server total already includes every listed day. */
    fun mirror(context: Context, owner: String, state: ChestState) {
        val edit = prefs(context).edit().putInt("$owner:total", state.total)
        state.recent.forEach { edit.putInt("$owner:day:${it.day}", it.points) }
        edit.apply()
    }
}

/** Opens and reads the signed-in learner's chests over the learning RPC transport. */
class QuestChestService(private val transport: LearningSyncTransport, private val accounts: AccountService) {
    fun open(user: String, day: String) = ChestState.parse(transport.call("open_quest_chest", JSONObject().put("p_day", day), accounts.accessToken(user)))
    fun load(user: String) = ChestState.parse(transport.call("get_quest_chests", JSONObject(), accounts.accessToken(user)))
}
