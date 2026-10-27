package com.yurken.englishtales.monetization

import android.content.Context
import android.util.AtomicFile
import com.yurken.englishtales.BuildConfig
import com.yurken.englishtales.data.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.time.Instant
import java.util.UUID

/** Cached expiry never becomes a permanent story unlock. */
data class EnergyState(val balance: Int, val adCredits: Int, val resetsAt: Long,
    val premiumUntil: Long = 0, val unlocked: Set<String> = emptySet(), val checkedAt: Long = 0, val enabled: Boolean = true, val pendingAdRewards: Int = 0) {
    fun premium(now: Long) = now >= checkedAt && now < premiumUntil
    /** Balance can also increase at midnight; expired/cancelled tickets are not verified rewards. */
    internal fun hasNewAdCreditSince(previous: EnergyState?): Boolean =
        previous != null && adCredits > previous.adCredits
    companion object {
        fun parse(json: JSONObject, now: Long): EnergyState {
            val balance = json.getInt("balance").also { require(it in 0..6) }
            val credits = json.getInt("adCredits").also { require(it in 0..3) }
            val until = json.optString("premiumUntil").takeUnless { it.isBlank() || it == "null" }
                ?.let { Instant.parse(it).toEpochMilli() } ?: 0L
            return EnergyState(balance, credits, Instant.parse(json.getString("resetsAt")).toEpochMilli(),
                if (json.getBoolean("premium")) until else 0, strings(json.getJSONArray("unlockedStoryIds")), now,
                json.optBoolean("enabled",true),json.optInt("pendingAdRewards").coerceIn(0,3))
        }
        internal fun strings(array: JSONArray): Set<String> = (0 until array.length()).map { array.getString(it) }.toSet()
    }
}

/** No learning schema/outbox changes. One atomic file per validated account or local guest. */
internal class EnergyDisk(context: Context, owner: String) {
    private val file: AtomicFile
    init {
        require(owner == "guest" || UUID.fromString(owner).toString() == owner)
        file = AtomicFile(File(context.filesDir, "energy-$owner.json"))
    }
    fun read(): JSONObject = try {
        file.openRead().use { stream ->
            val bytes = stream.readBytes()
            require(bytes.size <= 2_000_000)
            JSONObject(String(bytes, Charsets.UTF_8))
        }
    } catch (_: java.io.FileNotFoundException) { JSONObject() }
    fun write(json: JSONObject) {
        val output = file.startWrite()
        try { output.write(json.toString().toByteArray(Charsets.UTF_8)); file.finishWrite(output) }
        catch (failure: Exception) { file.failWrite(output); throw failure }
    }
    fun delete() { file.delete() }
}

