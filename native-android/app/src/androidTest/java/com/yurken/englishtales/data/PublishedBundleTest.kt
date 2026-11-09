package com.yurken.englishtales.data

import android.content.ContextWrapper
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.json.JSONArray
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.io.File
import java.security.MessageDigest
import java.util.UUID

class PublishedBundleTest {
    private val target get() = InstrumentationRegistry.getInstrumentation().targetContext
    private val root get() = JSONObject(target.assets.open("catalog/v2.json").bufferedReader().use {it.readText()})
    private val directory = File(target.cacheDir,"published-bundle-${UUID.randomUUID()}")
    private val isolated by lazy {LearningReliabilityTest().isolated()}
    private val context get() = object: ContextWrapper(isolated) {override fun getFilesDir()=directory}
    @Before fun setup() {LearningContent.resetForTest(); LearningContent.initialize(target); directory.mkdirs()}
    @After fun cleanup() {LearningContent.resetForTest(); LearningContent.initialize(target); directory.deleteRecursively()}

    @Test fun originalWordsAndPositionsSurviveThePublishedBundle() {
        val legacy=root.getJSONObject("legacyCatalog")
        val legacyWords=legacy.getJSONArray("words").let { rows -> (0 until rows.length()).map {rows.getJSONObject(it).getString("id")} }.toSet()
        val rows=legacy.getJSONArray("stories")
        for(i in 0 until rows.length()) {
            val raw=rows.getJSONObject(i);val id=raw.getString("id")
            val old=checkNotNull(LearningContent.revision(ContentRevisionIds.bundled(id)))
            assertEquals(raw.getJSONArray("sentences").length(),old.sentences.size)
            assertNotNull(old.vocabulary)
            assertTrue(LearningContent.wordsForStory(old).all {it.id in legacyWords})
            val position=ReadingPosition(old.revisionId,old.sentences.last().id)
            assertTrue(position.carriesTo(LearningContent.storyById.getValue(id)))
            assertEquals(45,LearningSnapshot(storyProgress=mapOf(id to 45),readingPositions=mapOf(id to position)).progressFor(LearningContent.storyById.getValue(id)))
        }
        val words=legacy.getJSONArray("words")
        LearningStore(context).use {store ->
            store.onProductSignal={}
            for(i in 0 until words.length()) {
                val raw=words.getJSONObject(i);val id=raw.getString("id")
                assertEquals(raw.getString("word"),LearningContent.wordById.getValue(id).word)
                store.setWordSaved(id,true)
            }
        }
        LearningContent.resetForTest();LearningContent.initialize(target)
        LearningStore(context).use {store ->
            assertEquals(words.length(),store.snapshot().savedWordList().size)
        }
    }

    @Test fun ambiguousRevisionTranslationsCannotLeakThroughLegacyCacheFallback() {
        fun story(translation: String) = JSONObject().put("id","tale").put("description","Açıklama")
            .put("descriptions",JSONObject().put("es-419","Descripción"))
            .put("sentences",JSONArray().put(JSONObject().put("id","line").put("english","A quiet day.").put("turkish","Sessiz bir gün.")
                .put("translations",JSONObject().put("es-419",translation))))
        val fixture=JSONObject().put("stories",JSONArray().put(story("Un día tranquilo.")))
            .put("legacyCatalog",JSONObject().put("stories",JSONArray().put(story("Un día sereno."))))
            .put("words",JSONArray()).put("tags",JSONArray())
        ContentTranslations.install(fixture,"es-419","Fallback")
        val line=story("unused").getJSONArray("sentences").getJSONObject(0).apply {remove("translations")}
        assertNull(ContentTranslations.pick(line,"translations","turkish","es-419"))
        line.put("translations",JSONObject().put("es-419","Server text"))
        assertEquals("Server text",SupportLanguage.pick(line,"translations","turkish","es-419"))
    }

