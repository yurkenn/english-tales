package com.yurken.englishtales.ui

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import com.yurken.englishtales.data.LearningSnapshot
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.data.WordInfo

@Composable
fun MatchingGame(words: List<WordInfo>,sessionId: Int,savedIds: Set<String>,padding: PaddingValues,onWordReviewed: (String,Boolean)->Unit,onLessonComplete: (Int)->Unit,onExit: ()->Unit,onRestart: ()->Unit,snapshot: LearningSnapshot) {
    val translationIds=rememberSaveable(sessionId) {words.shuffled().map {it.id}}
    val translations=translationIds.mapNotNull {id -> words.find {it.id==id}}
    var selected by rememberSaveable(sessionId) {mutableStateOf<String?>(null)}
    var matched by rememberSaveable(sessionId) {mutableStateOf(emptyList<String>())}
    var mistakes by rememberSaveable(sessionId) {mutableIntStateOf(0)}
    var finished by rememberSaveable(sessionId) {mutableStateOf(false)}
    if(finished) {GameResult("${words.size} kelime · $mistakes hata",(words.size-mistakes).coerceAtLeast(0)*5,padding,onExit,onRestart,snapshot);return}
    GameViewport(padding) {
        GameHeader(matched.size.toFloat()/words.size,onExit)
        Text("Kelimeleri eşleştirin",fontSize=16.sp,fontWeight=FontWeight.Bold,modifier=Modifier.fillMaxWidth().padding(vertical=12.dp))
        Row(Modifier.fillMaxWidth().weight(1f),horizontalArrangement=Arrangement.spacedBy(10.dp)) {
            Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(10.dp)) {
                words.forEach { word -> MatchCard(word.word,selected==word.id,word.id in matched,Modifier.fillMaxWidth().weight(1f)) { if(word.id !in matched) selected=word.id } }
            }
            Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(10.dp)) {
                translations.forEach { word -> MatchCard(word.translation,false,word.id in matched,Modifier.fillMaxWidth().weight(1f)) {
                    val current=selected
                    if(current!=null && word.id !in matched) {
                        if(current==word.id) {
                            matched=matched+word.id
                            if(word.id in savedIds) onWordReviewed(word.id,true)
                            if(matched.size==words.size) {finished=true;onLessonComplete((words.size-mistakes).coerceAtLeast(0))}
                        } else {mistakes++;if(current in savedIds) onWordReviewed(current,false)}
                        selected=null
                    }
                } }
            }
        }
        Spacer(Modifier.height(12.dp))
    }
}

@Composable
private fun MatchCard(label: String,selected: Boolean,matched: Boolean,modifier: Modifier,onClick: ()->Unit) {
    val color=when {matched->Color(0xFF9BCC72);selected->TaleBlue;else->TaleLine}
    Box(modifier.border(if(selected||matched) 2.dp else 1.dp,color,RoundedCornerShape(12.dp)).clickable(enabled=!matched,onClick=onClick).padding(8.dp),contentAlignment=Alignment.Center) {Text(label,fontSize=14.sp,fontWeight=FontWeight.Medium)}
}
