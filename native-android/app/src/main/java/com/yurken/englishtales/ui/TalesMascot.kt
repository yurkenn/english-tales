package com.yurken.englishtales.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import com.yurken.englishtales.R

internal enum class MascotMood(val drawable: Int) {
    Welcome(R.drawable.mascot_welcome),
    Thinking(R.drawable.mascot_thinking),
    Celebrate(R.drawable.mascot_celebrate),
    Support(R.drawable.mascot_support),
    Reading(R.drawable.mascot_reading),
    Proud(R.drawable.mascot_proud),
    Sleepy(R.drawable.mascot_sleepy)
}

/** Decorative companion: nearby text carries the meaning for screen readers. */
@Composable
internal fun TalesMascot(mood: MascotMood, modifier: Modifier = Modifier, description: String? = null, animate: Boolean = false) {
    val motion = remember(mood) { Animatable(0f) }
    LaunchedEffect(mood, animate) {
        if (animate && (mood == MascotMood.Welcome || mood == MascotMood.Celebrate || mood == MascotMood.Proud)) {
            motion.animateTo(1f, tween(220))
            motion.animateTo(0f, tween(320))
        }
    }
    Image(painterResource(mood.drawable), description,
        modifier.graphicsLayer {
            if (mood == MascotMood.Welcome) rotationZ = motion.value * -4f
            if (mood == MascotMood.Celebrate || mood == MascotMood.Proud) translationY = motion.value * -6f * density
        }, contentScale = ContentScale.Fit)
}
