package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
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
        LinearProgressIndicator(Modifier.width(120.dp).height(4.dp).clip(RoundedCornerShape(2.dp)), color = TaleBlue, trackColor = TaleLine)
    }
}
