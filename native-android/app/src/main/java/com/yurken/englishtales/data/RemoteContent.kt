package com.yurken.englishtales.data

import com.yurken.englishtales.R
import android.app.Application
import android.content.Context
import android.util.AtomicFile
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.yurken.englishtales.BuildConfig
import kotlinx.coroutines.Dispatchers
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

data class ContentStatus(val busy: Boolean = false, val message: String = "", val downloading: String? = null)

/** One finished content action, so the UI can confirm it or say clearly that it failed. */
data class ContentEvent(val success: Boolean, val message: String)

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
    fun rows(table: String, query: String, pageSize: Int = 5): JSONArray {
        val all = JSONArray(); var offset = 0
        // A small default page also exercises pagination with the initial six stories.
        while (true) {
            val page = JSONArray(String(bytes("/rest/v1/$table?$query&limit=$pageSize&offset=$offset", 2_000_000), Charsets.UTF_8))
            for (i in 0 until page.length()) all.put(page.getJSONObject(i))
            if (page.length() == 0) return all
            offset += page.length()
            require(offset <= 20_000) { "Katalog sınırı aşıldı." }
        }
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
            StoryQuestion.parse(doc.optJSONArray("questions")), StoryTag.parse(doc.optJSONArray("tags")))
    }
    fun verify(bytes: ByteArray, asset: JSONObject) {
        require(bytes.size.toLong() == asset.getLong("byte_size")) { "İndirilen dosya eksik." }
        val sha = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
        require(sha == asset.getString("sha256")) { "İndirilen dosya doğrulanamadı." }
    }
}

