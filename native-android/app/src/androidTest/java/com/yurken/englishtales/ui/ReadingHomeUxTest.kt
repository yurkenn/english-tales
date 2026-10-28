package com.yurken.englishtales.ui

import android.content.ContentValues
import android.graphics.Bitmap
import android.os.Build
import android.provider.MediaStore
import android.view.Choreographer
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.material3.Scaffold
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.Density
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import kotlinx.coroutines.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import java.util.UUID

class ReadingHomeUxTest {
    @get:Rule val compose=createComposeRule()
    private val context get()=InstrumentationRegistry.getInstrumentation().targetContext

    @Test fun preferencesSurviveNewStoreAndConcurrentChangesAndMalformedValues() = runBlocking {
        val name="reading-test-${UUID.randomUUID()}"
        val store=ReadingPreferencesStore(context,name)
        try {
            store.update {it.copy(theme=ReadingTheme.DARK,spacing=ReadingSpacing.SPACIOUS)}
            coroutineScope {repeat(5) {launch {store.update {it.copy(fontSize=it.fontSize+1)}}}}
            assertEquals(ReadingPreferences(ReadingTheme.DARK,DEFAULT_READING_FONT_SIZE+5,ReadingSpacing.SPACIOUS),ReadingPreferencesStore(context,name).read())
            context.getSharedPreferences(name,0).edit().putString("fontSize","old-invalid-value").putString("spacing","unknown").commit()
            assertEquals(ReadingPreferences(ReadingTheme.DARK,DEFAULT_READING_FONT_SIZE,ReadingSpacing.COMFORTABLE),ReadingPreferencesStore(context,name).read())
            store.update {it.copy(fontSize=100)}
            assertEquals(28,ReadingPreferencesStore(context,name).read().fontSize)
        } finally {context.getSharedPreferences(name,0).edit().clear().commit()}
    }

    @Test fun anOlderDarkSwitchBecomesTheDarkThemeAndSepiaIsKept() = runBlocking {
        val name="reading-test-${UUID.randomUUID()}"
        try {
            context.getSharedPreferences(name,0).edit().putBoolean("dark",true).commit()
            assertEquals(ReadingTheme.DARK,ReadingPreferencesStore(context,name).read().theme)
            ReadingPreferencesStore(context,name).update {it.copy(theme=ReadingTheme.SEPIA)}
            assertEquals(ReadingTheme.SEPIA,ReadingPreferencesStore(context,name).read().theme)
        } finally {context.getSharedPreferences(name,0).edit().clear().commit()}
    }

