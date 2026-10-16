package com.yurken.englishtales.ui

import androidx.compose.foundation.*
import androidx.compose.ui.semantics.Role
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import com.yurken.englishtales.data.LearningSnapshot
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.data.WordInfo

@Composable
fun FlashcardGame(words: List<WordInfo>,sessionId: Int,savedIds: Set<String>,padding: PaddingValues,onWordReviewed: (String,Boolean)->Unit,onLessonComplete: (Int)->Unit,onExit: ()->Unit,onRestart: ()->Unit,snapshot: LearningSnapshot) {
    var index by rememberSaveable(sessionId) {mutableIntStateOf(0)}
    var revealed by rememberSaveable(sessionId) {mutableStateOf(false)}
    var remembered by rememberSaveable(sessionId) {mutableIntStateOf(0)}
    var finished by rememberSaveable(sessionId) {mutableStateOf(false)}
    val narrator=rememberNarrator()
    if(finished) {GameResult(stringResource(R.string.kelimeden_tanesini_hatirladin, words.size, remembered),remembered*5,padding,onExit,onRestart,snapshot);return}
    val word=words[index]
    // A previous card's word must not keep playing over the next one.
    LaunchedEffect(word.id) {narrator.stop()}
    fun next(correct: Boolean) {
        if(word.id in savedIds) onWordReviewed(word.id,correct)
        if(correct) remembered++
        if(index==words.lastIndex) {finished=true;onLessonComplete(remembered)} else {index++;revealed=false}
    }
    GameViewport(padding,550.dp) {
        Box(Modifier.align(Alignment.Start)) { ReferenceIconButton("back",stringResource(R.string.alistirmadan_cik),onExit) }
        Spacer(Modifier.weight(1f))
        Column(Modifier.fillMaxWidth().height(360.dp).border(2.dp,TaleMint,RoundedCornerShape(10.dp)).clickable(role=Role.Button) {revealed=true}.padding(24.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.Center) {
            Text(word.word,fontSize=23.sp,fontWeight=FontWeight.Bold)
            Text(word.pronunciation,fontSize=13.sp,color=TaleMuted,modifier=Modifier.padding(vertical=10.dp))
            Text(if(revealed) word.translation else stringResource(R.string.anlami_gormek_icin_dokun),fontSize=if(revealed) 20.sp else 13.sp,color=if(revealed) TaleInk else TaleMuted)
            Box(Modifier.padding(top=20.dp).size(48.dp).contentLabel(if(narrator.speaking || narrator.preparing) stringResource(R.string.seslendirmeyi_durdur) else stringResource(R.string.kelimesini_dinle, word.word)).background(TaleBlue,CircleShape).clickable(role=Role.Button) {if(narrator.speaking || narrator.preparing) narrator.stop() else narrator.speak(word.word)},contentAlignment=Alignment.Center) {if(narrator.speaking || narrator.preparing) Text("Ⅱ",color=TaleOnBlue) else ReferenceIcon("volume",TaleOnBlue,Modifier.size(21.dp))}
        }
        if(narrator.preparing) Text(stringResource(R.string.ses_hazirlaniyor),color=TaleMuted,fontSize=12.sp)
        narrator.error?.let {Text(it,color=TaleMuted,fontSize=12.sp)}
        Spacer(Modifier.weight(1f))
        Row(horizontalArrangement=Arrangement.spacedBy(7.dp)) {words.forEachIndexed { i,_ -> Box(Modifier.size(5.dp).background(if(i==index) TaleBlue else TaleLine,CircleShape))}}
        Spacer(Modifier.height(24.dp))
        if(revealed) {
            Row(horizontalArrangement=Arrangement.spacedBy(10.dp)) {
                OutlinedButton(onClick={next(false)},modifier=Modifier.weight(1f)) {Text(stringResource(R.string.tekrar_et))}
                Button(onClick={next(true)},modifier=Modifier.weight(1f)) {Text(stringResource(R.string.hatirladim))}
            }
        } else Button(onClick={revealed=true},modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.ogren_2))}
    }
}
