package com.yurken.englishtales.ui

import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.ui.semantics.Role
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
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
fun MatchingGame(liveWords: List<WordInfo>,sessionId: Int,savedIds: Set<String>,padding: PaddingValues,onWordReviewed: (String,Boolean)->Unit,onLessonComplete: (Int)->Unit,onExit: ()->Unit,onRestart: ()->Unit,snapshot: LearningSnapshot) {
    // Frozen at start: a sync can drop a saved word mid-session, and a matched pair must not vanish from the board.
    val words=remember(sessionId) {liveWords}
    val translationIds=rememberSaveable(sessionId) {words.shuffled().map {it.id}}
    val translations=translationIds.mapNotNull {id -> words.find {it.id==id}}
    var selected by rememberSaveable(sessionId) {mutableStateOf<String?>(null)}
    var matched by rememberSaveable(sessionId) {mutableStateOf(emptyList<String>())}
    var mistakes by rememberSaveable(sessionId) {mutableIntStateOf(0)}
    var finished by rememberSaveable(sessionId) {mutableStateOf(false)}
    // The last wrong pair shakes; each mistake bumps the tick so the same pair can shake again.
    var wrongPair by remember(sessionId) {mutableStateOf<Pair<String,String>?>(null)}
    var wrongTick by remember(sessionId) {mutableIntStateOf(0)}
    if(finished) {GameResult(stringResource(R.string.kelime_hata, words.size, mistakes),(words.size-mistakes).coerceAtLeast(0)*5,padding,onExit,onRestart,snapshot);return}
    // Completion counts only this board's words; after recreation the live list may have lost some, even a matched one.
    val done=words.all {it.id in matched}
    if(done) {LaunchedEffect(sessionId) {if(!finished) {finished=true;onLessonComplete((words.size-mistakes).coerceAtLeast(0))}};return}
    GameViewport(padding) {
        GameHeader(words.count {it.id in matched}.toFloat()/words.size,onExit)
        Text(stringResource(R.string.kelimeleri_eslestirin),fontSize=16.sp,fontWeight=FontWeight.Bold,modifier=Modifier.fillMaxWidth().padding(vertical=12.dp))
        Row(Modifier.fillMaxWidth().weight(1f),horizontalArrangement=Arrangement.spacedBy(10.dp)) {
            Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(10.dp)) {
                words.forEachIndexed { i,word -> MatchCard(word.word,selected==word.id,word.id in matched,if(wrongPair?.first==word.id) wrongTick else 0,Modifier.fillMaxWidth().weight(1f).appearIn(i)) { if(word.id !in matched) selected=word.id } }
            }
            Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(10.dp)) {
                translations.forEachIndexed { i,word -> MatchCard(word.translation,false,word.id in matched,if(wrongPair?.second==word.id) wrongTick else 0,Modifier.fillMaxWidth().weight(1f).appearIn(i+1)) {
                    val current=selected
                    if(current!=null && word.id !in matched) {
                        if(current==word.id) {
                            matched=matched+word.id
                            if(word.id in savedIds) onWordReviewed(word.id,true)
                            if(words.all {it.id in matched}) {finished=true;onLessonComplete((words.size-mistakes).coerceAtLeast(0))}
                        } else {mistakes++;wrongPair=current to word.id;wrongTick++;if(current in savedIds) onWordReviewed(current,false)}
                        selected=null
                    }
                } }
            }
        }
        Spacer(Modifier.height(12.dp))
    }
}

@Composable
private fun MatchCard(label: String,selected: Boolean,matched: Boolean,shakeTick: Int,modifier: Modifier,onClick: ()->Unit) {
    val c=LocalTaleColors.current
    val color by animateColorAsState(when {matched->c.success;selected->c.blue;else->c.line},label="matchBorder")
    val fill by animateColorAsState(when {matched->c.tileGreen;selected->c.mint;else->c.surface},label="matchFill")
    val fade by animateFloatAsState(if(matched) 0.55f else 1f,tween(TaleMotion.emphasized),label="matchFade")
    var pops by remember {mutableIntStateOf(0)}
    LaunchedEffect(matched) {if(matched) pops++}
    Box(modifier.shakeOn(shakeTick).popOn(pops).graphicsLayer {alpha=fade}.background(fill,RoundedCornerShape(14.dp)).border(if(selected||matched) 2.dp else 1.5.dp,color,RoundedCornerShape(14.dp)).selectable(selected=selected||matched,enabled=!matched,role=Role.Button,onClick=onClick).padding(8.dp),contentAlignment=Alignment.Center) {
        Text(label,fontSize=15.sp,fontWeight=if(selected||matched) FontWeight.Bold else FontWeight.Medium,textAlign=androidx.compose.ui.text.style.TextAlign.Center)
    }
}
