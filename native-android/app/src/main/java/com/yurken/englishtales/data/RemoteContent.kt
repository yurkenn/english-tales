package com.yurken.englishtales.data

import com.yurken.englishtales.R
import android.app.Application
import android.content.Context
import android.util.AtomicFile
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.yurken.englishtales.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.MessageDigest
import java.util.UUID

data class ContentStatus(val busy: Boolean = false, val message: String = "", val downloading: String? = null, val failed: Boolean = false)

/** One finished content action, so the UI can confirm it or say clearly that it failed. */
data class ContentEvent(val success: Boolean, val message: String)

/** The saved download lacks the selected language and could not be completed; [story] is still readable (untranslated lines stay English). */
class IncompleteDownloadException(val story: Story, cause: Throwable) : Exception(cause)

/** Anonymous, read-only access. Only a publishable key is accepted, never a service key. */
open class ContentHttp(private val base: String, private val key: String) {
    init { require(base.startsWith("https://") && key.startsWith("sb_publishable_")) }
    open fun bytes(path: String, maxBytes: Long): ByteArray {
        val connection = URL(base.trimEnd('/') + path).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "GET"
            connection.connectTimeout = 15_000; connection.readTimeout = 30_000
            connection.instanceFollowRedirects = false
            connection.setRequestProperty("apikey", key)
            require(connection.responseCode == 200 || connection.responseCode == 206) { "İçerik servisine erişilemiyor (${connection.responseCode})." }
            require(connection.contentLengthLong <= maxBytes) { "İçerik boyutu sınırı aşıldı." }
            return connection.inputStream.use { input ->
                val output = java.io.ByteArrayOutputStream()
                val buffer = ByteArray(8192)
                while (true) {
                    val size = input.read(buffer); if (size < 0) break
                    require(output.size().toLong() + size <= maxBytes) { "İçerik boyutu sınırı aşıldı." }
                    output.write(buffer, 0, size)
                }
                output.toByteArray()
            }
        } finally { connection.disconnect() }
    }
    /** Only an empty page ends the table, so a server that caps pages below [pageSize] still returns every row. */
    fun rows(table: String, query: String, pageSize: Int = PAGE_SIZE): JSONArray {
        val all = JSONArray(); var offset = 0
        while (true) {
            val page = JSONArray(String(bytes("/rest/v1/$table?$query&limit=$pageSize&offset=$offset", 2_000_000), Charsets.UTF_8))
            for (i in 0 until page.length()) all.put(page.getJSONObject(i))
            if (page.length() == 0) return all
            offset += page.length()
            require(offset <= 20_000) { "Katalog sınırı aşıldı." }
        }
    }
    companion object {
        /** PostgREST `max_rows` (backend/supabase/config.toml, also the hosted default); a larger page gains nothing. */
        const val PAGE_SIZE = 1000
    }
}

object ContentCodec {
    fun story(doc: JSONObject, coverFile: String? = null): Story {
        require(!doc.has("published_at") || !doc.isNull("published_at")) { "Taslak içerik kullanılamaz." }
        val revision = UUID.fromString(doc.getString("id")).toString()
        val id = doc.getString("story_id")
        require(id.matches(Regex("[a-z0-9][a-z0-9_-]{0,79}")))
        require(doc.getString("level") in listOf("A1", "A2", "B1"))
        require(doc.getString("genre") in listOf("Günlük yaşam", "Macera", "Gizem"))
        require(doc.getString("title").isNotBlank())
        val sentences = doc.optJSONArray("sentences") ?: JSONArray()
        val parsed = (0 until sentences.length()).map { i -> sentences.getJSONObject(i).let {
            val translation = SupportLanguage.pick(it, "translations", "turkish")
            require(it.getString("english").isNotBlank() && translation.isNotBlank())
            StorySentence(it.getString("id"), it.getString("english"), translation)
        } }
        require(parsed.map { it.id }.distinct().size == parsed.size)
        val words = doc.optJSONArray("words") ?: JSONArray()
        val vocabulary = (0 until words.length()).map { i -> words.getJSONObject(i).let {
            val translation = SupportLanguage.pick(it, "translations", "translation")
            require(translation.isNotBlank())
            WordInfo(it.getString("id"), it.getString("word"), translation, it.getString("pronunciation"), it.getString("example"))
        } }
        require(vocabulary.map { it.id }.distinct().size == vocabulary.size)
        val links = doc.optJSONArray("links") ?: JSONArray()
        val mapping = mutableMapOf<String, MutableList<String>>()
        for (i in 0 until links.length()) links.getJSONObject(i).let {
            val sentence = it.getString("sentence_id"); val word = it.getString("word_id")
            require(parsed.any { s -> s.id == sentence } && vocabulary.any { w -> w.id == word })
            mapping.getOrPut(sentence) { mutableListOf() }.add(word)
        }
        // Copied from stories.created_at during refresh; absent in downloaded revision files and older caches.
        val addedAt = if (doc.isNull("story_created_at")) null
            else java.time.OffsetDateTime.parse(doc.getString("story_created_at")).toInstant()
        return Story(id, doc.getString("title"), doc.getString("author"), doc.getString("level"), doc.getString("genre"),
            SupportLanguage.pick(doc, "descriptions", "description"), "remote", parsed, revision, coverFile, vocabulary, mapping, addedAt,
            StoryQuestion.parse(doc.optJSONArray("questions")).ifEmpty { LearningContent.questionsForUnchangedSource(id, parsed) }, StoryTag.parse(doc.optJSONArray("tags")))
    }
    fun verify(bytes: ByteArray, asset: JSONObject) {
        require(bytes.size.toLong() == asset.getLong("byte_size")) { "İndirilen dosya eksik." }
        val sha = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
        require(sha == asset.getString("sha256")) { "İndirilen dosya doğrulanamadı." }
    }
}

