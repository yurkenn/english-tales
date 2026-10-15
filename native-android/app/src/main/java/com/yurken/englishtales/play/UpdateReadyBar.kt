package com.yurken.englishtales.play

import androidx.compose.foundation.layout.*
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
            Text("Yeni sürüm hazır.", Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
            TextButton(onClick = onRestart) { Text("Yeniden başlat") }
        }
    }
}
