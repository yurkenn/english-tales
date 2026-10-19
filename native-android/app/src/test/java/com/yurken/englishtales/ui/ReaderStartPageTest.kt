package com.yurken.englishtales.ui

import com.yurken.englishtales.data.LearningSnapshot
import com.yurken.englishtales.data.ReadingPosition
import com.yurken.englishtales.data.Story
import com.yurken.englishtales.data.StorySentence
import org.junit.Assert.assertEquals
import org.junit.Test

/** "Read again" on a finished story opens on page 1, not on the last sentence completion stored. */
class ReaderStartPageTest {
    private val story=Story("tale","Tale","","A1","Macera","","cover",(1..20).map {StorySentence("s-$it","One $it.","Bir $it.")})
    private fun snapshot(progress: Int,sentenceId: String?)=LearningSnapshot(storyProgress=mapOf("tale" to progress),
        readingPositions=sentenceId?.let {mapOf("tale" to ReadingPosition(story.revisionId,it))}.orEmpty())

    @Test fun finishedStoryStartsOverEvenWithItsLastSentenceStored() {
        assertEquals(0,initialReaderPage(story,snapshot(100,"s-20")))
        assertEquals(0,initialReaderPage(story,snapshot(100,null)))
    }

    @Test fun unfinishedStoryResumesAtItsStoredPosition() {
        assertEquals(1,initialReaderPage(story,snapshot(60,"s-10")))
        assertEquals(2,initialReaderPage(story,snapshot(85,"s-17")))
        // Without a position the percentage still picks the page.
        assertEquals(1,initialReaderPage(story,snapshot(60,null)))
    }
}
