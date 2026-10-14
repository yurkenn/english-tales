package com.yurken.englishtales.ui

import androidx.compose.foundation.clickable
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
import com.yurken.englishtales.data.LearningSnapshot

@Composable
internal fun LearningInfoButton(kind: String, value: String, title: String, explanation: String) {
    var open by remember {mutableStateOf(false)}
    Row(Modifier.heightIn(min=48.dp).semantics {contentDescription="$title: $value, bilgi"}
        .clickable(role=Role.Button) {open=true}.padding(horizontal=4.dp),
        verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(5.dp)) {
        Text(value,fontWeight=FontWeight.Bold)
        ReferenceIcon(kind,TaleBlue)
    }
    if(open) AlertDialog(onDismissRequest={open=false},title={Text(title)},text={Text(explanation)},
        confirmButton={TextButton(onClick={open=false}) {Text("Anladım")}})
}

internal fun streakExplanation(snapshot: LearningSnapshot) =
    "Şu an ${snapshot.streak} günlük çalışma serin var. Bir hikâye veya alıştırma tamamlayarak çalıştığın günü kaydedersin. Ardışık günlerde çalışmak seriyi sürdürür; yalnızca uygulamayı açmak yeterli değildir."

internal fun pointsExplanation(snapshot: LearningSnapshot) =
    "Toplam ${snapshot.points} puanın var. Kelime alıştırmasındaki her doğru cevap 5 puan kazandırır. Aynı çalışma tekrar kaydedilerek ikinci kez puan vermez. Puan para veya harcanan enerji değildir."

@Composable
internal fun RankProgress(points: Int) {
    val safe=points.coerceAtLeast(0)
    val rank=safe/100+1
    val progress=safe%100
    Text("Okuyucu $rank",fontWeight=FontWeight.Bold)
    ReferenceProgress(progress/100f,Modifier.fillMaxWidth())
    Text("${100-progress} puan sonra Okuyucu ${rank+1}",color=TaleMuted)
    Text("Her 100 puan bir okuma rütbesidir. Rütbe, İngilizce seviyenden ayrıdır.",style=MaterialTheme.typography.bodySmall,color=TaleMuted)
}
