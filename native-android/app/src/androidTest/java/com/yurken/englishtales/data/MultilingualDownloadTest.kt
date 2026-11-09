package com.yurken.englishtales.data

import android.content.Context
import android.content.ContextWrapper
import android.content.res.Configuration
import android.graphics.Bitmap
import android.os.LocaleList
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

/** A published story that is not among the bundled 50, so only its downloaded file can translate it offline. */
class MultilingualDownloadTest {
    private val target get() = InstrumentationRegistry.getInstrumentation().targetContext
    private val directory by lazy { File(target.cacheDir, "language-downloads-${UUID.randomUUID()}").apply { mkdirs() } }
    private val saved get() = File(directory, "published-content")
    private fun context(tag: String, translation: String? = null): Context {
        val localized = target.createConfigurationContext(Configuration(target.resources.configuration).apply { setLocales(LocaleList.forLanguageTags(tag)) })
        return object : ContextWrapper(localized) {
            override fun getFilesDir() = directory
            override fun getSharedPreferences(name: String, mode: Int) =
                if (translation == null) super.getSharedPreferences(name, mode)
                else target.getSharedPreferences("${directory.name}-$name", mode)
        }.also { if (translation != null) check(TranslationLanguage.select(it, translation)) }
    }
    /** Initializes the bundled content in [tag] first, as the app does, so the repository reads that language. */
    private fun repository(tag: String, http: ContentHttp?, translation: String? = null): ContentRepository {
        val localized = context(tag, translation)
        LearningContent.initialize(localized)
        assertEquals(translation ?: tag, SupportLanguage.code)
        return ContentRepository(localized, http)
    }
    @Before fun useBundledFixture() { LearningContent.resetForTest(); LearningContent.initialize(target) }
    @After fun restoreLanguage() {
        target.getSharedPreferences("${directory.name}-app_language", Context.MODE_PRIVATE).edit().clear().commit()
        LearningContent.resetForTest(); LearningContent.initialize(target); directory.deleteRecursively()
    }

    private class Server : ContentHttp("https://example.invalid", "sb_publishable_test") {
        val cover = java.io.ByteArrayOutputStream().also { Bitmap.createBitmap(4, 4, Bitmap.Config.ARGB_8888).compress(Bitmap.CompressFormat.PNG, 100, it) }.toByteArray()
        val sha = MessageDigest.getInstance("SHA-256").digest(cover).joinToString("") { "%02x".format(it) }
        val revision = UUID.randomUUID().toString()
        val assetId = UUID.randomUUID().toString()
        /** Thai is not published for this story, so an older copy's Thai text must survive a re-download. */
        val served = SupportLanguage.enabled - "th"
        @Volatile var fail = false
        @Volatile var failSentences = false
        val requests = mutableMapOf<String, Int>()
        fun doc() = JSONObject().put("id", revision).put("story_id", STORY).put("title", "The Lighthouse Key").put("author", "English Tales")
            .put("level", "A2").put("genre", "Macera").put("description", "A key opens an old lighthouse.").put("published_at", "2026-10-20T00:00:00Z").put("cover_asset_id", assetId)
        fun asset() = JSONObject().put("id", assetId).put("kind", "cover").put("mime_type", "image/png").put("storage_path", "covers/lighthouse.png").put("byte_size", cover.size).put("sha256", sha)
        override fun bytes(path: String, maxBytes: Long): ByteArray {
            check(!fail) { "Simulated network failure" }
            if (path.startsWith("/storage/")) { requests["storage"] = (requests["storage"] ?: 0) + 1; return cover }
            val uri = android.net.Uri.parse("https://example.invalid$path")
            val table = uri.lastPathSegment!!
            if(table=="story_sentences" && failSentences) error("Temporary sentence request failure")
            val langs = uri.getQueryParameter("lang")?.let { if (it.startsWith("in.(")) it.removePrefix("in.(").removeSuffix(")").split(",") else listOf(it.removePrefix("eq.")) }
                ?.filter { it in served }.orEmpty()
            val rows = when (table) {
                "stories" -> listOf(JSONObject().put("id", STORY).put("current_revision_id", revision))
                "story_revisions" -> listOf(doc())
                "story_sentences" -> (1..2).map { JSONObject().put("revision_id", revision).put("id", "s-$it").put("position", it).put("english", ENGLISH[it - 1]).put("turkish", "[tr-legacy] cümle $it") }
                "revision_words" -> listOf(JSONObject().put("id", WORD).put("word", "lighthouse").put("translation", "deniz feneri").put("pronunciation", "lighthouse").put("example", ENGLISH[0]))
                "sentence_words" -> listOf(JSONObject().put("sentence_id", "s-1").put("word_id", WORD))
                "content_assets" -> listOf(asset())
                "sentence_translations" -> langs.flatMap { lang -> (1..2).map { JSONObject().put("sentence_id", "s-$it").put("lang", lang).put("text", sentence(lang, it)) } }
                "word_translations" -> langs.map { JSONObject().put("word_id", WORD).put("lang", it).put("translation", word(it)) }
                "revision_texts" -> langs.map { JSONObject().put("revision_id", revision).put("lang", it).put("description", description(it)) }
                else -> error("Unavailable table $table")
            }
            requests[table] = (requests[table] ?: 0) + 1
            val offset = uri.getQueryParameter("offset")!!.toInt()
            val limit = minOf(uri.getQueryParameter("limit")!!.toInt(), PAGE_SIZE)
            return JSONArray(rows.drop(offset).take(limit)).toString().toByteArray()
        }
    }

