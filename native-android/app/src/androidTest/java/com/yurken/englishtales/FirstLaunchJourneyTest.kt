package com.yurken.englishtales

import android.database.sqlite.SQLiteDatabase
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.text.TextLayoutResult
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import java.io.File

/** A clean install walked end to end: intro, guest welcome, onboarding, first story, a saved word and its first review. */
class FirstLaunchJourneyTest {
    @get:Rule val compose=createEmptyComposeRule()
    private val context get()=InstrumentationRegistry.getInstrumentation().targetContext
    private fun text(id: Int,vararg args: Any)=context.getString(id,*args)

    /** Everything a first launch would not have; other tests use isolated contexts, so nothing is restored. */
    private fun freshInstall() {
        context.databaseList().filter {it.startsWith("english_tales") && it.endsWith(".db")}.forEach {context.deleteDatabase(it)}
        listOf("app_language","learning_preferences","reminders","product_metrics_v1","reading_appearance","comprehension","ad_frequency",
            "play_store_features","deleted-account-cleanup").forEach {context.getSharedPreferences(it,0).edit().clear().commit()}
        LearningSyncRuntime.accounts(context).clearLocal()
        File(context.filesDir,"published-content").deleteRecursively()
        LearningContent.resetForTest()
    }

    private fun scalar(sql: String,vararg args: String): String?=runCatching {
        val file=context.getDatabasePath(LearningOwner.Guest.databaseName)
        if(!file.exists()) null
        else SQLiteDatabase.openDatabase(file.path,null,SQLiteDatabase.OPEN_READONLY).use {db ->
            db.rawQuery(sql,args).use {if(it.moveToFirst() && !it.isNull(0)) it.getString(0) else null}
        }
    }.getOrNull()

    private fun waitFor(matcher: SemanticsMatcher,timeout: Long=20_000) {
        try {
            compose.waitUntil(timeout) {runCatching {compose.onAllNodes(matcher,useUnmergedTree=true).fetchSemanticsNodes().isNotEmpty()}.getOrDefault(false)}
        } catch (failure: ComposeTimeoutException) {
            val tree=runCatching {compose.onRoot(useUnmergedTree=true).printToString()}.getOrElse {"Semantics unavailable: ${it.message}"}
            throw AssertionError("First-launch screen did not reach $matcher. " +
                "Content ready=${LearningContent.ready}, language confirmed=${AppLanguage.hasConfirmedChoice(context)}, " +
                "onboarding=${scalar("SELECT onboarding_done FROM local_profile WHERE id=1")}\n$tree",failure)
        }
    }
    private fun waitForDb(timeout: Long=10_000,condition: ()->Boolean)=compose.waitUntil(timeout,condition)

    @Test fun guestReadsSavesAWordAndReviewsItOnAFreshInstall() {
        freshInstall()
        assertFalse("The fresh-install fixture must reset the device language gate",AppLanguage.hasConfirmedChoice(context))
        val scenario=ActivityScenario.launch(MainActivity::class.java)
        try {
            // Brand intro: skip it when it is still showing; it also continues on its own.
            runCatching {compose.onNodeWithContentDescription(text(R.string.yurken)).performClick()}
            waitFor(hasTestTag("language_continue"))
            compose.onNodeWithTag("language_continue").performClick()
            assertTrue(AppLanguage.hasConfirmedChoice(context))
            val guest=text(R.string.misafir_olarak_basla)
            waitFor(hasText(guest))
            compose.onNodeWithText(guest).performScrollTo().performClick()

            // Onboarding: A1, everyday life, one step a day.
            for(label in listOf(text(R.string.baslayalim),text(R.string.yeni_basliyorum),"Günlük yaşam",text(R.string.gunde_1_adim_rahat_baslangic))) {
                waitFor(hasText(label))
                compose.onNodeWithText(label,useUnmergedTree=true).performScrollTo().performClick()
                compose.waitForIdle()
            }
            val start=text(R.string.ilk_hikayeme_basla)
            waitFor(hasText(start))
            compose.onNodeWithText(start,useUnmergedTree=true).performScrollTo().performClick()

            // The recommended story's reader opens and the guest profile is saved.
            waitFor(hasContentDescription(text(R.string.kelimelerim_kayitli_kelime_2,0)))
            waitForDb {scalar("SELECT onboarding_done FROM local_profile WHERE id=1")=="1" && scalar("SELECT last_story_id FROM local_profile WHERE id=1")!=null}
            assertEquals("A1",scalar("SELECT level FROM local_profile WHERE id=1"))
            assertEquals("Günlük yaşam",scalar("SELECT genre FROM local_profile WHERE id=1"))
            assertEquals("1",scalar("SELECT goal FROM local_profile WHERE id=1"))
            val storyId=checkNotNull(scalar("SELECT last_story_id FROM local_profile WHERE id=1"))
            assertEquals(LearningContent.recommendedStory("A1","Günlük yaşam")?.id,storyId)
            val story=LearningContent.storyById.getValue(storyId)

            // Tap the first underlined learning word on the first page, the way the reader links it.
            val (sentence,match)=story.sentences.take(8).firstNotNullOf {s ->
                val phrases=if(story.vocabulary!=null) PhraseMatcher.Index(LearningContent.wordsForSentence(story,s)) else LearningContent.phraseIndex
                PhraseMatcher.find(s.english,phrases).firstOrNull()?.let {s to it}
            }
            val node=compose.onNodeWithText(sentence.english).performScrollTo()
            val layouts=mutableListOf<TextLayoutResult>()
            node.performSemanticsAction(SemanticsActions.GetTextLayoutResult) {it(layouts)}
            val bounds=layouts.single().getBoundingBox((match.start+match.end)/2)
            node.performTouchInput {click(bounds.center)}
            val learn=text(R.string.ogren_2)
            waitFor(hasText(learn))
            compose.onNodeWithText(learn).performClick()
            val wordId=match.word.id
            waitForDb {scalar("SELECT COUNT(*) FROM saved_words WHERE word_id=?",wordId)=="1"}
            waitFor(hasContentDescription(text(R.string.kelimelerim_kayitli_kelime_2,1)))

            // A configuration change keeps the reader, its story and the saved count.
            scenario.recreate()
            waitFor(hasContentDescription(text(R.string.kelimelerim_kayitli_kelime_2,1)))
            compose.onNodeWithText(sentence.english).assertExists()
            assertEquals("1",scalar("SELECT COUNT(*) FROM saved_words"))

            // Back to the daily plan, where the new word is already due for review.
            compose.onAllNodesWithContentDescription(text(R.string.geri)).onFirst().performClick()
            val review=text(R.string.kelimeyi_hatirla,1)
            waitFor(hasText(review))
            compose.onNodeWithText(review).performScrollTo().performClick()

            // A new word starts on the recognise rung: pick its meaning.
            waitFor(hasText(text(R.string.bir_ceviri_secin)))
            compose.onNodeWithText(match.word.word).assertExists()
            compose.onNodeWithText(match.word.translation).apply {runCatching {performScrollTo()}}.performClick()
            waitForDb {scalar("SELECT correct_count FROM saved_words WHERE word_id=?",wordId)=="1"}
            assertNotNull(scalar("SELECT last_reviewed_at FROM saved_words WHERE word_id=?",wordId))
            assertNotEquals("learning",scalar("SELECT learning_state FROM saved_words WHERE word_id=?",wordId))
            waitFor(hasText(text(R.string.calisma_tamamlandi)))
            waitForDb {scalar("SELECT completed_lessons FROM learning_stats WHERE id=1")=="1"}
        } finally {scenario.close()}
    }
}
