package com.yurken.englishtales.monetization

import org.junit.Assert.*
import org.junit.Test
import java.time.Instant

class EnergyPolicyTest {
    private val now=Instant.parse("2026-10-24T23:59:59Z").toEpochMilli()
    @Test fun `three opens survive reopens and the fourth waits`() {
        var state=GuestEnergy(EnergyPolicy.day(now))
        for(story in listOf("one","two","three")) {
            val result=EnergyPolicy.open(state,story,now);assertTrue(result.second);state=result.first
        }
        assertFalse(EnergyPolicy.open(state,"four",now).second)
        val reopen=EnergyPolicy.open(state,"one",now)
        assertTrue(reopen.second);assertEquals(3,reopen.first.spent)
    }
    @Test fun `UTC midnight refills without deleting permanent access`() {
        val spent=GuestEnergy("2026-10-24",3,setOf("old"),now)
        val next=EnergyPolicy.open(spent,"new",now+1000)
        assertTrue(next.second);assertEquals(1,next.first.spent)
        assertEquals(setOf("old","new"),next.first.unlocked)
        assertEquals("2026-10-25",next.first.day)
    }
    @Test fun `clock rollback cannot refill yesterday again`() {
        val spent=GuestEnergy("2026-10-24",3,setOf("old"),now)
        val result=EnergyPolicy.open(spent,"new",now-86400000)
        assertFalse(result.second);assertEquals("2026-10-24",result.first.day)
        assertEquals(now,result.first.lastClock)
    }
    @Test fun `only progress before rollout is grandfathered on a new device`() {
        assertEquals(setOf("old"),EnergyPolicy.legacy(mapOf("old" to 100L,"premium" to 300L),200))
        assertTrue(EnergyPolicy.legacy(mapOf("premium" to 300L),200).isEmpty())
        assertTrue(EnergyPolicy.legacy(mapOf("old" to 100L),0).isEmpty())
    }
    @Test fun `premium expires and never works before cache verification time`() {
        val value=EnergyState(0,0,now+1000,premiumUntil=now+5000,checkedAt=now)
        assertTrue(value.premium(now));assertFalse(value.premium(now+5000));assertFalse(value.premium(now-1))
        assertTrue(value.unlocked.isEmpty())
    }
}
