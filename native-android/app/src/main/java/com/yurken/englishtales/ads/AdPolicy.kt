package com.yurken.englishtales.ads

data class AdLedger(val sinceAd: Int=0, val seen: List<String> = emptyList(),
    val reservedAt: List<Long> = emptyList(), val lastClock: Long=0)

interface AdLedgerStore {
    fun read(): AdLedger?
    fun save(ledger: AdLedger): Boolean
}

/** Device-wide, conservative limits; reserve durably before showing a fullscreen. */
class AdPolicy(private val storage: AdLedgerStore, private val now: ()->Long=System::currentTimeMillis) {
    private var ledger=storage.read()
    @Synchronized fun recordCompletion(id: String) {
        val state=ledger ?: return
        if(id.isBlank() || id in state.seen) return
        write(state.copy(sinceAd=(state.sinceAd+1).coerceAtMost(3),seen=(state.seen+id).takeLast(256)))
    }
    @Synchronized fun reserve(): Long? {
        val state=ledger ?: return null
        val at=now()
        if(at<state.lastClock || state.sinceAd<3) return null
        val recent=state.reservedAt.filter {at-it<DAY}
        if(recent.size>=3 || recent.lastOrNull()?.let {at-it<COOLDOWN}==true) return null
        return if(write(state.copy(sinceAd=0,reservedAt=recent+at,lastClock=at))) at else null
    }
    @Synchronized fun failedToShow(reservation: Long) {
        val state=ledger ?: return
        if(state.reservedAt.lastOrNull()!=reservation) return
        write(state.copy(sinceAd=3,reservedAt=state.reservedAt.dropLast(1)))
    }
    private fun write(next: AdLedger): Boolean {
        return try {
            if(storage.save(next)) {ledger=next;true} else {ledger=null;false}
        } catch (_: Exception) {ledger=null;false}
    }
    companion object {const val COOLDOWN=10*60_000L;const val DAY=24*60*60_000L}
}
