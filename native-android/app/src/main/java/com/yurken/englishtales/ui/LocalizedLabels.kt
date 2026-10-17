package com.yurken.englishtales.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.yurken.englishtales.R
import com.yurken.englishtales.data.ReadingStatus

/** Labels change with the UI language; stored genre values keep their existing identity. */
@Composable
internal fun genreLabel(value: String): String = when (value) {
    "Günlük yaşam" -> stringResource(R.string.genre_daily_life)
    "Macera" -> stringResource(R.string.genre_adventure)
    "Gizem" -> stringResource(R.string.genre_mystery)
    else -> value
}

@Composable
internal fun readingStatusLabel(value: ReadingStatus): String = stringResource(when (value) {
    ReadingStatus.Unread -> R.string.reading_status_unread
    ReadingStatus.InProgress -> R.string.reading_status_in_progress
    ReadingStatus.Finished -> R.string.reading_status_finished
})
