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
        override fun request(path: String,method: String,body: JSONObject?,token: String?): JSONObject = when {
            path=="/auth/v1/user" -> JSONObject().put("id",token!!.removePrefix("token-")).put("email","fixture@example.invalid")
            path.contains("grant_type=id_token") -> JSONObject().put("access_token","token-$a").put("refresh_token","refresh-$a").put("expires_in",3600)
            path.contains("grant_type=password") -> {
                entered?.countDown();release?.await(5,TimeUnit.SECONDS)
                val id=if(body!!.getString("email").startsWith("a@")) a else b
                JSONObject().put("access_token","token-$id").put("refresh_token","refresh-$id").put("expires_in",3600)
            }
            path.startsWith("/auth/v1/logout") -> JSONObject()
            else -> error("Unexpected request")
        }
    }
    private fun await(predicate: ()->Boolean) {
        val deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(5)
        while(!predicate() && System.nanoTime()<deadline) Thread.sleep(20)
        assertTrue("Expected account state was not reached",predicate())
    }
    private fun exercise(syncFactory: (Fixture)->LearningAccountSync?={null},block: (LearningViewModel,Fixture)->Unit) {
        val instrumentation=InstrumentationRegistry.getInstrumentation()
        val target=instrumentation.targetContext
        val directory=File(target.cacheDir,"account-switch-${UUID.randomUUID()}").apply {mkdirs()}
        val context=object: ContextWrapper(target) {
            override fun getDatabasePath(name: String)=File(directory,name)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?)=SQLiteDatabase.openOrCreateDatabase(File(directory,name),factory)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?,handler: DatabaseErrorHandler?)=SQLiteDatabase.openOrCreateDatabase(File(directory,name).absolutePath,factory,handler)
        }
        val fixture=Fixture();val holder=ViewModelStore()
        val vm=LearningViewModel(target.applicationContext as Application,AccountService(fixture,Memory()),{LearningStore(context,it)},syncFactory(fixture))
        holder.put("account-test",vm)
        try {await {vm.ready.value};block(vm,fixture)}
        finally {fixture.release?.countDown();instrumentation.runOnMainSync {holder.clear()}}
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
        await {vm.state.value.ownerId==http.a && vm.account.value.sync.lastSuccessAt!=null && vm.state.value.displayName=="Bulut"}
        assertEquals("Bulut",vm.state.value.displayName)
        val last=vm.account.value.sync.lastSuccessAt
        vm.verifyAccount();await {vm.account.value.message.startsWith("Oturum")}
        assertEquals(last,vm.account.value.sync.lastSuccessAt)
        assertFalse(vm.account.value.sync.running)
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
}