class ContentRepository(context: Context, private val http: ContentHttp?) {
    private val language = SupportLanguage.code
    @Volatile private var incompleteDownloads = emptySet<String>()
    private val directory = File(context.filesDir, "published-content").apply { mkdirs() }
    private val index = AtomicFile(File(directory, "catalog.json"))
    private val lock = Mutex()
    private val bundled = LearningContent.bundledStories.associateBy { it.revisionId }
    private val bundledByStory = LearningContent.bundledStories.associateBy { it.id }
    /** Newer published revisions (immutable) whose text and cover match the bundled story; they still open offline. */
    private val bundledTextIndex = AtomicFile(File(directory, "bundled-text.index"))
    private val bundledText = mutableMapOf<String, String>()
    /** Revisions already checked and found to differ from the bundled story with this fingerprint, so refresh skips them. */
    private val bundledMismatchIndex = AtomicFile(File(directory, "bundled-mismatch.index"))
    private val bundledMismatch = mutableMapOf<String, String>()
    private fun fingerprint(story: Story) = MessageDigest.getInstance("SHA-256")
        .digest(story.sentences.map { it.id to it.english }.toString().toByteArray(Charsets.UTF_8))
        .joinToString("") { "%02x".format(it) }
    private var metadata = JSONArray()
    private var hasRemoteCatalog = false
    /** Replaced whole under [lock], never mutated: the UI reads it on Main without the lock (isDownloaded/downloads). */
    @Volatile private var downloaded: Map<String, Story> = emptyMap()
    private val historical = mutableMapOf<String, Story>()
    private fun atomic(file: AtomicFile, bytes: ByteArray) {
        val output = file.startWrite()
        try { output.write(bytes); file.finishWrite(output) } catch (failure: Throwable) { file.failWrite(output); throw failure }
    }
    private fun read(file: AtomicFile) = file.openRead().use { String(it.readBytes(), Charsets.UTF_8) }
    suspend fun restore() = lock.withLock {
        withContext(Dispatchers.IO) {
            val restored = mutableMapOf<String, Story>(); historical.clear(); bundledText.clear(); bundledMismatch.clear()
            metadata = JSONArray(); hasRemoteCatalog = false
            runCatching {
                val candidate = JSONArray(read(index))
                for (i in 0 until candidate.length()) ContentCodec.story(candidate.getJSONObject(i))
                metadata = candidate; hasRemoteCatalog = true
            }
            runCatching {
                val saved = JSONObject(read(bundledTextIndex))
                for (key in saved.keys()) bundledText[UUID.fromString(key).toString()] = saved.getString(key)
            }
            runCatching {
                val saved = JSONObject(read(bundledMismatchIndex))
                for (key in saved.keys()) bundledMismatch[UUID.fromString(key).toString()] = saved.getString(key)
            }
            directory.listFiles().orEmpty().filter { it.name.endsWith(".json") && it.name != "catalog.json" }.forEach { file ->
                runCatching {
                    val doc = JSONObject(read(AtomicFile(file)))
                    val revision = UUID.fromString(doc.getString("id")).toString()
                    val text = ContentCodec.story(doc)
                    require(text.sentences.isNotEmpty()); historical[revision] = text
                    val asset = doc.getJSONObject("cover")
                    val cover = File(directory, "$revision.cover")
                    ContentCodec.verify(cover.readBytes(), asset)
                    val story = ContentCodec.story(doc, cover.absolutePath)
                    require(story.sentences.isNotEmpty()); restored[story.revisionId] = story
                }
            }
            downloaded = restored
            incompleteDownloads = restored.keys.filterTo(mutableSetOf()) { revision -> savedDocument(revision)?.let { !complete(it, SupportLanguage.code) } == true }
            directory.listFiles().orEmpty().filter {it.name.endsWith(".cover") && it.name.removeSuffix(".cover") !in restored}.forEach {it.delete()}
        }
        publish()
    }
    private suspend fun publish() {
        if (language != SupportLanguage.code) return
        // Parsing every catalog document is heavy for a large catalog; only the install touches the UI thread.
        val stories = if (!hasRemoteCatalog) null else withContext(Dispatchers.Default) {
            (0 until metadata.length()).map { i ->
                val doc = metadata.getJSONObject(i); val revision = doc.getString("id")
                val remote = ContentCodec.story(doc)
                downloaded[revision]?.let { it.copy(addedAt=remote.addedAt,tags=it.tags.ifEmpty { remote.tags }) }
                    ?: (bundled[revision] ?: bundledByStory[remote.id]?.takeIf { bundledText[revision] == fingerprint(it) })
                        ?.let { bundled -> remote.copy(sentences=bundled.sentences,coverKey=bundled.coverKey,vocabulary=null,sentenceWordIds=null,questions=bundled.questions,tags=remote.tags.ifEmpty { bundled.tags }) }
                    // An edited bundled story keeps its bundled cover until the new revision is downloaded, instead of a blank tile.
                    ?: bundledByStory[remote.id]?.let { remote.copy(coverKey=it.coverKey) }
                    ?: remote
            }
        }
        val retained = historical.values.toList()
        withContext(Dispatchers.Main) {
            if (language != SupportLanguage.code) return@withContext
            retained.forEach(LearningContent::retain)
            if (stories != null) LearningContent.install(stories, retained.flatMap { it.vocabulary.orEmpty() })
        }
    }
    suspend fun refresh() = lock.withLock {
        val remote = checkNotNull(http) { "İçerik bağlantısı yapılandırılmadı." }
        val next = withContext(Dispatchers.IO) {
            val lang = SupportLanguage.code
            val stories = remote.rows("stories", "select=id,current_revision_id,created_at&order=id.asc")
            val result = JSONArray()
            val ids=(0 until stories.length()).map {UUID.fromString(stories.getJSONObject(it).getString("current_revision_id")).toString()}
            val revisionById=mutableMapOf<String,JSONObject>()
            val tagVocabulary=tagVocabulary(remote, lang)
            for(batch in ids.chunked(100)) {
                val revisions=remote.rows("story_revisions","select=*&id=in.(${batch.joinToString(",")})&published_at=not.is.null&order=id.asc")
                for(j in 0 until revisions.length()) revisions.getJSONObject(j).let {revisionById[it.getString("id")]=it}
                remote.optionalRows("revision_texts","select=revision_id,description&revision_id=in.(${batch.joinToString(",")})&lang=eq.$lang&order=revision_id.asc")
                    ?.forEachObject {revisionById[it.getString("revision_id")]?.put("descriptions",JSONObject().put(lang,it.getString("description")))}
                attachTags(remote, tagVocabulary, batch) { revisionById[it] }
            }
            for (i in 0 until stories.length()) {
                val row = stories.getJSONObject(i)
                val revision = UUID.fromString(row.getString("current_revision_id")).toString()
                val doc = checkNotNull(revisionById[revision]) { "Katalog değişti. Yeniden dene." }
                require(doc.getString("story_id") == row.getString("id"))
                doc.put("story_created_at", row.opt("created_at") ?: JSONObject.NULL); ContentCodec.story(doc)
                result.put(doc)
            }
            require((0 until result.length()).map {result.getJSONObject(it).getString("story_id")}.distinct().size==result.length()) {"Katalog değişti. Yeniden dene."}
            atomic(index, result.toString().toByteArray(Charsets.UTF_8))
            // Best effort: on failure these stories only need a download, as before.
            runCatching { matchBundledText(remote, result) }
            result
        }
        metadata = next; hasRemoteCatalog = true; publish()
        // Best effort: older downloads stored only the language selected at the time; online they gain the rest.
        repairDownloads(remote)
    }
    /** Revisions (per language) whose missing translations were already requested in this process, so refreshes do not refetch them. */
    private val repairAttempts = mutableSetOf<String>()
    private fun savedDocument(revision: String) = runCatching { JSONObject(read(AtomicFile(File(directory, "$revision.json")))) }.getOrNull()
    /** True when every sentence and word has a real [lang] translation instead of the English fallback. */
    private fun complete(doc: JSONObject, lang: String): Boolean {
        if (lang == SupportLanguage.DEFAULT) return true
        fun covered(items: JSONArray?, legacy: String) = items == null || (0 until items.length()).all { i -> items.getJSONObject(i).let {
            it.optJSONObject("translations")?.optString(lang)?.isNotBlank() == true || ContentTranslations.pick(it, "translations", legacy, lang) != null } }
        val description = doc.optJSONObject("descriptions")?.optString(lang)?.isNotBlank() == true ||
            ContentTranslations.pick(doc, "descriptions", "description", lang) != null
        return description && covered(doc.optJSONArray("sentences"), "turkish") && covered(doc.optJSONArray("words"), "translation")
    }
    private suspend fun repairDownloads(remote: ContentHttp) {
        val lang = SupportLanguage.code
        if (lang == SupportLanguage.DEFAULT) return
        val partial = withContext(Dispatchers.IO) {
            downloaded.values.filter { "$lang/${it.revisionId}" !in repairAttempts && savedDocument(it.revisionId)?.let { doc -> !complete(doc, lang) } == true }
        }
        var repaired = false
        for (story in partial) {
            try {
                fetch(remote, story)
                repairAttempts += "$lang/${story.revisionId}"
                repaired = true
            } catch (cancelled: kotlinx.coroutines.CancellationException) { throw cancelled }
            catch (_: Exception) { /* A network failure must be retried on the next refresh. */ }
        }
        if (repaired) publish()
    }
    private fun matchBundledText(remote: ContentHttp, catalog: JSONArray) {
        val docs = (0 until catalog.length()).map { catalog.getJSONObject(it) }
        val current = docs.map { it.getString("id") }.toSet()
        var changed = bundledText.keys.retainAll(current)
        var missed = bundledMismatch.keys.retainAll(current)
        val candidates = docs.filter { doc -> val revision = doc.getString("id")
            revision !in downloaded && revision !in bundled && revision !in bundledText && doc.getString("story_id") in bundledByStory &&
                bundledMismatch[revision] != fingerprint(bundledByStory.getValue(doc.getString("story_id"))) }
        for (batch in candidates.chunked(50)) {
            val bundledIds = batch.map { ContentRevisionIds.bundled(it.getString("story_id")) }
            val covers = remote.rows("story_revisions", "select=id,cover_asset_id&id=in.(${bundledIds.joinToString(",")})&published_at=not.is.null&order=id.asc", 100)
            val coverByRevision = (0 until covers.length()).associate { covers.getJSONObject(it).let { row -> row.getString("id") to row.getString("cover_asset_id") } }
            val rows = remote.rows("story_sentences", "select=revision_id,id,english,turkish&revision_id=in.(${batch.joinToString(",") { it.getString("id") }})&order=revision_id.asc,position.asc", 1000)
            val sentences = (0 until rows.length()).map { rows.getJSONObject(it) }.groupBy({ it.getString("revision_id") }) {
                StorySentence(it.getString("id"), it.getString("english"), it.getString("turkish")) }
            for (doc in batch) {
                val revision = doc.getString("id"); val story = bundledByStory.getValue(doc.getString("story_id"))
                val sameCover = coverByRevision[ContentRevisionIds.bundled(story.id)]?.let { it == doc.optString("cover_asset_id") } == true
                if (sameCover && sentences[revision]?.map { it.id to it.english } == story.sentences.map { it.id to it.english }) {
                    bundledText[revision] = fingerprint(story); changed = true
                    if (bundledMismatch.remove(revision) != null) missed = true
                } else { bundledMismatch[revision] = fingerprint(story); missed = true }
            }
        }
        if (changed) atomic(bundledTextIndex, JSONObject().apply { bundledText.forEach { (revision, text) -> put(revision, text) } }.toString().toByteArray(Charsets.UTF_8))
        if (missed) atomic(bundledMismatchIndex, JSONObject().apply { bundledMismatch.forEach { (revision, text) -> put(revision, text) } }.toString().toByteArray(Charsets.UTF_8))
    }
    /** Tag ids in vocabulary order with their names; empty on servers without tag tables (Q4.5). */
    private fun tagVocabulary(remote: ContentHttp, lang: String): List<Pair<String, String>> {
        val order = remote.optionalRows("content_tags", "select=id,position&order=position.asc", 100) ?: return emptyList()
        val names = mutableMapOf<String, String>()
        for (code in listOf(SupportLanguage.DEFAULT, lang).distinct()) {
            if (code == lang && lang != SupportLanguage.DEFAULT)
                (0 until order.length()).forEach { i -> order.getJSONObject(i).getString("id").let { names[it] = ContentTranslations.tag(it, names[it] ?: it) } }
            remote.optionalRows("tag_names", "select=tag_id,name&lang=eq.$code&order=tag_id.asc", 100)?.forEachObject { names[it.getString("tag_id")] = it.getString("name") }
        }
        return (0 until order.length()).map { order.getJSONObject(it).getString("id").let { id -> id to (names[id] ?: id) } }
    }
    /** Stores each revision's tags as `[{id, name}]` in vocabulary order, so caches and downloads keep them offline. */
    private fun attachTags(remote: ContentHttp, vocabulary: List<Pair<String, String>>, revisions: List<String>, doc: (String) -> JSONObject?) {
        if (vocabulary.isEmpty()) return
        val rows = remote.optionalRows("revision_tags", "select=revision_id,tag_id&revision_id=in.(${revisions.joinToString(",")})&order=revision_id.asc,tag_id.asc", 1000) ?: return
        val byRevision = mutableMapOf<String, MutableSet<String>>()
        rows.forEachObject { byRevision.getOrPut(it.getString("revision_id")) { mutableSetOf() }.add(it.getString("tag_id")) }
        for (revision in revisions) doc(revision)?.put("tags", JSONArray().apply {
            vocabulary.filter { it.first in byRevision[revision].orEmpty() }.forEach { (id, name) -> put(JSONObject().put("id", id).put("name", name).put("lang", SupportLanguage.code)) }
        })
    }
    /** Translation tables are newer than the first releases; until a server has them, the legacy Turkish columns are used. */
    private fun ContentHttp.optionalRows(table: String, query: String, pageSize: Int = ContentHttp.PAGE_SIZE) = runCatching { rows(table, query, pageSize) }.getOrNull()
    private fun JSONArray.forEachObject(action: (JSONObject) -> Unit) = (0 until length()).forEach { action(getJSONObject(it)) }
    /**
     * A revision's rows for every enabled language, so a later language switch never needs the network. Pairs are
     * (language, rows); the language is null when each row carries its own `lang`. Servers rejecting the list filter
     * are asked once per language.
     */
    private fun ContentHttp.translations(table: String, select: String, revision: String, order: String): List<Pair<String?, JSONArray>> {
        val all = SupportLanguage.enabled
        optionalRows(table, "select=$select,lang&revision_id=eq.$revision&lang=in.(${all.joinToString(",")})&order=$order,lang.asc")
            ?.takeIf { rows -> (0 until rows.length()).all { rows.getJSONObject(it).optString("lang") in all } }?.let { return listOf(null to it) }
        return all.mapNotNull { lang -> optionalRows(table, "select=$select,lang&revision_id=eq.$revision&lang=eq.$lang&order=$order")?.let { lang to it } }
    }
    private fun JSONObject.map(key: String) = optJSONObject(key) ?: JSONObject().also { put(key, it) }
    /** Adds each row's text as `translations.{lang}` on the matching item, which [ContentCodec] reads first; other languages stay. */
    private fun attach(items: JSONArray, rows: JSONArray, key: String, field: String, lang: String?) {
        val byId = mutableMapOf<String, MutableMap<String, String>>()
        rows.forEachObject { byId.getOrPut(it.getString(key)) { mutableMapOf() }[lang ?: it.getString("lang")] = it.getString(field) }
        items.forEachObject { item -> byId[item.getString("id")]?.forEach { (code, text) -> item.map("translations").put(code, text) } }
    }
    /** A re-download keeps languages the earlier copy had for the same source text and this answer lacks, so none is lost. */
    private fun keepTranslations(previous: JSONObject, doc: JSONObject) {
        fun merge(old: JSONObject, item: JSONObject, key: String) {
            val saved = old.optJSONObject(key)?.takeIf { it.length() > 0 } ?: return
            val current = item.map(key)
            for (code in saved.keys()) if (current.optString(code).isBlank()) current.put(code, saved.getString(code))
        }
        fun mergeItems(key: String, source: String) {
            val old = previous.optJSONArray(key) ?: return
            val byId = (0 until old.length()).associate { old.getJSONObject(it).let { item -> item.optString("id") to item } }
            doc.optJSONArray(key)?.forEachObject { item ->
                byId[item.getString("id")]?.takeIf { it.optString(source) == item.optString(source) }?.let { merge(it, item, "translations") }
            }
        }
        mergeItems("sentences", "english"); mergeItems("words", "word")
        if (previous.optString("description") == doc.optString("description")) merge(previous, doc, "descriptions")
    }
    fun isDownloaded(story: Story) = story.revisionId in downloaded
    fun needsLanguageRepair(story: Story) = story.revisionId in downloaded && story.revisionId in incompleteDownloads
    fun downloads(): List<Story> = downloaded.values.distinctBy {it.id}.sortedBy {it.title}
    /**
     * A saved download is returned as is when it covers the selected language; otherwise it is downloaded again with
     * every language. If that fails the saved copy stays untouched and comes back in [IncompleteDownloadException].
     */
    suspend fun download(story: Story): Story = lock.withLock {
        val lang = SupportLanguage.code
        downloaded[story.revisionId]?.let { saved ->
            if (withContext(Dispatchers.IO) { savedDocument(saved.revisionId)?.let { complete(it, lang) } != false }) return@withLock saved
            try { return@withLock fetch(checkNotNull(http) { "İçerik bağlantısı yapılandırılmadı." }, story).also {
                publish()
                if (needsLanguageRepair(it)) throw IncompleteDownloadException(it, IllegalStateException("Selected language unavailable"))
            } }
            catch (partial: IncompleteDownloadException) { throw partial }
            catch (cancelled: kotlinx.coroutines.CancellationException) { throw cancelled }
            catch (failure: Exception) { throw IncompleteDownloadException(saved, failure) }
        }
        val remote = checkNotNull(http) { "İçerik bağlantısı yapılandırılmadı." }
        fetch(remote, story).also {
            publish()
            if (needsLanguageRepair(it)) throw IncompleteDownloadException(it, IllegalStateException("Selected language unavailable"))
        }
    }
    /** Downloads [story] with every language under [lock]; the caller publishes. */
    private suspend fun fetch(remote: ContentHttp, story: Story): Story {
        val result = withContext(Dispatchers.IO) {
            val revision = UUID.fromString(story.revisionId).toString()
            val rows = remote.rows("story_revisions", "select=*&id=eq.$revision&published_at=not.is.null&order=id.asc")
            require(rows.length() == 1) { "Hikâye şu anda indirilemiyor." }
            val doc = rows.getJSONObject(0)
            val lang = SupportLanguage.code
            val sentences = remote.rows("story_sentences", "select=*&revision_id=eq.$revision&order=position.asc")
            val words = remote.rows("revision_words", "select=*&revision_id=eq.$revision&order=id.asc")
            remote.translations("sentence_translations", "sentence_id,text", revision, "sentence_id.asc")
                .forEach { (code, found) -> attach(sentences, found, "sentence_id", "text", code) }
            remote.translations("word_translations", "word_id,translation", revision, "word_id.asc")
                .forEach { (code, found) -> attach(words, found, "word_id", "translation", code) }
            remote.translations("revision_texts", "revision_id,description", revision, "revision_id.asc")
                .forEach { (code, found) -> found.forEachObject { doc.map("descriptions").put(code ?: it.getString("lang"), it.getString("description")) } }
            doc.put("sentences", sentences)
            doc.put("words", words)
            savedDocument(revision)?.let { keepTranslations(it, doc) }
            doc.put("links", remote.rows("sentence_words", "select=*&revision_id=eq.$revision&order=sentence_id.asc,word_id.asc"))
            // Comprehension questions are newer than the first servers; their absence never blocks a download.
            runCatching { remote.rows("story_questions", "select=id,position,kind,prompt,options,answer&revision_id=eq.$revision&order=position.asc") }
                .getOrNull()?.let { doc.put("questions", it) }
            attachTags(remote, tagVocabulary(remote, lang), listOf(revision)) { id -> doc.takeIf { id == revision } }
            val assetId = UUID.fromString(doc.getString("cover_asset_id")).toString()
            val assets = remote.rows("content_assets", "select=*&id=eq.$assetId&order=id.asc")
            require(assets.length() == 1)
            val asset = assets.getJSONObject(0)
            require(asset.getString("kind") == "cover" && asset.getString("mime_type").startsWith("image/"))
            val path = asset.getString("storage_path")
            require(!path.startsWith('/') && !path.contains("..") && !path.contains('\\'))
            val target = File(directory, "$revision.cover")
            val text = File(directory, "$revision.json")
            // Repairing a saved download's languages reuses its verified cover.
            val saved = target.takeIf { it.exists() }?.readBytes()?.takeIf { runCatching { ContentCodec.verify(it, asset) }.isSuccess }
            val cover = saved ?: remote.bytes("/storage/v1/object/authenticated/story-media/" + path.split('/').joinToString("/") { URLEncoder.encode(it, "UTF-8").replace("+", "%20") }, 6_291_456)
            ContentCodec.verify(cover, asset)
            val imageBounds = android.graphics.BitmapFactory.Options().apply { inJustDecodeBounds = true }
            android.graphics.BitmapFactory.decodeByteArray(cover,0,cover.size,imageBounds)
            require(imageBounds.outWidth in 1..4096 && imageBounds.outHeight in 1..4096) { "Kapak dosyası geçersiz." }
            doc.put("cover", asset)
            val parsed = ContentCodec.story(doc, target.absolutePath)
            require(parsed.id == story.id && parsed.sentences.isNotEmpty())
            val replaced = (if (saved != null) target.length() else 0L) + (if (text.exists()) text.length() else 0L)
            require(directory.listFiles().orEmpty().sumOf { it.length() } - replaced + cover.size + doc.toString().length < 100_000_000) { "İndirme alanı dolu. Bir hikâyenin indirmesini kaldır." }
            if (saved == null) atomic(AtomicFile(target), cover)
            atomic(AtomicFile(text), doc.toString().toByteArray(Charsets.UTF_8))
            parsed
        }
        downloaded = downloaded + (result.revisionId to result)
        historical[result.revisionId] = result
        val complete = withContext(Dispatchers.IO) { savedDocument(result.revisionId)?.let { complete(it, SupportLanguage.code) } == true }
        incompleteDownloads = if (complete) incompleteDownloads - result.revisionId else incompleteDownloads + result.revisionId
        return result
    }
    suspend fun removeDownload(story: Story) = lock.withLock {
        // Keep the small text archive as the source for already learned vocabulary.
        withContext(Dispatchers.IO) {
            downloaded.values.filter { it.id == story.id }.forEach { saved ->
                require(!File(directory,"${saved.revisionId}.cover").exists() || File(directory,"${saved.revisionId}.cover").delete())
            }
        }
        downloaded = downloaded.filterValues {it.id != story.id}; publish()
    }
}

