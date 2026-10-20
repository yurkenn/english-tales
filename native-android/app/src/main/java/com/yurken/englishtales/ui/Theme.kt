package com.yurken.englishtales.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.Shapes
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/** Theme-aware colors; every text/background pair keeps at least 4.5:1 contrast (TaleColorsContrastTest). */
@Immutable
data class TaleColors(
    val blue: Color, val onBlue: Color, val ink: Color, val muted: Color, val background: Color, val surface: Color,
    val line: Color, val mint: Color, val purple: Color, val onPurple: Color, val success: Color, val error: Color,
    val warm: Color, val gold: Color, val tileBlue: Color, val tileYellow: Color, val tilePurple: Color,
    val tileGreen: Color, val panel: Color, val dark: Boolean,
)

val LightTaleColors = TaleColors(
    blue = Color(0xFF006CA8), onBlue = Color.White, ink = Color(0xFF17181B), muted = Color(0xFF596777),
    background = Color.White, surface = Color.White, line = Color(0xFFE8EDF3), mint = Color(0xFFE0F5FF),
    purple = Color(0xFF7846BD), onPurple = Color.White, success = Color(0xFF2E7D32), error = Color(0xFFB3261E),
    warm = Color(0xFFC2410C), gold = Color(0xFF8A6400), tileBlue = Color(0xFFE3F6FF), tileYellow = Color(0xFFFFF6D5),
    tilePurple = Color(0xFFF0E5FF), tileGreen = Color(0xFFE9F7E2), panel = Color(0xFFF8F8F8), dark = false,
)

val DarkTaleColors = TaleColors(
    blue = Color(0xFF7CC4F2), onBlue = Color(0xFF00263D), ink = Color(0xFFE7E9EC), muted = Color(0xFFA4AFBC),
    background = Color(0xFF111316), surface = Color(0xFF1A1D21), line = Color(0xFF2C3138), mint = Color(0xFF123247),
    purple = Color(0xFFC4A3F2), onPurple = Color(0xFF2A1450), success = Color(0xFF9AD77A), error = Color(0xFFFF9A8A),
    warm = Color(0xFFFF9466), gold = Color(0xFFFFCE4A), tileBlue = Color(0xFF15303F), tileYellow = Color(0xFF3A3218),
    tilePurple = Color(0xFF2E2440), tileGreen = Color(0xFF1E3320), panel = Color(0xFF1D2025), dark = true,
)

val LocalTaleColors = staticCompositionLocalOf { LightTaleColors }

val TaleBlue: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.blue
val TaleOnBlue: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.onBlue
val TaleBlueDark: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.blue
val TaleInk: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.ink
val TaleMuted: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.muted
val TaleBackground: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.background
val TaleSurface: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.surface
val TaleLine: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.line
val TaleCream: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.surface
val TaleMint: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.mint
val TaleNavy: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.ink
val TalePurple: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.purple
val TaleOnPurple: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.onPurple
val TaleSuccess: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.success
val TaleError: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.error
val TaleWarm: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.warm
val TaleGold: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.gold
val TalePanel: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.panel
// Brand yellow reads the same in both themes; it never carries text.
val TaleYellow = Color(0xFFFFCE00)

private fun colorScheme(c: TaleColors) = if(c.dark) darkColorScheme(
    primary = c.blue, onPrimary = c.onBlue, primaryContainer = c.mint, onPrimaryContainer = c.ink,
    secondary = c.purple, onSecondary = c.onPurple, secondaryContainer = c.line, onSecondaryContainer = c.ink,
    surfaceVariant = c.line, onSurfaceVariant = c.muted, background = c.background, onBackground = c.ink,
    surface = c.surface, onSurface = c.ink, surfaceTint = c.blue, surfaceContainerLow = c.surface,
    surfaceContainer = c.surface, surfaceContainerHigh = c.panel, outline = c.line, error = c.error,
) else lightColorScheme(
    primary = c.blue, onPrimary = c.onBlue, primaryContainer = c.mint, onPrimaryContainer = c.blue,
    secondary = c.purple, secondaryContainer = c.line,
    surfaceVariant = c.line, onSurfaceVariant = c.muted, background = c.background, onBackground = c.ink,
    surface = c.surface, surfaceTint = c.blue, surfaceContainerLow = Color(0xFFF3F6FA), onSurface = c.ink,
    outline = c.line, error = c.error,
)

private val taleTypography = Typography(
    headlineMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 27.sp, lineHeight = 32.sp, fontWeight = FontWeight.Bold),
    headlineSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 23.sp, lineHeight = 28.sp, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 20.sp, lineHeight = 25.sp, fontWeight = FontWeight.Medium),
    titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 16.sp, lineHeight = 21.sp, fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 14.sp, lineHeight = 21.sp),
    bodySmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 12.sp, lineHeight = 18.sp),
    labelMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 12.sp, lineHeight = 16.sp, fontWeight = FontWeight.SemiBold)
)

@Composable
fun EnglishTalesTheme(dark: Boolean = when(AppTheme.mode) { AppThemeMode.SYSTEM -> isSystemInDarkTheme(); AppThemeMode.LIGHT -> false; AppThemeMode.DARK -> true }, content: @Composable () -> Unit) {
    TaleColorTheme(if(dark) DarkTaleColors else LightTaleColors, content)
}

/** Applies a palette to Tale tokens, Material components and default text; the reader uses it for its own theme. */
@Composable
fun TaleColorTheme(colors: TaleColors, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalTaleColors provides colors) {
        MaterialTheme(colorScheme = colorScheme(colors), typography = taleTypography,
            shapes = Shapes(extraSmall = RoundedCornerShape(6.dp), small = RoundedCornerShape(10.dp),
                medium = RoundedCornerShape(14.dp), large = RoundedCornerShape(20.dp), extraLarge = RoundedCornerShape(24.dp))) {
            CompositionLocalProvider(LocalContentColor provides colors.ink, content = content)
        }
    }
}
