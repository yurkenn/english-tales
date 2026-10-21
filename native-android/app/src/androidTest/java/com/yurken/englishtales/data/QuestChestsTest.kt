package com.yurken.englishtales.data

import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Test

/** org.json and SharedPreferences need the device, so the chest's device copy is checked here. */
class QuestChestsTest {
    private val context = InstrumentationRegistry.getInstrumentation().targetContext
    private fun owner() = "test-" + java.util.UUID.randomUUID()
    private fun state(total: Int, vararg days: Pair<String, Int>) = JSONObject().put("total", total)
        .put("recent", JSONArray(days.map { JSONObject().put("day", it.first).put("points", it.second) }))

    @Test fun rollsTwentyThirtyOrFiftyWithFiftyTheRarest() {
        assertEquals(listOf(20, 20, 30, 30, 50, 50), listOf(0.0, 0.59, 0.6, 0.89, 0.9, 0.999).map(QuestChests::roll))
    }

    @Test fun aGuestChestOpensOnceADayAndAddsToTheTotal() {
        val owner = owner()
        assertEquals(30, QuestChests.openLocally(context, owner, "2026-10-21", random = 0.7))
        assertEquals(30, QuestChests.openLocally(context, owner, "2026-10-21", random = 0.95))
        assertEquals(50, QuestChests.openLocally(context, owner, "2026-10-22", random = 0.95))
        assertEquals(80, QuestChests.total(context, owner))
        assertNull(QuestChests.opened(context, owner, "2026-10-23"))
    }

    @Test fun anAccountMirrorsTheServerTotal() {
        val owner = owner()
        QuestChests.mirror(context, owner, ChestState.parse(state(120, "2026-10-20" to 50, "2026-10-21" to 20)))
        assertEquals(120, QuestChests.total(context, owner))
        assertEquals(20, QuestChests.opened(context, owner, "2026-10-21"))
    }

    @Test fun rejectsRewardsTheServerNeverRolls() {
        assertThrows(IllegalArgumentException::class.java) { ChestState.parse(state(40, "2026-10-21" to 40)) }
        assertThrows(IllegalArgumentException::class.java) { ChestState.parse(state(-1)) }
    }
}
