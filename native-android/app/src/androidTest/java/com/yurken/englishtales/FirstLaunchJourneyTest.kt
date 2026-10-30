package com.yurken.englishtales

import android.database.sqlite.SQLiteDatabase
import android.graphics.Bitmap
import androidx.compose.ui.graphics.asAndroidBitmap
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
    // Keep the framework default dispatcher for the real Activity/window journey.
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
            // A missing match is an empty collection. Rendering failures must propagate,
            // rather than being swallowed and misreported as a missing screen.
            compose.waitUntil(timeout) {compose.onAllNodes(matcher,useUnmergedTree=true).fetchSemanticsNodes().isNotEmpty()}
        } catch (failure: ComposeTimeoutException) {
            val tree=runCatching {compose.onRoot(useUnmergedTree=true).printToString()}.getOrElse {"Semantics unavailable: ${it.message}"}
            throw AssertionError("First-launch screen did not reach $matcher. " +
                "Content ready=${LearningContent.ready}, language confirmed=${AppLanguage.hasConfirmedChoice(context)}, " +
                "onboarding=${scalar("SELECT onboarding_done FROM local_profile WHERE id=1")}\n$tree",failure)
        }
    }
    private fun waitForDb(timeout: Long=10_000,condition: ()->Boolean)=compose.waitUntil(timeout,condition)

    private fun screenshot(name: String) {
        compose.waitForIdle()
        val instrumentation=InstrumentationRegistry.getInstrumentation()
        val dir=InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let(::File)
            ?: File(context.getExternalFilesDir(null),"first-launch")
        // PixelCopy waits for the Compose draw. UiAutomation can return the outgoing
        // Activity frame immediately after navigation even when semantics are idle.
        val bitmap=compose.onRoot().captureToImage().asAndroidBitmap()
        File(dir,"first-launch").apply {mkdirs()}.resolve("$name.png").outputStream().use {
            bitmap.compress(Bitmap.CompressFormat.PNG,100,it)
        }
        bitmap.recycle()
    }

    @Test fun guestReadsSavesAWordAndReviewsItOnAFreshInstall() {
        freshInstall()
        assertFalse("The fresh-install fixture must reset the device language gate",AppLanguage.hasConfirmedChoice(context))
        val scenario=ActivityScenario.launch(MainActivity::class.java)
        try {
            // Brand intro: skip it when it is still showing; it also continues on its own.
            if(compose.onAllNodesWithContentDescription(text(R.string.yurken)).fetchSemanticsNodes().isNotEmpty())
                compose.onNodeWithContentDescription(text(R.string.yurken)).performClick()
            waitFor(hasTestTag("language_continue"))
            screenshot("01-language")
            compose.onNodeWithTag("language_continue").performClick()
            assertTrue(AppLanguage.hasConfirmedChoice(context))
            val guest=text(R.string.misafir_olarak_basla)
            waitFor(hasText(guest))
            screenshot("02-welcome")
            compose.onNodeWithText(guest).performScrollTo().performClick()

            // Onboarding: A1, everyday life, one step a day.
            for(label in listOf(text(R.string.baslayalim),text(R.string.yeni_basliyorum),"Günlük yaşam",text(R.string.gunde_1_adim_rahat_baslangic))) {
                waitFor(hasText(label))
                compose.onNodeWithText(label,useUnmergedTree=true).performScrollTo().performClick()
                compose.waitForIdle()
            }
            val start=text(R.string.ilk_hikayeme_basla)
            waitFor(hasText(start))
            screenshot("03-onboarding-ready")
            compose.onNodeWithText(start,useUnmergedTree=true).performScrollTo().performClick()

            // The recommended story's reader opens and the guest profile is saved.
            waitFor(hasContentDescription(text(R.string.kelimelerim_kayitli_kelime_2,0)))
            screenshot("04-reader")
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
            val node=compose.onNodeWithText(sentence.english,substring=true).performScrollTo()
            val layouts=mutableListOf<TextLayoutResult>()
            node.performSemanticsAction(SemanticsActions.GetTextLayoutResult) {it(layouts)}
            // The page is one paragraph, so the word's offset counts from where its sentence starts in it.
            val base=layouts.single().layoutInput.text.text.indexOf(sentence.english)
            val bounds=layouts.single().getBoundingBox(base+(match.start+match.end)/2)
            node.performTouchInput {click(bounds.center)}
            val learn=text(R.string.ogren_2)
            waitFor(hasText(learn))
            screenshot("05-word-card")
            compose.onNodeWithText(learn).performClick()
            val wordId=match.word.id
            waitForDb {scalar("SELECT COUNT(*) FROM saved_words WHERE word_id=?",wordId)=="1"}
            waitFor(hasContentDescription(text(R.string.kelimelerim_kayitli_kelime_2,1)))

            // A configuration change keeps the reader, its story and the saved count.
            scenario.recreate()
            waitFor(hasContentDescription(text(R.string.kelimelerim_kayitli_kelime_2,1)))
            compose.onNodeWithText(sentence.english,substring=true).assertExists()
            assertEquals("1",scalar("SELECT COUNT(*) FROM saved_words"))

            // Back to the daily plan, where the new word is already due for review.
            compose.onAllNodesWithContentDescription(text(R.string.geri)).onFirst().performClick()
            val review=text(R.string.kelimeyi_hatirla,1)
            waitFor(hasText(review))
            screenshot("06-study")
            compose.onNodeWithText(review).performScrollTo().performClick()

            // A new word starts on the recognise rung: pick its meaning.
            waitFor(hasText(text(R.string.bir_ceviri_secin)))
            screenshot("07-review")
            compose.onNodeWithText(match.word.word).assertExists()
            compose.onNodeWithText(match.word.translation).apply {runCatching {performScrollTo()}}.performClick()
            waitForDb {scalar("SELECT correct_count FROM saved_words WHERE word_id=?",wordId)=="1"}
            assertNotNull(scalar("SELECT last_reviewed_at FROM saved_words WHERE word_id=?",wordId))
            assertNotEquals("learning",scalar("SELECT learning_state FROM saved_words WHERE word_id=?",wordId))
            waitFor(hasText(text(R.string.calisma_tamamlandi)))
            screenshot("08-result")
            waitForDb {scalar("SELECT completed_lessons FROM learning_stats WHERE id=1")=="1"}
        } finally {scenario.close()}
    }
}
