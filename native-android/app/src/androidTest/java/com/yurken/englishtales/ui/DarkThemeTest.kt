package com.yurken.englishtales.ui

import android.graphics.Bitmap
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import java.io.File

/** Main screens follow the system dark theme instead of keeping white surfaces (Q3.3). */
class DarkThemeTest {
    @get:Rule val compose=createComposeRule()
    private val context get()=InstrumentationRegistry.getInstrumentation().targetContext
    private lateinit var story: Story
    private lateinit var snapshot: LearningSnapshot

    @Before fun content() {
        LearningContent.initialize(context)
        story=LearningContent.stories.first {it.sentences.size>8}
        val words=LearningContent.words.take(6).map {it.id}
        snapshot=LearningSnapshot(lastStoryId=story.id,storyProgress=mapOf(story.id to 40),points=125,streak=3,
            savedWordIds=words.toSet(),dueWordIds=words,readerHintSeen=true)
    }

    @Test fun study() = dark("study") {Scaffold(bottomBar={TalesBottomBar(0) {}}) {StudyScreen(snapshot,{},{},it,{},{})}}
    @Test fun catalog() = dark("catalog") {Scaffold {CatalogScreen(snapshot,{},it)}}
    @Test fun storyDetail() = dark("detail") {StoryDetailScreen(story,40,{},{},{},{})}
    @Test fun profile() = dark("profile") {Scaffold {ProfileScreen(snapshot,{},it,{})}}
    @Test fun savedWords() = dark("words") {SavedWordsScreen(snapshot,{},{})}
    @Test fun practice() = dark("practice") {Scaffold {PracticeScreen(snapshot,{_,_,_,_,_->},{_,_->},it,{_,_,_->},{_,_->},{})}}
    @Test fun settings() = dark("settings") {LearningSettingsScreen(snapshot,{},{_,_,_,_->})}
    @Test fun onboarding() = dark("onboarding") {OnboardingScreen(analyticsControls={}) {_,_,_->}}

    private fun dark(name: String, screen: @Composable () -> Unit) {
        compose.setContent {EnglishTalesTheme(dark=true) {screen()}}
        compose.waitForIdle()
        val bitmap=compose.onRoot().captureToImage().asAndroidBitmap()
        File(context.getExternalFilesDir("dark-theme"),"$name.png").outputStream().use {bitmap.compress(Bitmap.CompressFormat.PNG,100,it)}
        assertTrue("$name keeps a light background",brightShare(bitmap)<0.2)
    }

    /** Share of near-white pixels; a dark screen keeps them to text, covers and accents. */
    private fun brightShare(bitmap: Bitmap): Double {
        var bright=0;var total=0
        for(y in 0 until bitmap.height step 4) for(x in 0 until bitmap.width step 4) {
            val p=bitmap.getPixel(x,y)
            if((p shr 16 and 0xFF)>235 && (p shr 8 and 0xFF)>235 && (p and 0xFF)>235) bright++
            total++
        }
        return bright.toDouble()/total
    }
}
