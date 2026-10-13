package com.yurken.englishtales.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import androidx.room.*
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import java.util.UUID

@Entity(tableName="saved_words")
data class SavedWordRow(@PrimaryKey @ColumnInfo(name="word_id") val id: String,
    @ColumnInfo(name="learning_state",defaultValue="'learning'") val state: String="learning",
    @ColumnInfo(name="correct_count",defaultValue="0") val count: Int=0,
    @ColumnInfo(name="next_review_at",defaultValue="0") val dueAt: Long=0,
    @ColumnInfo(name="interval_days",defaultValue="0") val interval: Int=0,
    @ColumnInfo(name="last_review_day") val successfulDay: String?=null)
@Entity(tableName="story_progress")
data class StoryProgressRow(@PrimaryKey @ColumnInfo(name="story_id") val id: String, val percent: Int,
    @ColumnInfo(name="revision_id") val revisionId: String?=null,
    @ColumnInfo(name="sentence_id") val sentenceId: String?=null,
    @ColumnInfo(name="updated_at",defaultValue="0") val updatedAt: Long=0)
@Entity(tableName="learning_stats")
data class LearningStatsRow(@PrimaryKey val id: Int=1,
    @ColumnInfo(defaultValue="0") val points: Int=0,
    @ColumnInfo(defaultValue="0") val streak: Int=0,
    @ColumnInfo(name="completed_lessons",defaultValue="0") val lessons: Int=0,
    @ColumnInfo(name="last_study_day") val lastDay: String?=null)
@Entity(tableName="learning_days")
data class LearningDayRow(@PrimaryKey val day: String,
    @ColumnInfo(defaultValue="0") val sessions: Int=0, @ColumnInfo(defaultValue="0") val readings: Int=0)
@Entity(tableName="engagement_events")
data class EngagementRow(@PrimaryKey @ColumnInfo(name="event_id") val id: String,
    val name: String,@ColumnInfo(name="created_at") val createdAt: Long)
@Entity(tableName="earned_badges")
data class BadgeRow(@PrimaryKey @ColumnInfo(name="badge_id") val id: String,@ColumnInfo(name="earned_at") val earnedAt: Long)
@Entity(tableName="local_profile")
data class LocalProfileRow(@PrimaryKey val id: Int=1, val name: String="Okuyucu", val level: String="A1",
    val genre: String="Günlük yaşam", val goal: Int=1, @ColumnInfo(name="onboarding_done") val onboarding: Boolean=false,
    @ColumnInfo(name="reader_hint_seen") val hintSeen: Boolean=false,
    @ColumnInfo(name="last_story_id") val lastStory: String?=null,
    @ColumnInfo(name="preferences_dirty") val dirty: Boolean=false)
@Entity(tableName="local_identity")
data class LocalIdentityRow(@PrimaryKey val id: Int=1,@ColumnInfo(name="owner_id") val ownerId: String)
@Entity(tableName="learning_outbox",indices=[Index(value=["state","next_attempt_at","created_at"])])
data class QueuedLearningOperation(@PrimaryKey val id: String,
    @ColumnInfo(name="owner_id") val ownerId: String, val rpc: String, val payload: String,
    @ColumnInfo(name="created_at") val createdAt: Long, val state: String="pending", val attempts: Int=0,
    @ColumnInfo(name="next_attempt_at") val nextAttemptAt: Long=0,
    @ColumnInfo(name="error_code") val errorCode: String?=null,
    @ColumnInfo(name="delivered_at") val deliveredAt: Long?=null)
@Entity(tableName="session_drafts")
data class SessionDraftRow(@PrimaryKey val id: String, val kind: String,
    @ColumnInfo(name="story_id") val storyId: String?, @ColumnInfo(name="revision_id") val revisionId: String?,
    @ColumnInfo(name="started_at") val startedAt: Long, @ColumnInfo(name="active_millis") val activeMillis: Long,
    @ColumnInfo(name="question_count") val questionCount: Int, val state: String)

