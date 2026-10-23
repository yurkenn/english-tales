package com.yurken.englishtales.data

import android.app.Application
import androidx.lifecycle.ViewModelStore
import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.io.IOException
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Uses fake sessions and a blocking transport; never sends requests to real accounts. */
class LeagueAccountIsolationTest {
    private val target = InstrumentationRegistry.getInstrumentation().targetContext
    private val namespace = "league-isolation-${UUID.randomUUID()}"
    private val app = object : Application() {
        override fun getSharedPreferences(name: String, mode: Int) = target.getSharedPreferences("$namespace-$name", mode)
    }
    private val a = UUID.randomUUID().toString()
    private val b = UUID.randomUUID().toString()
    private fun accounts(user: String) = AccountService(null, object : SessionStorage {
        override fun read() = AccountSession(user,"fixture@example.invalid","fixture-access","fixture-refresh",Long.MAX_VALUE)
        override fun write(session: AccountSession) { error("Unexpected credential write") }
        override fun clear() {}
    }).apply { restore() }
    private fun friends() = JSONObject().put("code","ABCDEF").put("friends", JSONArray().put(
        JSONObject().put("rank",1).put("name","A private friend").put("xp",65).put("me",true)))
    private fun waitFor(predicate: () -> Boolean) {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5)
        while (!predicate() && System.nanoTime() < deadline) Thread.sleep(10)
        assertTrue("Asynchronous result was not observed",predicate())
    }
    private fun clear(vm: LeagueViewModel) {
        ViewModelStore().apply { put("test", vm); clear() }
        app.getSharedPreferences("quest_chests",0).edit().clear().commit()
    }

    @Test fun logoutClearsFriendsAndFailedNextAccountCannotRestoreThem() {
        val vm = LeagueViewModel(app,LeagueService(LearningSyncTransport {_,_,_->friends()},accounts(a)))
        try {
            vm.refreshFriends(a)
            waitFor { vm.friends.value is FriendsUi.Ready }
            vm.accountChanged(null)
            assertEquals(FriendsUi.Unavailable,vm.friends.value)
            // The A-only credential fixture rejects B, just like a failed account refresh.
            vm.refreshFriends(b)
            waitFor { vm.friends.value == FriendsUi.Failed }
            assertEquals(FriendsUi.Failed,vm.friends.value)
        } finally { clear(vm) }
    }

    @Test fun oldFriendsResponseAfterLogoutAndSameAccountLoginIsIgnored() {
        val entered=CountDownLatch(1); val release=CountDownLatch(1); val finished=CountDownLatch(1)
        val vm=LeagueViewModel(app,LeagueService(LearningSyncTransport {_,_,_->
            entered.countDown();check(release.await(5,TimeUnit.SECONDS));friends().also {finished.countDown()}
        },accounts(a)))
        try {
            vm.refreshFriends(a);assertTrue(entered.await(5,TimeUnit.SECONDS))
            vm.accountChanged(null);vm.accountChanged(a)
            release.countDown();assertTrue(finished.await(5,TimeUnit.SECONDS))
            Thread.sleep(100)
            assertEquals(FriendsUi.Loading,vm.friends.value)
        } finally {release.countDown();clear(vm)}
    }

    @Test fun pendingAccountChestNeverBecomesGuestRewardAfterLogout() {
        val synced=CountDownLatch(1)
        val transport=LearningSyncTransport {_,_,_->throw LearningSyncFailure("55000")}
        val vm=LeagueViewModel(app,null,QuestChestService(transport,accounts(a)))
        try {
            vm.openChest(a,a,"2026-10-23") {synced.countDown()}
            assertTrue(synced.await(5,TimeUnit.SECONDS));assertEquals(ChestUi.Syncing,vm.chest.value)
            vm.retryChest("guest",null)
            assertEquals(ChestUi.Idle,vm.chest.value)
            assertEquals(0,QuestChests.total(app,"guest"))
            assertEquals(0,QuestChests.total(app,a))
        } finally {clear(vm)}
    }

    @Test fun oldChestResponseDoesNotMirrorIntoLoggedOutAccountOrGuest() {
        val entered=CountDownLatch(1);val release=CountDownLatch(1);val finished=CountDownLatch(1)
        val transport=LearningSyncTransport {_,_,_->
            entered.countDown();check(release.await(5,TimeUnit.SECONDS))
            JSONObject().put("total",20).put("recent",JSONArray().put(JSONObject().put("day","2026-10-23").put("points",20)))
                .also {finished.countDown()}
        }
        val vm=LeagueViewModel(app,null,QuestChestService(transport,accounts(a)))
        try {
            vm.openChest(a,a,"2026-10-23",null);assertTrue(entered.await(5,TimeUnit.SECONDS))
            vm.accountChanged(null);release.countDown();assertTrue(finished.await(5,TimeUnit.SECONDS))
            Thread.sleep(100)
            assertEquals(ChestUi.Idle,vm.chest.value)
            assertEquals(0,QuestChests.total(app,a));assertEquals(0,QuestChests.total(app,"guest"))
        } finally {release.countDown();clear(vm)}
    }

    @Test fun oldChestRefreshAfterAccountChangeCannotWritePreviousOwnersPreferences() {
        val entered=CountDownLatch(1);val release=CountDownLatch(1);val finished=CountDownLatch(1)
        val transport=LearningSyncTransport {_,_,_->
            entered.countDown();check(release.await(5,TimeUnit.SECONDS))
            JSONObject().put("total",50).put("recent",JSONArray()).also {finished.countDown()}
        }
        val vm=LeagueViewModel(app,null,QuestChestService(transport,accounts(a)))
        try {
            vm.refreshChests(a);assertTrue(entered.await(5,TimeUnit.SECONDS))
            vm.accountChanged(b);release.countDown();assertTrue(finished.await(5,TimeUnit.SECONDS))
            Thread.sleep(100)
            assertEquals(0,QuestChests.total(app,a));assertEquals(0,QuestChests.total(app,b))
        } finally {release.countDown();clear(vm)}
    }

    @Test fun sameAccountOfflineRefreshKeepsItsOwnFriends() {
        var fail=false
        val vm=LeagueViewModel(app,LeagueService(LearningSyncTransport {_,_,_->
            if(fail) throw IOException("offline") else friends()
        },accounts(a)))
        try {
            vm.refreshFriends(a);waitFor {vm.friends.value is FriendsUi.Ready}
            val old=(vm.friends.value as FriendsUi.Ready).list
            fail=true;vm.refreshFriends(a)
            waitFor {(vm.friends.value as? FriendsUi.Ready)?.error != null}
            assertEquals(old,(vm.friends.value as FriendsUi.Ready).list)
        } finally {clear(vm)}
    }

    @Test fun chestRetryRequiresACompletionAfterItsOwnSyncRequest() {
        val calls=java.util.concurrent.atomic.AtomicInteger();val waiting=CountDownLatch(1)
        val vm=LeagueViewModel(app,null,QuestChestService(LearningSyncTransport {_,_,_->
            if(calls.incrementAndGet()==1) throw LearningSyncFailure("55000")
            JSONObject().put("total",20).put("recent",JSONArray().put(JSONObject().put("day","2026-10-23").put("points",20)))
        },accounts(a)))
        try {
            vm.openChest(a,a,"2026-10-23") {vm.waitForChestSync(5);waiting.countDown()}
            assertTrue(waiting.await(5,TimeUnit.SECONDS))
            vm.retryChest(a,a,4);vm.retryChest(a,a,5)
            assertEquals(ChestUi.Syncing,vm.chest.value);assertEquals(1,calls.get())
            vm.retryChest(a,a,6)
            waitFor {vm.chest.value is ChestUi.Opened}
            assertEquals(2,calls.get());assertEquals(20,QuestChests.total(app,a))
        } finally {clear(vm)}
    }

    @Test fun sameAccountReturnCannotRetryThePreviousLoginChest() {
        val calls=java.util.concurrent.atomic.AtomicInteger();val synced=CountDownLatch(1)
        val vm=LeagueViewModel(app,null,QuestChestService(LearningSyncTransport {_,_,_->
            calls.incrementAndGet();throw LearningSyncFailure("55000")
        },accounts(a)))
        try {
            vm.openChest(a,a,"2026-10-23") {synced.countDown()}
            assertTrue(synced.await(5,TimeUnit.SECONDS))
            vm.accountChanged(null);vm.accountChanged(a);vm.retryChest(a,a)
            assertEquals(ChestUi.Idle,vm.chest.value);assertEquals(1,calls.get())
            assertEquals(0,QuestChests.total(app,a))
        } finally {clear(vm)}
    }

    @Test fun chestRefreshWaitsWhileAnOpenIsPendingAndCannotLowerItsReward() {
        val entered=CountDownLatch(1);val release=CountDownLatch(1)
        val loads=java.util.concurrent.atomic.AtomicInteger()
        val vm=LeagueViewModel(app,null,QuestChestService(LearningSyncTransport {rpc,_,_->
            if(rpc=="open_quest_chest") {entered.countDown();check(release.await(5,TimeUnit.SECONDS))}
            else loads.incrementAndGet()
            JSONObject().put("total",if(rpc=="open_quest_chest") 20 else 0).put("recent",JSONArray().put(JSONObject().put("day","2026-10-23").put("points",20)))
        },accounts(a)))
        try {
            vm.openChest(a,a,"2026-10-23",null);assertTrue(entered.await(5,TimeUnit.SECONDS))
            vm.refreshChests(a);release.countDown()
            waitFor {vm.chest.value is ChestUi.Opened}
            assertEquals(0,loads.get());assertEquals(20,QuestChests.total(app,a))
        } finally {release.countDown();clear(vm)}
    }

    @Test fun missingAccountChestServiceDoesNotMintLocalAccountPoints() {
        val vm=LeagueViewModel(app,null,null)
        try {
            vm.openChest(a,a,"2026-10-23",null)
            assertEquals(ChestUi.Failed,vm.chest.value);assertEquals(0,QuestChests.total(app,a))
        } finally {clear(vm)}
    }
}
