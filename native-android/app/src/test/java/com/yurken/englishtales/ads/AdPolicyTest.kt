package com.yurken.englishtales.ads

import org.junit.Assert.*
import org.junit.Test

class AdPolicyTest {
    private class Memory(var value: AdLedger?=AdLedger()): AdLedgerStore {
        var writable=true
        override fun read()=value
        override fun save(ledger: AdLedger): Boolean {if(!writable) return false;value=ledger;return true}
    }
    @Test fun thirdUniqueCompletionQualifiesAndReplayDoesNotCount() {
        val storage=Memory();val policy=AdPolicy(storage) {1_000_000L}
        policy.recordCompletion("a");policy.recordCompletion("a");policy.recordCompletion("b")
        assertNull(policy.reserve())
        policy.recordCompletion("c")
        assertEquals(1_000_000L,policy.reserve())
        assertNull(policy.reserve())
        assertEquals(1,storage.value!!.reservedAt.size)
    }
    @Test fun cooldownAndLimitsSurviveRecreation() {
        var time=1_000_000L
        val storage=Memory()
        fun study(prefix: String) {val p=AdPolicy(storage) {time};repeat(3) {p.recordCompletion("$prefix-$it")}}
        study("first");assertNotNull(AdPolicy(storage) {time}.reserve())
        study("second");time+=AdPolicy.COOLDOWN-1;assertNull(AdPolicy(storage) {time}.reserve())
        time++;assertNotNull(AdPolicy(storage) {time}.reserve())
        study("third");time+=AdPolicy.COOLDOWN;assertNotNull(AdPolicy(storage) {time}.reserve())
        study("fourth");time+=AdPolicy.COOLDOWN;assertNull(AdPolicy(storage) {time}.reserve())
        time+=AdPolicy.DAY;assertNotNull(AdPolicy(storage) {time}.reserve())
    }
    @Test fun reversedClockCannotBypassFrequency() {
        var time=1_000_000L
        val policy=AdPolicy(Memory()) {time}
        repeat(3) {policy.recordCompletion("a$it")};assertNotNull(policy.reserve())
        repeat(3) {policy.recordCompletion("b$it")};time=1
        assertNull(policy.reserve())
    }
    @Test fun unwritableOrCorruptStateDisablesAds() {
        val storage=Memory();val policy=AdPolicy(storage) {1_000_000L}
        repeat(3) {policy.recordCompletion("a$it")}
        storage.writable=false;assertNull(policy.reserve())
        storage.writable=true;assertNull(policy.reserve())
        assertNull(AdPolicy(Memory(null)) {1_000_000L}.reserve())
    }
    @Test fun failedDisplayRefundsOnlyItsReservation() {
        val storage=Memory();val policy=AdPolicy(storage) {1_000_000L}
        repeat(3) {policy.recordCompletion("a$it")}
        val booking=policy.reserve()!!
        policy.failedToShow(booking+1);assertNull(policy.reserve())
        policy.failedToShow(booking);assertNotNull(policy.reserve())
        assertEquals(1,storage.value!!.reservedAt.size)
    }
    @Test fun accountsShareTheSameDeviceQuotaWithoutAccountData() {
        val storage=Memory()
        AdPolicy(storage).recordCompletion("guest-session")
        AdPolicy(storage).recordCompletion("account-session")
        assertNull(AdPolicy(storage).reserve())
        AdPolicy(storage).recordCompletion("other-session")
        assertNotNull(AdPolicy(storage).reserve())
    }
}
