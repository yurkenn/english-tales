package com.yurken.englishtales.analytics

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
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
            Text("Kullanım istatistikleri", modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleMedium)
            Switch(checked = enabled, enabled = !busy, onCheckedChange = { choice ->
                busy = true
                scope.launch {
                    val saved = withContext(Dispatchers.IO) { runCatching { onChange(choice) }.getOrDefault(false) }
                    if (saved) enabled = choice
                    error = !saved
                    busy = false
                }
            }, modifier = Modifier.semantics { contentDescription = "Kullanım istatistiklerini paylaş" })
        }
        Text("İsteğe bağlıdır. Açarsan hikâye ve kelime çalışmalarının tamamlanması ile ertesi gün geri dönüş gibi kullanım bilgileri Firebase Analytics'e gönderilir. E-postan, adın, hikâye metinleri ve cevapların eklenmez. Firebase, cihazını ayırt eden rastgele bir kimlik, cihaz bilgileri ve yaklaşık ülke/bölge bilgisi de işler. Bu tercih bu cihaz için geçerlidir; istediğin zaman kapatabilirsin.", style = MaterialTheme.typography.bodySmall)
        if (error) Text("Tercihin kaydedilemedi. Lütfen tekrar dene.", color = MaterialTheme.colorScheme.error)
    }
}
