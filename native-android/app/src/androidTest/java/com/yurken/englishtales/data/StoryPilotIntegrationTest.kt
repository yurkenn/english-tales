package com.yurken.englishtales.data

import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.util.UUID

/** Local-only authoring fixture: never part of src/main assets or the published catalog. */
class StoryPilotIntegrationTest {
    private val target get() = InstrumentationRegistry.getInstrumentation().targetContext
    private lateinit var store: LearningStore
    private lateinit var owner: LearningOwner.Account
    private lateinit var original: List<Story>
    private lateinit var originalWords: List<WordInfo>
    private lateinit var document: JSONObject
    private lateinit var story: Story
    private var now = 1_792_411_200_000L

    @Before fun setup() = runBlocking {
        LearningContent.initialize(target)
        original = LearningContent.stories
        originalWords = LearningContent.words
        owner = LearningOwner.Account(UUID.randomUUID().toString())
        store = LearningStore(target, owner) { now }
        store.onProductSignal = {}
        document = JSONObject(InstrumentationRegistry.getInstrumentation().context.assets
            .open("story-pilot/quiet-morning.json").bufferedReader().use { it.readText() })
        story = ContentCodec.story(document)
        withContext(Dispatchers.Main) {
            LearningContent.install(original.map { if (it.id == story.id) story else it },
                listOf(WordInfo("pilot-test-unselected", "bread", "Not a study word", "", "")))
        }
    }

    @After fun cleanup() = runBlocking<Unit> {
        if (::store.isInitialized) store.close()
        if (::owner.isInitialized) target.deleteDatabase(owner.databaseName)
        if (::original.isInitialized) withContext(Dispatchers.Main) { LearningContent.resetForTest(); LearningContent.initialize(target) }
    }

    @Test fun readerUsesOnlyTheTenLinkedStudyWords() {
        assertFalse(document.has("published_at"))
        val expected = (0 until document.getJSONArray("words").length())
            .map { document.getJSONArray("words").getJSONObject(it).getString("id") }.toSet()
        assertEquals(10, expected.size)
        assertEquals(expected, LearningContent.wordsForStory(story).map { it.id }.toSet())
        assertFalse(LearningContent.wordsForStory(story).any { it.id == "pilot-test-unselected" })
        for (sentence in story.sentences) {
            val linked = document.getJSONArray("links").let { links ->
                (0 until links.length()).map { links.getJSONObject(it) }
                    .filter { it.getString("sentence_id") == sentence.id }.map { it.getString("word_id") }.toSet()
            }
            assertEquals(sentence.id, linked, LearningContent.wordsForSentence(story, sentence).map { it.id }.toSet())
        }
        assertEquals(3, story.questions.size)
    }

    @Test fun savedPilotWordCanBeReviewedAndQueuesItsCapturedRevision() {
        val word = story.vocabulary!!.first { it.id == "pilot-quiet-morning-birthday" }
        store.setWordSaved(word.id, true)
        assertTrue(store.snapshot().savedWordIds.contains(word.id))
        assertEquals(word, store.snapshot().savedWordList().first { it.id == word.id })
        assertEquals(story.revisionId, LearningContent.revisionForWord(word.id))
        val before = store.snapshot()
        assertEquals(PracticeLadder.RECOGNISE, PracticeLadder.plan(listOf(word.id), before.wordStates,
            before.wordStability, setOf(word.id), false).single().second)
        now += LearningPolicy.DAY_MS
        store.reviewWord(word.id, true)
        assertTrue(store.snapshot().nextReviewAt!! > now)
        val operations = store.queuedOperations().filter { it.rpc == "apply_word_event" }.map { JSONObject(it.payload) }
        assertEquals(listOf("save", "review"), operations.map { it.getString("action") })
        assertTrue(operations.all { it.getString("storyRevisionId") == story.revisionId && it.getString("wordId") == word.id })
    }

    @Test fun oldSentencePositionCarriesForwardWhileOlderSavedVocabularySurvives() = runBlocking {
        val old = original.first { it.id == story.id }
        withContext(Dispatchers.Main) { LearningContent.install(original, originalWords) }
        val captured = old.sentences[4].id
        store.updateProgress(old.id, 40, captured, old)
        assertTrue(store.snapshot().readingPositions.getValue(old.id).carriesTo(story))
        assertEquals(old.revisionId, store.snapshot().readingPositions.getValue(old.id).revisionId)
        val word = LearningContent.wordsForStory(old).first()
        store.setWordSaved(word.id, true)
        assertEquals(old.revisionId, JSONObject(store.queuedOperations().first { it.rpc == "apply_word_event" }.payload).getString("storyRevisionId"))
        LearningContent.retain(old)
        withContext(Dispatchers.Main) { LearningContent.install(listOf(story)) }
        assertTrue(store.snapshot().savedWordIds.contains(word.id))
        assertNotNull(store.snapshot().wordFor(word.id))
        assertNotNull(LearningContent.revision(old.revisionId))
        store.updateProgress(story.id, 50, captured, story)
        assertEquals(story.revisionId, store.snapshot().readingPositions.getValue(story.id).revisionId)
    }
}