@Entity(tableName="guest_transfers")
data class GuestTransferRow(@PrimaryKey val id: String,@ColumnInfo(name="target_user_id") val target: String,
    val payload: String,val state: String,@ColumnInfo(name="created_at") val createdAt: Long)
@Entity(tableName="guest_imports")
data class GuestImportRow(@PrimaryKey val id: String,@ColumnInfo(name="payload_hash") val hash: String,
    @ColumnInfo(name="legacy_points") val legacyPoints: Int,@ColumnInfo(name="legacy_lessons") val legacyLessons: Int,
    @ColumnInfo(name="legacy_days") val legacyDays: String,@ColumnInfo(name="imported_at") val importedAt: Long)

@Entity(tableName="learning_cloud_state")
data class LearningCloudStateRow(@PrimaryKey val id: Int=1, val source: String,
    @ColumnInfo(name="snapshot_json") val snapshotJson: String,
    @ColumnInfo(name="baseline_json") val baselineJson: String,
    @ColumnInfo(name="preferences_version") val preferencesVersion: Long?,
    @ColumnInfo(name="preferences_conflict") val preferencesConflict: Boolean,
    @ColumnInfo(name="applied_at") val appliedAt: Long)

@Dao
interface OfflineLearningDao {
    @Query("SELECT * FROM local_profile WHERE id=1") fun profile(): LocalProfileRow?
    @Insert(onConflict=OnConflictStrategy.REPLACE) fun profile(profile: LocalProfileRow)
    @Query("SELECT * FROM local_identity WHERE id=1") fun identity(): LocalIdentityRow?
    @Query("SELECT * FROM learning_cloud_state WHERE id=1") fun cloud(): LearningCloudStateRow?
    @Query("SELECT * FROM learning_outbox ORDER BY created_at,id") fun operations(): List<QueuedLearningOperation>
    @Query("SELECT * FROM learning_outbox WHERE state='pending' AND next_attempt_at<=:now ORDER BY created_at,id LIMIT :limit")
    fun pending(now: Long,limit: Int): List<QueuedLearningOperation>
    @Query("SELECT * FROM learning_outbox WHERE id=:id") fun operation(id: String): QueuedLearningOperation?
    @Insert fun insert(operation: QueuedLearningOperation)
    @Query("UPDATE learning_outbox SET state='delivered',delivered_at=:now,error_code=NULL WHERE id=:id AND owner_id=:owner AND state='pending'")
    fun delivered(id: String,owner: String,now: Long): Int
    @Query("UPDATE learning_outbox SET attempts=attempts+1,next_attempt_at=:retryAt,error_code=:code,state=:state WHERE id=:id AND owner_id=:owner AND state='pending'")
    fun failed(id: String,owner: String,retryAt: Long,code: String,state: String): Int
    @Query("SELECT * FROM session_drafts WHERE id=:id") fun session(id: String): SessionDraftRow?
    @Insert(onConflict=OnConflictStrategy.IGNORE) fun begin(session: SessionDraftRow): Long
    @Query("UPDATE session_drafts SET active_millis=MAX(active_millis,:millis) WHERE id=:id AND state IN ('active','abandoned')")
    fun activeTime(id: String,millis: Long)
    @Query("UPDATE session_drafts SET state=:state WHERE id=:id AND state='active'") fun end(id: String,state: String)
    @Query("SELECT * FROM session_drafts WHERE state='active'") fun activeSessions(): List<SessionDraftRow>
}

sealed class LearningOwner(val id: String,val databaseName: String) {
    data object Guest: LearningOwner("guest","english_tales.db")
    class Account(userId: String): LearningOwner(UUID.fromString(userId).toString(),"english_tales_account_${UUID.fromString(userId)}.db")
}

@Database(entities=[SavedWordRow::class,StoryProgressRow::class,LearningStatsRow::class,LearningDayRow::class,
    EngagementRow::class,BadgeRow::class,LocalProfileRow::class,LocalIdentityRow::class,QueuedLearningOperation::class,SessionDraftRow::class,
    GuestTransferRow::class,GuestImportRow::class,LearningCloudStateRow::class],version=6,exportSchema=true)
