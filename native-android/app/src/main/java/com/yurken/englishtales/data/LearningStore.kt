package com.yurken.englishtales.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import org.json.JSONObject
import java.util.UUID
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

data class LearningSnapshot(
    val savedWordIds: Set<String> = emptySet(),
    val wordStates: Map<String,String> = emptyMap(),
    val storyProgress: Map<String,Int> = emptyMap(),
    val points: Int = 0, val streak: Int = 0, val completedLessons: Int = 0,
    val onboardingDone: Boolean = false, val level: String = "A1", val preferredGenre: String = "Günlük yaşam",
    val dailyGoal: Int = 1, val todaySessions: Int = 0, val todayReadings: Int = 0,
    val dueWordIds: List<String> = emptyList(), val nextReviewAt: Long? = null,
    val weeklyActivity: List<DailyActivity> = emptyList(), val badges: Set<String> = emptySet(),
    val lastStoryId: String? = null, val readerHintSeen: Boolean = false, val displayName: String = "Okuyucu",
    val readingPositions: Map<String,ReadingPosition> = emptyMap(), val activeSessionMillis: Map<String,Long> = emptyMap(),
    val ownerId: String = "guest"
) {
    val dailyGoalReached get() = todaySessions>=dailyGoal
}

/** Calls are serialized on the ViewModel's IO dispatcher. IDs survive content updates. */
class LearningStore(context: Context,val owner: LearningOwner=LearningOwner.Guest,private val clock: () -> Long = System::currentTimeMillis) : AutoCloseable {
    private val database=LearningDatabase.open(context,owner)
    private val dao=database.offline()
    private val operations=LearningOperations(InstallationIdentity.get(context))
    val readableDatabase: SupportSQLiteDatabase get() = database.openHelper.readableDatabase
    val writableDatabase: SupportSQLiteDatabase get() = database.openHelper.writableDatabase
    init { LearningContent.initialize(context) }
    private fun profile() = checkNotNull(dao.profile())
    fun recordVisit() {
        val now=clock(); val today=LearningPolicy.dayKey(now)
        recordEvent(writableDatabase,"visit:$today","app_open",now)
        if(!profile().onboarding) recordEvent(writableDatabase,"onboarding_started","onboarding_started",now)
        unlockBadges(writableDatabase,now)
    }
    fun snapshot(): LearningSnapshot {
        val now=clock();val today=LearningPolicy.dayKey(now);val db=readableDatabase
        val saved=linkedSetOf<String>();val states=mutableMapOf<String,String>();val due=mutableListOf<String>();var nextDue: Long?=null
        db.rawQuery("SELECT word_id,learning_state,next_review_at FROM saved_words ORDER BY next_review_at,word_id",null).use { c ->
            while(c.moveToNext()) {
                val id=c.getString(0); val at=c.getLong(2);saved+=id;states[id]=c.getString(1)
                if(at<=now) due+=id else if(nextDue==null || at<nextDue!!) nextDue=at
            }
        }
        val progress=mutableMapOf<String,Int>();val positions=mutableMapOf<String,ReadingPosition>()
        db.rawQuery("SELECT story_id,percent,revision_id,sentence_id FROM story_progress",null).use { c -> while(c.moveToNext()) {
            progress[c.getString(0)]=c.getInt(1)
            if(!c.isNull(2) && !c.isNull(3)) positions[c.getString(0)]=ReadingPosition(c.getString(2),c.getString(3))
        } }
        var points=0;var streak=0;var lessons=0
        db.rawQuery("SELECT points,streak,completed_lessons,last_study_day FROM learning_stats WHERE id=1",null).use { c ->
            if(c.moveToFirst()) {points=c.getInt(0);lessons=c.getInt(2);streak=LearningPolicy.visibleStreak(c.getInt(1),c.getString(3),today,LearningPolicy.previousDay(now))}
        }
        val days=mutableMapOf<String,Pair<Int,Int>>()
        db.rawQuery("SELECT day,sessions,readings FROM learning_days ORDER BY day DESC LIMIT 8",null).use {c -> while(c.moveToNext()) days[c.getString(0)]=c.getInt(1) to c.getInt(2)}
        val week=(6 downTo 0).map { offset ->
            val calendar=Calendar.getInstance().apply {timeInMillis=now;add(Calendar.DAY_OF_YEAR,-offset)}
            val key=LearningPolicy.dayKey(calendar.timeInMillis)
            DailyActivity(key,SimpleDateFormat("EE",Locale.forLanguageTag("tr")).format(calendar.time).take(2),days[key]?.first?:0)
        }
        val badges=mutableSetOf<String>()
        db.rawQuery("SELECT badge_id FROM earned_badges",null).use {c -> while(c.moveToNext()) badges+=c.getString(0)}
        val p=profile()
        return LearningSnapshot(saved,states,progress,points,streak,lessons,p.onboarding,p.level,p.genre,
            p.goal,days[today]?.first?:0,days[today]?.second?:0,due,nextDue,week,badges,p.lastStory,p.hintSeen,p.name,
            positions,dao.activeSessions().associate {it.id to it.activeMillis},owner.id)
    }
    fun completeOnboarding(level: String, genre: String, goal: Int) {
        transaction {db ->
            updatePreferences(level,genre,goal,profile().name)
            dao.profile(profile().copy(onboarding=true))
            recordEvent(db,"onboarding_completed","onboarding_completed",clock())
        }
    }
    fun updatePreferences(level: String, genre: String, goal: Int, name: String) {
        require(level in listOf("A1","A2","B1") && genre in listOf("Günlük yaşam","Macera","Gizem"))
        dao.profile(profile().copy(level=level,genre=genre,goal=goal.coerceIn(1,3),name=name.trim().take(30).ifBlank {"Okuyucu"},dirty=true))
    }
    fun startReading(storyId: String) {
        transaction {db ->
            dao.profile(profile().copy(lastStory=storyId))
            recordEvent(db,"reader:$storyId:${LearningPolicy.dayKey(clock())}","reader_started",clock())
        }
    }
    fun dismissReaderHint() { dao.profile(profile().copy(hintSeen=true)) }
    fun saveWords(ids: List<String>) {
        transaction {db ->
            ids.forEach {id ->
                require(id in LearningContent.wordById)
                if(db.insertWithOnConflict("saved_words",null,ContentValues().apply {put("word_id",id)},SQLiteDatabase.CONFLICT_IGNORE)!=-1L) {
                    recordEvent(db,"save:$id:${LearningPolicy.dayKey(clock())}","word_saved",clock())
                    enqueueWord(id,"save",null,clock())
                }
            }
            unlockBadges(db,clock())
        }
    }
    fun toggleWord(wordId: String) {
        transaction {db ->
            require(wordId in LearningContent.wordById)
            if(db.delete("saved_words","word_id=?",arrayOf(wordId))==0) {
                db.insert("saved_words",SQLiteDatabase.CONFLICT_ABORT,ContentValues().apply {put("word_id",wordId)})
                recordEvent(db,"save:$wordId:${LearningPolicy.dayKey(clock())}","word_saved",clock())
                enqueueWord(wordId,"save",null,clock())
            } else enqueueWord(wordId,"remove",null,clock())
            unlockBadges(db,clock())
        }
    }
    fun reviewWord(wordId: String, correct: Boolean) {
        transaction {db ->
            db.rawQuery("SELECT correct_count,last_review_day,next_review_at FROM saved_words WHERE word_id=?",arrayOf(wordId)).use {c ->
                if(c.moveToFirst()) {
                    enqueueWord(wordId,"review",correct,clock())
                    val plan=LearningPolicy.review(c.getInt(0),correct,c.getString(1),c.getLong(2),clock())
                    if(plan!=null) db.update("saved_words",ContentValues().apply {
                        put("correct_count",plan.correctCount);put("learning_state",plan.state);put("interval_days",plan.intervalDays);put("next_review_at",plan.dueAt);put("last_review_day",plan.successfulDay)
                    },"word_id=?",arrayOf(wordId))
                }
            }
            unlockBadges(db,clock())
        }
    }
    fun updateProgress(storyId: String, percent: Int, sentenceId: String?=null,source: Story?=null) { transaction {db -> updateProgress(db,storyId,percent,sentenceId,source)} }
    private fun updateProgress(db: SupportSQLiteDatabase, storyId: String, percent: Int,sentenceId: String?=null,source: Story?=null) {
        val story=source?:checkNotNull(LearningContent.storyById[storyId])
        require(sentenceId==null || story.sentences.any {it.id==sentenceId})
        var previous=scalar(db,"SELECT percent FROM story_progress WHERE story_id=?",arrayOf(storyId))
        db.rawQuery("SELECT revision_id FROM story_progress WHERE story_id=?",arrayOf(storyId)).use { c ->
            if(c.moveToFirst() && !c.isNull(0) && c.getString(0)!=story.revisionId) previous=0
        }
        if(sentenceId!=null) {
            db.rawQuery("SELECT revision_id,sentence_id,percent FROM story_progress WHERE story_id=?",arrayOf(storyId)).use {c ->
                if(c.moveToFirst() && c.getString(0)==story.revisionId && c.getString(1)==sentenceId && c.getInt(2)>=percent.coerceIn(0,100)) return
            }
        }
        db.execSQL("INSERT OR IGNORE INTO story_progress(story_id,percent) VALUES(?,0)",arrayOf(storyId))
        db.update("story_progress",ContentValues().apply {
            put("percent",maxOf(previous,percent.coerceIn(0,100)))
            if(sentenceId!=null) {put("revision_id",story.revisionId);put("sentence_id",sentenceId);put("updated_at",clock())}
        },"story_id=?",arrayOf(storyId))
        if(sentenceId!=null) {val id=UUID.randomUUID().toString();enqueue(id,"apply_progress_event",operations.progress(id,story,sentenceId,percent.coerceIn(0,100),clock()))}
    }
    fun completeReading(storyId: String,sessionId: String=UUID.randomUUID().toString(),activeMillis: Long=0,source: Story?=null) {
        val now=clock();val today=LearningPolicy.dayKey(now)
        transaction {db ->
            val id=canonicalSessionId(sessionId)
            val draft=prepareCompletion(id,"reading",0,storyId,activeMillis,now,source)?:return@transaction
            val story=source?:LearningContent.storyById.getValue(storyId)
            updateProgress(db,storyId,100,story.sentences.last().id,story)
            if(recordEvent(db,"read:$storyId:$today","reading_completed",now)) recordSession(db,now,0,true)
            enqueueSession(draft,0,now);dao.end(id,"completed")
            unlockBadges(db,now)
        }
    }
    fun completeLesson(correctAnswers: Int, sessionId: String,kind: String="choice",questionCount: Int=5,activeMillis: Long=0) {
        require(kind in listOf("choice","card","match","spell") && questionCount in 1..5 && correctAnswers in 0..questionCount)
        val now=clock()
        transaction {db ->
            val id=canonicalSessionId(sessionId)
            // A legacy completion has no recoverable timing/answers; do not invent a cloud session.
            if(dao.session(id)==null && scalar(db,"SELECT COUNT(*) FROM engagement_events WHERE event_id=?",arrayOf("lesson:$sessionId"))>0) return@transaction
            val draft=prepareCompletion(id,kind,questionCount,null,activeMillis,now)?:return@transaction
            if(recordEvent(db,"lesson:$sessionId","practice_completed",now)) {
                db.execSQL("UPDATE learning_stats SET completed_lessons=completed_lessons+1 WHERE id=1")
                recordSession(db,now,correctAnswers.coerceIn(0,5)*5,false)
            }
            enqueueSession(draft,correctAnswers,now);dao.end(id,"completed")
            unlockBadges(db,now)
        }
    }
    private fun recordSession(db: SupportSQLiteDatabase, now: Long, points: Int, reading: Boolean) {
        val today=LearningPolicy.dayKey(now)
        db.execSQL("INSERT OR IGNORE INTO learning_days(day) VALUES(?)",arrayOf(today))
        db.execSQL("UPDATE learning_days SET sessions=sessions+1,readings=readings+? WHERE day=?",arrayOf(if(reading) 1 else 0,today))
        db.rawQuery("SELECT streak,last_study_day FROM learning_stats WHERE id=1",null).use {c ->
            if(c.moveToFirst()) {
                val streak=LearningPolicy.nextStreak(c.getInt(0),c.getString(1),today,LearningPolicy.previousDay(now))
                db.execSQL("UPDATE learning_stats SET points=points+?,streak=?,last_study_day=? WHERE id=1",arrayOf(points,streak,today))
            }
        }
        if(scalar(db,"SELECT sessions FROM learning_days WHERE day=?",arrayOf(today))>=profile().goal) recordEvent(db,"goal:$today","daily_goal_reached",now)
    }
    private fun unlockBadges(db: SupportSQLiteDatabase, now: Long) {
        val conditions=mapOf(
            "first_story" to (scalar(db,"SELECT COUNT(*) FROM story_progress WHERE percent=100")>=1),
            "first_practice" to (scalar(db,"SELECT completed_lessons FROM learning_stats WHERE id=1")>=1),
            "five_words" to (scalar(db,"SELECT COUNT(*) FROM saved_words")>=5),
            "three_day_streak" to (scalar(db,"SELECT streak FROM learning_stats WHERE id=1")>=3),
            "seven_day_streak" to (scalar(db,"SELECT streak FROM learning_stats WHERE id=1")>=7))
        conditions.filterValues {it}.keys.forEach {id ->db.insertWithOnConflict("earned_badges",null,ContentValues().apply {put("badge_id",id);put("earned_at",now)},SQLiteDatabase.CONFLICT_IGNORE)}
    }
    fun beginSession(id: String,kind: String,questionCount: Int=0,storyId: String?=null,source: Story?=null) {
        require((kind=="reading" && questionCount==0 && (source?.id==storyId || storyId in LearningContent.storyById)) || (kind in listOf("choice","card","match","spell") && questionCount in 1..5 && storyId==null))
        dao.begin(SessionDraftRow(canonicalSessionId(id),kind,storyId,storyId?.let {source?.revisionId ?: LearningContent.storyById.getValue(it).revisionId},clock(),0,questionCount,"active"))
    }
    fun checkpointSession(id: String,millis: Long) {require(millis>=0);dao.activeTime(canonicalSessionId(id),millis.coerceAtMost(86_400_000))}
    fun abandonSession(id: String) {dao.end(canonicalSessionId(id),"abandoned")}
    private fun prepareCompletion(id: String,kind: String,questions: Int,storyId: String?,activeMillis: Long,now: Long,source: Story?=null): SessionDraftRow? {
        beginSession(id,kind,questions,storyId,source)
        val draft=checkNotNull(dao.session(id))
        if(draft.state!="active") return null
        require(draft.kind==kind && draft.questionCount==questions && draft.storyId==storyId)
        val elapsed=(now-draft.startedAt).coerceAtLeast(0)
        val active=maxOf(draft.activeMillis,activeMillis).coerceIn(0,minOf(elapsed,86_400_000))
        dao.activeTime(id,active)
        return draft.copy(activeMillis=active)
    }
    private fun canonicalSessionId(id: String) = runCatching {UUID.fromString(id).toString()}.getOrElse {ContentRevisionIds.stable("local-session:$id")}
    private fun enqueueWord(wordId: String,action: String,correct: Boolean?,now: Long) {
        val id=UUID.randomUUID().toString();val revision=LearningContent.revisionForWord(wordId)
        enqueue(id,"apply_word_event",operations.word(id,revision,wordId,action,correct,now),if(revision==null) "content_revision_unavailable" else null)
    }
    private fun enqueueSession(draft: SessionDraftRow,correct: Int,now: Long) {
        val error=when {
            now<draft.startedAt -> "session_clock_changed"
            now-draft.startedAt>7*LearningPolicy.DAY_MS -> "session_duration_exceeded"
            else -> null
        }
        enqueue(draft.id,"submit_learning_session",operations.session(draft,correct,now),error)
    }
    private fun enqueue(id: String,rpc: String,payload: JSONObject,blockedReason: String?=null) {
        dao.insert(QueuedLearningOperation(id,owner.id,rpc,payload.toString(),clock(),state=if(blockedReason==null) "pending" else "blocked",errorCode=blockedReason))
    }
    fun queuedOperations() = dao.operations()
    fun pendingUploads(expectedAccount: String,limit: Int=50): List<QueuedLearningOperation> {
        if(owner !is LearningOwner.Account || owner.id!=expectedAccount) return emptyList()
        return dao.pending(clock(),limit.coerceIn(1,100))
    }
    fun markDelivered(id: String,expectedAccount: String): Boolean = owner is LearningOwner.Account && owner.id==expectedAccount && dao.delivered(id,expectedAccount,clock())==1
    fun markUploadFailed(id: String,expectedAccount: String,code: String,retryable: Boolean): Boolean {
        if(owner !is LearningOwner.Account || owner.id!=expectedAccount) return false
        require(code.matches(Regex("[a-zA-Z0-9_]{1,80}")))
        return database.runInTransaction<Boolean> {
            val event=dao.operation(id)?:return@runInTransaction false
            val delay=(30_000L*(1L shl event.attempts.coerceAtMost(11))).coerceAtMost(86_400_000L)
            dao.failed(id,owner.id,clock()+delay,code,if(retryable) "pending" else "blocked")==1
        }
    }
    private fun scalar(db: SupportSQLiteDatabase,sql: String,args: Array<String>?=null) = db.rawQuery(sql,args).use {if(it.moveToFirst()) it.getInt(0) else 0}
    private fun recordEvent(db: SupportSQLiteDatabase,id: String,name: String,now: Long): Boolean = db.insertWithOnConflict("engagement_events",null,ContentValues().apply {put("event_id",id);put("name",name);put("created_at",now)},SQLiteDatabase.CONFLICT_IGNORE)!=-1L
    private fun transaction(action: (SupportSQLiteDatabase)->Unit) {database.runInTransaction {action(writableDatabase)}}
    internal fun <T> transferTransaction(action: (SupportSQLiteDatabase)->T): T=database.runInTransaction<T> {action(writableDatabase)}
    override fun close() {database.close()}
}

internal fun SupportSQLiteDatabase.rawQuery(sql: String,args: Array<String>?) = query(sql,args?:emptyArray())
internal fun SupportSQLiteDatabase.insertWithOnConflict(table: String,@Suppress("UNUSED_PARAMETER") nullColumnHack: String?,values: ContentValues,conflict: Int) = insert(table,conflict,values)
internal fun SupportSQLiteDatabase.update(table: String,values: ContentValues,where: String,args: Array<String>) = update(table,SQLiteDatabase.CONFLICT_ABORT,values,where,args)