class ContentRepository(context: Context, private val http: ContentHttp?) {
    private val directory = File(context.filesDir, "published-content").apply { mkdirs() }
    private val index = AtomicFile(File(directory, "catalog.json"))
    private val lock = Mutex()
    private val bundled = LearningContent.bundledStories.associateBy { it.revisionId }
    private val bundledByStory = LearningContent.bundledStories.associateBy { it.id }
    /** Newer published revisions (immutable) whose text and cover match the bundled story; they still open offline. */
    private val bundledTextIndex = AtomicFile(File(directory, "bundled-text.index"))
    private val bundledText = mutableMapOf<String, String>()
    private fun fingerprint(story: Story) = MessageDigest.getInstance("SHA-256")
        .digest(story.sentences.toString().toByteArray(Charsets.UTF_8))
        .joinToString("") { "%02x".format(it) }
    private var metadata = JSONArray()
    private var hasRemoteCatalog = false
    private val downloaded = mutableMapOf<String, Story>()
    private val historical = mutableMapOf<String, Story>()
    private fun atomic(file: AtomicFile, bytes: ByteArray) {
        val output = file.startWrite()
        try { output.write(bytes); file.finishWrite(output) } catch (failure: Throwable) { file.failWrite(output); throw failure }
    }
    private fun read(file: AtomicFile) = file.openRead().use { String(it.readBytes(), Charsets.UTF_8) }
    suspend fun restore() = lock.withLock {
        withContext(Dispatchers.IO) {
            runCatching {
                val candidate = JSONArray(read(index))
                for (i in 0 until candidate.length()) ContentCodec.story(candidate.getJSONObject(i))
                metadata = candidate; hasRemoteCatalog = true
            }
            runCatching {
                val saved = JSONObject(read(bundledTextIndex))
                for (key in saved.keys()) bundledText[UUID.fromString(key).toString()] = saved.getString(key)
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
                    require(story.sentences.isNotEmpty()); downloaded[story.revisionId] = story
                }
            }
            directory.listFiles().orEmpty().filter {it.name.endsWith(".cover") && it.name.removeSuffix(".cover") !in downloaded}.forEach {it.delete()}
        }
        publish()
    }
    private suspend fun publish() {
        // Parsing every catalog document is heavy for a large catalog; only the install touches the UI thread.
        val stories = if (!hasRemoteCatalog) null else withContext(Dispatchers.Default) {
            (0 until metadata.length()).map { i ->
                val doc = metadata.getJSONObject(i); val revision = doc.getString("id")
                val remote = ContentCodec.story(doc)
                downloaded[revision]?.let { it.copy(addedAt=remote.addedAt,tags=it.tags.ifEmpty { remote.tags }) }
                    ?: (bundled[revision] ?: bundledByStory[remote.id]?.takeIf { bundledText[revision] == fingerprint(it) })
                        ?.let { bundled -> remote.copy(sentences=bundled.sentences,coverKey=bundled.coverKey,vocabulary=null,sentenceWordIds=null,questions=bundled.questions,tags=remote.tags.ifEmpty { bundled.tags }) }
                    ?: remote
            }
        }
        val retained = historical.values.toList()
        withContext(Dispatchers.Main) {
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
    }
    private fun matchBundledText(remote: ContentHttp, catalog: JSONArray) {
        val docs = (0 until catalog.length()).map { catalog.getJSONObject(it) }
        val current = docs.map { it.getString("id") }.toSet()
        var changed = bundledText.keys.retainAll(current)
        val candidates = docs.filter { doc -> val revision = doc.getString("id")
            revision !in downloaded && revision !in bundled && revision !in bundledText && doc.getString("story_id") in bundledByStory }
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
                if (sameCover && sentences[revision] == story.sentences) { bundledText[revision] = fingerprint(story); changed = true }
            }
        }
        if (changed) atomic(bundledTextIndex, JSONObject().apply { bundledText.forEach { (revision, text) -> put(revision, text) } }.toString().toByteArray(Charsets.UTF_8))
    }
    /** Tag ids in vocabulary order with their names; empty on servers without tag tables (Q4.5). */
    private fun tagVocabulary(remote: ContentHttp, lang: String): List<Pair<String, String>> {
        val order = remote.optionalRows("content_tags", "select=id,position&order=position.asc", 100) ?: return emptyList()
        val names = mutableMapOf<String, String>()
        for (code in listOf(SupportLanguage.DEFAULT, lang).distinct())
            remote.optionalRows("tag_names", "select=tag_id,name&lang=eq.$code&order=tag_id.asc", 100)?.forEachObject { names[it.getString("tag_id")] = it.getString("name") }
        return (0 until order.length()).map { order.getJSONObject(it).getString("id").let { id -> id to (names[id] ?: id) } }
    }
    /** Stores each revision's tags as `[{id, name}]` in vocabulary order, so caches and downloads keep them offline. */
    private fun attachTags(remote: ContentHttp, vocabulary: List<Pair<String, String>>, revisions: List<String>, doc: (String) -> JSONObject?) {
        if (vocabulary.isEmpty()) return
        val rows = remote.optionalRows("revision_tags", "select=revision_id,tag_id&revision_id=in.(${revisions.joinToString(",")})&order=revision_id.asc,tag_id.asc", 1000) ?: return
        val byRevision = mutableMapOf<String, MutableSet<String>>()
        rows.forEachObject { byRevision.getOrPut(it.getString("revision_id")) { mutableSetOf() }.add(it.getString("tag_id")) }
        for (revision in revisions) doc(revision)?.put("tags", JSONArray().apply {
            vocabulary.filter { it.first in byRevision[revision].orEmpty() }.forEach { (id, name) -> put(JSONObject().put("id", id).put("name", name)) }
        })
    }
    /** Translation tables are newer than the first releases; until a server has them, the legacy Turkish columns are used. */
    private fun ContentHttp.optionalRows(table: String, query: String, pageSize: Int = 5) = runCatching { rows(table, query, pageSize) }.getOrNull()
    private fun JSONArray.forEachObject(action: (JSONObject) -> Unit) = (0 until length()).forEach { action(getJSONObject(it)) }
    /** Stores each row's text as `translations.{lang}` on the matching item, which [ContentCodec] reads first. */
    private fun attach(items: JSONArray, rows: JSONArray, key: String, field: String, lang: String) {
        val byId = mutableMapOf<String, String>()
        rows.forEachObject { byId[it.getString(key)] = it.getString(field) }
        items.forEachObject { item -> byId[item.getString("id")]?.let { item.put("translations", JSONObject().put(lang, it)) } }
    }
    fun isDownloaded(story: Story) = story.revisionId in downloaded
    fun downloads(): List<Story> = downloaded.values.distinctBy {it.id}.sortedBy {it.title}
    suspend fun download(story: Story): Story = lock.withLock {
        downloaded[story.revisionId]?.let { return@withLock it }
        val remote = checkNotNull(http) { "İçerik bağlantısı yapılandırılmadı." }
        val result = withContext(Dispatchers.IO) {
            val revision = UUID.fromString(story.revisionId).toString()
            val rows = remote.rows("story_revisions", "select=*&id=eq.$revision&published_at=not.is.null&order=id.asc")
            require(rows.length() == 1) { "Hikâye şu anda indirilemiyor." }
            val doc = rows.getJSONObject(0)
            val lang = SupportLanguage.code
            val sentences = remote.rows("story_sentences", "select=*&revision_id=eq.$revision&order=position.asc")
            val words = remote.rows("revision_words", "select=*&revision_id=eq.$revision&order=id.asc")
            remote.optionalRows("sentence_translations", "select=sentence_id,text&revision_id=eq.$revision&lang=eq.$lang&order=sentence_id.asc")
                ?.let { attach(sentences, it, "sentence_id", "text", lang) }
            remote.optionalRows("word_translations", "select=word_id,translation&revision_id=eq.$revision&lang=eq.$lang&order=word_id.asc")
                ?.let { attach(words, it, "word_id", "translation", lang) }
            remote.optionalRows("revision_texts", "select=revision_id,description&revision_id=eq.$revision&lang=eq.$lang&order=revision_id.asc")
                ?.forEachObject { doc.put("descriptions", JSONObject().put(lang, it.getString("description"))) }
            doc.put("sentences", sentences)
            doc.put("words", words)
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
            val cover = remote.bytes("/storage/v1/object/authenticated/story-media/" + path.split('/').joinToString("/") { URLEncoder.encode(it, "UTF-8").replace("+", "%20") }, 6_291_456)
            ContentCodec.verify(cover, asset)
            val imageBounds = android.graphics.BitmapFactory.Options().apply { inJustDecodeBounds = true }
            android.graphics.BitmapFactory.decodeByteArray(cover,0,cover.size,imageBounds)
            require(imageBounds.outWidth in 1..4096 && imageBounds.outHeight in 1..4096) { "Kapak dosyası geçersiz." }
            doc.put("cover", asset)
            val target = File(directory, "$revision.cover")
            val parsed = ContentCodec.story(doc, target.absolutePath)
            require(parsed.id == story.id && parsed.sentences.isNotEmpty())
            require(directory.listFiles().orEmpty().sumOf { it.length() } + cover.size + doc.toString().length < 100_000_000) { "İndirme alanı dolu. Bir hikâyenin indirmesini kaldır." }
            atomic(AtomicFile(target), cover)
            atomic(AtomicFile(File(directory, "$revision.json")), doc.toString().toByteArray(Charsets.UTF_8))
            parsed
        }
        downloaded[result.revisionId] = result; historical[result.revisionId] = result; publish(); result
    }
    suspend fun removeDownload(story: Story) = lock.withLock {
        // Keep the small text archive as the source for already learned vocabulary.
        withContext(Dispatchers.IO) {
            downloaded.values.filter { it.id == story.id }.forEach { saved ->
                require(!File(directory,"${saved.revisionId}.cover").exists() || File(directory,"${saved.revisionId}.cover").delete())
            }
        }
        downloaded.entries.removeAll {it.value.id == story.id}; publish()
    }
}

