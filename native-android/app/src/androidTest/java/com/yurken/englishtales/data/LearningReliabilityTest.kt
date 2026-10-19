package com.yurken.englishtales.data

import android.app.Application
import android.content.Context
import android.content.ContextWrapper
import android.database.DatabaseErrorHandler
import android.database.sqlite.SQLiteDatabase
import androidx.lifecycle.ViewModelStore
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.ui.LearningReminders
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.util.UUID
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class LearningReliabilityTest {
    internal fun isolated(): Context {
        val target=InstrumentationRegistry.getInstrumentation().targetContext
        val id=UUID.randomUUID().toString()
        val directory=File(target.cacheDir,"reliability-$id").apply {mkdirs()}
        return object: ContextWrapper(target) {
            override fun getSharedPreferences(name: String,mode: Int)=target.getSharedPreferences("$id-$name",mode)
            override fun getDatabasePath(name: String)=File(directory,name)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?)=SQLiteDatabase.openOrCreateDatabase(File(directory,name),factory)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?,handler: DatabaseErrorHandler?)=SQLiteDatabase.openOrCreateDatabase(File(directory,name).absolutePath,factory,handler)
        }
    }
    private fun await(predicate: ()->Boolean) {
        val deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(5)
        while(!predicate() && System.nanoTime()<deadline) Thread.sleep(20)
        assertTrue("Expected learning state was not reached",predicate())
    }
    private class Memory: SessionStorage {
        var saved: AccountSession?=null
        override fun read()=saved
        override fun write(session: AccountSession) {saved=session}
        override fun clear() {saved=null}
    }
    private fun exercise(setup: (LearningStore)->Unit={},read: (LearningStore)->LearningSnapshot={it.snapshot()},
        block: (LearningViewModel,Context)->Unit) {
        val instrumentation=InstrumentationRegistry.getInstrumentation()
        val context=isolated()
        val http=object: AuthHttp("https://example.invalid","sb_publishable_fixture") {
            val user=UUID.randomUUID().toString()
            override fun request(path: String,method: String,body: JSONObject?,token: String?): JSONObject=when {
                path.contains("grant_type=password") -> JSONObject().put("access_token","fixture-token").put("refresh_token","fixture-refresh").put("expires_in",3600)
                path=="/auth/v1/user" -> JSONObject().put("id",user).put("email","fixture@example.invalid")
                else -> error("Unexpected Auth request")
            }
        }
        val holder=ViewModelStore()
        val vm=LearningViewModel(context.applicationContext as Application,AccountService(http,Memory()),
            {LearningStore(context,it).also {store ->if(it is LearningOwner.Guest) setup(store)}},
            onOwnerChanged={LearningReminderOwner.select(context,it)},readSnapshot=read)
        holder.put("reliability",vm)
        try {await {vm.ready.value};block(vm,context)}
        finally {instrumentation.runOnMainSync {holder.clear()}}
    }

    @Test fun rolledBackWordSaveAndLaterSaveRecoverInOrder()=exercise(setup={
        it.writableDatabase.execSQL("CREATE TRIGGER fail_save BEFORE INSERT ON saved_words BEGIN SELECT RAISE(ABORT,'fixture'); END")
    }) {vm,context ->
        vm.toggleWord("morning");vm.toggleWord("quiet")
        await {vm.writeError.value?.pendingCount==2}
        assertTrue(vm.state.value.savedWordIds.isEmpty())
        LearningStore(context).use {it.writableDatabase.execSQL("DROP TRIGGER fail_save")}
        vm.retryLearningWrites()
        await {vm.writeError.value==null && vm.state.value.savedWordIds==setOf("morning","quiet")}
        vm.retryLearningWrites();vm.refresh()
        LearningStore(context).use {assertEquals(2,it.queuedOperations().count {event ->event.rpc=="apply_word_event"})}
    }

    @Test fun retriedLessonCompletionAwardsPointsAndQueuesSessionOnce()=exercise(setup={
        it.writableDatabase.execSQL("CREATE TRIGGER fail_points BEFORE UPDATE ON learning_stats BEGIN SELECT RAISE(ABORT,'fixture'); END")
    }) {vm,context ->
        val session=UUID.randomUUID().toString()
        vm.completeLesson(5,session,"choice",5,0)
        await {vm.writeError.value?.pendingCount==1}
        assertEquals(0,vm.state.value.points)
        assertFalse(session in vm.completedSessions.value)
        LearningStore(context).use {it.writableDatabase.execSQL("DROP TRIGGER fail_points")}
        vm.retryLearningWrites()
        await {vm.writeError.value==null && vm.state.value.points==25}
        assertEquals(setOf(session),vm.completedSessions.value)
        vm.retryLearningWrites();vm.completeLesson(5,session,"choice",5,0)
        await {vm.state.value.completedLessons==1}
        LearningStore(context).use {assertEquals(1,it.queuedOperations().count {event ->event.rpc=="submit_learning_session"})}
    }

    @Test fun failingDatabaseAtStartupStillOpensTheAppWithRetry()=exercise(setup={
        it.writableDatabase.execSQL("CREATE TRIGGER fail_visit BEFORE INSERT ON engagement_events BEGIN SELECT RAISE(ABORT,'fixture'); END")
    }) {vm,context ->
        assertTrue(vm.ready.value)
        await {vm.writeError.value?.pendingCount==1}
        LearningStore(context).use {it.writableDatabase.execSQL("DROP TRIGGER fail_visit")}
        vm.retryLearningWrites()
        await {vm.writeError.value==null}
    }

    @Test fun snapshotFailureShowsErrorWithoutTogglingSavedWordAgain() {
        val failRead=AtomicBoolean(false)
        exercise(read={check(!failRead.get());it.snapshot()}) {vm,context ->
            failRead.set(true);vm.toggleWord("morning")
            await {vm.writeError.value?.pendingCount==0}
            LearningStore(context).use {assertTrue("morning" in it.snapshot().savedWordIds)}
            vm.retryLearningWrites()
            failRead.set(false);vm.retryLearningWrites()
            await {vm.writeError.value==null && "morning" in vm.state.value.savedWordIds}
            LearningStore(context).use {assertEquals(1,it.queuedOperations().count {event ->event.rpc=="apply_word_event"})}
        }
    }

    @Test fun checkpointsPatchActiveTimeWithoutReReadingTheSnapshot() {
        val reads=java.util.concurrent.atomic.AtomicInteger()
        exercise(read={reads.incrementAndGet();it.snapshot()}) {vm,context ->
            val session=UUID.randomUUID().toString()
            vm.beginSession(session,"choice",5,null)
            await {session in vm.state.value.activeSessionMillis}
            val before=reads.get()
            repeat(10) {vm.checkpointSession(session,(it+1)*1_000L)}
            await {vm.state.value.activeSessionMillis[session]==10_000L}
            assertEquals(before,reads.get())
            LearningStore(context).use {assertEquals(it.snapshot().activeSessionMillis,vm.state.value.activeSessionMillis)}
            vm.toggleWord("morning")
            await {"morning" in vm.state.value.savedWordIds}
            assertEquals(before+1,reads.get())
        }
    }

    @Test fun membershipTogglesStillFlipSavedWordsAndFavorites()=exercise {vm,_ ->
        val glossary=WordInfo("glossary:walk","walk","yürümek","","")
        vm.toggleWord("morning");vm.toggleGlossaryWord(glossary);vm.toggleFavorite("fixture-story")
        await {vm.state.value.savedWordIds==setOf("morning","glossary:walk") && vm.state.value.favoriteStoryIds==listOf("fixture-story")}
        vm.toggleWord("morning");vm.toggleGlossaryWord(glossary);vm.toggleFavorite("fixture-story")
        await {vm.state.value.savedWordIds.isEmpty() && vm.state.value.favoriteStoryIds.isEmpty() && vm.state.value.personalWords.isEmpty()}
    }

    @Test fun failedSessionStartRetainsOriginalTimeWhenLaterCompletionIsRetried()=exercise(setup={
        it.writableDatabase.execSQL("CREATE TRIGGER fail_start BEFORE INSERT ON session_drafts BEGIN SELECT RAISE(ABORT,'fixture'); END")
    }) {vm,context ->
        val session=UUID.randomUUID().toString()
        vm.beginSession(session,"choice",5,null)
        val capturedAt=System.currentTimeMillis()
        await {vm.writeError.value?.pendingCount==1}
        Thread.sleep(1_100)
        vm.completeLesson(5,session,"choice",5,1_000)
        await {vm.writeError.value?.pendingCount==2}
        LearningStore(context).use {it.writableDatabase.execSQL("DROP TRIGGER fail_start")}
        vm.retryLearningWrites()
        await {vm.writeError.value==null && vm.state.value.completedLessons==1}
        LearningStore(context).use {
            val payload=JSONObject(it.queuedOperations().single {event ->event.rpc=="submit_learning_session"}.payload)
            assertTrue(java.time.Instant.parse(payload.getString("startedAt")).toEpochMilli()<=capturedAt)
            assertEquals(1,payload.getInt("activeSeconds"))
        }
    }

    @Test fun explicitWordSaveAndRemovalDoNotReplayEvents() {
        LearningStore(isolated()).use {store ->
            store.setWordSaved("morning",true);store.setWordSaved("morning",true)
            assertEquals(setOf("morning"),store.snapshot().savedWordIds)
            store.setWordSaved("morning",false);store.setWordSaved("morning",false)
            assertTrue(store.snapshot().savedWordIds.isEmpty())
            assertEquals(listOf("save","remove"),store.queuedOperations().map {JSONObject(it.payload).getString("action")})
        }
    }

    @Test fun failedGuestWriteCannotBeRetriedIntoAnotherAccount()=exercise(setup={
        it.writableDatabase.execSQL("CREATE TRIGGER IF NOT EXISTS fail_save BEFORE INSERT ON saved_words BEGIN SELECT RAISE(ABORT,'fixture'); END")
    }) {vm,context ->
        vm.toggleWord("morning");vm.toggleWord("quiet");await {vm.writeError.value?.pendingCount==2}
        // A switch while writes are held must neither drop them nor carry them into the account.
        vm.signIn("fixture@example.invalid","fixture-password")
        await {!vm.account.value.busy}
        val pending=com.yurken.englishtales.AppLanguage.wrap(context.applicationContext).getString(com.yurken.englishtales.R.string.write_error_pending_changes)
        assertEquals("guest",vm.state.value.ownerId);assertNull(vm.account.value.userId)
        assertEquals(pending,vm.account.value.message)
        assertEquals(2,vm.writeError.value?.pendingCount)
        LearningStore(context).use {it.writableDatabase.execSQL("DROP TRIGGER fail_save")}
        vm.signIn("fixture@example.invalid","fixture-password")
        await {vm.state.value.ownerId!="guest" && !vm.account.value.busy}
        vm.retryLearningWrites();vm.refresh()
        assertNull(vm.writeError.value)
        assertTrue(vm.completedSessions.value.isEmpty())
        LearningStore(context).use {assertEquals(setOf("morning","quiet"),it.snapshot().savedWordIds)}
        LearningStore(context,LearningOwner.Account(vm.state.value.ownerId)).use {assertTrue(it.snapshot().savedWordIds.isEmpty())}
        assertEquals(vm.state.value.ownerId,LearningReminderOwner.current(context)?.id)
    }

    @Test fun completedAccountGoalSuppressesReminderEvenWhenGuestIsIncomplete() {
        val context=isolated();val account=LearningOwner.Account(UUID.randomUUID().toString())
        LearningStore(context,account).use {it.completeLesson(5,UUID.randomUUID().toString(),"choice",5,0)}
        LearningReminderOwner.select(context,account)
        var shown=false
        LearningReminders.deliver(context,show={shown=true})
        assertFalse(shown)
    }

    @Test fun reminderNamesTheReviewsThatAreDue() {
        val context=isolated();val account=LearningOwner.Account(UUID.randomUUID().toString())
        LearningStore(context,account).use {it.saveWords(LearningContent.words.take(3).map {w -> w.id})}
        LearningReminderOwner.select(context,account)
        var due=-1
        LearningReminders.deliver(context,show={due=it})
        assertEquals(3,due)
    }

    @Test fun incompleteAccountReceivesReminderEvenWhenGuestGoalIsComplete() {
        val context=isolated();val account=LearningOwner.Account(UUID.randomUUID().toString())
        LearningStore(context).use {it.completeLesson(5,UUID.randomUUID().toString(),"choice",5,0)}
        LearningReminderOwner.select(context,account)
        var shown=false
        LearningReminders.deliver(context,show={shown=true})
        assertTrue(shown)
        // Recreated context preferences still select the account; no token lookup is needed.
        assertEquals(account.id,LearningReminderOwner.current(ContextWrapper(context))?.id)
        LearningReminderOwner.select(context,LearningOwner.Guest)
        shown=false;LearningReminders.deliver(context,show={shown=true})
        assertFalse(shown)
    }

    @Test fun accountSwitchWhileReadingGoalDoesNotNotifyForPreviousOwner() {
        val context=isolated();val account=LearningOwner.Account(UUID.randomUUID().toString())
        LearningReminderOwner.select(context,account)
        var shown=false
        LearningReminders.deliver(context,storeFactory={owner ->
            LearningReminderOwner.select(context,LearningOwner.Guest)
            LearningStore(context,owner)
        },show={shown=true})
        assertFalse(shown)
    }

    @Test fun invalidPersistedOwnerNeverOpensGuestDatabaseOrShowsReminder() {
        val context=isolated()
        context.getSharedPreferences("reminders",Context.MODE_PRIVATE).edit().putString("learning_owner","invalid").commit()
        LearningReminders.deliver(context,storeFactory={error("Must not open a database")},show={fail("Must not notify")})
    }
}
