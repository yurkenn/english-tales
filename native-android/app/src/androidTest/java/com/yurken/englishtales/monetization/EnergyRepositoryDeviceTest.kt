package com.yurken.englishtales.monetization

import android.content.ContextWrapper
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.time.Instant
import java.util.UUID

class EnergyRepositoryDeviceTest {
    private fun fixture(test: (android.content.Context,AccountService)->Unit) {
        val target=InstrumentationRegistry.getInstrumentation().targetContext
        val directory=File(target.cacheDir,"energy-test-${UUID.randomUUID()}").apply {mkdirs()}
        val context=object: ContextWrapper(target) {override fun getFilesDir()=directory}
        val accounts=AccountService(null,object: SessionStorage {
            override fun read(): AccountSession?=null
            override fun write(session: AccountSession) {}
            override fun clear() {}
        })
        try {test(context,accounts)} finally {directory.deleteRecursively()}
    }
    @Test fun guestSpendingIsDurableAndReopenIsFree() = fixture {context,accounts ->
        val now=Instant.parse("2026-10-24T12:00:00Z").toEpochMilli()
        repeat(3) { assertTrue(EnergyRepository(context,accounts,null) {now}.open("guest",emptySet(),"story-$it").second) }
        val restart=EnergyRepository(context,accounts,null) {now}
        assertFalse(restart.open("guest",emptySet(),"four").second)
        assertTrue(restart.open("guest",emptySet(),"story-0").second)
        assertEquals(0,restart.cached("guest",emptySet())!!.balance)
    }
    @Test fun onlyPreFeatureProgressBecomesPermanentAccess() = fixture {context,accounts ->
        val repo=EnergyRepository(context,accounts,null)
        repo.cached("guest",setOf("old"))
        val restart=EnergyRepository(context,accounts,null)
        assertTrue("old" in restart.cached("guest",setOf("new-premium-progress"))!!.unlocked)
        assertFalse("new-premium-progress" in restart.cached("guest",setOf("new-premium-progress"))!!.unlocked)
    }
    @Test fun accountCachesNeverSharePremiumOrUnlocks() = fixture {context,accounts ->
        val alice=UUID.randomUUID().toString();val bob=UUID.randomUUID().toString()
        val now=System.currentTimeMillis()
        val server=JSONObject().put("balance",3).put("adCredits",0).put("premium",true)
            .put("premiumUntil",Instant.ofEpochMilli(now+60000).toString())
            .put("resetsAt",Instant.ofEpochMilli(now+86400000).toString())
            .put("unlockedStoryIds",JSONArray(listOf("alice-only")))
        EnergyDisk(context,alice).write(JSONObject().put("legacySeeded",true).put("server",server).put("fetchedAt",now))
        val repo=EnergyRepository(context,accounts,null) {now}
        assertTrue(repo.cached(alice,emptySet())!!.premium(now))
        assertNull(repo.cached(bob,emptySet()))
    }
    @Test fun corruptedLedgerDoesNotResetTheGuestQuota() = fixture {context,accounts ->
        File(context.filesDir,"energy-guest.json").writeText("corrupt")
        assertTrue(runCatching {EnergyRepository(context,accounts,null).open("guest",emptySet(),"story")}.isFailure)
    }
    @Test fun offlineLegacyAccountStoryDoesNotNeedAServerSnapshot() = fixture {context,accounts ->
        val repo=EnergyRepository(context,accounts,null)
        val owner=UUID.randomUUID().toString()
        assertTrue(repo.open(owner,setOf("old"),"old").second)
        assertTrue(runCatching {repo.open(owner,setOf("old"),"new")}.isFailure)
    }
}
