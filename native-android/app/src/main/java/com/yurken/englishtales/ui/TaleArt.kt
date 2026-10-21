package com.yurken.englishtales.ui

import android.content.Context
import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import com.yurken.englishtales.R

/** Crest art per league tier, from bronze (1) to diamond (5). */
internal fun leagueArt(tier: Int) = when (tier.coerceIn(1, 5)) {
    1 -> R.drawable.league_1; 2 -> R.drawable.league_2; 3 -> R.drawable.league_3; 4 -> R.drawable.league_4; else -> R.drawable.league_5
}

/** Medal art for each badge id the store unlocks; unknown ids fall back to the first-story medal. */
internal fun badgeArt(id: String) = when (id) {
    "first_practice" -> R.drawable.badge_first_practice
    "five_words" -> R.drawable.badge_five_words
    "three_day_streak" -> R.drawable.badge_three_day_streak
    "seven_day_streak" -> R.drawable.badge_seven_day_streak
    else -> R.drawable.badge_first_story
}

private val grayscale = ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(0f) })

/** A decorative drawing; [locked] shows it grey and faded, for rewards still to earn. */
@Composable
internal fun TaleArt(drawable: Int, modifier: Modifier = Modifier, locked: Boolean = false, description: String? = null) {
    Image(painterResource(drawable), description, modifier.graphicsLayer { alpha = if (locked) 0.4f else 1f },
        contentScale = ContentScale.Fit, colorFilter = if (locked) grayscale else null)
}

/** The mascot avatars a learner can pick for their profile, stored on this device per learning owner. */
internal object AvatarChoice {
    val all = listOf(R.drawable.avatar_1, R.drawable.avatar_2, R.drawable.avatar_3, R.drawable.avatar_4,
        R.drawable.avatar_5, R.drawable.avatar_6, R.drawable.avatar_7, R.drawable.avatar_8)
    private fun prefs(context: Context) = context.getSharedPreferences("avatar_choice", Context.MODE_PRIVATE)
    /** The chosen avatar's position in [all], or null before the learner picks one. */
    fun get(context: Context, owner: String) = prefs(context).getInt(owner, -1).takeIf { it in all.indices }
    fun set(context: Context, owner: String, index: Int) = prefs(context).edit().putInt(owner, index).apply()
}
