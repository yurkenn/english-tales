package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.R

/** The app's wait state: the thinking mascot breathing over a slim progress bar, instead of a bare spinner. */
@Composable
internal fun TaleLoading(modifier: Modifier = Modifier, mascotSize: Int = 120) {
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(20.dp)) {
        TalesMascot(MascotMood.Thinking, Modifier.size(mascotSize.dp).pulseWhile(true), description = stringResource(R.string.yukleniyor))
        LinearProgressIndicator(Modifier.width(140.dp).height(10.dp).clip(RoundedCornerShape(5.dp)), color = TaleGreen, trackColor = TaleLine)
    }
}

/** An empty list explained by the mascot instead of a blank screen or a lone gray line. */
@Composable
internal fun TaleEmptyState(text: String, modifier: Modifier = Modifier, mascotSize: Int = 140, mood: MascotMood = MascotMood.Reading, actionLabel: String? = null, onAction: (() -> Unit)? = null) {
    Column(modifier.fillMaxWidth().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        TalesMascot(mood, Modifier.size(mascotSize.dp).appearIn(), animate = true)
        Text(text, Modifier.appearIn(1), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = TaleMuted, textAlign = TextAlign.Center)
        // An empty screen says what to do next instead of ending the visit.
        if (actionLabel != null && onAction != null) ChunkyButton(actionLabel, onAction, Modifier.appearIn(2))
    }
}
