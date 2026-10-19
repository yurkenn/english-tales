package com.yurken.englishtales.ui

import android.app.Application
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.ViewModelStore
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.AppLanguage
import com.yurken.englishtales.R
import com.yurken.englishtales.data.*
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** A returning account signs in on a new device: onboarding opens before the first pull and is left once the cloud profile arrives. */
class ReturningAccountOnboardingTest {
    @get:Rule val compose=createAndroidComposeRule<ComponentActivity>()
    private val user=UUID.randomUUID().toString()
    private val auth=object: AuthHttp("https://example.invalid","sb_publishable_test") {
        override fun request(path: String,method: String,body: JSONObject?,token: String?): JSONObject = when {
            path=="/auth/v1/user" -> JSONObject().put("id",user).put("email","fixture@example.invalid")
            path.contains("grant_type=password") -> JSONObject().put("access_token","token-$user").put("refresh_token","refresh-$user").put("expires_in",3600)
            path.startsWith("/auth/v1/logout") -> JSONObject()
            else -> error("Unexpected request")
        }
    }
    private val memory=object: SessionStorage {
        var session: AccountSession?=null
        override fun read()=session
        override fun write(session: AccountSession) {this.session=session}
        override fun clear() {session=null}
    }

    @Test fun cloudProfileArrivingDuringOnboardingOpensMainWithoutSavingPreferences() {
        val target=InstrumentationRegistry.getInstrumentation().targetContext
        val language=target.getSharedPreferences("app_language",0)
        val hadChoice=language.getBoolean("confirmed",false)
        AppLanguage.confirmChoice(target)
        kotlinx.coroutines.runBlocking {LearningContent.load(target)}
        val pull=CountDownLatch(1);val rpcs=java.util.Collections.synchronizedList(mutableListOf<String>())
        val sync=LearningAccountSync(LearningSyncTransport {rpc,_,_ ->
            rpcs+=rpc
            if(rpc!="get_learning_snapshot") JSONObject().put("applied",true)
            else {
                assertTrue(pull.await(20,TimeUnit.SECONDS))
                val now=System.currentTimeMillis()
                LearningCloudSnapshot(user,now,CloudLearningProfile("Bulut","B1","Gizem",3,"UTC",3,now),emptyList(),emptyList(),emptyList(),emptyList()).json()
            }
        },"https://fixture.supabase.co")
        val context=LearningReliabilityTest().isolated()
        val holder=ViewModelStore()
        val vm=LearningViewModel(context.applicationContext as Application,AccountService(auth,memory),{LearningStore(context,it)},sync)
        holder.put("returning-account",vm)
        val greeting=compose.activity.getString(R.string.merhaba_ben_senin_okuma_arkadasinim)
        fun shown()=compose.onAllNodesWithText(greeting,useUnmergedTree=true).fetchSemanticsNodes().isNotEmpty()
        try {
            compose.waitUntil(5_000) {vm.ready.value}
            compose.setContent {EnglishTalesTheme {TalesApp(vm)}}
            vm.signIn("fixture@example.invalid","fixture-password")
            // The new device's account database is not onboarded yet, so onboarding opens first.
            compose.waitUntil(20_000) {vm.state.value.ownerId==user && runCatching {shown()}.getOrDefault(false)}
            assertFalse(vm.state.value.onboardingDone)
            pull.countDown()
            compose.waitUntil(20_000) {vm.state.value.onboardingDone && !runCatching {shown()}.getOrDefault(true)}
            assertEquals("B1",vm.state.value.level);assertEquals(3,vm.state.value.dailyGoal)
            compose.waitUntil(20_000) {!vm.account.value.sync.running}
            assertFalse(rpcs.toString(),"save_learning_preferences" in rpcs)
        } finally {
            pull.countDown()
            if(!hadChoice) language.edit().remove("confirmed").commit()
            InstrumentationRegistry.getInstrumentation().runOnMainSync {holder.clear()}
        }
    }
}
