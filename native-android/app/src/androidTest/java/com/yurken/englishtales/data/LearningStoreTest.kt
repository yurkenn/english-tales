package com.yurken.englishtales.data

import android.content.Context
import android.content.ContextWrapper
import android.content.SharedPreferences
import android.database.sqlite.SQLiteDatabase
import android.database.DatabaseErrorHandler
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.Assert.*
import java.util.Calendar
import java.util.UUID
import org.json.JSONObject

/** Isolated databases/preferences; the emulator user's real progress is never touched. */
class LearningStoreTest {
    private lateinit var context: Context
    private lateinit var store: LearningStore
    private var now=0L
    private val dbName="retention_verification.db"
    @Test fun progressAndCompletionKeepCapturedRevision() {
        val stories=LearningContent.stories
        val old=stories.first()
        val updated=old.copy(revisionId=UUID.randomUUID().toString())
        val session=UUID.randomUUID().toString()
        try {
            store.updateProgress(old.id,88,old.sentences.last().id,old)
            store.beginSession(session,"reading",0,old.id,old)
            LearningContent.install(stories.map {if(it.id==old.id) updated else it})
            now+=30_000
            store.completeReading(old.id,session,10_000,old)
            assertEquals(old.revisionId,store.snapshot().readingPositions.getValue(old.id).revisionId)
            val event=store.queuedOperations().first {it.rpc=="submit_learning_session"}
            assertEquals(old.revisionId,JSONObject(event.payload).getString("storyRevisionId"))
            store.updateProgress(updated.id,20,updated.sentences.first().id,updated)
            assertEquals(20,store.snapshot().storyProgress.getValue(updated.id))
            assertEquals(updated.revisionId,store.snapshot().readingPositions.getValue(updated.id).revisionId)
        } finally {LearningContent.install(stories)}
    }
    @Before fun setup() {
        val target=InstrumentationRegistry.getInstrumentation().targetContext
        context=object: ContextWrapper(target) {
            private fun mapped(name: String) = if(name=="english_tales.db" || name==dbName) dbName else "${dbName}_$name"
            override fun getSharedPreferences(name: String,mode: Int): SharedPreferences = super.getSharedPreferences("verification_$name",mode)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?): SQLiteDatabase = super.openOrCreateDatabase(mapped(name),mode,factory)
            override fun openOrCreateDatabase(name: String,mode: Int,factory: SQLiteDatabase.CursorFactory?,handler: DatabaseErrorHandler?): SQLiteDatabase = super.openOrCreateDatabase(mapped(name),mode,factory,handler)
            override fun getDatabasePath(name: String) = super.getDatabasePath(mapped(name))
        }
        target.deleteDatabase(dbName)
        context.getSharedPreferences("learning_preferences",0).edit().clear().commit()
        now=Calendar.getInstance().apply {set(2026,Calendar.OCTOBER,10,12,0,0);set(Calendar.MILLISECOND,0)}.timeInMillis
        store=LearningStore(context) {now}
    }
    @After fun cleanup() {store.close();context.deleteDatabase(dbName)}

    @Test fun firstReadingAndPracticeFinishGoalOnlyOnce() {
        store.completeOnboarding("A1","Günlük yaşam",2)
        store.completeReading("quiet-morning");store.completeReading("quiet-morning")
        assertEquals(1,store.snapshot().todaySessions);assertFalse(store.snapshot().dailyGoalReached)
        store.completeLesson(4,"unique-session");store.completeLesson(4,"unique-session")
        val snapshot=store.snapshot()
        assertEquals(2,snapshot.todaySessions);assertTrue(snapshot.dailyGoalReached)
        assertEquals(20,snapshot.points);assertEquals(1,snapshot.completedLessons);assertEquals(1,snapshot.streak)
        assertTrue(snapshot.badges.containsAll(listOf("first_story","first_practice")))
        store.readableDatabase.rawQuery("SELECT COUNT(*) FROM engagement_events WHERE name='daily_goal_reached'",null).use {assertTrue(it.moveToFirst());assertEquals(1,it.getInt(0))}
    }
    @Test fun reconfirmingTheOnboardedProfileDoesNotMarkPreferencesForUpload() {
        fun dirty()=store.readableDatabase.rawQuery("SELECT preferences_dirty FROM local_profile WHERE id=1",null).use {it.moveToFirst();it.getInt(0)}
        // A first onboarding is always the learner's own choice, even when it matches the defaults.
        store.completeOnboarding("A1","Günlük yaşam",1);assertEquals(1,dirty())
        store.writableDatabase.execSQL("UPDATE local_profile SET level='B1',genre='Gizem',goal=3,preferences_dirty=0 WHERE id=1")
        store.completeOnboarding("B1","Gizem",3);assertEquals(0,dirty())
        assertTrue(store.snapshot().onboardingDone);assertEquals("B1",store.snapshot().level)
        store.completeOnboarding("A2","Gizem",3);assertEquals(1,dirty());assertEquals("A2",store.snapshot().level)
    }
    @Test fun anOverCountedPracticeIsClampedInsteadOfWedgingTheWriteQueue() {
        val session=UUID.randomUUID().toString()
        store.beginSession(session,"choice",3)
        now+=30_000
        store.completeLesson(5,session,"choice",3,10_000)
        assertEquals(1,store.snapshot().completedLessons)
        val payload=JSONObject(store.queuedOperations().single {it.rpc=="submit_learning_session"}.payload)
        assertEquals(3,payload.getInt("questionCount"));assertEquals(3,payload.getInt("correctAnswers"))
        assertThrows(IllegalArgumentException::class.java) {store.completeLesson(-1,UUID.randomUUID().toString())}
    }
    @Test fun sentenceGapKeepsExistingChoicePayloadAndAwardsTheGoalOnlyOnce() {
        val questions=SentenceGap.session(SentenceGap.prompts(LearningContent.stories,LearningContent.words),LearningContent.words,emptyList(),"A1")
        assertEquals(5,questions.size)
        store.completeOnboarding("A1","Günlük yaşam",1)
        store.saveWords(questions.map {it.prompt.wordId})
        val session=UUID.randomUUID().toString()
        store.beginSession(session,SentenceGap.SESSION_KIND,questions.size)
        now+=30_000
        questions.forEachIndexed {i,q ->store.reviewWord(q.prompt.wordId,i!=0)}
        repeat(2) {store.completeLesson(4,session,SentenceGap.SESSION_KIND,questions.size,30_000)}
        val snapshot=store.snapshot()
        assertEquals(20,snapshot.points)
        assertEquals(1,snapshot.todaySessions)
        assertEquals(1,snapshot.completedLessons)
        assertTrue(snapshot.dailyGoalReached)
        assertEquals("learning",snapshot.wordStates[questions.first().prompt.wordId])
        assertEquals("reviewing",snapshot.wordStates[questions.last().prompt.wordId])
        val operations=store.queuedOperations().filter {it.rpc=="submit_learning_session"}
        assertEquals(1,operations.size)
        val payload=JSONObject(operations.single().payload)
        assertEquals("choice",payload.getString("kind"))
        assertEquals(5,payload.getInt("questionCount"))
        assertEquals(4,payload.getInt("correctAnswers"))
        assertFalse(payload.has("sentence"))
        store.readableDatabase.rawQuery("SELECT COUNT(*) FROM engagement_events WHERE name='daily_goal_reached'",null).use {
            assertTrue(it.moveToFirst());assertEquals(1,it.getInt(0))
        }
    }
    @Test fun activityRollsOverAndStreakExpires() {
        store.completeLesson(3,"one")
        now+=LearningPolicy.DAY_MS
        assertEquals(0,store.snapshot().todaySessions);assertEquals(1,store.snapshot().streak)
        store.completeReading("quiet-morning");assertEquals(2,store.snapshot().streak)
        now+=2*LearningPolicy.DAY_MS
        assertEquals(0,store.snapshot().streak)
        store.completeLesson(1,"two");assertEquals(1,store.snapshot().streak)
        assertEquals(3,store.snapshot().weeklyActivity.count {it.sessions>0})
    }
    @Test fun savedWordSchedulingSurvivesReopenAndBulkSave() {
        store.saveWords(listOf("quiet","morning"))
        assertEquals(2,store.snapshot().dueWordIds.size)
        store.reviewWord("quiet",true);store.reviewWord("quiet",true);store.saveWords(listOf("quiet"))
        assertEquals(listOf("morning"),store.snapshot().dueWordIds)
        store.close();store=LearningStore(context) {now}
        assertEquals("reviewing",store.snapshot().wordStates["quiet"])
        // Q5.7: FSRS spaces the next review from the memory left by the first answer.
        val first=Fsrs.review(null,true,0.0)
        now+=LearningPolicy.DAY_MS
        store.reviewWord("quiet",true)
        assertEquals("an early answer changes nothing",now-LearningPolicy.DAY_MS+Fsrs.intervalDays(first.stability)*LearningPolicy.DAY_MS,store.snapshot().nextReviewAt)
        now+=(Fsrs.intervalDays(first.stability)-1)*LearningPolicy.DAY_MS
        store.reviewWord("quiet",true)
        val second=Fsrs.review(first,true,Fsrs.intervalDays(first.stability).toDouble())
        assertEquals(now+Fsrs.intervalDays(second.stability)*LearningPolicy.DAY_MS,store.snapshot().nextReviewAt)
        store.reviewWord("quiet",false)
        assertEquals("learning",store.snapshot().wordStates["quiet"])
        assertEquals(now+600000,store.snapshot().nextReviewAt)
    }
    @Test fun missedWordsComeFirstUntilKnownOrForgotten() {
        store.saveWords(listOf("quiet","morning"))
        assertEquals(emptyList<String>(),store.snapshot().weakWordIds)
        store.reviewWord("morning",false);store.reviewWord("morning",false)
        now+=LearningPolicy.DAY_MS
        store.reviewWord("morning",false);store.reviewWord("quiet",false)
        // Two missed days outrank one; the same day counts once.
        assertEquals(listOf("morning","quiet"),store.snapshot().weakWordIds)
        store.close();store=LearningStore(context) {now}
        assertEquals(listOf("morning","quiet"),store.snapshot().weakWordIds)
        now+=(ReviewFocus.WINDOW_DAYS+1)*LearningPolicy.DAY_MS
        assertEquals(emptyList<String>(),store.snapshot().weakWordIds)
    }
    @Test fun favoritesKeepNewestFirstAcrossReopenAndRemoval() {
        store.setFavorite("quiet-morning",true)
        now+=1000
        store.setFavorite("paper-boat",true);store.setFavorite("quiet-morning",true)
        assertEquals(listOf("paper-boat","quiet-morning"),store.snapshot().favoriteStoryIds)
        store.close();store=LearningStore(context) {now}
        assertEquals(listOf("paper-boat","quiet-morning"),store.snapshot().favoriteStoryIds)
        store.setFavorite("paper-boat",false)
        assertEquals(listOf("quiet-morning"),store.snapshot().favoriteStoryIds)
        // A story that later leaves the catalog stays a harmless ID; screens only list stories they can open.
        store.setFavorite("archived-story",true)
        assertEquals(listOf("archived-story","quiet-morning"),store.snapshot().favoriteStoryIds)
    }
    @Test fun glossaryWordsArePractisedAndSyncWithTheirText() {
        val walked=WordInfo("glossary:walk","walk","yürümek","","")
        store.savePersonalWord(walked)
        var snapshot=store.snapshot()
        assertTrue("glossary:walk" in snapshot.savedWordIds);assertEquals(walked,snapshot.personalWords["glossary:walk"])
        assertEquals(walked,snapshot.wordFor("glossary:walk"));assertTrue(walked in snapshot.savedWordList())
        assertTrue("glossary:walk" in snapshot.dueWordIds)
        store.reviewWord("glossary:walk",true)
        store.close();store=LearningStore(context) {now}
        snapshot=store.snapshot()
        assertEquals("reviewing",snapshot.wordStates["glossary:walk"])
        // The save carries the word and meaning without a story revision; the review carries neither.
        // Both events share the test clock, so the queue order is not meaningful; look them up by action.
        val events=store.queuedOperations().filter {it.rpc=="apply_word_event"}.map {JSONObject(it.payload)}.associateBy {it.getString("action")}
        assertEquals(setOf("save","review"),events.keys)
        assertTrue(events.values.all {it.isNull("storyRevisionId") && it.getString("wordId")=="glossary:walk"})
        assertEquals("walk",events.getValue("save").getString("word"));assertEquals("yürümek",events.getValue("save").getString("gloss"))
        assertFalse(events.getValue("review").has("word") || events.getValue("review").has("gloss"))
        assertTrue(store.queuedOperations().all {it.errorCode==null})
        store.setWordSaved("glossary:walk",false)
        snapshot=store.snapshot()
        assertFalse("glossary:walk" in snapshot.savedWordIds);assertTrue(snapshot.personalWords.isEmpty())
        // Only glossary ids with a meaning can be saved this way; unknown ids are still refused.
        assertThrows(IllegalArgumentException::class.java) {store.savePersonalWord(WordInfo("walk","walk","yürümek","",""))}
        assertThrows(IllegalArgumentException::class.java) {store.setWordSaved("glossary:unknown",true)}
    }
    @Test fun wordsReadInTwoFinishedStoriesBecomeKnownUnlessLookedUp() {
        val (first,second)=LearningContent.stories.take(2)
        val shared=first.sentences.flatMap {WordKnowledge.lemmas(it.english)}.toSet() intersect second.sentences.flatMap {WordKnowledge.lemmas(it.english)}.toSet()
        val word=shared.first();val other=shared.drop(1).first()
        store.completeReading(first.id)
        assertEquals(WordStage.SEEN,store.snapshot().wordStages[word])
        store.completeReading(second.id);store.completeReading(second.id)
        var snapshot=store.snapshot()
        assertEquals(WordStage.KNOWN,snapshot.wordStages[word]);assertTrue(snapshot.knownWordCount>=shared.size)
        // Looking a word up while reading takes it out of "known" until it is practised.
        store.recordLookup(WordInfo("glossary:$word",word,"x","",""))
        store.close();store=LearningStore(context) {now}
        snapshot=store.snapshot()
        assertEquals(WordStage.LOOKED_UP,snapshot.wordStages[word]);assertEquals(WordStage.KNOWN,snapshot.wordStages[other])
        // Reading a story again does not count twice.
        assertEquals(snapshot.knownWordCount,store.also {it.completeReading(first.id)}.snapshot().knownWordCount)
        // Each first finish and each first lookup travels once; repeats queue nothing.
        val events=store.queuedOperations().filter {it.rpc=="apply_lemma_event"}.map {JSONObject(it.payload)}
        assertEquals(listOf("lookup","read","read"),events.map {it.getString("kind")}.sorted())
        assertEquals(setOf(first.id,second.id),events.filter {it.getString("kind")=="read"}.map {it.getString("storyId")}.toSet())
        assertEquals(word,events.single {it.getString("kind")=="lookup"}.getJSONArray("lemmas").getString(0))
        store.recordLookup(WordInfo("glossary:$word",word,"x","",""))
        assertEquals(3,store.queuedOperations().count {it.rpc=="apply_lemma_event"})
    }
    @Test fun weeklyWordsCountFinishedStoriesOfTheLastSevenDays() {
        val story=LearningContent.stories.first()
        val words=story.sentences.sumOf {s -> PhraseMatcher.tokens(s.english).count {t -> t.any(Char::isLetter)}}
        assertEquals(0,store.snapshot().weeklyWordsRead)
        store.completeReading(story.id)
        assertEquals(words,store.snapshot().weeklyWordsRead)
        now+=8*LearningPolicy.DAY_MS
        assertEquals(0,store.snapshot().weeklyWordsRead)
    }
    @Test fun progressDoesNotRegressAndPreferencesPersist() {
        store.updateProgress("quiet-morning",88);store.updateProgress("quiet-morning",10)
        store.updatePreferences("B1","Gizem",3,"Ada")
        store.dismissReaderHint();store.startReading("quiet-morning")
        store.close();store=LearningStore(context) {now}
        val snapshot=store.snapshot()
        assertEquals(88,snapshot.storyProgress["quiet-morning"]);assertEquals("Ada",snapshot.displayName)
        assertEquals(3,snapshot.dailyGoal);assertEquals("B1",snapshot.level)
        assertTrue(snapshot.readerHintSeen);assertEquals("quiet-morning",snapshot.lastStoryId)
    }
    @Test fun versionTwoMigrationKeepsWordsAndProgress() {
        store.close()
        context.openOrCreateDatabase(dbName,0,null).use {db ->
            db.execSQL("CREATE TABLE saved_words(word_id TEXT PRIMARY KEY,learning_state TEXT NOT NULL,correct_count INTEGER NOT NULL)")
            db.execSQL("CREATE TABLE story_progress(story_id TEXT PRIMARY KEY,percent INTEGER NOT NULL)")
            db.execSQL("CREATE TABLE learning_stats(id INTEGER PRIMARY KEY,points INTEGER NOT NULL,streak INTEGER NOT NULL,completed_lessons INTEGER NOT NULL,last_study_day TEXT)")
            db.execSQL("INSERT INTO saved_words VALUES('quiet','known',5)")
            db.execSQL("INSERT INTO story_progress VALUES('quiet-morning',88)")
            db.execSQL("INSERT INTO learning_stats VALUES(1,125,1,5,'2026-10-10')")
            db.version=2
        }
        store=LearningStore(context) {now}
        assertEquals(125,store.snapshot().points);assertEquals(88,store.snapshot().storyProgress["quiet-morning"])
        assertEquals("known",store.snapshot().wordStates["quiet"]);assertEquals(listOf("quiet"),store.snapshot().dueWordIds)
        assertEquals(10,store.readableDatabase.version)
    }

    @Test fun versionOneMigrationKeepsExistingProgress() {
        store.close()
        context.openOrCreateDatabase(dbName,0,null).use {db ->
            db.execSQL("CREATE TABLE saved_words(word_id TEXT PRIMARY KEY)")
            db.execSQL("CREATE TABLE story_progress(story_id TEXT PRIMARY KEY,percent INTEGER NOT NULL)")
            db.execSQL("CREATE TABLE learning_stats(id INTEGER PRIMARY KEY,points INTEGER NOT NULL,streak INTEGER NOT NULL,completed_lessons INTEGER NOT NULL,last_study_day TEXT)")
            db.execSQL("INSERT INTO saved_words VALUES('quiet')");db.execSQL("INSERT INTO story_progress VALUES('quiet-morning',44)")
            db.execSQL("INSERT INTO learning_stats VALUES(1,25,1,1,'2026-10-10')");db.version=1
        }
        store=LearningStore(context) {now}
        assertEquals(25,store.snapshot().points);assertEquals(44,store.snapshot().storyProgress["quiet-morning"])
        assertEquals("learning",store.snapshot().wordStates["quiet"]);assertEquals(10,store.readableDatabase.version)
        assertTrue(store.queuedOperations().isEmpty())
    }

    @Test fun wordQueuePersistsExactPayloadAndRemovalHistory() {
        store.saveWords(listOf("quiet","quiet"));store.reviewWord("quiet",true);store.toggleWord("quiet")
        val before=store.queuedOperations()
        assertEquals(3,before.size)
        assertEquals(setOf("save","review","remove"),before.map {JSONObject(it.payload).getString("action")}.toSet())
        assertTrue(before.all {it.ownerId=="guest" && it.state=="pending"})
        assertEquals(ContentRevisionIds.bundled("quiet-morning"),JSONObject(before.first().payload).getString("storyRevisionId"))
        store.close();store=LearningStore(context) {now}
        assertEquals(before,store.queuedOperations());assertFalse(store.snapshot().savedWordIds.contains("quiet"))
        assertTrue(store.pendingUploads("guest").isEmpty());assertFalse(store.markDelivered(before.first().id,"guest"))
    }
    @Test fun queueFailureRollsBackTheLocalChange() {
        store.writableDatabase.execSQL("CREATE TEMP TRIGGER fail_queue BEFORE INSERT ON learning_outbox BEGIN SELECT RAISE(ABORT,'forced_queue_failure'); END")
        try {store.saveWords(listOf("quiet"));fail("Expected transaction failure")} catch(e: RuntimeException) {assertTrue(e.message.orEmpty().contains("forced_queue_failure"))}
        assertTrue(store.snapshot().savedWordIds.isEmpty());assertTrue(store.queuedOperations().isEmpty())
    }
    @Test fun cursorAndCompletionSurviveReopenWithoutDuplicateReward() {
        store.updateProgress("quiet-morning",88,"qm-8");store.updateProgress("quiet-morning",10,"qm-2")
        val id=UUID.randomUUID().toString()
        store.beginSession(id,"choice",4)
        now+=60_000;store.checkpointSession(id,30_000)
        store.completeLesson(4,id,"choice",4,35_000);store.completeLesson(4,id,"choice",4,35_000)
        assertEquals(20,store.snapshot().points)
        val payload=JSONObject(store.queuedOperations().single {it.rpc=="submit_learning_session"}.payload)
        assertEquals(4,payload.getInt("questionCount"));assertEquals(35,payload.getInt("activeSeconds"));assertEquals(id,payload.getString("id"))
        store.close();store=LearningStore(context) {now}
        assertEquals(88,store.snapshot().storyProgress["quiet-morning"])
        assertEquals("qm-2",store.snapshot().readingPositions["quiet-morning"]?.sentenceId)
        store.completeLesson(4,id,"choice",4,35_000)
        assertEquals(1,store.snapshot().completedLessons)
        assertEquals(1,store.queuedOperations().count {it.rpc=="submit_learning_session"})
    }
    @Test fun abandonedSessionsNeverGiveARewardOrQueueCompletion() {
        val id=UUID.randomUUID().toString();store.beginSession(id,"spell",5);now+=60_000
        store.checkpointSession(id,15_000);store.abandonSession(id);store.completeLesson(5,id,"spell",5,15_000)
        assertEquals(0,store.snapshot().points);assertTrue(store.queuedOperations().isEmpty())
    }
    @Test fun invalidClockAndLongSuspensionCannotEnterTheUploadQueue() {
        val first=UUID.randomUUID().toString();store.beginSession(first,"choice",1);now-=60_000
        store.completeLesson(1,first,"choice",1)
        assertEquals("session_clock_changed",store.queuedOperations().single().errorCode)
        val second=UUID.randomUUID().toString();store.beginSession(second,"choice",1);now+=8*LearningPolicy.DAY_MS
        store.completeLesson(1,second,"choice",1)
        assertTrue(store.queuedOperations().all {it.state=="blocked"})
        assertEquals("session_duration_exceeded",store.queuedOperations().last().errorCode)
    }
    @Test fun accountsHaveSeparateDataAndRetryCannotChangePayload() {
        val a=LearningOwner.Account("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
        val b=LearningOwner.Account("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
        val target=InstrumentationRegistry.getInstrumentation().targetContext
        listOf(a,b).forEach {target.deleteDatabase("${dbName}_${it.databaseName}")}
        try {
            store.saveWords(listOf("morning"))
            LearningStore(context,a) {now}.use {first ->
                first.saveWords(listOf("quiet"));val event=first.pendingUploads(a.id).single()
                assertTrue(first.pendingUploads(b.id).isEmpty());assertFalse(first.markDelivered(event.id,b.id))
                assertTrue(first.markUploadFailed(event.id,a.id,"network_timeout",true))
                assertTrue(first.pendingUploads(a.id).isEmpty());now+=30_000
                assertEquals(event.payload,first.pendingUploads(a.id).single().payload)
                assertTrue(first.markDelivered(event.id,a.id));assertTrue(first.pendingUploads(a.id).isEmpty())
                assertEquals(event.payload,first.queuedOperations().single().payload)
                LearningStore(context,b) {now}.use {second ->assertTrue(second.snapshot().savedWordIds.isEmpty());assertTrue(second.queuedOperations().isEmpty())}
            }
            assertEquals(setOf("morning"),store.snapshot().savedWordIds)
        } finally {listOf(a,b).forEach {target.deleteDatabase("${dbName}_${it.databaseName}")}}
    }
    @Test fun legacyWordsWithoutPublishedSourceAreHeldLocally() {
        // A retained vocabulary record with no current or pinned source revision.
        // Do not depend on a real word remaining absent as the library grows.
        val retiredId="retired-word-verification"
        LearningContent.install(LearningContent.stories, listOf(
            WordInfo(retiredId,"retiredfixture","eski test kelimesi","/test/","Retired vocabulary fixture.")
        ))
        assertNull(LearningContent.revisionForWord(retiredId))
        store.saveWords(listOf(retiredId))
        assertTrue(store.snapshot().savedWordIds.contains(retiredId))
        assertEquals("blocked",store.queuedOperations().single().state)
        assertEquals("content_revision_unavailable",store.queuedOperations().single().errorCode)
    }
    @Test fun versionThreeMigrationPreservesScheduleDaysBadgesAndPreferences() {
        store.close()
        context.getSharedPreferences("learning_preferences",0).edit().putString("display_name","Ada").putString("level","B1").putString("preferred_genre","Gizem").putInt("daily_goal",3).putBoolean("onboarding_done",true).putBoolean("reader_hint_seen",true).putString("last_story_id","quiet-morning").commit()
        context.openOrCreateDatabase(dbName,0,null).use {db ->
            db.execSQL("CREATE TABLE saved_words(word_id TEXT NOT NULL PRIMARY KEY,learning_state TEXT NOT NULL DEFAULT 'learning',correct_count INTEGER NOT NULL DEFAULT 0,next_review_at INTEGER NOT NULL DEFAULT 0,interval_days INTEGER NOT NULL DEFAULT 0,last_review_day TEXT)")
            db.execSQL("CREATE TABLE story_progress(story_id TEXT NOT NULL PRIMARY KEY,percent INTEGER NOT NULL)")
            db.execSQL("CREATE TABLE learning_stats(id INTEGER PRIMARY KEY CHECK(id=1),points INTEGER NOT NULL DEFAULT 0,streak INTEGER NOT NULL DEFAULT 0,completed_lessons INTEGER NOT NULL DEFAULT 0,last_study_day TEXT)")
            db.execSQL("CREATE TABLE learning_days(day TEXT NOT NULL PRIMARY KEY,sessions INTEGER NOT NULL DEFAULT 0,readings INTEGER NOT NULL DEFAULT 0)")
            db.execSQL("CREATE TABLE engagement_events(event_id TEXT NOT NULL PRIMARY KEY,name TEXT NOT NULL,created_at INTEGER NOT NULL)")
            db.execSQL("CREATE TABLE earned_badges(badge_id TEXT NOT NULL PRIMARY KEY,earned_at INTEGER NOT NULL)")
            db.execSQL("INSERT INTO saved_words VALUES('quiet','known',3,${now+7*LearningPolicy.DAY_MS},7,'2026-10-10')")
            db.execSQL("INSERT INTO story_progress VALUES('quiet-morning',88)")
            db.execSQL("INSERT INTO learning_stats VALUES(1,125,1,5,'2026-10-10')")
            db.execSQL("INSERT INTO learning_days VALUES('2026-10-10',3,1)")
            db.execSQL("INSERT INTO engagement_events VALUES('lesson:legacy','practice_completed',$now)")
            db.execSQL("INSERT INTO earned_badges VALUES('first_story',$now)");db.version=3
        }
        store=LearningStore(context) {now};val snapshot=store.snapshot()
        assertEquals(125,snapshot.points);assertEquals(5,snapshot.completedLessons);assertEquals(88,snapshot.storyProgress["quiet-morning"])
        assertEquals(now+7*LearningPolicy.DAY_MS,snapshot.nextReviewAt);assertEquals(3,snapshot.todaySessions)
        assertEquals("Ada",snapshot.displayName);assertEquals("B1",snapshot.level);assertEquals(3,snapshot.dailyGoal)
        assertTrue(snapshot.onboardingDone && snapshot.readerHintSeen && "first_story" in snapshot.badges)
        assertEquals("quiet-morning",snapshot.lastStoryId);assertTrue(snapshot.readingPositions.isEmpty());assertTrue(store.queuedOperations().isEmpty())
        store.completeLesson(5,"legacy");assertEquals(125,store.snapshot().points);assertTrue(store.queuedOperations().isEmpty())
    }
}

