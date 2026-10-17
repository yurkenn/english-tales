package com.yurken.englishtales.data

import android.content.Context
import org.json.JSONObject
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf

data class WordInfo(val id: String, val word: String, val translation: String, val pronunciation: String, val example: String)
/** [translation] is in the reader's support language ([SupportLanguage]); the story text is always English. */
data class StorySentence(val id: String, val english: String, val translation: String)

/** Language of the translations shown next to the English content (Q4.0). Only Turkish ships today. */
object SupportLanguage {
    const val DEFAULT = "tr"
    val code: String get() = DEFAULT

    /**
     * Reads [lang] from an optional per-language map (`{"tr": "…"}`), falling back to the legacy
     * Turkish field that older catalogs, caches and released servers still provide.
     */
    fun pick(item: JSONObject, mapKey: String, legacyKey: String, lang: String = code): String {
        item.optJSONObject(mapKey)?.optString(lang)?.takeIf { it.isNotBlank() }?.let { return it }
        require(lang == DEFAULT) { "Missing $lang translation" }
        return item.getString(legacyKey)
    }
}
data class Story(
    val id: String,
    val title: String,
    val author: String,
    val level: String,
    val genre: String,
    val description: String,
    val coverKey: String,
    val sentences: List<StorySentence>,
    val revisionId: String = ContentRevisionIds.bundled(id),
    val coverFile: String? = null,
    val vocabulary: List<WordInfo>? = null,
    val sentenceWordIds: Map<String, List<String>>? = null,
    /** First publication of the story (not of this revision); null for bundled content. */
    val addedAt: java.time.Instant? = null,
    /** English comprehension questions shown after reading (Q5.3); empty when the story has none. */
    val questions: List<StoryQuestion> = emptyList(),
    /** Library categories (Q4.5) in vocabulary order; empty when the source predates tags. */
    val tags: List<StoryTag> = emptyList()
)

/** A library category such as a fairy tale or fable; [name] is in the support language. */
data class StoryTag(val id: String, val name: String) {
    companion object {
        private val genreTags = mapOf("Macera" to "macera", "Gizem" to "gizem", "Günlük yaşam" to "gunluk-yasam")
        /** Stories from servers or caches without tags fall back to their genre, which every story has. */
        fun of(story: Story): List<StoryTag> = story.tags.ifEmpty { listOf(StoryTag(genreTags[story.genre] ?: story.genre, story.genre)) }
        /** Reads `[{id, name}]` (revision documents) or `["id"]` with [names] (the bundled catalog). */
        fun parse(array: org.json.JSONArray?, names: Map<String, String> = emptyMap()): List<StoryTag> = (0 until (array?.length() ?: 0)).mapNotNull { i ->
            array!!.optJSONObject(i)?.let { StoryTag(it.optString("id"), it.optString("name").ifBlank { names[it.optString("id")] ?: it.optString("id") }) }
                ?: array.optString(i).takeIf { it.isNotBlank() }?.let { StoryTag(it, names[it] ?: it) }
        }.filter { it.id.isNotBlank() }.distinctBy { it.id }
    }
}

/** A multiple-choice comprehension question; [answer] indexes [options]. */
data class StoryQuestion(val id: String, val kind: String, val prompt: String, val options: List<String>, val answer: Int) {
    companion object {
        /** Reads `questions` from a bundled story or a downloaded revision; invalid entries are dropped. */
        fun parse(array: org.json.JSONArray?): List<StoryQuestion> = (0 until (array?.length() ?: 0)).mapNotNull { i ->
            runCatching {
                val item = array!!.getJSONObject(i)
                val raw = item.getJSONArray("options")
                val options = (0 until raw.length()).map { raw.getString(it) }
                val question = StoryQuestion(item.getString("id"), item.getString("kind"), item.getString("prompt"), options, item.getInt("answer"))
                question.takeIf { it.isValid() }
            }.getOrNull()
        }
    }
    fun isValid() = kind in setOf("main", "detail", "inference") && prompt.isNotBlank() && options.size in 2..4 &&
        options.all { it.isNotBlank() } && options.map { it.trim().lowercase() }.distinct().size == options.size && answer in options.indices
}

private data class Catalog(
    val words: List<WordInfo>,
    val wordById: Map<String, WordInfo>,
    val wordByText: Map<String, WordInfo>,
    val stories: List<Story>,
    val storyById: Map<String, Story>
) {
    val phrases by lazy { PhraseMatcher.Index(words) }
    val glossary by lazy { LearningContent.glossarySource.let { (entries, forms) -> Glossary(entries, forms, words) } }
    /** Revision of the first story, in catalog order, that teaches each word; built once instead of per word event. */
    val wordRevisions: Map<String, String> by lazy {
        HashMap<String, String>().also { map -> stories.forEach { story -> storyWords(story, phrases).forEach { map.putIfAbsent(it.id, story.revisionId) } } }
    }
}

