package com.yurken.englishtales.data

import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.util.UUID

class DownloadedQuestionsTest {
    @Before fun initialize() { LearningContent.initialize(InstrumentationRegistry.getInstrumentation().targetContext) }
    private fun doc(story: Story) = JSONObject().put("id",UUID.randomUUID().toString()).put("story_id",story.id)
        .put("title",story.title).put("author",story.author).put("level",story.level).put("genre",story.genre)
        .put("description",story.description).put("questions",JSONArray())
        .put("sentences",JSONArray(story.sentences.map { JSONObject().put("id",it.id).put("english",it.english).put("turkish",it.translation) }))
    @Test fun downloadedAndRestoredUnchangedStoryKeepsBundledQuestions() {
        for(story in LearningContent.bundledStories) {
            assertTrue(story.questions.size>=3)
            val raw=doc(story)
            assertEquals(story.questions,ContentCodec.story(raw).questions)
            assertEquals(story.questions,ContentCodec.story(JSONObject(raw.toString())).questions)
        }
    }
    @Test fun editedEnglishOrSentenceIdsNeverBorrowOldQuestions() {
        val story=LearningContent.bundledStories.first()
        val changed=doc(story)
        changed.getJSONArray("sentences").getJSONObject(0).put("english","The story has been rewritten.")
        assertTrue(ContentCodec.story(changed).questions.isEmpty())
        val ids=doc(story)
        ids.getJSONArray("sentences").getJSONObject(0).put("id","new-sentence")
        assertTrue(ContentCodec.story(ids).questions.isEmpty())
    }
    @Test fun publishedQuestionsAlwaysTakePrecedence() {
        val raw=doc(LearningContent.bundledStories.first()).put("questions",JSONArray().put(JSONObject()
            .put("id","new-question").put("kind","main").put("prompt","Which story is this?")
            .put("options",JSONArray(listOf("A story","A list"))).put("answer",0)))
        assertEquals(listOf("new-question"),ContentCodec.story(raw).questions.map {it.id})
    }
}