    private fun assertLanguage(lang: String, story: Story) {
        assertEquals(sentence(lang, 1), story.sentences[0].translation)
        assertEquals(sentence(lang, 2), story.sentences[1].translation)
        assertEquals(description(lang), story.description)
        assertEquals(word(lang), story.vocabulary!!.single().translation)
    }

    @Test fun englishUiUsesExplicitSpanishThenArabicFromTheSameOfflineDownload() = runBlocking {
        val server = Server()
        val spanish = repository("en", server, "es-419")
        spanish.restore(); spanish.refresh()
        assertLanguage("es-419", spanish.download(LearningContent.storyById.getValue(STORY)))
        server.fail = true
        LearningContent.resetForTest()
        val arabic = repository("en", null, "ar")
        arabic.restore()
        assertLanguage("ar", arabic.downloads().single { it.id == STORY })
        assertEquals("en", com.yurken.englishtales.AppLanguage.locale(context("en", "ar")).language)
    }

    @Test fun turkishDownloadOpensInSpanishAndArabicOfflineAfterRestarts() = runBlocking {
        val server = Server()
        val turkish = repository("tr", server); turkish.restore(); turkish.refresh()
        assertFalse(STORY in LearningContent.bundledStories.map { it.id })
        val downloaded = turkish.download(LearningContent.storyById.getValue(STORY))
        assertLanguage("tr", downloaded)
        // One download stores every published language, so no later switch needs the network.
        val file = JSONObject(File(saved, "${server.revision}.json").readText())
        for (lang in server.served) assertEquals(sentence(lang, 2), file.getJSONArray("sentences").getJSONObject(1).getJSONObject("translations").getString(lang))
        server.fail = true
        for (lang in listOf("es-419", "ar", "tr", "ar")) {
            val restarted = repository(lang, server); restarted.restore()
            val story = restarted.downloads().single()
            assertTrue(restarted.isDownloaded(story))
            assertLanguage(lang, story)
            assertLanguage(lang, LearningContent.storyById.getValue(STORY))
            // Reopening a complete download returns it without the (offline) network.
            assertLanguage(lang, restarted.download(story))
        }
        assertEquals(1, server.requests["storage"])
    }

    /** What the previous release stored: only the language selected when downloading, plus an older Thai text. */
    private fun writeLegacyTurkishDownload(server: Server) {
        saved.mkdirs()
        fun translations(tr: String, th: String) = JSONObject().put("tr", tr).put("th", th)
        val sentences = JSONArray((1..2).map { JSONObject().put("revision_id", server.revision).put("id", "s-$it").put("position", it).put("english", ENGLISH[it - 1])
            .put("turkish", "[tr-legacy] cümle $it").put("translations", translations(sentence("tr", it), sentence("th", it))) })
        val words = JSONArray().put(JSONObject().put("id", WORD).put("word", "lighthouse").put("translation", "deniz feneri").put("pronunciation", "lighthouse")
            .put("example", ENGLISH[0]).put("translations", translations(word("tr"), word("th"))))
        val doc = server.doc().put("sentences", sentences).put("words", words).put("links", JSONArray().put(JSONObject().put("sentence_id", "s-1").put("word_id", WORD)))
            .put("descriptions", translations(description("tr"), description("th"))).put("cover", server.asset())
        File(saved, "${server.revision}.json").writeText(doc.toString())
        File(saved, "${server.revision}.cover").writeBytes(server.cover)
    }