abstract class LearningDatabase: RoomDatabase() {
    abstract fun offline(): OfflineLearningDao
    companion object {
        fun open(context: Context,owner: LearningOwner): LearningDatabase {
            val preferences=context.getSharedPreferences("learning_preferences",Context.MODE_PRIVATE)
            val initial=if(owner is LearningOwner.Guest) LocalProfileRow(
                name=preferences.getString("display_name","Okuyucu")?:"Okuyucu",
                level=preferences.getString("level","A1")?:"A1",genre=preferences.getString("preferred_genre","Günlük yaşam")?:"Günlük yaşam",
                goal=preferences.getInt("daily_goal",1).coerceIn(1,3),onboarding=preferences.getBoolean("onboarding_done",false),
                hintSeen=preferences.getBoolean("reader_hint_seen",false),lastStory=preferences.getString("last_story_id",null)
            ) else LocalProfileRow()
            val migrations=(1..3).map {from -> object: Migration(from,4) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    if(from<2) {
                        db.execSQL("ALTER TABLE saved_words ADD COLUMN learning_state TEXT NOT NULL DEFAULT 'learning'")
                        db.execSQL("ALTER TABLE saved_words ADD COLUMN correct_count INTEGER NOT NULL DEFAULT 0")
                    }
                    if(from<3) {
                        db.execSQL("ALTER TABLE saved_words ADD COLUMN next_review_at INTEGER NOT NULL DEFAULT 0")
                        db.execSQL("ALTER TABLE saved_words ADD COLUMN interval_days INTEGER NOT NULL DEFAULT 0")
                        db.execSQL("ALTER TABLE saved_words ADD COLUMN last_review_day TEXT")
                        db.execSQL("CREATE TABLE learning_days(day TEXT PRIMARY KEY NOT NULL,sessions INTEGER NOT NULL DEFAULT 0,readings INTEGER NOT NULL DEFAULT 0)")
                        db.execSQL("CREATE TABLE engagement_events(event_id TEXT PRIMARY KEY NOT NULL,name TEXT NOT NULL,created_at INTEGER NOT NULL)")
                        db.execSQL("CREATE TABLE earned_badges(badge_id TEXT PRIMARY KEY NOT NULL,earned_at INTEGER NOT NULL)")
                    }
                    // Normalize nullable legacy primary keys and defaults before Room validation.
                    normalize(db,"saved_words","word_id TEXT NOT NULL PRIMARY KEY,learning_state TEXT NOT NULL DEFAULT 'learning',correct_count INTEGER NOT NULL DEFAULT 0,next_review_at INTEGER NOT NULL DEFAULT 0,interval_days INTEGER NOT NULL DEFAULT 0,last_review_day TEXT","word_id,learning_state,correct_count,next_review_at,interval_days,last_review_day")
                    normalize(db,"story_progress","story_id TEXT NOT NULL PRIMARY KEY,percent INTEGER NOT NULL,revision_id TEXT,sentence_id TEXT,updated_at INTEGER NOT NULL DEFAULT 0","story_id,percent")
                    normalize(db,"learning_stats","id INTEGER NOT NULL PRIMARY KEY,points INTEGER NOT NULL DEFAULT 0,streak INTEGER NOT NULL DEFAULT 0,completed_lessons INTEGER NOT NULL DEFAULT 0,last_study_day TEXT","id,points,streak,completed_lessons,last_study_day")
                    createOfflineTables(db)
                    initialize(db,owner.id,initial)
                }
            }}
            return Room.databaseBuilder(context,LearningDatabase::class.java,owner.databaseName)
                .addMigrations(*migrations.toTypedArray())
                .addMigrations(object: Migration(4,5) {override fun migrate(db: SupportSQLiteDatabase) {createTransferTables(db)}})
                .addMigrations(object: Migration(5,6) {override fun migrate(db: SupportSQLiteDatabase) {
                    db.execSQL("CREATE TABLE learning_cloud_state(id INTEGER NOT NULL PRIMARY KEY,source TEXT NOT NULL,snapshot_json TEXT NOT NULL,baseline_json TEXT NOT NULL,preferences_version INTEGER,preferences_conflict INTEGER NOT NULL,applied_at INTEGER NOT NULL)")
                }})
                .addCallback(object: Callback() {
                    override fun onCreate(db: SupportSQLiteDatabase) { initialize(db,owner.id,initial);db.execSQL("INSERT INTO learning_stats(id) VALUES(1)") }
                    override fun onOpen(db: SupportSQLiteDatabase) {
                        db.query("SELECT owner_id FROM local_identity WHERE id=1").use {c -> check(c.moveToFirst() && c.getString(0)==owner.id) {"Local database owner mismatch"} }
                    }
                }).build()
        }
        private fun normalize(db: SupportSQLiteDatabase,table: String,definition: String,columns: String) {
            db.execSQL("CREATE TABLE ${table}_v4($definition)")
            db.execSQL("INSERT INTO ${table}_v4($columns) SELECT $columns FROM $table")
            db.execSQL("DROP TABLE $table");db.execSQL("ALTER TABLE ${table}_v4 RENAME TO $table")
        }
        private fun createTransferTables(db: SupportSQLiteDatabase) {
            db.execSQL("CREATE TABLE guest_transfers(id TEXT NOT NULL PRIMARY KEY,target_user_id TEXT NOT NULL,payload TEXT NOT NULL,state TEXT NOT NULL,created_at INTEGER NOT NULL)")
            db.execSQL("CREATE TABLE guest_imports(id TEXT NOT NULL PRIMARY KEY,payload_hash TEXT NOT NULL,legacy_points INTEGER NOT NULL,legacy_lessons INTEGER NOT NULL,legacy_days TEXT NOT NULL,imported_at INTEGER NOT NULL)")
        }
        private fun createOfflineTables(db: SupportSQLiteDatabase) {
            db.execSQL("CREATE TABLE local_profile(id INTEGER NOT NULL PRIMARY KEY,name TEXT NOT NULL,level TEXT NOT NULL,genre TEXT NOT NULL,goal INTEGER NOT NULL,onboarding_done INTEGER NOT NULL,reader_hint_seen INTEGER NOT NULL,last_story_id TEXT,preferences_dirty INTEGER NOT NULL)")
            db.execSQL("CREATE TABLE local_identity(id INTEGER NOT NULL PRIMARY KEY,owner_id TEXT NOT NULL)")
            db.execSQL("CREATE TABLE learning_outbox(id TEXT NOT NULL PRIMARY KEY,owner_id TEXT NOT NULL,rpc TEXT NOT NULL,payload TEXT NOT NULL,created_at INTEGER NOT NULL,state TEXT NOT NULL,attempts INTEGER NOT NULL,next_attempt_at INTEGER NOT NULL,error_code TEXT,delivered_at INTEGER)")
            db.execSQL("CREATE INDEX index_learning_outbox_state_next_attempt_at_created_at ON learning_outbox(state,next_attempt_at,created_at)")
            db.execSQL("CREATE TABLE session_drafts(id TEXT NOT NULL PRIMARY KEY,kind TEXT NOT NULL,story_id TEXT,revision_id TEXT,started_at INTEGER NOT NULL,active_millis INTEGER NOT NULL,question_count INTEGER NOT NULL,state TEXT NOT NULL)")
        }
        private fun initialize(db: SupportSQLiteDatabase,owner: String,p: LocalProfileRow) {
            db.execSQL("INSERT INTO local_identity(id,owner_id) VALUES(1,?)",arrayOf(owner))
            db.insert("local_profile",SQLiteDatabase.CONFLICT_ABORT,ContentValues().apply {
                put("id",1);put("name",p.name);put("level",p.level);put("genre",p.genre);put("goal",p.goal)
                put("onboarding_done",p.onboarding);put("reader_hint_seen",p.hintSeen);put("last_story_id",p.lastStory);put("preferences_dirty",p.dirty)
            })
        }
    }
}
