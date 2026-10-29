package com.yurken.englishtales.analytics

import androidx.compose.foundation.layout.*
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
import com.yurken.englishtales.ui.contentLabel
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.font.FontWeight
import com.yurken.englishtales.ui.TaleInk
import com.yurken.englishtales.ui.TaleMuted
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
internal fun AnalyticsControls() {
    val context = LocalContext.current
    val metrics = remember(context) { ProductAnalytics.get(context) }
    AnalyticsConsentControl(metrics.enabled, onChange = metrics::setConsent)
}

@Composable
internal fun AnalyticsConsentControl(initialEnabled: Boolean, onChange: (Boolean) -> Boolean) {
    var enabled by remember { mutableStateOf(initialEnabled) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(stringResource(R.string.kullanim_istatistikleri), modifier = Modifier.weight(1f), fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = TaleInk)
            Switch(checked = enabled, enabled = !busy, onCheckedChange = { choice ->
                busy = true
                scope.launch {
                    val saved = withContext(Dispatchers.IO) { runCatching { onChange(choice) }.getOrDefault(false) }
                    if (saved) enabled = choice
                    error = !saved
                    busy = false
                }
            }, modifier = Modifier.contentLabel(stringResource(R.string.kullanim_istatistiklerini_paylas)))
        }
        Text(stringResource(R.string.istege_baglidir_acarsan_hikaye_ve), fontSize = 12.sp, color = TaleMuted)
        if (error) Text(stringResource(R.string.tercihin_kaydedilemedi_lutfen_tekrar_dene), color = MaterialTheme.colorScheme.error)
    }
}