private fun sentenceWords(story: Story, sentence: StorySentence, phrases: PhraseMatcher.Index): List<WordInfo> =
    if (story.vocabulary != null) story.vocabulary.filter { it.id in story.sentenceWordIds.orEmpty()[sentence.id].orEmpty() }
    else PhraseMatcher.find(sentence.english, phrases).map { it.word }.distinctBy { it.id }

private fun storyWords(story: Story, phrases: PhraseMatcher.Index): List<WordInfo> =
    story.sentences.flatMap { sentenceWords(story, it, phrases) }.distinctBy { it.id }

/** A learning word or one of the learner's saved glossary words. */
fun LearningSnapshot.wordFor(id: String): WordInfo? = LearningContent.wordById[id] ?: personalWords[id]
/** Saved words in dictionary order, then saved glossary words in the order they were added. */
fun LearningSnapshot.savedWordList(): List<WordInfo> = (LearningContent.words+personalWords.values).filter {it.id in savedWordIds}

/** Sentence IDs are stable across revisions, so a position carries over while its sentence still exists. */
fun ReadingPosition.carriesTo(story: Story) = revisionId==story.revisionId || story.sentences.any {it.id==sentenceId}

/** The saved older revision to reopen, or null when the current revision continues the position. */
fun LearningSnapshot.resumeRevision(storyId: String): String? {
    val position=readingPositions[storyId] ?: return null
    if(LearningContent.storyById[storyId]?.let(position::carriesTo)==true) return null
    return position.revisionId.takeIf {LearningContent.revision(it)!=null}
}

fun LearningSnapshot.progressFor(story: Story): Int {
    val position=readingPositions[story.id]
    if(position!=null && !position.carriesTo(story)) return 0
    if(position==null && story.revisionId!=ContentRevisionIds.bundled(story.id)) return 0
    return storyProgress[story.id]?:0
}

/** Versioned, bundled content. User progress refers to stable IDs rather than list positions. */
object LearningContent {
    private var catalog: Catalog? by mutableStateOf(null)
    private val pinned = java.util.concurrent.ConcurrentHashMap<String, Story>()
    private val historical = java.util.concurrent.ConcurrentHashMap<String, Story>()
    private val wordSources = java.util.concurrent.ConcurrentHashMap<String, String>()

    val words: List<WordInfo> get() = current().words
    val wordById: Map<String, WordInfo> get() = current().wordById
    val wordByText: Map<String, WordInfo> get() = current().wordByText
    /** Every dictionary word and phrase, for bundled stories that have no per-sentence links. */
    val phraseIndex: PhraseMatcher.Index get() = current().phrases
    /** Lookup for every other token (Q4.3a); learning words of the current catalog are part of it. */
    val glossary: Glossary get() = current().glossary
    val stories: List<Story> get() = current().stories
    val storyById: Map<String, Story> get() = current().storyById.let { if (pinned.isEmpty()) it else it + pinned }

    private val loadLock = Any()

    /** The packaged stories, unchanged after a remote catalog is installed. */
    @Volatile private var bundled: List<Story>? = null
    val bundledStories: List<Story> get() = checkNotNull(bundled) { "LearningContent.initialize must run before UI" }

    /** Bundled tag vocabulary order; tags only known from the server sort after these. */
    @Volatile var tagOrder: List<String> = emptyList()
        private set

    /** Bundled `glossary/<lang>.json`, kept across remote catalog installs; empty when the file is absent. */
    @Volatile internal var glossarySource: Pair<Map<String, String>, Map<String, String>> = emptyMap<String, String>() to emptyMap()
        private set

    /** True once the bundled catalog is installed; readable from composition. */
    val ready: Boolean get() = catalog != null

