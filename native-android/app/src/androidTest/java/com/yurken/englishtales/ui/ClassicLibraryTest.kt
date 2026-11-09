package com.yurken.englishtales.ui

import android.content.ContentValues
import android.graphics.Bitmap
import android.provider.MediaStore
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.test.*
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class ClassicLibraryTest {
    @get:Rule val compose=createComposeRule()
    private val context get()=InstrumentationRegistry.getInstrumentation().targetContext

    @Test fun turkishClassicSearchFindsAndOpensTheCorrectStory() {
        LearningContent.initialize(context)
        val classics=LearningContent.stories.filter {it.id.startsWith("classic-")}
        assertEquals(59,classics.size)
        classics.forEach {assertTrue("Missing study words: ${it.id}",LearningContent.wordsForStory(it).size>=6)}
        var opened=""
        compose.setContent {EnglishTalesTheme {CatalogScreen(LearningSnapshot(),{opened=it},PaddingValues())}}
        compose.onNodeWithText("Kitap ara").performClick()
        compose.onNode(hasSetTextAction()).performTextInput("Külkedisi")
        compose.onAllNodesWithText("Cinderella").onLast().assertIsDisplayed()
        screenshot("search")
        compose.onAllNodesWithText("Cinderella").onLast().performClick()
        assertEquals("classic-cinderella",opened)
        compose.onNode(hasSetTextAction()).performTextReplacement("Mutlu Prens")
        compose.onAllNodesWithText("The Happy Prince").onLast().assertIsDisplayed()
        compose.onNodeWithText("Cinderella").assertDoesNotExist()
        listOf(
            Triple("Pamuk Prenses", "Snow White", "classic-snow-white"),
            Triple("Rapunzel", "Rapunzel", "classic-rapunzel"),
            Triple("Karlar Kraliçesi", "The Snow Queen", "classic-snow-queen"),
            Triple("Çirkin Ördek Yavrusu", "The Ugly Duckling", "classic-ugly-duckling")
        ).forEach { (query, title, id) ->
            compose.onNode(hasSetTextAction()).performTextReplacement(query)
            compose.onAllNodesWithText(title).onLast().assertIsDisplayed().performClick()
            assertEquals(id, opened)
        }
        screenshot("andersen-search")
    }

    @Test fun classicTranslationWordSavingAndResumeUseTheNewStableSentenceIds() {
        LearningContent.initialize(context)
        val story=LearningContent.storyById.getValue("classic-tortoise-hare")
        var saved="";var position="";var percent=0;var complete=0
        var mount by mutableIntStateOf(0)
        compose.setContent {EnglishTalesTheme {
            key(mount) {ReaderScreen(story,LearningSnapshot(readerHintSeen=true,
                readingPositions=if(position.isEmpty()) emptyMap() else mapOf(story.id to ReadingPosition(story.revisionId,position))),
                onBack={},onSaveWord={saved=it},onProgress={p,s->percent=p;position=s},onComplete={complete++},
                onHintDismiss={},sessionId="classic-reader-$mount",onCheckpoint={_,_->},pageFits=EightPerPage)}
        }}
        compose.onNodeWithContentDescription("Sayfayı çevir").performClick()
        compose.onNodeWithText(story.sentences.first().translation).assertIsDisplayed()
        val sentence=compose.onNodeWithText(story.sentences.first().english)
        val layouts=mutableListOf<TextLayoutResult>()
        sentence.performSemanticsAction(SemanticsActions.GetTextLayoutResult) {it(layouts)}
        val wordBounds=layouts.single().getBoundingBox(story.sentences.first().english.indexOf("hare")+1)
        sentence.performTouchInput {click(wordBounds.center)}
        compose.onNodeWithText("yaban tavşanı").assertIsDisplayed()
        compose.onNodeWithText("Öğren").performClick()
        assertEquals("hare",saved)
        compose.onNodeWithText("Sonraki ›").performClick()
        assertEquals(story.sentences[8].id,position);assertEquals(8*100/story.sentences.size,percent)
        compose.runOnIdle {mount++}
        val pages=(story.sentences.size+7)/8
        compose.onNodeWithText("2 / $pages").assertIsDisplayed()
        screenshot("reader")
        repeat(pages-2) {compose.onNodeWithText("Sonraki ›").performClick()}
        compose.onNodeWithText("Bitir ✓").performClick()
        assertEquals(1,complete)
    }

    private fun screenshot(name:String) {
        if(android.os.Build.VERSION.SDK_INT<29) return
        compose.waitForIdle()
        val bitmap=compose.onRoot().captureToImage().asAndroidBitmap()
        val values=ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME,"english-tales-classics-$name.png")
            put(MediaStore.Images.Media.MIME_TYPE,"image/png")
            put(MediaStore.Images.Media.RELATIVE_PATH,"Pictures/EnglishTalesClassics")
        }
        val resolver=context.contentResolver
        val uri=checkNotNull(resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,values))
        resolver.openOutputStream(uri)!!.use {bitmap.compress(Bitmap.CompressFormat.PNG,100,it)}
        bitmap.recycle()
    }
}
