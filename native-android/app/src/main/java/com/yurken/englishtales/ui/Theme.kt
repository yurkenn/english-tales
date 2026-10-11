package com.yurken.englishtales.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.Shapes
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.unit.dp
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val TaleBlue = Color(0xFF00A6EC)
val TaleBlueDark = TaleBlue
val TaleInk = Color(0xFF17181B)
val TaleMuted = Color(0xFF9AA5B3)
val TaleBackground = Color.White
val TaleLine = Color(0xFFEEF2F5)
val TaleYellow = Color(0xFFFFCE00)
val TaleCream = Color.White
val TaleMint = Color(0xFFE0F5FF)
val TaleNavy = Color(0xFF22242A)
val TalePurple = Color(0xFFAC59F0)

private val taleColors = lightColorScheme(
    primary = TaleBlue,
    onPrimary = Color.White,
    primaryContainer = TaleMint,
    onPrimaryContainer = TaleBlueDark,
    secondary = TalePurple,
    secondaryContainer = TaleLine,
    surfaceVariant = TaleLine,
    onSurfaceVariant = TaleMuted,
    background = TaleBackground,
    onBackground = TaleInk,
    surface = Color.White,
    onSurface = TaleInk,
    outline = TaleLine
)

private val taleTypography = Typography(
    headlineMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 27.sp, lineHeight = 32.sp, fontWeight = FontWeight.Bold),
    headlineSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 23.sp, lineHeight = 28.sp, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 20.sp, lineHeight = 25.sp, fontWeight = FontWeight.Medium),
    titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 16.sp, lineHeight = 21.sp, fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 15.sp, lineHeight = 22.sp),
    bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 14.sp, lineHeight = 21.sp),
    bodySmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 12.sp, lineHeight = 18.sp),
    labelMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 12.sp, lineHeight = 16.sp, fontWeight = FontWeight.SemiBold)
)

@Composable
fun EnglishTalesTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = taleColors, typography = taleTypography,
        shapes = Shapes(extraSmall = RoundedCornerShape(4.dp), small = RoundedCornerShape(6.dp),
            medium = RoundedCornerShape(10.dp), large = RoundedCornerShape(12.dp), extraLarge = RoundedCornerShape(6.dp)),
        content = content)
}
