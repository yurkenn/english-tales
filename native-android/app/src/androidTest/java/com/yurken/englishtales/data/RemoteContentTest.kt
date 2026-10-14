package com.yurken.englishtales.data

import android.content.ContextWrapper
import android.graphics.Bitmap
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.BuildConfig
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import java.io.File
import java.security.MessageDigest
import java.util.UUID

class RemoteContentTest {
    private lateinit var directory: File
    private lateinit var context: ContextWrapper
    private lateinit var original: List<Story>
    private lateinit var originalWords: List<WordInfo>
    @Before fun setup() {
        val target=InstrumentationRegistry.getInstrumentation().targetContext
        LearningContent.initialize(target)
        original=LearningContent.stories; originalWords=LearningContent.words
        directory=File(target.cacheDir,"content-test-${UUID.randomUUID()}").apply {mkdirs()}
        context=object: ContextWrapper(target) {override fun getFilesDir()=directory}
    }
    @After fun cleanup() = runBlocking<Unit> {
        withContext(Dispatchers.Main) {LearningContent.install(original,originalWords)}
        directory.deleteRecursively()
        Unit
    }
    private class Fixture: ContentHttp("https://example.invalid","sb_publishable_test") {
        val cover=java.io.ByteArrayOutputStream().also {Bitmap.createBitmap(4,4,Bitmap.Config.ARGB_8888).compress(Bitmap.CompressFormat.PNG,100,it)}.toByteArray()
        val revision=UUID.randomUUID().toString()
        val assetId=UUID.randomUUID().toString()
        var corrupted=false
        var fail=false
        var empty=false
        var revisionQueries=0
        var createdAt: String?=null
        val doc=JSONObject().put("id",revision).put("story_id","remote-test").put("title","Remote test").put("author","English Tales")
            .put("level","A1").put("genre","Gizem").put("description","A test story").put("published_at","2026-10-11T00:00:00Z").put("cover_asset_id",assetId)
        override fun bytes(path: String,maxBytes: Long): ByteArray {
            check(!fail) {"Simulated network failure"}
            if(path.startsWith("/storage/")) return if(corrupted) cover + byteArrayOf(0) else cover
            val uri=android.net.Uri.parse("https://example.invalid$path")
            val offset=uri.getQueryParameter("offset")!!.toInt()
            val table=uri.lastPathSegment
            val rows=when(table) {
                "stories" -> if(empty) emptyList() else listOf(JSONObject().put("id","remote-test").put("current_revision_id",revision).also {row -> createdAt?.let {row.put("created_at",it)}})
                "story_revisions" -> listOf(doc)
                "story_sentences" -> (1..7).map {JSONObject().put("id","s-$it").put("position",it).put("english","A quiet day.").put("turkish","Sessiz bir gün.")}
                "revision_words" -> listOf(JSONObject().put("id","fixture-quiet").put("word","quiet").put("translation","sessiz").put("pronunciation","quiet").put("example","A quiet day."))
                "sentence_words" -> listOf(JSONObject().put("sentence_id","s-1").put("word_id","fixture-quiet"))
                "content_assets" -> listOf(JSONObject().put("id",assetId).put("kind","cover").put("mime_type","image/png").put("storage_path","test/cover.png").put("byte_size",cover.size)
                    .put("sha256",MessageDigest.getInstance("SHA-256").digest(cover).joinToString("") {"%02x".format(it)}))
                else -> error("Unexpected table")
            }
            if(table=="story_sentences") revisionQueries++
            return JSONArray(rows.drop(offset).take(5)).toString().toByteArray()
        }
    }
    @Test fun paginatedDownloadSurvivesOfflineRestart()=runBlocking {
        val fixture=Fixture(); val repo=ContentRepository(context,fixture)
        repo.restore(); repo.refresh()
        val downloaded=repo.download(LearningContent.stories.single())
        assertEquals(7,downloaded.sentences.size); assertEquals(3,fixture.revisionQueries)
        assertEquals(listOf("fixture-quiet"),LearningContent.wordsForStory(downloaded).map {it.id})
        fixture.fail=true
        val restart=ContentRepository(context,fixture); restart.restore()
        assertTrue(restart.isDownloaded(LearningContent.stories.single()))
        assertEquals(7,LearningContent.stories.single().sentences.size)
    }
    @Test fun firstPublicationDateSurvivesDownloadAndOfflineRestart()=runBlocking {
        val fixture=Fixture().apply {createdAt="2026-10-14T09:47:44.123456+00:00"}
        val expected=java.time.Instant.parse("2026-10-14T09:47:44.123456Z")
        val repo=ContentRepository(context,fixture)
        repo.restore(); repo.refresh()
        assertEquals(expected,LearningContent.stories.single().addedAt)
        repo.download(LearningContent.stories.single())
        assertEquals(expected,LearningContent.stories.single().addedAt)
        fixture.fail=true
        ContentRepository(context,fixture).restore()
        assertEquals(expected,LearningContent.stories.single().addedAt)
    }
    @Test fun missingCreationDateLeavesStoryUndated()=runBlocking {
        val repo=ContentRepository(context,Fixture())
        repo.restore(); repo.refresh()
        assertNull(LearningContent.stories.single().addedAt)
    }
    @Test fun newestStoriesPreferAddedDateThenLaterCatalogPosition()=runBlocking {
        fun story(id: String, addedAt: String?)=Story(id,id,"English Tales","A1","Gizem","","remote",listOf(StorySentence("s-1","A day.","Bir gün.")),
            addedAt=addedAt?.let(java.time.Instant::parse))
        withContext(Dispatchers.Main) {
            LearningContent.install(listOf(story("old-undated",null),story("first-batch","2026-10-11T15:20:47Z"),
                story("late-undated",null),story("classic-b","2026-10-14T09:47:44Z"),story("classic-a","2026-10-14T09:47:44Z")))
        }
        assertEquals(listOf("classic-a","classic-b","first-batch"),LearningContent.newestStories(3).map {it.id})
        assertEquals(listOf("classic-a","classic-b","first-batch","late-undated","old-undated"),LearningContent.newestStories(10).map {it.id})
    }
    @Test fun corruptCoverDoesNotCommitDownload()=runBlocking {
        val fixture=Fixture(); val repo=ContentRepository(context,fixture)
        repo.restore(); repo.refresh(); fixture.corrupted=true
        assertTrue(runCatching {repo.download(LearningContent.stories.single())}.isFailure)
        assertFalse(repo.isDownloaded(LearningContent.stories.single()))
        assertEquals(0,LearningContent.stories.single().sentences.size)
        assertFalse(File(directory,"published-content/${fixture.revision}.json").exists())
    }
    @Test fun failedRefreshKeepsWorkingContentAndReaderPin()=runBlocking {
        val fixture=Fixture(); val repo=ContentRepository(context,fixture)
        repo.restore(); repo.refresh(); val downloaded=repo.download(LearningContent.stories.single())
        LearningContent.pin(downloaded)
        try {
            fixture.fail=true
            assertTrue(runCatching {repo.refresh()}.isFailure)
            assertSame(downloaded,LearningContent.storyById[downloaded.id])
            fixture.fail=false; fixture.empty=true; repo.refresh()
            assertTrue(LearningContent.stories.isEmpty())
            assertSame(downloaded,LearningContent.storyById[downloaded.id])
        } finally {LearningContent.unpin(downloaded)}
    }
    @Test fun removeDownloadKeepsLearnedWordSource()=runBlocking {
        val fixture=Fixture(); val repo=ContentRepository(context,fixture)
        repo.restore();repo.refresh();val story=repo.download(LearningContent.stories.single())
        repo.removeDownload(story)
        assertFalse(repo.isDownloaded(story));assertFalse(File(story.coverFile!!).exists())
        val restarted=ContentRepository(context,null);restarted.restore()
        assertEquals("sessiz",LearningContent.wordById.getValue("fixture-quiet").translation)
        assertEquals(story.revisionId,LearningContent.revisionForWord("fixture-quiet"))
    }
    @Test fun damagedCacheFallsBackWithoutCrash()=runBlocking {
        File(directory,"published-content").mkdirs()
        File(directory,"published-content/catalog.json").writeText("[{\"id\":\"bad\"}]")
        val repo=ContentRepository(context,null);repo.restore()
        assertEquals(original,LearningContent.stories)
    }
    @Test fun livePublishedContentDownloadsAndRestoresOffline()=runBlocking {
        assumeTrue(BuildConfig.SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_"))
        val repo=ContentRepository(context,ContentHttp(BuildConfig.SUPABASE_URL,BuildConfig.SUPABASE_PUBLISHABLE_KEY))
        repo.restore();repo.refresh()
        assertTrue(LearningContent.stories.isNotEmpty())
        val story=repo.download(LearningContent.stories.first())
        assertTrue(story.sentences.isNotEmpty());assertTrue(story.vocabulary!!.isNotEmpty());assertTrue(File(story.coverFile!!).exists())
        val offline=ContentRepository(context,null);offline.restore()
        assertEquals(story.revisionId,LearningContent.storyById.getValue(story.id).revisionId)
        assertTrue(offline.isDownloaded(LearningContent.storyById.getValue(story.id)))
    }
}
