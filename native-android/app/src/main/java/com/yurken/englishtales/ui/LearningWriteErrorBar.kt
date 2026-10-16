package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.background
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
    // Stays until the writes succeed; the retry sits next to the message so the way out is obvious.
    Box(Modifier.fillMaxWidth().background(TaleBackground).statusBarsPadding().padding(horizontal=12.dp,vertical=8.dp)) {
        TaleNotice(error.message,TaleAlertKind.Error) {
            TextButton(onClick=onRetry) { Text(stringResource(R.string.tekrar_dene),fontWeight=androidx.compose.ui.text.font.FontWeight.Bold) }
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