    @Test fun legacyPartialDownloadIsRepairedOnlineKeepingItsLanguagesAndCover() = runBlocking {
        val server = Server(); writeLegacyTurkishDownload(server)
        val spanish = repository("es-419", server); spanish.restore()
        // Before repair the missing Spanish lines stay English rather than borrowing another language.
        assertEquals(ENGLISH[0], spanish.downloads().single().sentences[0].translation)
        assertTrue(spanish.needsLanguageRepair(spanish.downloads().single()))
        spanish.refresh()
        assertFalse(spanish.needsLanguageRepair(spanish.downloads().single()))
        assertLanguage("es-419", spanish.downloads().single())
        assertLanguage("es-419", LearningContent.storyById.getValue(STORY))
        assertNull("the verified saved cover is reused", server.requests["storage"])
        val file = JSONObject(File(saved, "${server.revision}.json").readText())
        val translations = file.getJSONArray("sentences").getJSONObject(0).getJSONObject("translations")
        assertEquals(sentence("th", 1), translations.getString("th"))
        assertEquals(sentence("ar", 1), translations.getString("ar"))
        assertEquals(description("th"), file.getJSONObject("descriptions").getString("th"))
        assertArrayEquals(server.cover, File(saved, "${server.revision}.cover").readBytes())
        // A repaired download needs no further requests, even after a restart.
        val requests = server.requests.toMap(); spanish.refresh()
        assertEquals(requests["story_sentences"], server.requests["story_sentences"])
        server.fail = true
        for (lang in listOf("ar", "th", "tr")) {
            val restarted = repository(lang, server); restarted.restore()
            assertLanguage(lang, restarted.downloads().single())
        }
    }

    @Test fun offlinePartialDownloadStaysUsableAndReportsItIsIncomplete() = runBlocking {
        val server = Server(); writeLegacyTurkishDownload(server)
        val textBytes = File(saved, "${server.revision}.json").readBytes()
        server.fail = true
        val arabic = repository("ar", server); arabic.restore()
        val story = arabic.downloads().single()
        val failure = runCatching { arabic.download(story) }.exceptionOrNull()
        assertTrue("$failure", failure is IncompleteDownloadException)
        assertSame(story, (failure as IncompleteDownloadException).story)
        assertTrue(arabic.isDownloaded(story))
        assertArrayEquals(textBytes, File(saved, "${server.revision}.json").readBytes())
        assertArrayEquals(server.cover, File(saved, "${server.revision}.cover").readBytes())
        // Once online, the learner's download completes the Arabic text in place.
        server.fail = false
        assertLanguage("ar", arabic.download(story))
        assertTrue(arabic.isDownloaded(story))
        server.fail = true
        val restarted = repository("ar", server); restarted.restore()
        assertLanguage("ar", restarted.downloads().single())
    }

    @Test fun missingDescriptionTriggersRepairEvenWhenAllSentencesAndWordsAreTranslated() = runBlocking {
        val server=Server()
        val tr=repository("tr",server);tr.restore();tr.refresh()
        tr.download(LearningContent.storyById.getValue(STORY))
        val file=File(saved,"${server.revision}.json")
        val doc=JSONObject(file.readText())
        doc.getJSONObject("descriptions").remove("es-419")
        file.writeText(doc.toString())
        val es=repository("es-419",server);es.restore()
        es.refresh()
        assertLanguage("es-419",es.downloads().single())
    }

    @Test fun transientFailedRepairCanSucceedOnNextRefreshWithoutRestart() = runBlocking {
        val server=Server();writeLegacyTurkishDownload(server)
        val es=repository("es-419",server);es.restore()
        // The metadata refresh works, but this story's sentence download temporarily fails.
        server.failSentences=true
        es.refresh()
        assertEquals(ENGLISH[0],es.downloads().single().sentences[0].translation)
        server.failSentences=false
        es.refresh()
        assertLanguage("es-419",es.downloads().single())
    }

    private companion object {
        const val STORY = "lighthouse-key-unbundled"
        const val WORD = "lighthouse-key-lighthouse"
        const val PAGE_SIZE = 1000
        val ENGLISH = listOf("The lighthouse was quiet.", "Mia found a small key.")
        fun sentence(lang: String, n: Int) = "[$lang] sentence $n"
        fun word(lang: String) = "[$lang] lighthouse"
        fun description(lang: String) = "[$lang] description"
    }
}