internal class EnergyRepository(private val context: Context, private val accounts: AccountService,
    private val transport: LearningSyncTransport?, private val clock: () -> Long = System::currentTimeMillis) {
    private fun disk(owner: String) = EnergyDisk(context, owner)
    private fun read(owner: String, legacy: Set<String>): JSONObject {
        val json = disk(owner).read()
        // Capture pre-feature progress once. Premium-created progress can never mint permanent access later.
        if (!json.optBoolean("legacySeeded")) {
            json.put("legacy", JSONArray(legacy.toList())).put("legacySeeded", true)
            disk(owner).write(json)
        }
        return json
    }
    private fun guest(json: JSONObject): GuestEnergy = GuestEnergy(json.optString("day", EnergyPolicy.day(clock())),
        json.optInt("spent"), EnergyState.strings(json.optJSONArray("unlocked") ?: JSONArray()) +
            EnergyState.strings(json.optJSONArray("legacy") ?: JSONArray()), json.optLong("lastClock"))
    private fun guestState(value: GuestEnergy) = EnergyState((3 - value.spent).coerceIn(0,3), 0,
        EnergyPolicy.resetAt(value.lastClock), unlocked = value.unlocked, checkedAt = value.lastClock)
    private fun saveGuest(json: JSONObject, value: GuestEnergy) {
        json.put("day", value.day).put("spent", value.spent).put("lastClock", value.lastClock)
            .put("unlocked", JSONArray(value.unlocked.toList()))
        disk("guest").write(json)
    }
    fun cached(owner: String, legacy: Set<String>): EnergyState? {
        val json = read(owner, legacy)
        if (owner == "guest") {
            val value = EnergyPolicy.normalize(guest(json), clock()); saveGuest(json, value); return guestState(value)
        }
        val stored = json.optJSONObject("server") ?: return null
        return EnergyState.parse(stored, json.getLong("fetchedAt")).copy(unlocked = EnergyState.strings(stored.getJSONArray("unlockedStoryIds")) +
            EnergyState.strings(json.optJSONArray("legacy") ?: JSONArray()))
    }
    private fun server(owner: String, rpc: String, payload: JSONObject = JSONObject()): JSONObject {
        require(owner != "guest")
        return (transport ?: error("service_unavailable")).call(rpc, payload, accounts.accessToken(owner))
    }
    private fun saveServer(owner: String, legacy: Set<String>, json: JSONObject): EnergyState {
        val state = EnergyState.parse(json, clock())
        val disk = read(owner, legacy).put("server", json).put("fetchedAt", state.checkedAt)
        this.disk(owner).write(disk)
        return state.copy(unlocked = state.unlocked + EnergyState.strings(disk.optJSONArray("legacy") ?: JSONArray()))
    }
    fun refresh(owner: String, legacy: Set<String>): EnergyState =
        if (owner == "guest") checkNotNull(cached(owner, legacy)) else saveServer(owner, legacy, server(owner, "get_energy_state"))
    fun open(owner: String, legacy: Set<String>, story: String): Pair<EnergyState?, Boolean> {
        val cache = cached(owner, legacy)
        val legacyIds=EnergyState.strings(read(owner,legacy).optJSONArray("legacy") ?: JSONArray())
        if (story in cache?.unlocked.orEmpty() || story in legacyIds) return cache to true
        if (owner == "guest") {
            val json = read(owner, legacy)
            val (value, allowed) = EnergyPolicy.open(guest(json), story, clock())
            saveGuest(json, value)
            return guestState(value) to allowed
        }
        val local = read(owner, legacy)
        val premiumReads = EnergyState.strings(local.optJSONArray("premiumReads") ?: JSONArray())
        if(cache?.premium(clock())==true && story in premiumReads) return cache to true
        val result = server(owner, "unlock_story", JSONObject().put("p_story_id", story))
        val state = saveServer(owner, legacy, result)
        if(result.getBoolean("allowed") && result.optString("reason")=="premium") {
            disk(owner).write(read(owner,legacy).put("premiumReads",JSONArray((premiumReads+story).toList())))
        }
        return state to result.getBoolean("allowed")
    }
    fun cachedPolicy(): Boolean = if(BuildConfig.DEBUG) true else disk("guest").read().optBoolean("policyEnabled",false)
    fun purchasePending(owner: String)=disk(owner).read().optBoolean("purchasePending")
    fun purchasePending(owner: String,pending: Boolean) {disk(owner).write(disk(owner).read().put("purchasePending",pending))}
    fun policy(): Boolean {
        // Preview builds are local QA; release uses the anonymous server kill switch with a cached fallback.
        if(BuildConfig.DEBUG) return true
        val cached=disk("guest").read()
        return try {
            val enabled=AuthHttp(BuildConfig.SUPABASE_URL,BuildConfig.SUPABASE_PUBLISHABLE_KEY)
                .request("/rest/v1/rpc/get_energy_policy","POST",JSONObject()).getBoolean("enabled")
            disk("guest").write(cached.put("policyEnabled",enabled))
            enabled
        } catch (_: Exception) {cached.optBoolean("policyEnabled",false)}
    }
    fun cancelReward(owner: String,nonce: String) {server(owner,"cancel_ad_reward",JSONObject().put("p_nonce",nonce))}
    fun beginReward(owner: String): String = server(owner, "begin_ad_reward").getString("nonce").also { UUID.fromString(it) }
    fun syncPremium(owner: String, legacy: Set<String>): EnergyState {
        val response = AuthHttp(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_PUBLISHABLE_KEY)
            .request("/functions/v1/premium-sync", "POST", JSONObject(), accounts.accessToken(owner))
        return saveServer(owner, legacy, response)
    }
}
