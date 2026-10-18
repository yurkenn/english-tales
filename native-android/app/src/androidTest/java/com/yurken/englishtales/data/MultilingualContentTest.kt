package com.yurken.englishtales.data

import android.content.Context
import android.content.ContextWrapper
import android.content.res.Configuration
import android.os.LocaleList
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.json.JSONArray
import org.json.JSONObject
import org.junit.After
import org.junit.Before
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.security.MessageDigest
import java.util.UUID

class MultilingualContentTest {
    private val target get() = InstrumentationRegistry.getInstrumentation().targetContext
    private val bundle by lazy { JSONObject(target.assets.open("catalog/v1.json").bufferedReader().use { it.readText() }) }
    private val directory by lazy { File(target.cacheDir, "languages-${UUID.randomUUID()}").apply { mkdirs() } }
    private fun context(tag: String): Context {
        val localized = target.createConfigurationContext(Configuration(target.resources.configuration).apply { setLocales(LocaleList.forLanguageTags(tag)) })
        return object : ContextWrapper(localized) { override fun getFilesDir() = directory }
    }
    @Before fun useBundledFixture() { LearningContent.resetForTest(); LearningContent.initialize(target) }
    @After fun restoreLanguage() { LearningContent.resetForTest(); LearningContent.initialize(target); directory.deleteRecursively() }

    @Test fun everyBundledTranslationIsAvailableOfflineAndKeepsEnglishAndStableIds() {
        for (lang in SupportLanguage.enabled) {
            LearningContent.initialize(context(lang))
            assertEquals(lang, SupportLanguage.code)
            assertEquals(50, LearningContent.stories.size)
            assertEquals(359, LearningContent.words.size)
            val rawStories = bundle.getJSONArray("stories")
            for (i in 0 until rawStories.length()) {
                val raw = rawStories.getJSONObject(i)
                val story = LearningContent.storyById.getValue(raw.getString("id"))
                val expectedDescription = if (lang == "tr") raw.getString("description") else raw.getJSONObject("descriptions").getString(lang)
                assertEquals(expectedDescription, story.description)
                val sentences = raw.getJSONArray("sentences")
                for (j in 0 until sentences.length()) {
                    val sentence = sentences.getJSONObject(j)
                    assertEquals(sentence.getString("id"), story.sentences[j].id)
                    assertEquals(sentence.getString("english"), story.sentences[j].english)
                    val expected = if (lang == "tr") sentence.getString("turkish") else sentence.getJSONObject("translations").getString(lang)
                    assertEquals("$lang/${story.id}/${story.sentences[j].id}", expected, story.sentences[j].translation)
                }
            }
            val words = bundle.getJSONArray("words")
            for (i in 0 until words.length()) {
                val raw = words.getJSONObject(i)
                val word = LearningContent.wordById.getValue(raw.getString("id"))
                assertEquals(raw.getString("word"), word.word)
                assertEquals(if (lang == "tr") raw.getString("translation") else raw.getJSONObject("translations").getString(lang), word.translation)
            }
        }
    }

    private fun legacyDocument(): JSONObject {
        val raw = bundle.getJSONArray("stories").getJSONObject(0)
        val doc = JSONObject(raw.toString()).put("story_id", raw.getString("id"))
            .put("id", ContentRevisionIds.bundled(raw.getString("id")))
            .put("words", JSONArray(bundle.getJSONArray("words").toString()))
        doc.remove("descriptions")
        val sentences = doc.getJSONArray("sentences")
        for (i in 0 until sentences.length()) sentences.getJSONObject(i).remove("translations")
        val words = doc.getJSONArray("words")
        for (i in 0 until words.length()) words.getJSONObject(i).remove("translations")
        return doc
    }

