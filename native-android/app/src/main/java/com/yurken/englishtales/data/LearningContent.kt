package com.yurken.englishtales.data

import android.content.Context
import org.json.JSONObject
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf

data class WordInfo(val id: String, val word: String, val translation: String, val pronunciation: String, val example: String)
data class StorySentence(val id: String, val english: String, val turkish: String)
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
    val addedAt: java.time.Instant? = null
)

private data class Catalog(
    val words: List<WordInfo>,
    val wordById: Map<String, WordInfo>,
    val wordByText: Map<String, WordInfo>,
    val stories: List<Story>,
    val storyById: Map<String, Story>
) {
    val phrases by lazy { PhraseMatcher.Index(words) }
}

fun LearningSnapshot.progressFor(story: Story): Int {
    val position=readingPositions[story.id]
    if(position!=null && position.revisionId!=story.revisionId) return 0
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
    val stories: List<Story> get() = current().stories
    val storyById: Map<String, Story> get() = current().storyById + pinned

    fun initialize(context: Context) {
        if (catalog != null) return
        val json = context.assets.open("catalog/v1.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
        val root = JSONObject(json)
        require(root.getInt("schemaVersion") == 1) { "Unsupported catalog schema" }

        val wordArray = root.getJSONArray("words")
        val parsedWords = (0 until wordArray.length()).map { index ->
            val item = wordArray.getJSONObject(index)
            WordInfo(item.getString("id"), item.getString("word"), item.getString("translation"), item.getString("pronunciation"), item.getString("example"))
        }
        require(parsedWords.map { it.id }.distinct().size == parsedWords.size) { "Duplicate word ID" }

        val storyArray = root.getJSONArray("stories")
        val parsedStories = (0 until storyArray.length()).map { index ->
            val item = storyArray.getJSONObject(index)
            val sentenceArray = item.getJSONArray("sentences")
            val sentences = (0 until sentenceArray.length()).map { sentenceIndex ->
                val sentence = sentenceArray.getJSONObject(sentenceIndex)
                StorySentence(sentence.getString("id"), sentence.getString("english"), sentence.getString("turkish"))
            }
            require(sentences.isNotEmpty()) { "Story has no sentences" }
            require(sentences.map { it.id }.distinct().size == sentences.size) { "Duplicate sentence ID" }
            Story(
                item.getString("id"), item.getString("title"), item.getString("author"),
                item.getString("level"), item.getString("genre"), item.getString("description"),
                item.getString("coverKey"), sentences
            )
        }
        require(parsedStories.isNotEmpty()) { "Catalog has no stories" }
        require(parsedStories.map { it.id }.distinct().size == parsedStories.size) { "Duplicate story ID" }

        catalog = Catalog(
            parsedWords, parsedWords.associateBy { it.id }, parsedWords.associateBy { it.word.lowercase() },
            parsedStories, parsedStories.associateBy { it.id }
        )
    }

    /** Published stories use their editor links; bundled stories match the shared dictionary. */
    fun wordsForSentence(story: Story, sentence: StorySentence): List<WordInfo> =
        if (story.vocabulary != null) story.vocabulary.filter { it.id in story.sentenceWordIds.orEmpty()[sentence.id].orEmpty() }
        else PhraseMatcher.find(sentence.english, phraseIndex).map { it.word }.distinctBy { it.id }

    fun wordsForStory(story: Story): List<WordInfo> = story.sentences.flatMap { wordsForSentence(story, it) }.distinctBy { it.id }

    fun revisionForWord(wordId: String): String? = (pinned.values + stories).firstOrNull { story -> wordsForStory(story).any {it.id==wordId} }?.revisionId ?: wordSources[wordId]

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
