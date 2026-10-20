package com.yurken.englishtales.ui

import androidx.compose.foundation.clickable
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.data.LearningSnapshot

@Composable
internal fun LearningInfoButton(kind: String, value: String, title: String, explanation: String, caption: String? = null) {
    var open by remember {mutableStateOf(false)}
    // A changed value (new points, a longer streak) pops once so the gain is noticed.
    var last by remember {mutableStateOf(value)}
    var bumps by remember {mutableIntStateOf(0)}
    LaunchedEffect(value) {if(value!=last) {bumps++;last=value}}
    // The caption names the number, so the header reads without opening each explanation.
    Column(Modifier.heightIn(min=48.dp).contentLabel(stringResource(R.string.bilgi, title, value))
        .clickable(role=Role.Button) {open=true}.padding(horizontal=4.dp),
        horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.Center) {
        Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(5.dp)) {
            Text(value,fontWeight=FontWeight.Bold,modifier=Modifier.popOn(bumps))
            ReferenceIcon(kind,TaleBlue,Modifier.size(23.dp).popOn(bumps))
        }
        caption?.let { Text(it,fontSize=11.sp,color=TaleMuted,maxLines=1) }
    }
    if(open) TaleDialog(title,explanation,stringResource(R.string.anladim),onConfirm={open=false},onDismissRequest={open=false},mood=MascotMood.Welcome)
}

@Composable
internal fun streakExplanation(snapshot: LearningSnapshot) =
    stringResource(R.string.su_an_gunluk_calisma_serin, snapshot.streak)

@Composable
internal fun pointsExplanation(snapshot: LearningSnapshot) =
    stringResource(R.string.toplam_puanin_var_kelime_alistirmasindaki, snapshot.points)

@Composable
internal fun RankProgress(points: Int) {
    val safe=points.coerceAtLeast(0)
    val rank=safe/100+1
    val progress=safe%100
    Text(stringResource(R.string.okuyucu, rank),fontWeight=FontWeight.Bold)
    ReferenceProgress(progress/100f,Modifier.fillMaxWidth())
    Text(stringResource(R.string.puan_sonra_okuyucu, 100-progress, rank+1),color=TaleMuted)
    Text(stringResource(R.string.her_100_puan_bir_okuma),style=MaterialTheme.typography.bodySmall,color=TaleMuted)
}
