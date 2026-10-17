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
        compose.setContent {
            val resultOwner = checkNotNull(LocalActivityResultRegistryOwner.current)
            CompositionLocalProvider(LocalActivityResultRegistryOwner provides resultOwner, LocalContext provides context,
                LocalConfiguration provides context.resources.configuration) {
                EnglishTalesTheme {
                    LearningSettingsScreen(LearningSnapshot(), {}, { _, genre, _, _ -> savedGenre = genre })
                }
            }
        }
        compose.onNodeWithText("Daily life").performScrollTo().assertIsDisplayed()
        compose.onNodeWithText("Mystery").performScrollTo().performClick()
        compose.onNodeWithText("Gizem").assertDoesNotExist()
        compose.onNodeWithText("Save changes").performScrollTo().performClick()
        compose.runOnIdle { assertEquals("Gizem", savedGenre) }
    }
}
