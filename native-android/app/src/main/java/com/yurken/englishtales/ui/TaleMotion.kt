package com.yurken.englishtales.ui

import android.provider.Settings
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.ui.semantics.Role
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import kotlinx.coroutines.delay
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

/** Durations shared by every screen, so motion feels like one system. */
object TaleMotion {
    const val quick = 160
    const val standard = 260
    const val emphasized = 420
    const val stagger = 45L
    val spring: SpringSpec<Float> = spring(dampingRatio = 0.55f, stiffness = Spring.StiffnessMediumLow)
}

/** True when the learner turned animations off in the system settings; decorative motion is then skipped. */
@Composable
internal fun reduceMotion(): Boolean {
    val context = LocalContext.current
    return remember(context) {
        runCatching { Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f }.getOrDefault(false)
    }
}

/** Fades and lifts an element in on first appearance; [index] staggers siblings in a list. */
fun Modifier.appearIn(index: Int = 0): Modifier = composed {
    val still = reduceMotion()
    val progress = remember { Animatable(if (still) 1f else 0f) }
    LaunchedEffect(Unit) {
        if (!still) {
            delay(TaleMotion.stagger * index.coerceAtMost(8))
            progress.animateTo(1f, tween(TaleMotion.emphasized, easing = FastOutSlowInEasing))
        }
    }
    graphicsLayer {
        alpha = progress.value
        translationY = (1f - progress.value) * 18f * density
    }
}

/** Shakes sideways each time [trigger] grows; used for wrong answers. */
fun Modifier.shakeOn(trigger: Int): Modifier = composed {
    val offset = remember { Animatable(0f) }
    val still = reduceMotion()
    LaunchedEffect(trigger) {
        if (trigger > 0 && !still) {
            for (x in listOf(-10f, 9f, -7f, 5f, -3f, 0f)) offset.animateTo(x, tween(45))
        }
    }
    graphicsLayer { translationX = offset.value * density }
}

/** A short scale "pop" each time [trigger] grows; used for correct answers and rewards. */
fun Modifier.popOn(trigger: Int): Modifier = composed {
    val scale = remember { Animatable(1f) }
    val still = reduceMotion()
    LaunchedEffect(trigger) {
        if (trigger > 0 && !still) {
            scale.animateTo(1.08f, tween(110))
            scale.animateTo(1f, TaleMotion.spring)
        }
    }
    graphicsLayer { scaleX = scale.value; scaleY = scale.value }
}

/** Counts up to [value] the first time and on every change, like a score board. */
@Composable
fun AnimatedCounter(value: Int, modifier: Modifier = Modifier, style: TextStyle = LocalTextStyle.current, color: Color = Color.Unspecified, prefix: String = "") {
    val still = reduceMotion()
    val animated = remember { Animatable(if (still) value.toFloat() else 0f) }
    LaunchedEffect(value) { animated.animateTo(value.toFloat(), tween(if (still) 0 else 700, easing = FastOutSlowInEasing)) }
    // The final value is announced; screen readers should not hear every intermediate number.
    Text(prefix + animated.value.toInt(), modifier, style = style, color = color)
}

private data class Particle(val angle: Float, val speed: Float, val spin: Float, val color: Color, val size: Float, val drift: Float)