    @Test fun continueAndReviewKeepTheirTargetsAtLargeFont() {
        LearningContent.initialize(context)
        val story=LearningContent.stories.first()
        val due=LearningContent.words.take(7).map {it.id}
        var read="";var reviewed=emptyList<String>()
        var scale by mutableFloatStateOf(1f)
        compose.setContent {EnglishTalesTheme {
            val density=LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(density.density,scale)) {
                Scaffold(bottomBar={TalesBottomBar(0) {}}) {padding ->
                    StudyScreen(LearningSnapshot(lastStoryId=story.id,storyProgress=mapOf(story.id to 42),points=125,streak=3,
                        savedWordIds=due.toSet(),dueWordIds=due,weeklyActivity=List(7) {i ->
                            DailyActivity("fixture-$i",listOf("Pt","Sa","Ça","Pe","Cu","Ct","Pa")[i],if(i in 3..5) 1 else 0)
                        }),{}, {},padding,{read=it},{reviewed=it})
                }
            }
        }}
        compose.onNodeWithText("%42 tamamlandı").assertIsDisplayed()
        screenshot("home")
        compose.runOnIdle {scale=2f}
        compose.onNodeWithText("Okumaya devam et").performScrollTo().assertIsDisplayed().performClick()
        assertEquals(story.id,read)
        screenshot("home-large-text")
        compose.onNodeWithText("5 kelimeyi hatırla").performScrollTo().assertIsDisplayed().performClick()
        assertEquals(due.take(5),reviewed)
    }

    @Test fun completedStoryIsNotPresentedAsAnUnfinishedReading() {
        LearningContent.initialize(context)
        compose.setContent {EnglishTalesTheme {
            DailyPlan(LearningSnapshot(lastStoryId=LearningContent.stories.first().id,
                storyProgress=LearningContent.stories.associate {it.id to 100},
                readingPositions=LearningContent.stories.associate {it.id to ReadingPosition(it.revisionId,it.sentences.last().id)}),{},{})
        }}
        compose.onNodeWithText("Okumaya devam et").assertDoesNotExist()
        compose.onNodeWithText("Yeniden oku").assertIsDisplayed()
        compose.onNodeWithText("Yeniden keşfet").assertIsDisplayed()
    }

    @Test fun appearancePanelPersistsAcrossReaderRemountAndAllowsLargeTextExit() {
        LearningContent.initialize(context)
        val name="reading-ui-${UUID.randomUUID()}"
        val store=ReadingPreferencesStore(context,name)
        var mount by mutableIntStateOf(0)
        var scale by mutableFloatStateOf(1f)
        try {
            compose.setContent {EnglishTalesTheme {
                val density=LocalDensity.current
                CompositionLocalProvider(LocalDensity provides Density(density.density,scale)) {
                    key(mount) {ReaderScreen(LearningContent.stories.first(),LearningSnapshot(readerHintSeen=true),{}, {},{_,_->},
                        onComplete={},onHintDismiss={},sessionId="reading-ui",onCheckpoint={_,_->},appearanceStore=ReadingPreferencesStore(context,name))}
                }
            }}
            compose.onNodeWithContentDescription("Okuma görünümü").performClick()
            compose.onNodeWithContentDescription("Yazıyı büyüt").performClick().performClick()
            compose.waitUntil(5_000) {store.read().fontSize==DEFAULT_READING_FONT_SIZE+2}
            compose.onNodeWithText("Geniş").performClick()
            compose.onNodeWithText("Koyu").performScrollTo().performClick()
            compose.waitUntil(5_000) {store.read()==ReadingPreferences(ReadingTheme.DARK,DEFAULT_READING_FONT_SIZE+2,ReadingSpacing.SPACIOUS)}
            screenshot("reading-appearance")
            compose.onNodeWithText("Okumaya dön").assertIsDisplayed().performClick()
            compose.runOnIdle {mount++;scale=2f}
            compose.onNodeWithContentDescription("Okuma görünümü").performClick()
            compose.onNodeWithText("${DEFAULT_READING_FONT_SIZE+2} punto").assertIsDisplayed()
            compose.onNodeWithText("Geniş").assertIsSelected()
            compose.onNodeWithText("Koyu").performScrollTo().assertIsSelected()
            compose.onNodeWithText("Okumaya dön").assertIsDisplayed()
            screenshot("reading-appearance-large-text")
            compose.onNodeWithText("Okumaya dön").performClick()
            compose.onNodeWithContentDescription("Okuma görünümü").assertIsDisplayed()
        } finally {context.getSharedPreferences(name,0).edit().clear().commit()}
    }

    /** Fixture-only images on the dedicated test emulator; no account or live content. */
    private fun screenshot(name: String) {
        if(Build.VERSION.SDK_INT<29) return
        compose.waitForIdle()
        val frames=CountDownLatch(1)
        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            Choreographer.getInstance().postFrameCallback {
                Choreographer.getInstance().postFrameCallback {frames.countDown()}
            }
        }
        check(frames.await(3,TimeUnit.SECONDS))
        val bitmap=if(name.startsWith("home")) compose.onRoot().captureToImage().asAndroidBitmap()
            else InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        val values=ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME,"english-tales-ux-$name.png")
            put(MediaStore.Images.Media.MIME_TYPE,"image/png")
            put(MediaStore.Images.Media.RELATIVE_PATH,"Pictures/EnglishTalesUX")
        }
        val resolver=context.contentResolver
        val uri=checkNotNull(resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,values))
        resolver.openOutputStream(uri)!!.use {bitmap.compress(Bitmap.CompressFormat.PNG,100,it)}
        bitmap.recycle()
    }
}
