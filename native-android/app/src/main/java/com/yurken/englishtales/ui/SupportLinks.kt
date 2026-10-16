package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.*
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun SupportLinks() {
    val uriHandler=LocalUriHandler.current
    var error by remember {mutableStateOf(false)}
    fun open(url: String) {error=runCatching {uriHandler.openUri(url)}.isFailure}
    Column(verticalArrangement=Arrangement.spacedBy(4.dp)) {
        HorizontalDivider()
        Text(stringResource(R.string.yardim_ve_gizlilik),style=MaterialTheme.typography.titleMedium)
        TextButton(onClick={open("https://englishtales-app.web.app/privacy")},modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.gizlilik_politikasi))}
        TextButton(onClick={open("https://englishtales-app.web.app/delete-account")},modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.hesap_ve_veri_silme_bilgileri))}
        TextButton(onClick={open("mailto:oguz.yurken@gmail.com?subject=English%20Tales%20Destek")},modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.destek_ve_icerik_hatasi_bildirimi))}
        if(error) Text(stringResource(R.string.baglanti_acilamadi_tarayicindan_englishtales_app),fontSize=13.sp,color=TaleMuted)
    }
}
