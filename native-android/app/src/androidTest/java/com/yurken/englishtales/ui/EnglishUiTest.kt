package com.yurken.englishtales.ui

import android.content.res.Configuration
import android.os.LocaleList
import androidx.activity.compose.LocalActivityResultRegistryOwner
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.LearningSnapshot
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import java.util.Locale

class EnglishUiTest {
    @get:Rule val compose = createComposeRule()

    @Test fun englishGenreSelectionSavesTheExistingGenreValue() {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        val context = target.createConfigurationContext(Configuration(target.resources.configuration).apply {
            setLocales(LocaleList(Locale.ENGLISH))
        })
        var savedGenre = ""
        var savedGoal = 0
        compose.setContent {
            val resultOwner = checkNotNull(LocalActivityResultRegistryOwner.current)
            CompositionLocalProvider(LocalActivityResultRegistryOwner provides resultOwner, LocalContext provides context,
                LocalConfiguration provides context.resources.configuration) {
                EnglishTalesTheme {
                    LearningSettingsScreen(LearningSnapshot(), {}, { _, genre, goal, _ -> savedGenre = genre; savedGoal = goal })
                }
            }
        }
        compose.onNodeWithText("Daily life").performScrollTo().assertIsDisplayed()
        // Each setting opens its choices from its row.
        compose.onNodeWithText("Stories you like").performScrollTo().performClick()
        compose.onNodeWithText("Mystery").performScrollTo().performClick()
        compose.onNodeWithText("Gizem").assertDoesNotExist()
        compose.onNodeWithText("Your daily goal").performScrollTo().performClick()
        compose.onNode(hasText("1 step") and isSelectable()).performScrollTo().assertIsSelected()
        compose.onNode(hasText("2 steps") and isSelectable()).performScrollTo().performClick().assertIsSelected()
        compose.onNodeWithText("Save changes").performScrollTo().performClick()
        compose.runOnIdle { assertEquals("Gizem", savedGenre); assertEquals(2, savedGoal) }
    }
}
