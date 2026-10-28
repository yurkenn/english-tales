package com.yurken.englishtales.ui

import android.graphics.Bitmap
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.test.DeviceConfigurationOverride
import androidx.compose.ui.test.ForcedSize
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.isRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.R
import com.yurken.englishtales.data.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import java.io.File

/**
 * Renders every main screen on a 390 x 844 dp phone and saves it as a picture, so the app can be
 * compared screen by screen with the design canvas. It checks nothing; CI keeps the pictures.
 */
class DesignGalleryTest {
    @get:Rule val compose=createComposeRule()
    private val context get()=InstrumentationRegistry.getInstrumentation().targetContext
    private lateinit var story: Story
    private lateinit var words: List<WordInfo>
    private lateinit var snapshot: LearningSnapshot

    @Before fun content() {
        LearningContent.initialize(context)
        story=LearningContent.stories.first {it.sentences.size>8}
        words=LearningContent.words.take(10)
        val ids=words.map {it.id}
        val week=listOf("Pt","Sa","Ça","Pe","Cu","Ct","Pz").mapIndexed {i,day -> DailyActivity("2026-10-${20+i}",day,if(i in 3..5) 1 else 0)}
        snapshot=LearningSnapshot(lastStoryId=story.id,storyProgress=mapOf(story.id to 42),points=125,streak=3,
            savedWordIds=ids.toSet(),dueWordIds=ids.take(7),readerHintSeen=true,weeklyActivity=week,displayName="Oğuz")
    }

    @Test fun g01_language() = shot("01-dil") {LanguageWelcomeScreen(initialTag="tr") {}}
    @Test fun g02_welcome() = shot("02-karsilama") {WelcomeScreen(AccountState(),{},{},{})}
    @Test fun g03_level() = shot("03-seviye",tap=listOf(R.string.baslayalim)) {OnboardingScreen(analyticsControls={}) {_,_,_->}}
    @Test fun g04_placement() = shot("04-seviye-testi",tap=listOf(R.string.placement_start)) {PlacementScreen({},{})}
    @Test fun g05_study() = shot("05-calis") {Scaffold(bottomBar={TalesBottomBar(0) {}}) {StudyScreen(snapshot,{},{},it,{},{})}}
    @Test fun g06_library() = shot("06-oku") {Scaffold(bottomBar={TalesBottomBar(1) {}}) {CatalogScreen(snapshot,{},it)}}
    @Test fun g07_detail() = shot("07-hikaye") {StoryDetailScreen(story,42,{},{},{},{})}
    @Test fun g08_reader() = shot("08-okuyucu") {ReaderScreen(story,snapshot,onBack={},onSaveWord={},onProgress={_,_->},
        onComplete={},onHintDismiss={},sessionId="gallery",onCheckpoint={_,_->})}
    @Test fun g09_readingResult() = shot("09-okuma-sonucu") {ReadingResultScreen(story,snapshot,{},{})}
    @Test fun g10_words() = shot("10-kelimelerim") {SavedWordsScreen(snapshot,{},{})}
    @Test fun g11_play() = shot("11-oyna") {Scaffold(bottomBar={TalesBottomBar(2) {}}) {PracticeScreen(snapshot,{_,_,_,_,_->},{_,_->},it,{_,_,_->},{_,_->},{})}}
    @Test fun g12_match() = shot("12-eslestir") {MatchingGame(words.take(5),1,snapshot.savedWordIds,PaddingValues(),{_,_->},{},{},{},snapshot)}
    @Test fun g13_cards() = shot("13-kartlar") {FlashcardGame(words,1,snapshot.savedWordIds,PaddingValues(),{_,_->},{},{},{},snapshot)}
    @Test fun g14_gameResult() = shot("14-oyun-sonucu") {GameResult("Eşleştirme",45,PaddingValues(),{},{},snapshot,9,10)}
    @Test fun g15_profile() = shot("15-profil") {Scaffold(bottomBar={TalesBottomBar(3) {}}) {ProfileScreen(snapshot,{},it,{})}}
    @Test fun g16_league() = shot("16-lig") {
        val names=listOf("Ayşe" to 620,"Mert" to 540,"Deniz" to 515,"Sen" to 480,"Elif" to 470,"Can" to 120,"Zeynep" to 90)
        val members=names.mapIndexed {i,(name,xp) -> LeagueMember(i+1,name,xp,name=="Sen","m$i")}
        LeagueScreen(LeagueUi.Ready(LeagueStanding(2,"2026-10-26",System.currentTimeMillis()+3*86_400_000L,true,false,5,2,members,null)),"Oğuz",{},{},{},{})
    }
    @Test fun g17_chest() = shot("17-sandik") {Column {DailyQuestsCard(snapshot,ChestUi.Opened(30,true),{},{})}}
    @Test fun g18_streak() = shot("18-seri-kutlama") {StreakMilestoneDialog(7,snapshot.weeklyActivity,emptySet()) {}}
    @Test fun g19_settings() = shot("19-ayarlar") {LearningSettingsScreen(snapshot,{},{_,_,_,_->})}
    @Test fun g20_account() = shot("20-hesap") {AccountScreen(AccountState(),{},{_,_->},{})}
    @Test fun g21_empty() = shot("21-bos-durum") {SavedWordsScreen(LearningSnapshot(),{},{},onBrowse={})}

    private fun shot(name: String, tap: List<Int> = emptyList(), screen: @Composable () -> Unit) {
        compose.setContent {
            DeviceConfigurationOverride(DeviceConfigurationOverride.ForcedSize(DpSize(390.dp,844.dp))) {EnglishTalesTheme(dark=false) {screen()}}
        }
        compose.waitForIdle()
        tap.forEach {compose.onNodeWithText(context.getString(it)).performScrollTo().performClick();compose.waitForIdle()}
        compose.mainClock.advanceTimeBy(2_000)
        compose.waitForIdle()
        val image=compose.onAllNodes(isRoot()).onLast().captureToImage().asAndroidBitmap()
        // Phone-width pictures keep the CI log that carries them small.
        val small=Bitmap.createScaledBitmap(image,390,image.height*390/image.width,true)
        val dir=InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let {File(it)}
            ?: File(context.getExternalFilesDir(null),"gallery")
        File(dir,"gallery").apply {mkdirs()}.resolve("$name.jpg").outputStream().use {small.compress(Bitmap.CompressFormat.JPEG,82,it)}
    }
}