/** A one-shot burst of brand-colored paper pieces from the top centre; purely decorative. */
@Composable
fun ConfettiBurst(modifier: Modifier = Modifier, key: Any = Unit, pieces: Int = 70) {
    if (reduceMotion()) return
    val colors = LocalTaleColors.current.let { listOf(TaleYellow, it.blue, it.purple, it.success, it.warm) }
    val particles = remember(key) {
        val random = Random(key.hashCode())
        List(pieces) {
            Particle(angle = (PI * (0.15 + random.nextDouble() * 0.7)).toFloat(), speed = 0.55f + random.nextFloat() * 0.7f,
                spin = random.nextFloat() * 720f - 360f, color = colors[random.nextInt(colors.size)],
                size = 5f + random.nextFloat() * 6f, drift = random.nextFloat() * 2f - 1f)
        }
    }
    val time = remember(key) { Animatable(0f) }
    LaunchedEffect(key) { time.animateTo(1f, tween(1800, easing = LinearEasing)) }
    if (time.value >= 1f) return
    Canvas(modifier.fillMaxSize()) {
        val t = time.value
        val origin = Offset(size.width / 2f, size.height * 0.18f)
        particles.forEach { p ->
            val distance = p.speed * size.minDimension * 0.75f * t
            val x = origin.x + cos(p.angle) * distance * (if (p.drift < 0) -1 else 1) + p.drift * 30f * t
            val y = origin.y - sin(p.angle) * distance * 0.9f + size.height * 0.9f * t * t
            val fade = (1f - t).coerceIn(0f, 1f)
            rotate(p.spin * t, Offset(x, y)) {
                drawRect(p.color.copy(alpha = fade), Offset(x - p.size, y - p.size / 2f), Size(p.size * 2f, p.size * density / 2.5f))
            }
        }
    }
}

/** Gently breathes while [active]; for play buttons during narration. Stops completely when inactive. */
fun Modifier.pulseWhile(active: Boolean): Modifier = composed {
    val scale = remember { Animatable(1f) }
    val still = reduceMotion()
    LaunchedEffect(active) {
        if (active && !still) {
            while (true) {
                scale.animateTo(1.06f, tween(520, easing = FastOutSlowInEasing))
                scale.animateTo(1f, tween(520, easing = FastOutSlowInEasing))
            }
        } else scale.animateTo(1f, tween(TaleMotion.quick))
    }
    graphicsLayer { scaleX = scale.value; scaleY = scale.value }
}

/** Screen-to-screen transitions for the navigation host. */
internal val taleEnter: EnterTransition = fadeIn(tween(TaleMotion.standard)) + slideInHorizontally(tween(TaleMotion.standard, easing = FastOutSlowInEasing)) { it / 8 }
internal val taleExit: ExitTransition = fadeOut(tween(TaleMotion.quick))
internal val talepopEnter: EnterTransition = fadeIn(tween(TaleMotion.standard)) + slideInHorizontally(tween(TaleMotion.standard, easing = FastOutSlowInEasing)) { -it / 8 }
internal val talePopExit: ExitTransition = fadeOut(tween(TaleMotion.quick)) + slideOutHorizontally(tween(TaleMotion.standard)) { it / 8 }

/** Cross-fades between tabs or steps with a slight lift. */
@Composable
internal fun <T> TaleSwitch(target: T, modifier: Modifier = Modifier, content: @Composable (T) -> Unit) {
    AnimatedContent(target, modifier, transitionSpec = {
        (fadeIn(tween(TaleMotion.standard)) + slideInVertically(tween(TaleMotion.standard)) { it / 24 }) togetherWith fadeOut(tween(TaleMotion.quick))
    }, label = "switch") { content(it) }
}

/** Keeps a decorative layer above content without taking touches. */
@Composable
internal fun Celebration(key: Any, content: @Composable () -> Unit) {
    Box { content(); ConfettiBurst(Modifier.fillMaxSize(), key) }
}

internal suspend fun Animatable<Float, AnimationVector1D>.bounce() {
    animateTo(-10f, tween(140)); animateTo(0f, TaleMotion.spring)
}

/** Scales the element down a little while pressed and runs [onClick]; keeps the platform ripple. */
fun Modifier.pressScale(enabled: Boolean = true, role: Role = Role.Button, onClick: () -> Unit): Modifier = composed {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed && enabled) 0.97f else 1f, spring(stiffness = Spring.StiffnessMedium), label = "press")
    graphicsLayer { scaleX = scale; scaleY = scale }
        .clickable(interactionSource = source, indication = LocalIndication.current, enabled = enabled, role = role, onClick = onClick)
}
