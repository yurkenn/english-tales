package com.yurken.englishtales.ads

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

internal class AdLedgerPreferences(context: Context): AdLedgerStore {
    private val prefs=context.getSharedPreferences("ad_frequency",Context.MODE_PRIVATE)
    override fun read(): AdLedger? = try {
        prefs.getString("ledger",null)?.let {raw ->
            val json=JSONObject(raw)
            val seen=json.getJSONArray("seen")
            val reserved=json.getJSONArray("reserved")
            AdLedger(json.getInt("sinceAd"),(0 until seen.length()).map {seen.getString(it)},
                (0 until reserved.length()).map {reserved.getLong(it)},json.getLong("clock")).also {
                require(it.sinceAd in 0..3 && it.seen.size<=256 && it.reservedAt.size<=3 && it.lastClock>=0)
                require(it.reservedAt.all {time ->time in 0..it.lastClock} && it.reservedAt.zipWithNext().all {pair ->pair.first<=pair.second})
            }
        } ?: AdLedger()
    } catch (_: Exception) {null}
    override fun save(ledger: AdLedger): Boolean = prefs.edit().putString("ledger",JSONObject()
        .put("sinceAd",ledger.sinceAd).put("seen",JSONArray(ledger.seen))
        .put("reserved",JSONArray(ledger.reservedAt)).put("clock",ledger.lastClock).toString()).commit()
}
