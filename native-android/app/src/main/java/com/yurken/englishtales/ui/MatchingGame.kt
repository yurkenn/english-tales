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
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.delay

@Composable
fun MatchingGame(liveWords: List<WordInfo>,sessionId: Int,savedIds: Set<String>,padding: PaddingValues,onWordReviewed: (String,Boolean)->Unit,onLessonComplete: (Int)->Unit,onExit: ()->Unit,onRestart: ()->Unit,snapshot: LearningSnapshot,onDone: ()->Unit=onExit) {
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
    val combo=LocalCombo.current
    val context=LocalContext.current
    // Quizlet-style race against the clock: the board's time is kept per board size, and a faster finish is a new record.
    var elapsed by rememberSaveable(sessionId) {mutableLongStateOf(0L)}
    var record by rememberSaveable(sessionId) {mutableStateOf<Boolean?>(null)}
    LaunchedEffect(sessionId,finished) {
        var last=android.os.SystemClock.elapsedRealtime()
        while(true) {delay(100);if(finished) break;val now=android.os.SystemClock.elapsedRealtime();elapsed+=now-last;last=now}
    }
    // The time is frozen at the last match; a late clock tick must not change what the result shows.
    var finalMillis by rememberSaveable(sessionId) {mutableLongStateOf(0L)}
    fun finish() {
        finished=true;finalMillis=elapsed
        record=GameRecords.recordMatch(context,snapshot.ownerId,words.size,finalMillis)
        onLessonComplete((words.size-mistakes).coerceAtLeast(0))
    }
    if(finished) {
        val best=GameRecords.bestMatchMillis(context,snapshot.ownerId,words.size)
        val time=formatMatchTime(finalMillis)
        GameResult(stringResource(R.string.kelime_hata, words.size, mistakes),(words.size-mistakes).coerceAtLeast(0)*5,padding,onDone,onRestart,snapshot,
            correct=(words.size-mistakes).coerceAtLeast(0),total=words.size,
            highlight=if(record==true) stringResource(R.string.match_new_record,time) else stringResource(R.string.match_time,time,formatMatchTime(best?:finalMillis)))
        return
    }
    // Completion counts only this board's words; after recreation the live list may have lost some, even a matched one.
    val done=words.all {it.id in matched}
    if(done) {LaunchedEffect(sessionId) {if(!finished) finish()};return}
    GameViewport(padding) {
        GameHeader(words.count {it.id in matched}.toFloat()/words.size,onExit)
        Row(Modifier.fillMaxWidth().padding(vertical=12.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)) {
            Text(stringResource(R.string.kelimeleri_eslestirin),fontSize=16.sp,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f))
            ComboBadge()
            Row(Modifier.background(TalePanel,RoundedCornerShape(20.dp)).padding(horizontal=10.dp,vertical=5.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(4.dp)) {
                ReferenceIcon("bolt",TaleBlue,Modifier.size(16.dp))
                Text(formatMatchTime(elapsed),fontSize=14.sp,fontWeight=FontWeight.Bold,color=TaleInk,fontFamily=androidx.compose.ui.text.font.FontFamily.Monospace)
            }
        }
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
                            combo.record(true)
                            if(words.all {it.id in matched}) finish()
                        } else {mistakes++;wrongPair=current to word.id;wrongTick++;combo.record(false);if(current in savedIds) onWordReviewed(current,false)}
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
    Box(modifier.shakeOn(shakeTick).popOn(pops).graphicsLayer {alpha=fade}.selectable(selected=selected||matched,enabled=!matched,role=Role.Button,onClick=onClick)
        // A card on a lip in its border color; a matched pair loses the lip and lies flat.
        .background(color,RoundedCornerShape(16.dp)).padding(bottom=if(matched) 0.dp else 4.dp)
        .background(fill,RoundedCornerShape(16.dp)).border(2.dp,color,RoundedCornerShape(16.dp)).padding(8.dp),contentAlignment=Alignment.Center) {
        Text(label,fontSize=16.sp,fontWeight=if(selected||matched) FontWeight.ExtraBold else FontWeight.Bold,textAlign=androidx.compose.ui.text.style.TextAlign.Center)
    }
}
