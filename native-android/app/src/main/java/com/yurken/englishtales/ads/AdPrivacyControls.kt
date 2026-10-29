package com.yurken.englishtales.ads

import androidx.compose.foundation.layout.*
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.BuildConfig
import com.yurken.englishtales.ui.TaleInk
import com.yurken.englishtales.ui.TaleMuted

@Composable
fun AdPrivacyControls() {
    val ads=LocalCompletionAds.current
    var message by remember {mutableStateOf("")}
    Column(Modifier.fillMaxWidth()) {
        Text(stringResource(R.string.reklam_tercihleri),fontSize=15.sp,fontWeight=FontWeight.ExtraBold,color=TaleInk)
        Text(if(BuildConfig.ADS_ENABLED) stringResource(R.string.reklamlar_yalnizca_tamamlanan_calismalarin_ardindan) else stringResource(R.string.bu_surumde_reklam_gosterimi_kapali),fontSize=12.sp,color=TaleMuted)
        if(BuildConfig.ADS_ENABLED) TextButton(onClick={ads.privacyOptions {message=it}}) {Text(stringResource(R.string.reklam_gizlilik_tercihleri))}
        if(message.isNotBlank()) Text(message,style=MaterialTheme.typography.bodySmall)
    }
}
