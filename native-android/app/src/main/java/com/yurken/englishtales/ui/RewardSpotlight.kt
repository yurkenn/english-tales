package com.yurken.englishtales.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.yurken.englishtales.R
import com.yurken.englishtales.data.DailyActivity
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * A full-screen reward moment: slowly turning light rays and twinkling sparkles behind a hero drawing,
 * then a big title, a short line and one button. Used for streak milestones and earned streak freezes.
 */
@Composable
internal fun RewardSpotlight(
    title: String,
    text: String,
    buttonLabel: String,
    glow: Color,
    onDismiss: () -> Unit,
    confettiKey: Any? = null,
    extra: (@Composable ColumnScope.() -> Unit)? = null,
    hero: @Composable BoxScope.() -> Unit,
) {
    Dialog(onDismiss, DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)) {
        val still = reduceMotion()
        val entrance = remember { Animatable(if (still) 1f else 0f) }
        LaunchedEffect(Unit) { entrance.animateTo(1f, spring(dampingRatio = 0.55f, stiffness = Spring.StiffnessLow)) }
        Box(Modifier.fillMaxSize().background(TaleBackground).semantics { paneTitle = title }) {
            Column(Modifier.fillMaxSize().systemBarsPadding().padding(horizontal = 24.dp, vertical = 20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Spacer(Modifier.weight(0.6f))
                Box(Modifier.widthIn(max = 300.dp).fillMaxWidth().aspectRatio(1f), contentAlignment = Alignment.Center) {
                    SpotlightRays(glow, Modifier.matchParentSize())
                    Box(Modifier.fillMaxSize(0.62f).graphicsLayer { scaleX = entrance.value; scaleY = entrance.value; alpha = entrance.value.coerceIn(0f, 1f) },
                        contentAlignment = Alignment.Center, content = hero)
                    confettiKey?.let { ConfettiBurst(Modifier.matchParentSize(), it, pieces = 90) }
                }
                Spacer(Modifier.height(12.dp))
                Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold, color = TaleInk, textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().appearIn(1))
                Spacer(Modifier.height(10.dp))
                Text(text, style = MaterialTheme.typography.bodyLarge, color = TaleMuted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().appearIn(2))
                extra?.let { Spacer(Modifier.height(20.dp)); Column(Modifier.widthIn(max = 420.dp).fillMaxWidth().appearIn(3), content = it) }
                Spacer(Modifier.weight(1f))
                ChunkyButton(buttonLabel, onDismiss, Modifier.widthIn(max = 420.dp).fillMaxWidth())
            }
        }
    }
}

