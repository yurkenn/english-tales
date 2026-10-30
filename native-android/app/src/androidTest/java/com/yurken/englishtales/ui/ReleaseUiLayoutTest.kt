package com.yurken.englishtales.ui

import android.graphics.Bitmap
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.R
import com.yurken.englishtales.data.*
import com.yurken.englishtales.monetization.*
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import java.io.File

/** Release boundaries absent from the main-screen layout suite: populated week and active games. */
class ReleaseUiLayoutTest {
    @get:Rule val compose = createComposeRule()
    private val context get() = InstrumentationRegistry.getInstrumentation().targetContext
    private lateinit var words: List<WordInfo>
    private lateinit var snapshot: LearningSnapshot

    @Before fun content() {
        LearningContent.initialize(context)
        words = LearningContent.words.take(5)
        val week = listOf("Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz").mapIndexed { i, day ->
            DailyActivity("2026-10-${20+i}", day, if (i > 3) 1 else 0)
        }
        snapshot = LearningSnapshot(points=125, streak=3, streakFreezes=2, weeklyActivity=week,
            savedWordIds=words.map { it.id }.toSet(), readerHintSeen=true)
    }

    @Test fun populatedWeek() = check("week") {
        // The home owns scrolling; the weekly component itself is intentionally not scrollable.
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) { WeeklyActivity(snapshot) }
    }
    @Test fun streakWeek() = check("streak-week") {
        Column(Modifier.fillMaxSize()) { WeekFlames(snapshot.weeklyActivity, emptySet()) }
    }
    @Test fun matching() = check("matching",after={
        compose.onNodeWithText(words.last().word).performScrollTo().assertIsDisplayed()
        compose.onNodeWithText(words.last().translation).performScrollTo().assertIsDisplayed()
    }) {
        MatchingGame(words, 1, snapshot.savedWordIds, PaddingValues(), {_,_->}, {}, {}, {}, snapshot)
    }
    @Test fun flashcardFront() = check("flashcard-front") {
        FlashcardGame(words, 1, snapshot.savedWordIds, PaddingValues(), {_,_->}, {}, {}, {}, snapshot)
    }
    @Test fun flashcardAnswer() = check("flashcard-answer", tap=R.string.ogren_2) {
        FlashcardGame(words, 1, snapshot.savedWordIds, PaddingValues(), {_,_->}, {}, {}, {}, snapshot)
    }
    @Test fun longestFlashcardFront() = longCard(false)
    @Test fun longestFlashcardAnswer() = longCard(true)
    @Test fun gameResult() = check("game-result") {
        GameResult("Eşleştirme", 45, PaddingValues(), {}, {}, snapshot, 9, 10)
    }
    @Test fun language() = check("language") { LanguageWelcomeScreen(initialTag="tr") {} }
    @Test fun welcome() = check("welcome") { WelcomeScreen(AccountState(), {}, {}, {}) }
    @Test fun account() = check("account") { AccountScreen(AccountState(), {}, {_,_->}, {}) }
    @Test fun joinedLeagueCard() = check("league-card") {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            LeagueCard(LeagueUi.Ready(LeagueStanding(2, "2026-10-26", System.currentTimeMillis()+3*86_400_000L,
                true, false, 5, 2, listOf(LeagueMember(4, "Sen", 480, true, "me")), null)), {}, {})
        }
    }

    @Test fun exhaustedGuestEnergy() = energy("energy-guest", guest=true)
    @Test fun pendingAdEnergy() = energy("energy-ad-pending", adPending=true)
    @Test fun pendingPurchaseEnergy() = energy("energy-purchase-pending", purchasePending=true)
    @Test fun activePremiumEnergy() = energy("energy-premium", premium=true)

    private fun energy(name: String, guest: Boolean=false, adPending: Boolean=false,
        purchasePending: Boolean=false, premium: Boolean=false) {
        val state=EnergyState(0,0,System.currentTimeMillis()+86_400_000L,
            premiumUntil=if(premium) System.currentTimeMillis()+86_400_000L else 0)
        check(name, dark=premium, after={
            compose.onNodeWithContentDescription(context.getString(R.string.energy_close))
                .assertHeightIsAtLeast(48.dp).assertWidthIsAtLeast(48.dp)
            compose.onNodeWithText(context.getString(R.string.energy_retry_read))
                .performScrollTo().apply {if(premium) assertIsEnabled() else assertIsNotEnabled()}
            if(!guest && !premium) {
                compose.onNodeWithText(context.getString(R.string.energy_watch)).performScrollTo().assertIsNotEnabled()
                compose.onNodeWithText(context.getString(R.string.energy_offer_unavailable)).performScrollTo().assertIsDisplayed()
            } else compose.onNodeWithText(context.getString(R.string.energy_watch)).assertDoesNotExist()
            compose.onNodeWithText(context.getString(R.string.energy_terms)).performScrollTo().assertIsDisplayed()
        }) {
            EnergyScreenContent(MonetizationUi(policyEnabled=true,energy=state,
                adPending=adPending,purchasePending=purchasePending,offersLoaded=true),guest,true,
                EnergyScreenActions(onRead={}))
        }
    }

    @Test fun energyStatusAtLargeText() = check("energy-status", after={
        compose.onNodeWithTag("energy_status").assertHasClickAction().assertHeightIsAtLeast(48.dp)
    }) {
        EnergyStatusContent(MonetizationUi(policyEnabled=true,energy=EnergyState(3,0,0)),{})
    }

    private fun longCard(reveal: Boolean) {
        val word=LearningContent.words.maxBy { it.word.length }
        check(if(reveal) "long-card-answer" else "long-card-front", tap=if(reveal) R.string.ogren_2 else null, after={
            compose.onNodeWithContentDescription(context.getString(R.string.kelimesini_dinle,word.word))
                .performScrollTo().assertIsDisplayed().assertHeightIsAtLeast(48.dp)
            for(id in if(reveal) listOf(R.string.tekrar_et,R.string.hatirladim) else listOf(R.string.ogren_2)) {
                compose.onNodeWithText(context.getString(id)).performScrollTo().assertIsDisplayed()
            }
        }) {
            FlashcardGame(listOf(word), 1, setOf(word.id), PaddingValues(), {_,_->}, {}, {}, {}, snapshot)
        }
    }

    private fun check(name: String, tap: Int? = null, dark: Boolean = false, after: (() -> Unit)? = null, screen: @Composable () -> Unit) {
        compose.setContent {
            DeviceConfigurationOverride(DeviceConfigurationOverride.FontScale(2f) then
                DeviceConfigurationOverride.ForcedSize(DpSize(320.dp, 640.dp))) {
                // Exercise a visible combo badge without inheriting another test's default combo.
                CompositionLocalProvider(LocalCombo provides remember { ComboState(current=3,best=5) }) {
                    EnglishTalesTheme(dark=dark) { screen() }
                }
            }
        }
        compose.waitForIdle()
        tap?.let { compose.onNodeWithText(context.getString(it)).performScrollTo().performClick() }
        compose.mainClock.advanceTimeBy(2_000)
        compose.waitForIdle()
        capture(name)
        val problems = compose.onAllNodes(hasText("", substring=true),useUnmergedTree=true).fetchSemanticsNodes().flatMap { node ->
            val layouts = mutableListOf<TextLayoutResult>()
            node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(layouts)
            layouts.filter { layout -> layout.didOverflowHeight || (0 until layout.lineCount).any {
                layout.isLineEllipsized(it) || layout.getLineRight(it) > layout.size.width+1 || layout.getLineLeft(it) < -1
            } }.map { "cut: ${it.layoutInput.text}" }
        }
        assertEquals("$name loses text at 200% on a 320dp phone", emptyList<String>(), problems)
        after?.let {
            try { it() }
            catch(failure: AssertionError) { throw AssertionError("${failure.message}\n${compose.onRoot().printToString()}",failure) }
            finally { capture("$name-actions") }
        }
    }

    private fun capture(name: String) {
        compose.waitForIdle()
        val root=compose.onAllNodes(isRoot()).onLast()
        val dir=InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let(::File)
            ?: File(context.getExternalFilesDir(null),"release-ui")
        File(dir,"release-ui").apply {mkdirs()}.resolve("$name.png").outputStream().use {
            root.captureToImage().asAndroidBitmap().compress(Bitmap.CompressFormat.PNG,100,it)
        }
    }
}
