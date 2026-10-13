package com.yurken.englishtales.ads

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.yurken.englishtales.BuildConfig

@Composable
fun AdPrivacyControls() {
    val ads=LocalCompletionAds.current
    var message by remember {mutableStateOf("")}
    Column(Modifier.fillMaxWidth()) {
        Text("Reklam tercihleri",style=MaterialTheme.typography.titleSmall)
        Text(if(BuildConfig.ADS_ENABLED) "Reklamlar yalnızca tamamlanan çalışmaların ardından, sınırlı sıklıkta gösterilir." else "Bu sürümde reklam gösterimi kapalı.",style=MaterialTheme.typography.bodySmall)
        if(BuildConfig.ADS_ENABLED) TextButton(onClick={ads.privacyOptions {message=it}}) {Text("Reklam gizlilik tercihleri")}
        if(message.isNotBlank()) Text(message,style=MaterialTheme.typography.bodySmall)
    }
}
