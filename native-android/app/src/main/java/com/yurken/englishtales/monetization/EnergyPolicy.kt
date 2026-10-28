package com.yurken.englishtales.monetization

import java.time.Instant
import java.time.ZoneOffset

/** Guest quotas are a device convenience; authenticated balances are decided by the server. */
data class GuestEnergy(val day: String, val spent: Int = 0, val unlocked: Set<String> = emptySet(), val lastClock: Long = 0)

object EnergyPolicy {
    const val DAILY_FREE = 3
    fun legacy(progressUpdatedAt: Map<String,Long>, cutoff: Long): Set<String> =
        if(cutoff<=0) emptySet() else progressUpdatedAt.filterValues {it<cutoff}.keys
    fun day(now: Long): String = Instant.ofEpochMilli(now).atZone(ZoneOffset.UTC).toLocalDate().toString()
    fun resetAt(now: Long): Long = Instant.ofEpochMilli(now).atZone(ZoneOffset.UTC).toLocalDate().plusDays(1)
        .atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
    fun normalize(state: GuestEnergy, now: Long): GuestEnergy {
        val monotonic = maxOf(now, state.lastClock)
        val today = day(monotonic)
        return state.copy(day = today, spent = if (today == state.day) state.spent else 0, lastClock = monotonic)
    }
    fun open(state: GuestEnergy, story: String, now: Long): Pair<GuestEnergy, Boolean> {
        require(story.isNotBlank())
        val current = normalize(state, now)
        if (story in current.unlocked) return current to true
        if (current.spent >= DAILY_FREE) return current to false
        return current.copy(spent = current.spent + 1, unlocked = current.unlocked + story) to true
    }
}