internal object ContentRefreshPolicy {
    const val MIN_INTERVAL_MILLIS = 15 * 60_000L
    /** A failed or never-run refresh is always stale, so the next return retries it. */
    fun isStale(lastSuccessAt: Long?, now: Long): Boolean = lastSuccessAt == null || now - lastSuccessAt >= MIN_INTERVAL_MILLIS || now < lastSuccessAt
}

class ContentViewModel(application: Application) : AndroidViewModel(application) {
    private fun text(@androidx.annotation.StringRes id: Int) = com.yurken.englishtales.AppLanguage.wrap(getApplication<Application>()).getString(id)
    private val http = if (BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_"))
        ContentHttp(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_PUBLISHABLE_KEY) else null
    val repository = ContentRepository(application, http)
    private val mutableStatus = MutableStateFlow(ContentStatus())
    val status = mutableStatus.asStateFlow()
    private val mutableReady = MutableStateFlow(false)
    val ready = mutableReady.asStateFlow()
    init { viewModelScope.launch { try {repository.restore()} finally {mutableReady.value=true}; refresh() } }
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
    fun refresh(userInitiated: Boolean = false) {
        if (mutableStatus.value.busy) return
        mutableStatus.value = ContentStatus(busy = true, message = text(R.string.content_message_refreshing))
        viewModelScope.launch {
            try { repository.refresh(); lastRefreshAt = android.os.SystemClock.elapsedRealtime(); finish(ContentStatus(message = text(R.string.content_message_up_to_date)), true, userInitiated) }
            catch (_: Exception) { finish(ContentStatus(message = text(R.string.content_message_refresh_failed)), false, userInitiated) }
        }
    }
    fun download(story: Story, onReady: (Story) -> Unit = {}) {
        if (mutableStatus.value.busy) return
        mutableStatus.value = ContentStatus(true, text(R.string.content_message_downloading), story.id)
        viewModelScope.launch {
            try { val ready = repository.download(story); finish(ContentStatus(message = text(R.string.content_message_downloaded)), true); onReady(ready) }
            catch (_: Exception) { finish(ContentStatus(message = text(R.string.content_message_download_failed)), false) }
        }
    }
    fun removeDownload(story: Story) {
        if(mutableStatus.value.busy) return
        mutableStatus.value=ContentStatus(busy=true)
        viewModelScope.launch {
            try {repository.removeDownload(story);finish(ContentStatus(message=text(R.string.content_message_download_removed)),true)}
            catch (_: Exception) {finish(ContentStatus(message=text(R.string.content_message_remove_failed)),false)}
        }
    }
}
