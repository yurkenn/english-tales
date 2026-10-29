package com.yurken.englishtales.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
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
    val alerts=LocalTaleAlerts.current
    val failed=stringResource(R.string.alert_link_failed)
    fun open(url: String) {error=runCatching {uriHandler.openUri(url)}.isFailure;if(error) alerts.error(failed)}
    Column(verticalArrangement=Arrangement.spacedBy(8.dp)) {
        Text(stringResource(R.string.yardim_ve_gizlilik),fontSize=15.sp,fontWeight=FontWeight.ExtraBold,color=TaleInk,modifier=Modifier.padding(start=4.dp,top=6.dp))
        // One white card of link rows, each with a colored icon tile and a chevron.
        ChunkyBox(TaleSurface,Modifier.fillMaxWidth(),RoundedCornerShape(22.dp),depth=5.dp,border=TaleLine) { Column(Modifier.padding(8.dp)) {
            LinkRow(stringResource(R.string.gizlilik_politikasi),"lock",TaleBlue,TaleOnBlue) {open("https://englishtales-app.web.app/privacy")}
            Box(Modifier.padding(horizontal=12.dp).fillMaxWidth().height(1.dp).background(TaleLine))
            LinkRow(stringResource(R.string.hesap_ve_veri_silme_bilgileri),"info",TaleOrange,TaleOnOrange) {open("https://englishtales-app.web.app/delete-account")}
            Box(Modifier.padding(horizontal=12.dp).fillMaxWidth().height(1.dp).background(TaleLine))
            LinkRow(stringResource(R.string.destek_ve_icerik_hatasi_bildirimi),"mail",TalePurple,TaleOnPurple) {open("mailto:oguz.yurken@gmail.com?subject=English%20Tales%20Destek")}
        } }
        if(error) Text(stringResource(R.string.baglanti_acilamadi_tarayicindan_englishtales_app),fontSize=13.sp,color=TaleMuted)
    }
}

@Composable
private fun LinkRow(title: String,icon: String,color: Color,onColor: Color,onClick: ()->Unit) {
    Row(Modifier.fillMaxWidth().heightIn(min=56.dp).clip(RoundedCornerShape(14.dp)).clickable(role=Role.Button,onClick=onClick).padding(horizontal=10.dp,vertical=8.dp),
        verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)) {
        Box(Modifier.size(36.dp).background(color,RoundedCornerShape(11.dp)),contentAlignment=Alignment.Center) {ReferenceIcon(icon,onColor,Modifier.size(20.dp))}
        Text(title,fontSize=15.sp,fontWeight=FontWeight.ExtraBold,color=TaleInk,modifier=Modifier.weight(1f))
        ReferenceIcon("next",TaleMuted,Modifier.size(16.dp))
    }
}
