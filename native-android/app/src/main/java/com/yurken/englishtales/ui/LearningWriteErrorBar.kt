package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.*
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.data.LearningWriteError

@Composable
internal fun LearningWriteErrorBar(error: LearningWriteError?, onRetry: () -> Unit) {
    if (error == null) return
    Surface(color=MaterialTheme.colorScheme.errorContainer) {
        Column(Modifier.fillMaxWidth().statusBarsPadding().padding(horizontal=16.dp,vertical=8.dp)
            .semantics { liveRegion=LiveRegionMode.Polite }) {
            Text(error.message, color=MaterialTheme.colorScheme.onErrorContainer)
            TextButton(onClick=onRetry) { Text(stringResource(R.string.tekrar_dene)) }
        }
    }
}

@Composable
internal fun LearningWriteHost(error: LearningWriteError?, onRetry: () -> Unit, content: @Composable () -> Unit) {
    Column(Modifier.fillMaxSize()) {
        LearningWriteErrorBar(error,onRetry)
        val insets=if(error!=null) Modifier.consumeWindowInsets(WindowInsets.statusBars) else Modifier
        Box(Modifier.weight(1f).then(insets)) { content() }
    }
}
