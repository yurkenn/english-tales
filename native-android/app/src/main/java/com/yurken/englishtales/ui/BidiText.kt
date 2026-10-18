package com.yurken.englishtales.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection

/** Keep English punctuation with its English argument inside an Arabic/Urdu sentence. */
internal fun englishArgument(text: String, rtl: Boolean): String = if (rtl) "\u2066$text\u2069" else text

@Composable
internal fun englishArgument(text: String): String = englishArgument(text, LocalLayoutDirection.current == LayoutDirection.Rtl)
