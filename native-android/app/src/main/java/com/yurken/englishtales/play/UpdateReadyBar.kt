package com.yurken.englishtales.play

import androidx.compose.foundation.layout.*
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** Shown once a flexible update has downloaded; restarting installs it. */
@Composable
fun UpdateReadyBar(onRestart: () -> Unit, modifier: Modifier = Modifier) {
    Surface(modifier.fillMaxWidth().navigationBarsPadding().padding(12.dp), tonalElevation = 6.dp, shadowElevation = 6.dp, shape = MaterialTheme.shapes.medium) {
        Row(Modifier.padding(start = 16.dp, end = 8.dp, top = 6.dp, bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(stringResource(R.string.yeni_surum_hazir), Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
            TextButton(onClick = onRestart) { Text(stringResource(R.string.yeniden_baslat)) }
        }
    }
}
