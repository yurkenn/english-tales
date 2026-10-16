package com.yurken.englishtales.ads

import androidx.compose.foundation.layout.*
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.yurken.englishtales.BuildConfig

@Composable
fun AdPrivacyControls() {
    val ads=LocalCompletionAds.current
    var message by remember {mutableStateOf("")}
    Column(Modifier.fillMaxWidth()) {
        Text(stringResource(R.string.reklam_tercihleri),style=MaterialTheme.typography.titleSmall)
        Text(if(BuildConfig.ADS_ENABLED) stringResource(R.string.reklamlar_yalnizca_tamamlanan_calismalarin_ardindan) else stringResource(R.string.bu_surumde_reklam_gosterimi_kapali),style=MaterialTheme.typography.bodySmall)
        if(BuildConfig.ADS_ENABLED) TextButton(onClick={ads.privacyOptions {message=it}}) {Text(stringResource(R.string.reklam_gizlilik_tercihleri))}
        if(message.isNotBlank()) Text(message,style=MaterialTheme.typography.bodySmall)
    }
}