/** Soft rays fanning out from the centre, turning slowly, with a few sparkles that twinkle in and out. */
@Composable
internal fun SpotlightRays(color: Color, modifier: Modifier = Modifier, rays: Int = 10) {
    val still = reduceMotion()
    val transition = rememberInfiniteTransition(label = "spotlight")
    val turn = if (still) rememberUpdatedState(0f) else transition.animateFloat(0f, 360f, infiniteRepeatable(tween(24_000, easing = LinearEasing)), label = "rayTurn")
    val twinkle = if (still) rememberUpdatedState(0.5f) else transition.animateFloat(0f, 1f, infiniteRepeatable(tween(1_400, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "twinkle")
    Canvas(modifier) {
        val c = Offset(size.width / 2f, size.height / 2f)
        val reach = size.minDimension / 2f
        drawCircle(Brush.radialGradient(listOf(color.copy(alpha = 0.45f), color.copy(alpha = 0f)), c, reach * 0.75f), reach * 0.75f, c)
        rotate(turn.value, c) {
            val half = (PI / rays / 2.6).toFloat()
            repeat(rays) { i ->
                val a = (2 * PI * i / rays).toFloat()
                val path = Path().apply {
                    moveTo(c.x, c.y)
                    lineTo(c.x + cos(a - half) * reach, c.y + sin(a - half) * reach)
                    lineTo(c.x + cos(a + half) * reach, c.y + sin(a + half) * reach)
                    close()
                }
                drawPath(path, Brush.radialGradient(listOf(color.copy(alpha = 0.32f), color.copy(alpha = 0f)), c, reach))
            }
        }
        // Sparkles sit at fixed spots and alternate, so the scene keeps a quiet shimmer.
        listOf(Triple(0.22f, 0.26f, 0f), Triple(0.8f, 0.3f, 0.5f), Triple(0.26f, 0.78f, 0.7f), Triple(0.76f, 0.74f, 0.2f)).forEachIndexed { i, (x, y, phase) ->
            val t = ((twinkle.value + phase) % 1f).let { if (i % 2 == 0) it else 1f - it }
            val s = reach * (0.035f + 0.03f * t)
            val p = Offset(size.width * x, size.height * y)
            rotate(45f, p) { drawRect(Color.White.copy(alpha = 0.35f + 0.55f * t), Offset(p.x - s, p.y - s), Size(s * 2f, s * 2f)) }
        }
    }
}

/** An icy streak-freeze shield, drawn so it scales cleanly; it bobs gently while shown. */
@Composable
internal fun FreezeShield(modifier: Modifier = Modifier) {
    val still = reduceMotion()
    val bob = if (still) rememberUpdatedState(0f) else rememberInfiniteTransition(label = "shield")
        .animateFloat(-1f, 1f, infiniteRepeatable(tween(1_600, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "shieldBob")
    Canvas(modifier.graphicsLayer { translationY = bob.value * 6f * density; rotationZ = bob.value * 2f }) {
        val w = size.width; val h = size.height
        val body = Path().apply {
            moveTo(w * 0.14f, h * 0.2f)
            lineTo(w * 0.86f, h * 0.2f)
            cubicTo(w * 0.88f, h * 0.62f, w * 0.72f, h * 0.84f, w * 0.5f, h * 0.96f)
            cubicTo(w * 0.28f, h * 0.84f, w * 0.12f, h * 0.62f, w * 0.14f, h * 0.2f)
            close()
        }
        drawPath(body, Brush.verticalGradient(listOf(Color(0xFFA8F4FF), Color(0xFF3FD0EE), Color(0xFF18B4E0)), 0f, h))
        // A frosted cap with dripping icicles across the top.
        val cap = Path().apply {
            moveTo(w * 0.1f, h * 0.12f)
            quadraticBezierTo(w * 0.5f, h * 0.04f, w * 0.9f, h * 0.12f)
            lineTo(w * 0.9f, h * 0.24f)
            lineTo(w * 0.8f, h * 0.38f); lineTo(w * 0.72f, h * 0.26f)
            lineTo(w * 0.62f, h * 0.34f); lineTo(w * 0.5f, h * 0.24f)
            lineTo(w * 0.4f, h * 0.36f); lineTo(w * 0.3f, h * 0.27f)
            lineTo(w * 0.2f, h * 0.36f); lineTo(w * 0.1f, h * 0.24f)
            close()
        }
        drawPath(cap, Brush.verticalGradient(listOf(Color(0xFFE9FFFF), Color(0xFFBDF6FF)), 0f, h * 0.4f))
        drawLine(Color.White.copy(alpha = 0.9f), Offset(w * 0.36f, h * 0.13f), Offset(w * 0.62f, h * 0.11f), strokeWidth = w * 0.03f, cap = StrokeCap.Round)
        drawCircle(Color.White.copy(alpha = 0.85f), w * 0.025f, Offset(w * 0.24f, h * 0.15f))
        drawPath(body, Color.White.copy(alpha = 0.25f), style = Stroke(w * 0.02f))
    }
}

/** The last seven days as flames: studied days light up one after another, a freeze day shows ice, the rest stay grey. */
@Composable
internal fun WeekFlames(week: List<DailyActivity>, frozenDays: Set<String>, modifier: Modifier = Modifier) {
    val still = reduceMotion()
    Row(modifier.fillMaxWidth().background(TaleSurface, RoundedCornerShape(20.dp)).border(1.dp, TaleLine, RoundedCornerShape(20.dp)).padding(horizontal = 12.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween) {
        week.forEachIndexed { i, day ->
            val lit = day.sessions > 0
            val frozen = day.day in frozenDays
            val today = i == week.lastIndex
            val pop = remember { Animatable(if (still || !lit) 1f else 0.4f) }
            LaunchedEffect(lit) { if (lit && !still) { kotlinx.coroutines.delay(260L + i * 110L); pop.animateTo(1f, spring(dampingRatio = 0.4f, stiffness = Spring.StiffnessMedium)) } }
            Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(if (today) stringResource(R.string.weekly_today) else day.label, fontSize = 11.sp, maxLines = 1,
                    color = if (today) TaleBlue else TaleMuted, fontWeight = if (today) FontWeight.Bold else FontWeight.Normal)
                if (frozen && !lit) Text("❄", fontSize = 24.sp, color = Color(0xFF3FD0EE))
                else ReferenceIcon("flame", if (lit) TaleWarm else TaleLine, Modifier.size(28.dp).graphicsLayer { scaleX = pop.value; scaleY = pop.value })
            }
        }
    }
}
