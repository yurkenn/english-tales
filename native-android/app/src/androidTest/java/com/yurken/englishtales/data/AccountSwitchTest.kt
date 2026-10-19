package com.yurken.englishtales.data

import android.app.Application
import android.content.ContextWrapper
import android.database.DatabaseErrorHandler
import android.database.sqlite.SQLiteDatabase
import androidx.lifecycle.ViewModelStore
import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class AccountSwitchTest {
    private class Memory: SessionStorage {
        var session: AccountSession?=null
        override fun read()=session
        override fun write(session: AccountSession) {this.session=session}
        override fun clear() {session=null}
    }
    private class Fixture: AuthHttp("https://example.invalid","sb_publishable_test") {
        val a=UUID.randomUUID().toString();val b=UUID.randomUUID().toString()
        var entered: CountDownLatch?=null;var release: CountDownLatch?=null
        var deletionError: String?=null
        override fun request(path: String,method: String,body: JSONObject?,token: String?): JSONObject = when {
            path=="/auth/v1/user" -> JSONObject().put("id",token!!.removePrefix("token-")).put("email","fixture@example.invalid")
            path.contains("grant_type=id_token") -> JSONObject().put("access_token","token-$a").put("refresh_token","refresh-$a").put("expires_in",3600)
            path.contains("grant_type=password") -> {
                entered?.countDown();release?.await(5,TimeUnit.SECONDS)
                val id=if(body!!.getString("email").startsWith("a@")) a else b
                JSONObject().put("access_token","token-$id").put("refresh_token","refresh-$id").put("expires_in",3600)
            }
            path.startsWith("/auth/v1/logout") -> JSONObject()
            path=="/functions/v1/delete-account" -> {
                deletionError?.let {throw AuthFailure(it,403)}
                JSONObject().put("code","account_deleted").put("userId",token!!.removePrefix("token-"))
            }
            else -> error("Unexpected request")
        }
    }
    private fun await(seconds: Long=5,predicate: ()->Boolean) {
        val deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(seconds)
        while(!predicate() && System.nanoTime()<deadline) Thread.sleep(20)
        assertTrue("Expected account state was not reached",predicate())
    }
    private fun exercise(syncFactory: (Fixture)->LearningAccountSync?={null},opening: (LearningOwner)->Unit={},retired: MutableList<String>?=null,scheduled: MutableList<Pair<String,Boolean>>?=null,block: (LearningViewModel,Fixture)->Unit) {
        val instrumentation=InstrumentationRegistry.getInstrumentation()
        val target=instrumentation.targetContext
        val directory=File(target.cacheDir,"account-switch-${UUID.randomUUID()}").apply {mkdirs()}
        val context=object: ContextWrapper(target) {
            override fun getDatabasePath(name: String)=File(directory,name)
            override fun deleteDatabase(name: String)=SQLiteDatabase.deleteDatabase(File(directory,name))
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?)=SQLiteDatabase.openOrCreateDatabase(File(directory,name),factory)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?,handler: DatabaseErrorHandler?)=SQLiteDatabase.openOrCreateDatabase(File(directory,name).absolutePath,factory,handler)
        }
        val fixture=Fixture();val holder=ViewModelStore()
        val vm=LearningViewModel(target.applicationContext as Application,AccountService(fixture,Memory()),{opening(it);LearningStore(context,it)},syncFactory(fixture),
            retireSync={user -> retired?.let {synchronized(it) {it.add(user)}}},scheduleWork={user,now -> scheduled?.let {synchronized(it) {it.add(user to now)}}})
        holder.put("account-test",vm)
        try {await {vm.ready.value};block(vm,fixture)}
        finally {fixture.release?.countDown();instrumentation.runOnMainSync {holder.clear()}}
    }
    @Test fun acknowledgedDeletionErasesOnlyTargetAndRetainsGuestAndOtherAccount()=exercise {vm,http ->
        vm.saveWords(listOf("morning"));await {"morning" in vm.state.value.savedWordIds}
        vm.signIn("b@example.invalid","fixture-password");await {vm.state.value.ownerId==http.b}
        vm.completeLesson(4,UUID.randomUUID().toString(),"choice",5,0);await {vm.state.value.points==20}
        vm.signIn("a@example.invalid","fixture-password");await {vm.state.value.ownerId==http.a}
        vm.completeLesson(5,UUID.randomUUID().toString(),"choice",5,0);await {vm.state.value.points==25}
        vm.deleteAccount();await {vm.state.value.ownerId=="guest" && !vm.account.value.busy}
        assertEquals(setOf("morning"),vm.state.value.savedWordIds)
        vm.signIn("b@example.invalid","fixture-password");await {vm.state.value.ownerId==http.b};assertEquals(20,vm.state.value.points)
        // Fixture-only recreation with the same UID proves the removed database is empty.
        vm.signIn("a@example.invalid","fixture-password");await {vm.state.value.ownerId==http.a};assertEquals(0,vm.state.value.points)
    }
    @Test fun deletionWithoutFreshAuthenticationPreservesLocalAccount()=exercise {vm,http ->
        vm.signIn("a@example.invalid","fixture-password");await {vm.state.value.ownerId==http.a}
        vm.completeLesson(5,UUID.randomUUID().toString(),"choice",5,0);await {vm.state.value.points==25}
        http.deletionError="reauthentication_required"
        vm.deleteAccount();await {vm.account.value.needsSignIn && !vm.account.value.busy}
        assertEquals(http.a,vm.state.value.ownerId);assertEquals(25,vm.state.value.points)
    }
    @Test fun switchingToAnotherAccountRetiresOnlyThePreviousAccountsBackgroundSync() {
        val retired=mutableListOf<String>()
        fun seen()=synchronized(retired) {retired.toList()}
        exercise(retired=retired) {vm,http ->
            vm.signIn("a@example.invalid","fixture-password");await {vm.state.value.ownerId==http.a && !vm.account.value.busy}
            assertTrue(seen().isEmpty())
            // Same account signing in again (e.g. after its session expired) keeps its periodic job.
            vm.signIn("a@example.invalid","fixture-password");await {!vm.account.value.busy}
            assertTrue(seen().isEmpty())
            vm.signIn("b@example.invalid","fixture-password");await {vm.state.value.ownerId==http.b && !vm.account.value.busy}
            assertEquals(listOf(http.a),seen())
            vm.signOut();await {vm.state.value.ownerId=="guest" && !vm.account.value.busy}
            assertEquals(listOf(http.a,http.b),seen())
        }
    }
    @Test fun switchingAccountsAndGuestKeepsSeparateLearningData()=exercise {vm,http ->
        vm.saveWords(listOf("morning"));await {"morning" in vm.state.value.savedWordIds}
        vm.signIn("a@example.invalid","fixture-password");await {vm.state.value.ownerId==http.a}
        vm.saveWords(listOf("quiet"));vm.completeLesson(5,UUID.randomUUID().toString(),"choice",5,0)
        await {vm.state.value.points==25}
        vm.signOut();await {vm.state.value.ownerId=="guest"}
        assertEquals(setOf("morning"),vm.state.value.savedWordIds);assertEquals(0,vm.state.value.points)
        vm.signIn("b@example.invalid","fixture-password");await {vm.state.value.ownerId==http.b}
        assertTrue(vm.state.value.savedWordIds.isEmpty());assertEquals(0,vm.state.value.points)
        vm.saveWords(listOf("smile"));await {"smile" in vm.state.value.savedWordIds}
        vm.signOut();await {vm.state.value.ownerId=="guest"}
        vm.signIn("a@example.invalid","fixture-password");await {vm.state.value.ownerId==http.a}
        assertEquals(setOf("quiet"),vm.state.value.savedWordIds);assertEquals(25,vm.state.value.points)
    }
    @Test fun staleGuestActionCannotWriteIntoNewAccount()=exercise {vm,http ->
        http.entered=CountDownLatch(1);http.release=CountDownLatch(1)
        vm.signIn("a@example.invalid","fixture-password")
        assertTrue(http.entered!!.await(5,TimeUnit.SECONDS))
        vm.toggleWord("quiet")
        http.release!!.countDown()
        await {vm.state.value.ownerId==http.a}
        vm.completeLesson(0,UUID.randomUUID().toString(),"choice",5,0)
        await {vm.state.value.completedLessons==1}
        assertFalse("quiet" in vm.state.value.savedWordIds)
        // The guest action is kept by the guest it was made under, not silently dropped.
        vm.signOut();await {vm.state.value.ownerId=="guest"}
        assertTrue("quiet" in vm.state.value.savedWordIds)
    }
    @Test fun writesQueuedDuringGuestTransferLandInAccount() {
        val armed=java.util.concurrent.atomic.AtomicBoolean(false);val entered=CountDownLatch(1);val release=CountDownLatch(1)
        try {
            // The transfer opens the guest store inside the actor; holding it there keeps the transfer in flight.
            exercise(opening={if(it is LearningOwner.Guest && armed.getAndSet(false)) {entered.countDown();assertTrue(release.await(5,TimeUnit.SECONDS))}}) {vm,http ->
                vm.saveWords(listOf("morning"));await {"morning" in vm.state.value.savedWordIds}
                vm.signIn("a@example.invalid","fixture-password");await {vm.state.value.ownerId==http.a && vm.account.value.guestTransfer!=null && !vm.account.value.busy}
                armed.set(true);vm.transferGuestProgress();assertTrue(entered.await(5,TimeUnit.SECONDS))
                val story=LearningContent.storyById.getValue("quiet-morning")
                vm.updateProgress(story.id,40,story.sentences.first().id);vm.saveWords(listOf("quiet"))
                release.countDown()
                await {!vm.account.value.busy && "quiet" in vm.state.value.savedWordIds}
                assertEquals(http.a,vm.state.value.ownerId)
                assertEquals(setOf("morning","quiet"),vm.state.value.savedWordIds)
                assertEquals(40,vm.state.value.storyProgress[story.id])
            }
        } finally {release.countDown()}
    }
    @Test fun cancelledGooglePickerKeepsGuestProgress()=exercise {vm,_ ->
        vm.saveWords(listOf("morning"));await {"morning" in vm.state.value.savedWordIds}
        kotlinx.coroutines.runBlocking {vm.signInGoogle {throw AuthFailure("google_cancelled")}}
        assertFalse(vm.account.value.busy);assertNull(vm.account.value.userId)
        assertEquals(setOf("morning"),vm.state.value.savedWordIds)
    }
    @Test fun googleSignInOpensAccountAndKeepsGuestSeparate()=exercise {vm,http ->
        vm.saveWords(listOf("morning"));await {"morning" in vm.state.value.savedWordIds}
        kotlinx.coroutines.runBlocking {vm.signInGoogle {GoogleIdentity("fixture-id-token",GoogleSignIn.nonce())}}
        await {vm.state.value.ownerId==http.a}
        assertTrue(vm.state.value.savedWordIds.isEmpty())
        vm.signOut();await {vm.state.value.ownerId=="guest"}
        assertEquals(setOf("morning"),vm.state.value.savedWordIds)
    }
    private fun remote(user: String): JSONObject {
        val now=System.currentTimeMillis()
        return LearningCloudSnapshot(user,now,CloudLearningProfile("Bulut","A2","Günlük yaşam",2,"UTC",3,now),
            emptyList(),emptyList(),emptyList(),emptyList()).json()
    }
    @Test fun signInAutomaticallyPullsCloudAndPreservesSyncStatusDuringVerification()=exercise({http ->
        LearningAccountSync(LearningSyncTransport {rpc,_,token ->
            assertEquals("get_learning_snapshot",rpc);remote(token.removePrefix("token-"))
        },"https://fixture.supabase.co")
    }) {vm,http ->
        vm.signIn("a@example.invalid","fixture-password")
        await {vm.state.value.ownerId==http.a && vm.account.value.sync.lastSuccessAt!=null && vm.state.value.displayName=="Bulut" && !vm.account.value.sync.running}
        assertEquals("Bulut",vm.state.value.displayName)
        val last=vm.account.value.sync.lastSuccessAt
        val verifiedMessage=com.yurken.englishtales.AppLanguage.wrap(
            InstrumentationRegistry.getInstrumentation().targetContext.applicationContext
        ).getString(com.yurken.englishtales.R.string.account_message_session_verified)
        vm.verifyAccount();await {vm.account.value.message==verifiedMessage}
        assertEquals(last,vm.account.value.sync.lastSuccessAt)
        assertFalse(vm.account.value.sync.running)
    }
    /** A returning account on a new device: its pulled cloud profile finishes onboarding, and nothing writes its preferences back. */
    @Test fun signInWithACloudProfileMarksOnboardingDoneWithoutSavingPreferences() {
        val rpcs=java.util.Collections.synchronizedList(mutableListOf<String>())
        exercise({LearningAccountSync(LearningSyncTransport {rpc,_,token ->
            rpcs+=rpc;if(rpc=="get_learning_snapshot") remote(token.removePrefix("token-")) else JSONObject().put("applied",true)
        },"https://fixture.supabase.co")}) {vm,http ->
            vm.signIn("a@example.invalid","fixture-password")
            await(20) {vm.state.value.onboardingDone && vm.account.value.sync.lastSuccessAt!=null && !vm.account.value.sync.running}
            assertEquals("A2",vm.state.value.level);assertEquals(2,vm.state.value.dailyGoal)
            // Confirming the same answers in a late onboarding screen is not an edit either.
            vm.completeOnboarding("A2","Günlük yaşam",2);vm.syncNow()
            Thread.sleep(2_500);await(20) {!vm.account.value.sync.running}
            assertFalse(rpcs.toString(),"save_learning_preferences" in rpcs)
        }
    }
    @Test fun activeTimeCheckpointsStayLocalWhileRealWritesStillSync() {
        // Counts every RPC so a checkpoint can neither pull a snapshot nor upload anything.
        val rpcs=java.util.concurrent.atomic.AtomicInteger()
        exercise({LearningAccountSync(LearningSyncTransport {rpc,_,token ->
            rpcs.incrementAndGet();if(rpc=="get_learning_snapshot") remote(token.removePrefix("token-")) else JSONObject().put("applied",true)
        },"https://fixture.supabase.co")}) {vm,http ->
            vm.signIn("a@example.invalid","fixture-password")
            await(20) {vm.state.value.ownerId==http.a && vm.account.value.sync.lastSuccessAt!=null && !vm.account.value.sync.running}
            val session=UUID.randomUUID().toString();val signedIn=rpcs.get()
            vm.beginSession(session,"choice",5,null)
            await(20) {rpcs.get()>signedIn && !vm.account.value.sync.running}
            Thread.sleep(2_500);await(20) {!vm.account.value.sync.running}
            val settled=rpcs.get()
            repeat(4) {vm.checkpointSession(session,(it+1)*1_000L);Thread.sleep(1_000)}
            Thread.sleep(3_000)
            assertEquals(settled,rpcs.get())
            vm.toggleWord("quiet");await(20) {"quiet" in vm.state.value.savedWordIds}
            await(20) {rpcs.get()>settled}
        }
    }
    @Test fun writeDuringARunningSyncUploadsSoonAfterItInsteadOfAMinuteLater() {
        val hold=java.util.concurrent.atomic.AtomicBoolean(false);val entered=CountDownLatch(1);val release=CountDownLatch(1)
        val uploads=java.util.concurrent.atomic.AtomicInteger()
        try {
            exercise({LearningAccountSync(LearningSyncTransport {rpc,_,token ->
                if(hold.getAndSet(false)) {entered.countDown();assertTrue(release.await(10,TimeUnit.SECONDS))}
                if(rpc=="get_learning_snapshot") remote(token.removePrefix("token-")) else {uploads.incrementAndGet();JSONObject().put("applied",true)}
            },"https://fixture.supabase.co")}) {vm,http ->
                vm.signIn("a@example.invalid","fixture-password")
                await(20) {vm.state.value.ownerId==http.a && vm.account.value.sync.lastSuccessAt!=null && !vm.account.value.sync.running}
                hold.set(true);vm.syncNow();assertTrue(entered.await(10,TimeUnit.SECONDS))
                val before=uploads.get()
                vm.toggleWord("morning");await {"morning" in vm.state.value.savedWordIds}
                Thread.sleep(2_500)
                release.countDown()
                await(15) {uploads.get()>before}
            }
        } finally {release.countDown()}
    }
    @Test fun writeJustBeforeASyncFinishesIsNotPushedBackAMinute() {
        val hold=java.util.concurrent.atomic.AtomicBoolean(false);val entered=CountDownLatch(1);val release=CountDownLatch(1)
        val uploads=java.util.concurrent.atomic.AtomicInteger()
        try {
            exercise({LearningAccountSync(LearningSyncTransport {rpc,_,token ->
                if(hold.getAndSet(false)) {entered.countDown();assertTrue(release.await(10,TimeUnit.SECONDS))}
                if(rpc=="get_learning_snapshot") remote(token.removePrefix("token-")) else {uploads.incrementAndGet();JSONObject().put("applied",true)}
            },"https://fixture.supabase.co")}) {vm,http ->
                vm.signIn("a@example.invalid","fixture-password")
                await(20) {vm.state.value.ownerId==http.a && vm.account.value.sync.lastSuccessAt!=null && !vm.account.value.sync.running}
                // Holds the final snapshot read, so the sync ends right after the write and before the write's own timer fires.
                hold.set(true);vm.syncNow();assertTrue(entered.await(10,TimeUnit.SECONDS))
                val before=uploads.get()
                vm.toggleWord("morning");await {"morning" in vm.state.value.savedWordIds}
                release.countDown()
                await(15) {uploads.get()>before}
            }
        } finally {release.countDown()}
    }
    @Test fun stoppedAppCancelsTheForegroundSyncTimerAndStartingSyncsAgain() {
        val rpcs=java.util.concurrent.atomic.AtomicInteger()
        exercise({LearningAccountSync(LearningSyncTransport {rpc,_,token ->
            rpcs.incrementAndGet();if(rpc=="get_learning_snapshot") remote(token.removePrefix("token-")) else JSONObject().put("applied",true)
        },"https://fixture.supabase.co")}) {vm,http ->
            vm.signIn("a@example.invalid","fixture-password")
            await(20) {vm.state.value.ownerId==http.a && vm.account.value.sync.lastSuccessAt!=null && !vm.account.value.sync.running}
            // The write arms the 2 s timer; stopping right after must cancel it, and a write while stopped must not arm a new one.
            vm.toggleWord("quiet");vm.setForeground(false)
            await {"quiet" in vm.state.value.savedWordIds}
            val stopped=rpcs.get()
            vm.toggleWord("morning");await {"morning" in vm.state.value.savedWordIds}
            Thread.sleep(4_000)
            assertEquals(stopped,rpcs.get())
            vm.setForeground(true)
            await(15) {rpcs.get()>stopped}
        }
    }
    /** The in-app timer alone syncs a started app; the one-time worker is enqueued only once it stops with unsent writes, and a resume visit syncs nothing. */
    @Test fun foregroundSyncDoesNotAlsoEnqueueTheOneTimeWorker() {
        val rpcs=java.util.concurrent.atomic.AtomicInteger();val uploads=java.util.concurrent.atomic.AtomicInteger()
        val scheduled=java.util.Collections.synchronizedList(mutableListOf<Pair<String,Boolean>>())
        exercise({LearningAccountSync(LearningSyncTransport {rpc,_,token ->
            rpcs.incrementAndGet();if(rpc=="get_learning_snapshot") remote(token.removePrefix("token-")) else {uploads.incrementAndGet();JSONObject().put("applied",true)}
        },"https://fixture.supabase.co")},scheduled=scheduled) {vm,http ->
            vm.signIn("a@example.invalid","fixture-password")
            await(20) {vm.state.value.ownerId==http.a && vm.account.value.sync.lastSuccessAt!=null && !vm.account.value.sync.running}
            vm.toggleWord("morning");await(15) {uploads.get()>0 && vm.account.value.sync.pending==0 && !vm.account.value.sync.running}
            assertTrue(synchronized(scheduled) {scheduled.isNotEmpty() && scheduled.none {it.second}})
            // A verification or rerun queued during the first sync may still fire its 2 s timer; wait until requests stop.
            var settled: Int
            do {settled=rpcs.get();Thread.sleep(3_000)} while(rpcs.get()!=settled)
            vm.refresh();Thread.sleep(4_000)
            assertEquals(settled,rpcs.get())
            vm.toggleWord("quiet");vm.setForeground(false)
            await {synchronized(scheduled) {(http.a to true) in scheduled}}
        }
    }
    @Test fun signOutRequestInvalidatesAnInFlightSnapshotBeforeItReturns() {
        val entered=CountDownLatch(1);val release=CountDownLatch(1)
        try {
            exercise({http ->LearningAccountSync(LearningSyncTransport {_,_,token ->
                entered.countDown();assertTrue(release.await(5,TimeUnit.SECONDS));remote(token.removePrefix("token-"))
            },"https://fixture.supabase.co")}) {vm,http ->
                vm.signIn("a@example.invalid","fixture-password");await {vm.state.value.ownerId==http.a}
                vm.syncNow();assertTrue(entered.await(5,TimeUnit.SECONDS))
                vm.signOut();assertFalse(vm.account.value.sync.running)
                release.countDown();await {vm.state.value.ownerId=="guest"}
                vm.signIn("a@example.invalid","fixture-password");await {vm.state.value.ownerId==http.a}
                assertNull(vm.account.value.sync.lastSuccessAt)
                assertEquals("Okuyucu",vm.state.value.displayName)
            }
        } finally {release.countDown()}
    }
    @Test fun slowNetworkDoesNotBlockLocalPreferenceSave() {
        val entered=CountDownLatch(1);val release=CountDownLatch(1)
        try {
            exercise({LearningAccountSync(LearningSyncTransport {_,_,token ->
                entered.countDown();assertTrue(release.await(5,TimeUnit.SECONDS));remote(token.removePrefix("token-"))
            },"https://fixture.supabase.co")}) {vm,http ->
                vm.signIn("a@example.invalid","fixture-password");await {vm.state.value.ownerId==http.a}
                vm.syncNow();assertTrue(entered.await(5,TimeUnit.SECONDS))
                vm.updatePreferences("A2","Macera",2,"Yerel")
                await {vm.state.value.displayName=="Yerel"}
                assertEquals(1L,release.count)
                release.countDown()
            }
        } finally {release.countDown()}
    }
}