    @Test fun oldDownloadedStoryRelocalizesOfflineWithoutChangingItsFilesOrRevision() = runBlocking {
        val doc = legacyDocument()
        val cover = "cover fixture".toByteArray()
        doc.put("cover", JSONObject().put("byte_size", cover.size).put("sha256", MessageDigest.getInstance("SHA-256").digest(cover).joinToString("") { "%02x".format(it) }))
        val revision = doc.getString("id")
        val saved = File(directory, "published-content").apply { mkdirs() }
        File(saved, "catalog.json").writeText(JSONArray().put(doc).toString())
        val textFile = File(saved, "$revision.json").apply { writeText(doc.toString()) }
        File(saved, "$revision.cover").writeBytes(cover)
        val originalBytes = textFile.readBytes()
        for (lang in listOf("tr", "es-419", "ar", "ur", "th", "tr")) {
            val localized = context(lang)
            LearningContent.initialize(localized)
            val repository = ContentRepository(localized, null)
            repository.restore()
            val story = repository.downloads().single()
            assertEquals(revision, story.revisionId)
            val expected = bundle.getJSONArray("stories").getJSONObject(0).getJSONArray("sentences").getJSONObject(0)
            assertEquals(if (lang == "tr") expected.getString("turkish") else expected.getJSONObject("translations").getString(lang), story.sentences.first().translation)
            assertArrayEquals(originalBytes, textFile.readBytes())
            assertArrayEquals(cover, File(saved, "$revision.cover").readBytes())
        }
    }

    @Test fun serverTranslationWinsButAnEditedSourceCannotBorrowAnOldTranslation() {
        LearningContent.initialize(context("es-419"))
        val doc = legacyDocument()
        val sentence = doc.getJSONArray("sentences").getJSONObject(0)
        val original = sentence.getString("english")
        assertNotEquals(original, SupportLanguage.pick(sentence, "translations", "turkish"))
        sentence.put("translations", JSONObject().put("es-419", "Editorial server translation"))
        assertEquals("Editorial server translation", SupportLanguage.pick(sentence, "translations", "turkish"))
        sentence.remove("translations")
        sentence.put("english", "An edited English sentence.")
        assertEquals("An edited English sentence.", SupportLanguage.pick(sentence, "translations", "turkish"))
        doc.put("description", "An edited description")
        assertEquals(ContentTranslations.descriptionFallback, SupportLanguage.pick(doc, "descriptions", "description"))
    }

    @Test fun anOldLanguageRepositoryCannotReplaceTheSelectedLanguage() = runBlocking {
        val turkish = context("tr")
        LearningContent.initialize(turkish)
        val old = ContentRepository(turkish, null)
        LearningContent.initialize(context("ar"))
        val expected = LearningContent.words.first().translation
        old.restore()
        assertEquals("ar", SupportLanguage.code)
        assertEquals(expected, LearningContent.words.first().translation)
    }

    @Test fun languageChangesPreserveSavedWordsReadingPositionsFavoritesAndPreferences() {
        val isolated = LearningReliabilityTest().isolated()
        LearningContent.initialize(target)
        val story = LearningContent.stories.first()
        val word = LearningContent.words.first()
        val original = LearningStore(isolated).use { store ->
            store.onProductSignal = {}
            store.updatePreferences("A2", "Gizem", 2, "Learner")
            store.setWordSaved(word.id, true)
            store.setFavorite(story.id, true)
            store.updateProgress(story.id, 25, story.sentences.first().id, story)
            store.snapshot()
        }
        for (lang in listOf("es-419", "ar", "ur", "th", "tr")) {
            val resources = context(lang).resources
            val localized = object : ContextWrapper(isolated) { override fun getResources() = resources }
            LearningStore(localized).use { store ->
                store.onProductSignal = {}
                val actual = store.snapshot()
                assertEquals(lang, SupportLanguage.code)
                assertEquals(original.savedWordIds, actual.savedWordIds)
                assertEquals(original.readingPositions, actual.readingPositions)
                assertEquals(original.storyProgress, actual.storyProgress)
                assertEquals(original.favoriteStoryIds, actual.favoriteStoryIds)
                assertEquals(original.points, actual.points)
                assertEquals(original.displayName, actual.displayName)
                assertEquals(original.level, actual.level)
                assertEquals(original.preferredGenre, actual.preferredGenre)
                assertEquals(original.dailyGoal, actual.dailyGoal)
            }
        }
    }
}