    @Test fun legacyPercentAndCompletedPositionStayCompletedWhenTheRevisionChanges() {
        val story=LearningContent.bundledStories.first()
        val old=checkNotNull(LearningContent.revision(ContentRevisionIds.bundled(story.id)))
        LearningStore(context).use {store ->
            store.onProductSignal={}
            store.writableDatabase.execSQL("INSERT OR REPLACE INTO story_progress(story_id,percent,updated_at) VALUES(?,100,0)",arrayOf(story.id))
            assertEquals(100,store.snapshot().progressFor(story))
            store.updateProgress(story.id,1,story.sentences.first().id,story)
            assertEquals(100,store.snapshot().progressFor(story))
            assertEquals(100,JSONObject(store.queuedOperations().last {it.rpc=="apply_progress_event"}.payload).getInt("percent"))
            store.updateProgress(old.id,100,old.sentences.last().id,old)
            store.updateProgress(story.id,1,story.sentences.first().id,story)
            assertEquals(100,store.snapshot().progressFor(story))
            val unrelated=story.copy(revisionId=UUID.randomUUID().toString(),sentences=listOf(StorySentence("new-id","Changed source.","Yeni metin.")))
            store.updateProgress(story.id,3,"new-id",unrelated)
            assertEquals(3,store.snapshot().progressFor(unrelated))
        }
    }

    @Test fun oldCachedMetadataStillOpensTheExactArchivedRevisionOffline()=runBlocking {
        val raw=root.getJSONObject("legacyCatalog").getJSONArray("stories").getJSONObject(0)
        val revision=ContentRevisionIds.bundled(raw.getString("id"))
        val expected=checkNotNull(LearningContent.revision(revision))
        save(metadata(raw,revision));ContentRepository(context,null).restore()
        val actual=LearningContent.storyById.getValue(expected.id)
        assertEquals(revision,actual.revisionId);assertEquals(expected.sentences,actual.sentences)
        assertEquals(expected.vocabulary,actual.vocabulary)
    }

    private fun metadata(raw: JSONObject,revision: String)=JSONObject().put("id",revision).put("story_id",raw.getString("id"))
        .put("title",raw.getString("title")).put("author",raw.getString("author")).put("level",raw.getString("level"))
        .put("genre",raw.getString("genre")).put("description",raw.getString("description"))
    private fun save(doc: JSONObject) {File(directory,"published-content").apply {mkdirs()}.resolve("catalog.json").writeText(JSONArray().put(doc).toString())}

    @Test fun exactPublishedRevisionRetainsEditorialWordsAndLinksAfterOfflineCatalogRestore()=runBlocking {
        val raw=root.getJSONArray("stories").getJSONObject(0)
        val expected=LearningContent.storyById.getValue(raw.getString("id"))
        assertNotNull(expected.vocabulary)
        save(metadata(raw,expected.revisionId));ContentRepository(context,null).restore()
        val restored=LearningContent.storyById.getValue(expected.id)
        assertEquals(expected.sentences,restored.sentences)
        assertEquals(expected.vocabulary,restored.vocabulary)
        assertEquals(expected.sentenceWordIds,restored.sentenceWordIds)
        assertEquals(LearningContent.wordsForStory(expected),LearningContent.wordsForStory(restored))
    }

    @Test fun newerRevisionCannotBorrowEditorialLinksFromAnOldTextOnlyCache()=runBlocking {
        val raw=root.getJSONArray("stories").getJSONObject(0)
        val story=LearningContent.storyById.getValue(raw.getString("id"));val revision=UUID.randomUUID().toString()
        save(metadata(raw,revision))
        val fingerprint=MessageDigest.getInstance("SHA-256").digest(story.sentences.map {it.id to it.english}.toString().toByteArray()).joinToString("") {"%02x".format(it)}
        File(directory,"published-content/bundled-text.index").writeText(JSONObject().put(revision,fingerprint).toString())
        ContentRepository(context,null).restore()
        val restored=LearningContent.storyById.getValue(story.id)
        assertEquals(revision,restored.revisionId);assertTrue(restored.sentences.isEmpty())
        assertTrue(LearningContent.wordsForStory(restored).isEmpty())
    }
}
