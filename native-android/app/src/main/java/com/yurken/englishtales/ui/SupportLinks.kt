package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.*
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
        Text("Yardım ve gizlilik",style=MaterialTheme.typography.titleMedium)
        TextButton(onClick={open("https://englishtales-app.web.app/privacy")},modifier=Modifier.fillMaxWidth()) {Text("Gizlilik politikası")}
        TextButton(onClick={open("https://englishtales-app.web.app/delete-account")},modifier=Modifier.fillMaxWidth()) {Text("Hesap ve veri silme bilgileri")}
        TextButton(onClick={open("mailto:oguz.yurken@gmail.com?subject=English%20Tales%20Destek")},modifier=Modifier.fillMaxWidth()) {Text("Destek ve içerik hatası bildirimi")}
        if(error) Text("Bağlantı açılamadı. Tarayıcından englishtales-app.web.app adresini açabilir veya oguz.yurken@gmail.com adresine yazabilirsin.",fontSize=13.sp,color=TaleMuted)
    }
}
