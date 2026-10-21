package com.yurken.englishtales.ui

import com.yurken.englishtales.data.LearningSnapshot
import com.yurken.englishtales.data.ReadingPosition
import com.yurken.englishtales.data.Story
import com.yurken.englishtales.data.StorySentence
import org.junit.Assert.assertEquals
import org.junit.Test

/** "Read again" on a finished story opens at the start, not on the last sentence completion stored. */
class ReaderStartPageTest {
    private val story=Story("tale","Tale","","A1","Macera","","cover",(1..20).map {StorySentence("s-$it","One $it.","Bir $it.")})
    private fun snapshot(progress: Int,sentenceId: String?)=LearningSnapshot(storyProgress=mapOf("tale" to progress),
        readingPositions=sentenceId?.let {mapOf("tale" to ReadingPosition(story.revisionId,it))}.orEmpty())

    @Test fun finishedStoryStartsOverEvenWithItsLastSentenceStored() {
        assertEquals(0,initialReaderSentence(story,snapshot(100,"s-20")))
        assertEquals(0,initialReaderSentence(story,snapshot(100,null)))
    }

    @Test fun unfinishedStoryResumesAtItsStoredPosition() {
        assertEquals(9,initialReaderSentence(story,snapshot(60,"s-10")))
        assertEquals(16,initialReaderSentence(story,snapshot(85,"s-17")))
        // Without a position the percentage still picks the sentence.
        assertEquals(12,initialReaderSentence(story,snapshot(60,null)))
    }

    @Test fun pagesTakeAsManySentencesAsFit() {
        // Each sentence is one unit tall and a page holds five: short sentences fill the page.
        assertEquals(listOf(0,5,10,15),readerPageStarts(20) {from,to -> to-from<=5})
        // Sentences of uneven height break where the next one no longer fits.
        val heights=listOf(2,2,3,1,4,1,1)
        assertEquals(listOf(0,2,4),readerPageStarts(heights.size) {from,to -> heights.subList(from,to).sum()<=6})
    }

    @Test fun aSentenceTallerThanThePageStillGetsItsOwnPage() {
        assertEquals(listOf(0,1,2),readerPageStarts(3) {_,_ -> false})
        assertEquals(listOf(0),readerPageStarts(0) {_,_ -> true})
    }
}