internal object ContentRefreshPolicy {
    const val MIN_INTERVAL_MILLIS = 15 * 60_000L
    /** A failed or never-run refresh is always stale, so the next return retries it. */
    fun isStale(lastSuccessAt: Long?, now: Long): Boolean = lastSuccessAt == null || now - lastSuccessAt >= MIN_INTERVAL_MILLIS || now < lastSuccessAt
}

class ContentViewModel internal constructor(application: Application, val repository: ContentRepository) : AndroidViewModel(application) {
    constructor(application: Application) : this(application, ContentRepository(application,
        if (BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_"))
            ContentHttp(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_PUBLISHABLE_KEY) else null))
    private fun text(@androidx.annotation.StringRes id: Int) = com.yurken.englishtales.AppLanguage.wrap(getApplication<Application>()).getString(id)
    private val mutableStatus = MutableStateFlow(ContentStatus())
    val status = mutableStatus.asStateFlow()
    private val mutableReady = MutableStateFlow(false)
    val ready = mutableReady.asStateFlow()
    init { viewModelScope.launch { try {repository.restore()} finally {mutableReady.value=true}; refresh() } }
    /** A retained language-specific ViewModel restores raw documents again when its screen returns. */
    fun restoreLanguage() {
        viewModelScope.launch { repository.restore(); refreshIfStale() }
    }
    private val mutableEvents = MutableSharedFlow<ContentEvent>(extraBufferCapacity = 4)
    /** Outcomes of downloads, removals and refreshes the learner asked for; background refreshes stay silent. */
    val events = mutableEvents.asSharedFlow()
    private fun finish(status: ContentStatus, success: Boolean, announce: Boolean = true) {
        mutableStatus.value = status
        if (announce) mutableEvents.tryEmit(ContentEvent(success, status.message))
    }
    private var lastRefreshAt: Long? = null
    /** Returning to the app refreshes the catalog at most every [ContentRefreshPolicy.MIN_INTERVAL_MILLIS]. */
    fun refreshIfStale(now: Long = android.os.SystemClock.elapsedRealtime()) {
        if (ContentRefreshPolicy.isStale(lastRefreshAt, now)) refresh()
    }
    private var refreshing = false
    /** A download queued behind this refresh owns the status, so the refresh only announces its outcome. */
    private fun finishRefresh(status: ContentStatus, success: Boolean, announce: Boolean) {
        refreshing = false
        if (mutableStatus.value.downloading == null) finish(status, success, announce)
        else if (announce) mutableEvents.tryEmit(ContentEvent(success, status.message))
    }
    private var refreshJob: Job? = null
    /** Waits for the running refresh, or runs one now; a shared link to a just-published story needs the newest catalog. */
    suspend fun awaitRefresh() { (refreshJob?.takeIf { it.isActive } ?: run { refresh(); refreshJob?.takeIf { it.isActive } })?.join() }
    fun refresh(userInitiated: Boolean = false) {
        if (mutableStatus.value.busy) return
        refreshing = true
        mutableStatus.value = ContentStatus(busy = true, message = text(R.string.content_message_refreshing))
        refreshJob = viewModelScope.launch {
            try { repository.refresh(); lastRefreshAt = android.os.SystemClock.elapsedRealtime(); finishRefresh(ContentStatus(message = text(R.string.content_message_up_to_date)), true, userInitiated) }
            catch (_: Exception) { finishRefresh(ContentStatus(message = text(R.string.content_message_refresh_failed), failed = true), false, userInitiated) }
        }
    }
    /** Callers waiting on the running download, by revision; a reader recreated mid-download joins instead of being dropped. */
    private val waiting = mutableMapOf<String, MutableList<(Story) -> Unit>>()
    /** Waits behind a running refresh (the repository lock serialises them); one download runs at a time. */
    fun download(story: Story, onReady: (Story) -> Unit = {}) {
        waiting[story.revisionId]?.let { it += onReady; return }
        val current = mutableStatus.value
        if (current.downloading != null || (current.busy && !refreshing)) return
        mutableStatus.value = ContentStatus(true, text(R.string.content_message_downloading), story.id)
        val callbacks = mutableListOf(onReady).also { waiting[story.revisionId] = it }
        viewModelScope.launch {
            try { val ready = try { repository.download(story) } finally { waiting.remove(story.revisionId) }
                finish(ContentStatus(message = text(R.string.content_message_downloaded)), true); callbacks.forEach { it(ready) } }
            // The saved copy still opens, but the failure is reported instead of claiming the language is ready offline.
            catch (partial: IncompleteDownloadException) { finish(ContentStatus(message = text(R.string.content_message_language_incomplete), failed = true), false); callbacks.forEach { it(partial.story) } }
            catch (_: Exception) { finish(ContentStatus(message = text(R.string.content_message_download_failed), failed = true), false) }
        }
    }
    fun removeDownload(story: Story) {
        if(mutableStatus.value.busy) return
        mutableStatus.value=ContentStatus(busy=true)
        viewModelScope.launch {
            try {repository.removeDownload(story);finish(ContentStatus(message=text(R.string.content_message_download_removed)),true)}
            catch (_: Exception) {finish(ContentStatus(message=text(R.string.content_message_remove_failed),failed=true),false)}
        }
    }
}
