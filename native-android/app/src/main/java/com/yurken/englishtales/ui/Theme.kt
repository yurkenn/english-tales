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
import androidx.compose.ui.text.font.Font
import com.yurken.englishtales.R
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/** Theme-aware colors; every text/background pair keeps at least 4.5:1 contrast (TaleColorsContrastTest). */
@Immutable
data class TaleColors(
    val blue: Color, val onBlue: Color, val ink: Color, val muted: Color, val background: Color, val surface: Color,
    val line: Color, val mint: Color, val purple: Color, val onPurple: Color, val success: Color, val error: Color,
    val warm: Color, val gold: Color, val tileBlue: Color, val tileYellow: Color, val tilePurple: Color,
    val tileGreen: Color, val panel: Color, val dark: Boolean,
    // The game green of the "go" buttons and progress fills, with the text that sits on it.
    val green: Color = Color(0xFF2BB673), val onGreen: Color = Color(0xFF0B2E1D),
)

val LightTaleColors = TaleColors(
    // The playful look: white cards on a pale blue ground, outlined in a cool gray that also forms their lip.
    blue = Color(0xFF006CA8), onBlue = Color.White, ink = Color(0xFF17212B), muted = Color(0xFF4A5A6A),
    background = Color(0xFFF1F7FB), surface = Color.White, line = Color(0xFFDCE8F0), mint = Color(0xFFDDF0FA),
    purple = Color(0xFF8B3FD9), onPurple = Color.White, success = Color(0xFF2E7D32), error = Color(0xFFB3261E),
    warm = Color(0xFFC2410C), gold = Color(0xFF8A6400), tileBlue = Color(0xFFDDF0FA), tileYellow = Color(0xFFFFF6CC),
    tilePurple = Color(0xFFF0E5FF), tileGreen = Color(0xFFE3F7EC), panel = Color(0xFFF1F7FB), dark = false,
)

val DarkTaleColors = TaleColors(
    blue = Color(0xFF7CC4F2), onBlue = Color(0xFF00263D), ink = Color(0xFFE7E9EC), muted = Color(0xFFA4AFBC),
    background = Color(0xFF111316), surface = Color(0xFF1A1D21), line = Color(0xFF2C3138), mint = Color(0xFF123247),
    purple = Color(0xFFC4A3F2), onPurple = Color(0xFF2A1450), success = Color(0xFF9AD77A), error = Color(0xFFFF9A8A),
    warm = Color(0xFFFF9466), gold = Color(0xFFFFCE4A), tileBlue = Color(0xFF15303F), tileYellow = Color(0xFF3A3218),
    tilePurple = Color(0xFF2E2440), tileGreen = Color(0xFF1E3320), panel = Color(0xFF1D2025), dark = true,
    green = Color(0xFF5FD39A), onGreen = Color(0xFF062014),
)

val LocalTaleColors = staticCompositionLocalOf { LightTaleColors }

val TaleBlue: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.blue
val TaleOnBlue: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.onBlue
val TaleInk: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.ink
val TaleMuted: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.muted
val TaleBackground: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.background
val TaleSurface: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.surface
val TaleLine: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.line
val TaleMint: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.mint
val TalePurple: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.purple
val TaleOnPurple: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.onPurple
val TaleSuccess: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.success
val TaleError: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.error
val TaleWarm: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.warm
val TaleGold: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.gold
val TalePanel: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.panel
val TaleGreen: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.green
val TaleOnGreen: Color @Composable @ReadOnlyComposable get() = LocalTaleColors.current.onGreen
// Brand yellow reads the same in both themes; only [TaleOnYellow] text sits on it.
val TaleYellow = Color(0xFFFFCE00)
val TaleOnYellow = Color(0xFF3A2A00)
// Streak orange and the wrong-answer red of the playful look, the same in both themes.
val TaleOrange = Color(0xFFFF8A00)
val TaleOnOrange = Color(0xFF2B1500)
val TaleRed = Color(0xFFD93A40)

/** Rounded display face of the playful look: screen titles, card titles and big numbers. */
val TaleDisplay = FontFamily(Font(R.font.baloo2_semibold, FontWeight.SemiBold), Font(R.font.baloo2_bold, FontWeight.Bold),
    Font(R.font.baloo2_extrabold, FontWeight.ExtraBold))
/** Body face; scripts it lacks (Arabic, Thai, Bengali, Devanagari) fall back to the system font per glyph. */
val TaleBody = FontFamily(Font(R.font.nunito_regular, FontWeight.Normal), Font(R.font.nunito_semibold, FontWeight.SemiBold),
    Font(R.font.nunito_bold, FontWeight.Bold), Font(R.font.nunito_extrabold, FontWeight.ExtraBold))

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
    headlineMedium = TextStyle(fontFamily = TaleDisplay, fontSize = 28.sp, lineHeight = 32.sp, fontWeight = FontWeight.ExtraBold),
    headlineSmall = TextStyle(fontFamily = TaleDisplay, fontSize = 24.sp, lineHeight = 28.sp, fontWeight = FontWeight.ExtraBold),
    titleLarge = TextStyle(fontFamily = TaleDisplay, fontSize = 21.sp, lineHeight = 25.sp, fontWeight = FontWeight.Bold),
    titleMedium = TextStyle(fontFamily = TaleBody, fontSize = 16.sp, lineHeight = 21.sp, fontWeight = FontWeight.Bold),
    titleSmall = TextStyle(fontFamily = TaleBody, fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Bold),
    bodyLarge = TextStyle(fontFamily = TaleBody, fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontFamily = TaleBody, fontSize = 14.sp, lineHeight = 21.sp),
    bodySmall = TextStyle(fontFamily = TaleBody, fontSize = 12.sp, lineHeight = 18.sp),
    labelLarge = TextStyle(fontFamily = TaleBody, fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Bold),
    labelMedium = TextStyle(fontFamily = TaleBody, fontSize = 12.sp, lineHeight = 16.sp, fontWeight = FontWeight.Bold),
    labelSmall = TextStyle(fontFamily = TaleBody, fontSize = 11.sp, lineHeight = 16.sp, fontWeight = FontWeight.Bold),
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
