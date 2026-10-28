package com.yurken.englishtales.data

import android.content.ContextWrapper
import android.graphics.Bitmap
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.async
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.Assert.*
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
        withContext(Dispatchers.Main) {LearningContent.resetForTest(); LearningContent.initialize(context)}
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
        var sentenceCount=7
        /** Successful REST requests per table. */
        val requests=mutableMapOf<String,Int>()
        var createdAt: String?=null
        var questions=false
        /** Servers without the Q4.0 translation tables answer those queries with an error. */
        var translationTables=false
        var tagTables=false
        /** Holds catalog refreshes at their first request until released. */
        @Volatile var gate: java.util.concurrent.CountDownLatch?=null
        /** Holds downloads at their first request until released. */
        @Volatile var downloadGate: java.util.concurrent.CountDownLatch?=null
        /** First pages of single-revision downloads; the terminal empty page is not another download. */
        @Volatile var downloads=0
        val doc=JSONObject().put("id",revision).put("story_id","remote-test").put("title","Remote test").put("author","English Tales")
            .put("level","A1").put("genre","Gizem").put("description","A test story").put("published_at","2026-10-11T00:00:00Z").put("cover_asset_id",assetId)
        override fun bytes(path: String,maxBytes: Long): ByteArray {
            check(!fail) {"Simulated network failure"}
            if(path.startsWith("/storage/")) return if(corrupted) cover + byteArrayOf(0) else cover
            val uri=android.net.Uri.parse("https://example.invalid$path")
            val offset=uri.getQueryParameter("offset")!!.toInt()
            val table=uri.lastPathSegment
            if(table=="stories") gate?.let {check(it.await(10,java.util.concurrent.TimeUnit.SECONDS))}
            if(table=="story_revisions" && uri.getQueryParameter("id")!!.startsWith("eq.") && offset==0) {downloads++; downloadGate?.let {check(it.await(10,java.util.concurrent.TimeUnit.SECONDS))}}
            val rows=when(table) {
                "stories" -> if(empty) emptyList() else listOf(JSONObject().put("id","remote-test").put("current_revision_id",revision).also {row -> createdAt?.let {row.put("created_at",it)}})
                "story_revisions" -> listOf(doc)
                "story_sentences" -> (1..sentenceCount).map {JSONObject().put("id","s-$it").put("position",it).put("english","A quiet day.").put("turkish","Sessiz bir gün.")}
                "revision_words" -> listOf(JSONObject().put("id","fixture-quiet").put("word","quiet").put("translation","sessiz").put("pronunciation","quiet").put("example","A quiet day."))
                "sentence_words" -> listOf(JSONObject().put("sentence_id","s-1").put("word_id","fixture-quiet"))
                "content_assets" -> listOf(JSONObject().put("id",assetId).put("kind","cover").put("mime_type","image/png").put("storage_path","test/cover.png").put("byte_size",cover.size)
                    .put("sha256",MessageDigest.getInstance("SHA-256").digest(cover).joinToString("") {"%02x".format(it)}))
                "story_questions" -> {check(questions); listOf(JSONObject().put("id","q1").put("position",1).put("kind","main").put("prompt","Is it quiet?")
                    .put("options",JSONArray(listOf("Yes","No"))).put("answer",0))}
                "sentence_translations" -> {check(translationTables && uri.getQueryParameter("lang")=="eq.tr"); (1..7).map {JSONObject().put("sentence_id","s-$it").put("text","Tablodan gelen çeviri $it.")}}
                "word_translations" -> {check(translationTables); listOf(JSONObject().put("word_id","fixture-quiet").put("translation","sakin"))}
                "revision_texts" -> {check(translationTables); listOf(JSONObject().put("revision_id",revision).put("description","Tablodan gelen açıklama"))}
                "content_tags" -> {check(tagTables); listOf(JSONObject().put("id","masal").put("position",1),JSONObject().put("id","gizem").put("position",2))}
                "tag_names" -> {check(tagTables); if(uri.getQueryParameter("lang")=="eq.tr") listOf(JSONObject().put("tag_id","masal").put("name","Masal"),JSONObject().put("tag_id","gizem").put("name","Gizem")) else emptyList()}
                "revision_tags" -> {check(tagTables); listOf(JSONObject().put("revision_id",revision).put("tag_id","gizem"),JSONObject().put("revision_id",revision).put("tag_id","masal"))}
                else -> error("Unexpected table")
            }
            requests[table!!]=(requests[table]?:0)+1
            // Like PostgREST, a page never exceeds the server's max_rows.
            val limit=minOf(uri.getQueryParameter("limit")!!.toInt(),ContentHttp.PAGE_SIZE)
            return JSONArray(rows.drop(offset).take(limit)).toString().toByteArray()
        }
    }
    /** A bundled story whose live story now points at a newer published revision. */
    private class RevisionFixture(val story: Story, val editedText: Boolean=false, val newCover: Boolean=false): ContentHttp("https://example.invalid","sb_publishable_test") {
        val revision=UUID.randomUUID().toString()
        val cover=UUID.randomUUID().toString()
        var fail=false
        val requests=mutableMapOf<String,Int>()
        private fun doc(id: String,coverId: String)=JSONObject().put("id",id).put("story_id",story.id).put("title",story.title).put("author",story.author)
            .put("level",story.level).put("genre",story.genre).put("description",story.description).put("published_at","2026-10-16T00:00:00Z").put("cover_asset_id",coverId)
        private val revisions=listOf(doc(story.revisionId,cover),doc(revision,if(newCover) UUID.randomUUID().toString() else cover))
        override fun bytes(path: String,maxBytes: Long): ByteArray {
            check(!fail) {"Simulated network failure"}
            val uri=android.net.Uri.parse("https://example.invalid$path")
            fun ids(name: String)=uri.getQueryParameter(name)?.removePrefix("in.(")?.removePrefix("eq.")?.removeSuffix(")")?.split(",")?.toSet()
            uri.lastPathSegment?.let {requests[it]=(requests[it]?:0)+1}
            val rows=when(uri.lastPathSegment) {
                "stories" -> listOf(JSONObject().put("id",story.id).put("current_revision_id",revision))
                "story_revisions" -> revisions.filter {it.getString("id") in ids("id")!!}
                "story_sentences" -> ids("revision_id")!!.flatMap {id -> story.sentences.mapIndexed {i,s ->
                    JSONObject().put("revision_id",id).put("id",s.id).put("position",i+1).put("english",if(editedText&&i==0) s.english+" Again." else s.english).put("turkish",s.component3())}}
                else -> error("Unexpected table")
            }
            val offset=uri.getQueryParameter("offset")!!.toInt(); val limit=uri.getQueryParameter("limit")!!.toInt()
            return JSONArray(rows.drop(offset).take(limit)).toString().toByteArray()
        }
    }
    @Test fun newerRevisionWithBundledTextStaysReadableOffline()=runBlocking {
        // Exercise the historical schema-1 text-only optimization with a legacy fixture.
        original = original.map {it.copy(revisionId=ContentRevisionIds.bundled(it.id),vocabulary=null,sentenceWordIds=null)}
        LearningContent.initializeForTest(originalWords, original)
        val story=original.first(); val fixture=RevisionFixture(story)
        val repo=ContentRepository(context,fixture); repo.restore(); repo.refresh()
        val current=LearningContent.storyById.getValue(story.id)
        assertEquals(fixture.revision,current.revisionId); assertEquals(story.sentences,current.sentences)
        assertFalse(repo.isDownloaded(current))
        fixture.fail=true
        ContentRepository(context,fixture).restore()
        assertEquals(story.sentences,LearningContent.storyById.getValue(story.id).sentences)
    }
    @Test fun newerRevisionWithChangedTextOrCoverNeedsDownload()=runBlocking {
        // Exercise the historical schema-1 text-only optimization with a legacy fixture.
        original = original.map {it.copy(revisionId=ContentRevisionIds.bundled(it.id),vocabulary=null,sentenceWordIds=null)}
        LearningContent.initializeForTest(originalWords, original)
        for(fixture in listOf(RevisionFixture(original.first(),editedText=true),RevisionFixture(original.first(),newCover=true))) {
            File(directory,"published-content").deleteRecursively()
            val repo=ContentRepository(context,fixture); repo.restore(); repo.refresh()
            val current=LearningContent.storyById.getValue(fixture.story.id)
            assertEquals(fixture.revision,current.revisionId); assertTrue(current.sentences.isEmpty())
        }
    }
    @Test fun changedTextIsCheckedOnceAcrossRefreshesAndRestarts()=runBlocking {
        // Exercise the historical schema-1 text-only optimization with a legacy fixture.
        original = original.map {it.copy(revisionId=ContentRevisionIds.bundled(it.id),vocabulary=null,sentenceWordIds=null)}
        LearningContent.initializeForTest(originalWords, original)
        val fixture=RevisionFixture(original.first(),editedText=true)
        val repo=ContentRepository(context,fixture); repo.restore(); repo.refresh()
        val checked=fixture.requests.getValue("story_sentences"); assertTrue(checked>0)
        repo.refresh(); ContentRepository(context,fixture).apply {restore(); refresh()}
        assertEquals(checked,fixture.requests["story_sentences"])
        assertTrue(LearningContent.storyById.getValue(fixture.story.id).sentences.isEmpty())
    }
    @Test fun paginatedDownloadSurvivesOfflineRestart()=runBlocking {
        val fixture=Fixture(); val repo=ContentRepository(context,fixture)
        repo.restore(); repo.refresh()
        val downloaded=repo.download(LearningContent.stories.single())
        assertEquals(7,downloaded.sentences.size); assertEquals(2,fixture.requests["story_sentences"])
        assertEquals(listOf("fixture-quiet"),LearningContent.wordsForStory(downloaded).map {it.id})
        fixture.fail=true
        val restart=ContentRepository(context,fixture); restart.restore()
        assertTrue(restart.isDownloaded(LearningContent.stories.single()))
        assertEquals(7,LearningContent.stories.single().sentences.size)
    }
    @Test fun downloadStateReadsStayConsistentWhileRestoreAndRemovalRun()=runBlocking {
        val fixture=Fixture(); val repo=ContentRepository(context,fixture)
        repo.restore(); repo.refresh()
        val story=LearningContent.stories.single(); repo.download(story)
        // The UI reads these on Main without the repository lock; restore and removal write on other threads.
        val restoring=java.util.concurrent.atomic.AtomicBoolean(true); val running=java.util.concurrent.atomic.AtomicBoolean(true)
        val failure=java.util.concurrent.atomic.AtomicReference<Throwable>()
        val reader=Thread {
            try { while(running.get()) {
                val list=repo.downloads(); val present=repo.isDownloaded(story)
                // A downloaded story never disappears while restore only re-reads it from disk.
                if(restoring.get()) { check(present) {"restore exposed a partial map"}; check(list.map {it.id}==listOf(story.id)) }
            } } catch(t: Throwable) { failure.set(t) }
        }.apply {start()}
        try {
            repeat(20) { repo.restore() }
            restoring.set(false)
            repeat(5) { repo.removeDownload(story); repo.download(story); repo.restore() }
        } finally { running.set(false); reader.join(2_000) }
        failure.get()?.let {throw AssertionError("Concurrent read failed",it)}
        assertTrue(repo.isDownloaded(story))
    }
    @Test fun downloadFetchesEachTableInFullPages()=runBlocking {
        val fixture=Fixture().apply {sentenceCount=2_503}; val repo=ContentRepository(context,fixture)
        repo.restore(); repo.refresh(); fixture.requests.clear()
        assertEquals(2_503,repo.download(LearningContent.stories.single()).sentences.size)
        // ceil(2503/1000) pages plus the empty page that ends the table.
        assertEquals(4,fixture.requests["story_sentences"])
        assertEquals(mapOf("story_revisions" to 2,"revision_words" to 2,"sentence_words" to 2,"content_assets" to 2),fixture.requests-"story_sentences")
    }
    @Test fun smallPagesEndOnlyAtAnEmptyPage() {
        val fixture=Fixture(); val query="select=*&revision_id=eq.${fixture.revision}&order=position.asc"
        // A short page may be a server cap, not the end, so pagination continues to an empty page.
        val rows=fixture.rows("story_sentences",query,5)
        assertEquals((1..7).map {"s-$it"},(0 until rows.length()).map {rows.getJSONObject(it).getString("id")})
        assertEquals(3,fixture.requests["story_sentences"])
        fixture.sentenceCount=10; fixture.requests.clear()
        assertEquals(10,fixture.rows("story_sentences",query,5).length()); assertEquals(3,fixture.requests["story_sentences"])
    }
    @Test fun downloadedQuestionsSurviveOfflineRestartAndAreOptional()=runBlocking {
        val withQuestions=Fixture().apply {questions=true}; val repo=ContentRepository(context,withQuestions)
        repo.restore(); repo.refresh()
        assertEquals(listOf("q1"),repo.download(LearningContent.stories.single()).questions.map {it.id})
        withQuestions.fail=true
        ContentRepository(context,withQuestions).restore()
        assertEquals("Is it quiet?",LearningContent.stories.single().questions.single().prompt)
    }
    @Test fun translationTablesWinAndSurviveOfflineRestart()=runBlocking {
        val fixture=Fixture().apply {translationTables=true}; val repo=ContentRepository(context,fixture)
        repo.restore(); repo.refresh()
        assertEquals("Tablodan gelen açıklama",LearningContent.stories.single().description)
        val downloaded=repo.download(LearningContent.stories.single())
        assertEquals("Tablodan gelen çeviri 1.",downloaded.sentences.first().translation)
        assertEquals("sakin",LearningContent.wordsForStory(downloaded).single().translation)
        fixture.fail=true
        ContentRepository(context,fixture).restore()
        assertEquals("Tablodan gelen çeviri 7.",LearningContent.stories.single().sentences.last().translation)
        assertEquals("Tablodan gelen açıklama",LearningContent.stories.single().description)
    }
    @Test fun tagsFollowVocabularyOrderAndSurviveOfflineRestart()=runBlocking {
        val fixture=Fixture().apply {tagTables=true}; val repo=ContentRepository(context,fixture)
        repo.restore(); repo.refresh()
        val tags=listOf(StoryTag("masal","Masal"),StoryTag("gizem","Gizem"))
        assertEquals(tags,LearningContent.stories.single().tags)
        assertEquals(tags,repo.download(LearningContent.stories.single()).tags)
        fixture.fail=true
        ContentRepository(context,fixture).restore()
        assertEquals(tags,LearningContent.stories.single().tags)
    }
    @Test fun serversWithoutTagTablesFallBackToTheGenre()=runBlocking {
        val repo=ContentRepository(context,Fixture()); repo.restore(); repo.refresh()
        assertEquals(listOf(StoryTag("gizem","Gizem")),StoryTag.of(LearningContent.stories.single()))
    }
    @Test fun serversWithoutTranslationTablesUseLegacyTurkishColumns()=runBlocking {
        val repo=ContentRepository(context,Fixture())
        repo.restore(); repo.refresh()
        assertEquals("A test story",LearningContent.stories.single().description)
        val downloaded=repo.download(LearningContent.stories.single())
        assertEquals("Sessiz bir gün.",downloaded.sentences.first().translation)
        assertEquals("sessiz",LearningContent.wordsForStory(downloaded).single().translation)
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
    @Test fun readerDownloadDuringRefreshWaitsInsteadOfBeingDropped()=runBlocking {
        val fixture=Fixture(); val repo=ContentRepository(context,fixture)
        repo.restore(); repo.refresh()
        val story=LearningContent.stories.single(); assertFalse(repo.isDownloaded(story))
        val gate=java.util.concurrent.CountDownLatch(1); fixture.gate=gate
        val app=InstrumentationRegistry.getInstrumentation().targetContext.applicationContext as android.app.Application
        val ready=kotlinx.coroutines.CompletableDeferred<Story>(); var calls=0
        val model=withContext(Dispatchers.Main) {ContentViewModel(app,repo)}
        // The ViewModel's start-up refresh is now held at the network.
        withTimeout(10_000) {model.status.first {it.busy && it.downloading==null}}
        withContext(Dispatchers.Main) {
            model.download(story) {calls++; ready.complete(it)}
            model.download(story) {calls++}
            assertEquals(story.id,model.status.value.downloading); assertTrue(model.status.value.busy)
        }
        gate.countDown()
        val opened=withTimeout(10_000) {ready.await()}
        assertEquals(7,opened.sentences.size); assertTrue(repo.isDownloaded(story))
        withContext(Dispatchers.Main) {
            // Both callers get the story from the one download.
            assertEquals(2,calls); assertEquals(1,fixture.downloads)
            assertFalse(model.status.value.busy); assertNull(model.status.value.downloading)
        }
    }
    @Test fun readerRecreatedMidDownloadStillOpensTheStory()=runBlocking {
        val fixture=Fixture(); val repo=ContentRepository(context,fixture)
        repo.restore(); repo.refresh()
        val story=LearningContent.stories.single(); assertFalse(repo.isDownloaded(story))
        val app=InstrumentationRegistry.getInstrumentation().targetContext.applicationContext as android.app.Application
        val model=withContext(Dispatchers.Main) {ContentViewModel(app,repo)}
        withTimeout(10_000) {model.status.first {!it.busy && it.message.isNotEmpty()}}
        val gate=java.util.concurrent.CountDownLatch(1); fixture.downloadGate=gate
        val ready=kotlinx.coroutines.CompletableDeferred<Story>(); var stale=0
        // The first reader is disposed (rotation, or Back and Read again) while its download is held at the network.
        withContext(Dispatchers.Main) {model.download(story) {stale++}}
        withTimeout(10_000) {model.status.first {it.downloading==story.id}}
        withContext(Dispatchers.Main) {model.download(story) {ready.complete(it)}}
        gate.countDown()
        val opened=withTimeout(10_000) {ready.await()}
        assertEquals(7,opened.sentences.size); assertTrue(repo.isDownloaded(story))
        withContext(Dispatchers.Main) {
            assertEquals(1,stale); assertEquals(1,fixture.downloads)
            assertFalse(model.status.value.busy); assertNull(model.status.value.downloading)
            // A later reader for the same story is not left joined to the finished download.
            var again: Story?=null; model.download(story) {again=it}
            withTimeout(10_000) {model.status.first {!it.busy}}
            assertEquals(7,again?.sentences?.size)
        }
    }
    @Test fun sharedLinkToNewStoryWaitsForRunningRefresh()=runBlocking {
        val fixture=Fixture(); val gate=java.util.concurrent.CountDownLatch(1); fixture.gate=gate
        val app=InstrumentationRegistry.getInstrumentation().targetContext.applicationContext as android.app.Application
        val model=withContext(Dispatchers.Main) {ContentViewModel(app,ContentRepository(context,fixture))}
        // Ready comes from the cached catalog, which predates the shared story; the start-up refresh is held at the network.
        withTimeout(10_000) {model.ready.first {it}; model.status.first {it.busy}}
        assertFalse("remote-test" in LearningContent.storyById)
        val opened=async(Dispatchers.Main) {StoryLinks.resolve("remote-test",{it in LearningContent.storyById}) {model.awaitRefresh()}}
        kotlinx.coroutines.delay(200); assertFalse(opened.isCompleted)
        gate.countDown()
        assertTrue(withTimeout(10_000) {opened.await()})
        // One refresh reads the stories page and the empty page that ends pagination; a second refresh would make it 4.
        assertEquals(2,fixture.requests["stories"])
    }
    @Test fun sharedLinkRefreshesAFreshCatalogOnceAndFallsBackOffline()=runBlocking {
        val fixture=Fixture().apply {empty=true}
        val app=InstrumentationRegistry.getInstrumentation().targetContext.applicationContext as android.app.Application
        val model=withContext(Dispatchers.Main) {ContentViewModel(app,ContentRepository(context,fixture))}
        withTimeout(10_000) {model.status.first {!it.busy && it.message.isNotEmpty()}}
        fixture.fail=true
        assertFalse(withContext(Dispatchers.Main) {withTimeout(10_000) {StoryLinks.resolve("remote-test",{it in LearningContent.storyById}) {model.awaitRefresh()}}})
        fixture.fail=false; fixture.empty=false
        assertTrue(withContext(Dispatchers.Main) {withTimeout(10_000) {StoryLinks.resolve("remote-test",{it in LearningContent.storyById}) {model.awaitRefresh()}}})
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
}
