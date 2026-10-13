package com.yurken.englishtales.data

import android.app.Application
import android.content.Context
import android.util.AtomicFile
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.yurken.englishtales.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
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
    fun rows(table: String, query: String): JSONArray {
        val all = JSONArray(); var offset = 0
        // A small page also exercises pagination with the initial six stories.
        while (true) {
            val page = JSONArray(String(bytes("/rest/v1/$table?$query&limit=5&offset=$offset", 2_000_000), Charsets.UTF_8))
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
            require(it.getString("english").isNotBlank() && it.getString("turkish").isNotBlank())
            StorySentence(it.getString("id"), it.getString("english"), it.getString("turkish"))
        } }
        require(parsed.map { it.id }.distinct().size == parsed.size)
        val words = doc.optJSONArray("words") ?: JSONArray()
        val vocabulary = (0 until words.length()).map { i -> words.getJSONObject(i).let {
            WordInfo(it.getString("id"), it.getString("word"), it.getString("translation"), it.getString("pronunciation"), it.getString("example"))
        } }
        require(vocabulary.map { it.id }.distinct().size == vocabulary.size)
        val links = doc.optJSONArray("links") ?: JSONArray()
        val mapping = mutableMapOf<String, MutableList<String>>()
        for (i in 0 until links.length()) links.getJSONObject(i).let {
            val sentence = it.getString("sentence_id"); val word = it.getString("word_id")
            require(parsed.any { s -> s.id == sentence } && vocabulary.any { w -> w.id == word })
            mapping.getOrPut(sentence) { mutableListOf() }.add(word)
        }
        return Story(id, doc.getString("title"), doc.getString("author"), doc.getString("level"), doc.getString("genre"),
            doc.getString("description"), "remote", parsed, revision, coverFile, vocabulary, mapping)
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
    private val bundled = LearningContent.stories.associateBy { it.revisionId }
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
    private suspend fun publish() = withContext(Dispatchers.Main) {
        historical.values.forEach(LearningContent::retain)
        if (hasRemoteCatalog) {
            val stories = (0 until metadata.length()).map { i ->
                val doc = metadata.getJSONObject(i); val revision = doc.getString("id")
                downloaded[revision] ?: ContentCodec.story(doc).let { remote ->
                    bundled[revision]?.let { bundled -> remote.copy(sentences=bundled.sentences,coverKey=bundled.coverKey,vocabulary=null,sentenceWordIds=null) } ?: remote
                }
            }
            LearningContent.install(stories, historical.values.flatMap { it.vocabulary.orEmpty() })
        }
    }
    suspend fun refresh() = lock.withLock {
        val remote = checkNotNull(http) { "İçerik bağlantısı yapılandırılmadı." }
        val next = withContext(Dispatchers.IO) {
            val stories = remote.rows("stories", "select=id,current_revision_id&order=id.asc")
            val result = JSONArray()
            val ids=(0 until stories.length()).map {UUID.fromString(stories.getJSONObject(it).getString("current_revision_id")).toString()}
            val revisionById=mutableMapOf<String,JSONObject>()
            for(batch in ids.chunked(100)) {
                val revisions=remote.rows("story_revisions","select=*&id=in.(${batch.joinToString(",")})&published_at=not.is.null&order=id.asc")
                for(j in 0 until revisions.length()) revisions.getJSONObject(j).let {revisionById[it.getString("id")]=it}
            }
            for (i in 0 until stories.length()) {
                val row = stories.getJSONObject(i)
                val revision = UUID.fromString(row.getString("current_revision_id")).toString()
                val doc = checkNotNull(revisionById[revision]) { "Katalog değişti. Yeniden dene." }
                require(doc.getString("story_id") == row.getString("id")); ContentCodec.story(doc)
                result.put(doc)
            }
            require((0 until result.length()).map {result.getJSONObject(it).getString("story_id")}.distinct().size==result.length()) {"Katalog değişti. Yeniden dene."}
            atomic(index, result.toString().toByteArray(Charsets.UTF_8))
            result
        }
        metadata = next; hasRemoteCatalog = true; publish()
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
            doc.put("sentences", remote.rows("story_sentences", "select=*&revision_id=eq.$revision&order=position.asc"))
            doc.put("words", remote.rows("revision_words", "select=*&revision_id=eq.$revision&order=id.asc"))
            doc.put("links", remote.rows("sentence_words", "select=*&revision_id=eq.$revision&order=sentence_id.asc,word_id.asc"))
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

class ContentViewModel(application: Application) : AndroidViewModel(application) {
    private val http = if (BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_"))
        ContentHttp(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_PUBLISHABLE_KEY) else null
    val repository = ContentRepository(application, http)
    private val mutableStatus = MutableStateFlow(ContentStatus())
    val status = mutableStatus.asStateFlow()
    private val mutableReady = MutableStateFlow(false)
    val ready = mutableReady.asStateFlow()
    init { viewModelScope.launch { try {repository.restore()} finally {mutableReady.value=true}; refresh() } }
    fun refresh() {
        if (mutableStatus.value.busy) return
        mutableStatus.value = ContentStatus(busy = true, message = "Hikâyeler güncelleniyor…")
        viewModelScope.launch {
            mutableStatus.value = try { repository.refresh(); ContentStatus(message = "Hikâyeler güncel") }
            catch (_: Exception) { ContentStatus(message = "Güncelleme yapılamadı. Cihazdaki hikâyeler kullanılabilir.") }
        }
    }
    fun download(story: Story, onReady: (Story) -> Unit = {}) {
        if (mutableStatus.value.busy) return
        mutableStatus.value = ContentStatus(true, "Hikâye indiriliyor…", story.id)
        viewModelScope.launch {
            try { val ready = repository.download(story); mutableStatus.value = ContentStatus(message = "Çevrimdışı okumaya hazır"); onReady(ready) }
            catch (_: Exception) { mutableStatus.value = ContentStatus(message = "İndirme tamamlanamadı. Bağlantını kontrol edip yeniden dene.") }
        }
    }
    fun removeDownload(story: Story) {
        if(mutableStatus.value.busy) return
        mutableStatus.value=ContentStatus(busy=true)
        viewModelScope.launch {
            mutableStatus.value=try {repository.removeDownload(story);ContentStatus(message="İndirme kaldırıldı. Öğrendiğin kelimeler korundu.")}
            catch (_: Exception) {ContentStatus(message="İndirme kaldırılamadı. Yeniden dene.")}
        }
    }
}