    /** Parses the bundled catalog off the main thread (~150 ms on an emulator); safe to call repeatedly. */
    suspend fun load(context: Context) = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) { initialize(context) }

    /** Blocking variant for callers that already run off the UI thread (stores, workers, tests). */
    fun initialize(context: Context) {
        if (catalog != null) return
        synchronized(loadLock) { if (catalog == null) catalog = parse(context).also { bundled = it.stories } }
    }

    @androidx.annotation.VisibleForTesting
    internal fun resetForTest() = synchronized(loadLock) { catalog = null; bundled = null; pinned.clear(); historical.clear(); wordSources.clear() }

    private fun parse(context: Context): Catalog {
        val json = context.assets.open("catalog/v1.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
        val root = JSONObject(json)
        require(root.getInt("schemaVersion") == 1) { "Unsupported catalog schema" }
        glossarySource = try {
            Glossary.parse(context.assets.open("glossary/${SupportLanguage.code}.json").bufferedReader(Charsets.UTF_8).use { it.readText() })
        } catch (missing: java.io.FileNotFoundException) { emptyMap<String, String>() to emptyMap() }

        val wordArray = root.getJSONArray("words")
        val parsedWords = (0 until wordArray.length()).map { index ->
            val item = wordArray.getJSONObject(index)
            WordInfo(item.getString("id"), item.getString("word"), SupportLanguage.pick(item, "translations", "translation"), item.getString("pronunciation"), item.getString("example"))
        }
        require(parsedWords.map { it.id }.distinct().size == parsedWords.size) { "Duplicate word ID" }

        val tagArray = root.optJSONArray("tags") ?: org.json.JSONArray()
        val tagNames = (0 until tagArray.length()).associate { i -> tagArray.getJSONObject(i).let { tag ->
            val names = tag.optJSONObject("names")
            tag.getString("id") to (names?.optString(SupportLanguage.code)?.takeIf { it.isNotBlank() } ?: names?.optString(SupportLanguage.DEFAULT)?.takeIf { it.isNotBlank() } ?: tag.getString("id"))
        } }
        tagOrder = tagNames.keys.toList()
        val storyArray = root.getJSONArray("stories")
        val parsedStories = (0 until storyArray.length()).map { index ->
            val item = storyArray.getJSONObject(index)
            val sentenceArray = item.getJSONArray("sentences")
            val sentences = (0 until sentenceArray.length()).map { sentenceIndex ->
                val sentence = sentenceArray.getJSONObject(sentenceIndex)
                StorySentence(sentence.getString("id"), sentence.getString("english"), SupportLanguage.pick(sentence, "translations", "turkish"))
            }
            require(sentences.isNotEmpty()) { "Story has no sentences" }
            require(sentences.map { it.id }.distinct().size == sentences.size) { "Duplicate sentence ID" }
            Story(
                item.getString("id"), item.getString("title"), item.getString("author"),
                item.getString("level"), item.getString("genre"), SupportLanguage.pick(item, "descriptions", "description"),
                item.getString("coverKey"), sentences, questions = StoryQuestion.parse(item.optJSONArray("questions")),
                tags = StoryTag.parse(item.optJSONArray("tags"), tagNames)
            )
        }
        require(parsedStories.isNotEmpty()) { "Catalog has no stories" }
        require(parsedStories.map { it.id }.distinct().size == parsedStories.size) { "Duplicate story ID" }

        return Catalog(
            parsedWords, parsedWords.associateBy { it.id }, parsedWords.associateBy { it.word.lowercase() },
            parsedStories, parsedStories.associateBy { it.id }
        )
    }

    /** Published stories use their editor links; bundled stories match the shared dictionary. */
    fun wordsForSentence(story: Story, sentence: StorySentence): List<WordInfo> = sentenceWords(story, sentence, phraseIndex)

    fun wordsForStory(story: Story): List<WordInfo> = storyWords(story, phraseIndex)

    /** Pinned revisions win, then the first catalog story that teaches the word, then a retained older revision. */
    fun revisionForWord(wordId: String): String? = pinned.values.firstOrNull { story -> wordsForStory(story).any {it.id==wordId} }?.revisionId
        ?: current().wordRevisions[wordId] ?: wordSources[wordId]

    /** The original linear scan, kept so tests can check [revisionForWord] against it. */
    @androidx.annotation.VisibleForTesting
    internal fun revisionForWordByScan(wordId: String): String? = (pinned.values + stories).firstOrNull { story -> wordsForStory(story).any {it.id==wordId} }?.revisionId ?: wordSources[wordId]

    fun retain(story: Story) {
        historical[story.revisionId] = story
        wordsForStory(story).forEach {wordSources[it.id]=story.revisionId}
    }

    fun pin(story: Story) { pinned[story.id] = story; retain(story) }
    fun unpin(story: Story) { if (pinned[story.id] === story) pinned.remove(story.id) }
    fun revision(id: String): Story? = pinned.values.firstOrNull {it.revisionId==id} ?: stories.firstOrNull {it.revisionId==id} ?: historical[id]

    /** Publish on the main thread; keep learned vocabulary from previous content revisions. */
    fun install(stories: List<Story>, historicalWords: List<WordInfo> = emptyList()) {
        val words = (current().words + historicalWords + stories.flatMap { it.vocabulary.orEmpty() }).associateBy { it.id }.values.toList()
        catalog = Catalog(words, words.associateBy { it.id }, words.associateBy { it.word.lowercase(java.util.Locale.ROOT) }, stories, stories.associateBy { it.id })
    }

    /** Most recently added first. Undated stories keep catalog order, later entries counting as newer. */
    fun newestStories(limit: Int): List<Story> = stories.withIndex()
        .sortedWith(compareByDescending<IndexedValue<Story>> { it.value.addedAt }.thenByDescending { it.index })
        .take(limit).map { it.value }

    fun recommendedStory(level: String, genre: String, progress: Map<String,Int> = emptyMap()): Story? =
        stories.sortedBy { (if(it.level==level) 0 else 4) + (if(it.genre==genre) 0 else 1) + (if(progress[it.id]==100) 2 else 0) }.firstOrNull()

    private fun current() = checkNotNull(catalog) { "LearningContent.initialize must run before UI" }
}
