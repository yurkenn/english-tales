package com.yurken.englishtales.ui

import android.graphics.Bitmap
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.R
import com.yurken.englishtales.data.*
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

    @Test fun populatedWeek() = check("week") { WeeklyActivity(snapshot) }
    @Test fun matching() = check("matching") {
        MatchingGame(words, 1, snapshot.savedWordIds, PaddingValues(), {_,_->}, {}, {}, {}, snapshot)
    }
    @Test fun flashcardFront() = check("flashcard-front") {
        FlashcardGame(words, 1, snapshot.savedWordIds, PaddingValues(), {_,_->}, {}, {}, {}, snapshot)
    }
    @Test fun flashcardAnswer() = check("flashcard-answer", tap=R.string.ogren_2) {
        FlashcardGame(words, 1, snapshot.savedWordIds, PaddingValues(), {_,_->}, {}, {}, {}, snapshot)
    }
    @Test fun gameResult() = check("game-result") {
        GameResult("Eşleştirme", 45, PaddingValues(), {}, {}, snapshot, 9, 10)
    }
    @Test fun language() = check("language") { LanguageWelcomeScreen(initialTag="tr") {} }
    @Test fun welcome() = check("welcome") { WelcomeScreen(AccountState(), {}, {}, {}) }
    @Test fun account() = check("account") { AccountScreen(AccountState(), {}, {_,_->}, {}) }
    @Test fun joinedLeagueCard() = check("league-card") {
        LeagueCard(LeagueUi.Ready(LeagueStanding(2, "2026-10-26", System.currentTimeMillis()+3*86_400_000L,
            true, false, 5, 2, listOf(LeagueMember(4, "Sen", 480, true, "me")), null)), {}, {})
    }

    private fun check(name: String, tap: Int? = null, screen: @Composable () -> Unit) {
        compose.setContent {
            DeviceConfigurationOverride(DeviceConfigurationOverride.FontScale(2f) then
                DeviceConfigurationOverride.ForcedSize(DpSize(320.dp, 640.dp))) {
                EnglishTalesTheme(dark=false) { screen() }
            }
        }
        compose.waitForIdle()
        tap?.let { compose.onNodeWithText(context.getString(it)).performScrollTo().performClick() }
        compose.mainClock.advanceTimeBy(2_000)
        compose.waitForIdle()
        val root = compose.onAllNodes(isRoot()).onLast()
        val dir = InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let(::File)
            ?: File(context.getExternalFilesDir(null), "release-ui")
        File(dir, "release-ui").apply { mkdirs() }.resolve("$name.png").outputStream().use {
            root.captureToImage().asAndroidBitmap().compress(Bitmap.CompressFormat.PNG, 100, it)
        }
        val problems = compose.onAllNodes(hasText("", substring=true)).fetchSemanticsNodes().flatMap { node ->
            val layouts = mutableListOf<TextLayoutResult>()
            node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(layouts)
            val text = node.config.getOrNull(SemanticsProperties.Text)?.joinToString { it.text }.orEmpty()
            layouts.filter { layout -> layout.didOverflowHeight || (0 until layout.lineCount).any {
                layout.isLineEllipsized(it) || layout.getLineRight(it) > layout.size.width+1 || layout.getLineLeft(it) < -1
            } }.map { "cut: $text" }
        }
        assertEquals("$name loses text at 200% on a 320dp phone", emptyList<String>(), problems)
    }
}
