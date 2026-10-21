package com.yurken.englishtales.ui

import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.*
import androidx.compose.ui.semantics.Role
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.spring
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.ui.input.pointer.pointerInput
import kotlinx.coroutines.launch
import kotlin.math.abs
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
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.data.WordInfo

@Composable
fun FlashcardGame(liveWords: List<WordInfo>,sessionId: Int,savedIds: Set<String>,padding: PaddingValues,onWordReviewed: (String,Boolean)->Unit,onLessonComplete: (Int)->Unit,onExit: ()->Unit,onRestart: ()->Unit,snapshot: LearningSnapshot,onDone: ()->Unit=onExit) {
    // Frozen at start: a sync can drop a saved word mid-session, and the deck must not shrink under the current card.
    val words=remember(sessionId) {liveWords}
    var index by rememberSaveable(sessionId) {mutableIntStateOf(0)}
    var revealed by rememberSaveable(sessionId) {mutableStateOf(false)}
    var remembered by rememberSaveable(sessionId) {mutableIntStateOf(0)}
    var finished by rememberSaveable(sessionId) {mutableStateOf(false)}
    val narrator=rememberNarrator()
    val combo=LocalCombo.current
    val scope=rememberCoroutineScope()
    if(finished) {GameResult(stringResource(R.string.kelimeden_tanesini_hatirladin, words.size, remembered),remembered*5,padding,onDone,onRestart,snapshot,correct=remembered,total=words.size);return}
    // After recreation the deck is rebuilt from the live list, which may be shorter; the session then ends with what was answered.
    val word=words.getOrNull(index)
    if(word==null) {LaunchedEffect(sessionId) {if(!finished) {finished=true;onLessonComplete(remembered)}};return}
    // A previous card's word must not keep playing over the next one.
    LaunchedEffect(word.id) {narrator.stop()}
    val displayedIndex=index
    fun next(correct: Boolean) {
        // A swipe animation may finish after a button already advanced this card.
        if(finished || index!=displayedIndex) return
        if(word.id in savedIds) onWordReviewed(word.id,correct)
        combo.record(correct)
        if(correct) remembered++
        if(index==words.lastIndex) {finished=true;onLessonComplete(remembered)} else {index++;revealed=false}
    }
    GameViewport(padding,550.dp) {
        Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically) {
            ReferenceIconButton("back",stringResource(R.string.alistirmadan_cik),onExit)
            Spacer(Modifier.weight(1f))
            ComboBadge()
        }
        Spacer(Modifier.weight(1f))
        // The card turns over to show the meaning; each new card slides in.
        val turn by animateFloatAsState(if(revealed) 180f else 0f,tween(TaleMotion.emphasized,easing=FastOutSlowInEasing),label="flip")
        val back=turn>90f
        key(word.id) {
        // Drops-style answer: once the meaning shows, the card can be flung right (remembered) or left (again).
        val drag=remember {Animatable(0f)}
        var cardWidth by remember {mutableIntStateOf(1)}
        Box(Modifier.fillMaxWidth().height(360.dp).onSizeChanged {cardWidth=it.width.coerceAtLeast(1)}
            .graphicsLayer {translationX=drag.value;rotationZ=drag.value/cardWidth*14f}
            .pointerInput(revealed) {
                if(revealed) detectHorizontalDragGestures(
                    onDragEnd={scope.launch {
                        if(abs(drag.value)>cardWidth*0.28f) {val right=drag.value>0;drag.animateTo(if(right) cardWidth*1.4f else -cardWidth*1.4f,tween(TaleMotion.quick));next(right)}
                        else drag.animateTo(0f,spring(dampingRatio=0.6f))
                    }},
                    onDragCancel={scope.launch {drag.animateTo(0f,spring(dampingRatio=0.6f))}}) {change,amount -> change.consume();scope.launch {drag.snapTo(drag.value+amount)}}
            }) {
        Column(Modifier.fillMaxSize().appearIn().graphicsLayer {rotationY=turn;cameraDistance=14f*density}
            .background(if(back) LocalTaleColors.current.tileBlue else TaleSurface,RoundedCornerShape(20.dp)).border(2.dp,if(back) TaleBlue.copy(alpha=0.4f) else TaleMint,RoundedCornerShape(20.dp))
            .clickable(role=Role.Button) {revealed=true}.graphicsLayer {rotationY=if(back) 180f else 0f}.padding(24.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.Center) {
            Text(word.word,fontSize=if(back) 18.sp else 26.sp,fontWeight=FontWeight.Bold,color=if(back) TaleMuted else TaleInk)
            Text(word.pronunciation,fontSize=13.sp,color=TaleMuted,modifier=Modifier.padding(vertical=10.dp))
            Text(if(revealed) word.translation else stringResource(R.string.anlami_gormek_icin_dokun),fontSize=if(revealed) 24.sp else 13.sp,fontWeight=if(revealed) FontWeight.Bold else FontWeight.Normal,color=if(revealed) TaleInk else TaleMuted)
            Box(Modifier.padding(top=20.dp).size(48.dp).pulseWhile(narrator.speaking).contentLabel(if(narrator.speaking || narrator.preparing) stringResource(R.string.seslendirmeyi_durdur) else stringResource(R.string.kelimesini_dinle, word.word)).background(TaleBlue,CircleShape).clickable(role=Role.Button) {if(narrator.speaking || narrator.preparing) narrator.stop() else narrator.speak(word.word)},contentAlignment=Alignment.Center) {if(narrator.speaking || narrator.preparing) Text("Ⅱ",color=TaleOnBlue) else ReferenceIcon("volume",TaleOnBlue,Modifier.size(21.dp))}
        }
        SwipeStamp(drag.value/cardWidth)
        }
        }
        if(revealed) Text(stringResource(R.string.card_swipe_hint),color=TaleMuted,fontSize=12.sp,modifier=Modifier.appearIn())
        if(narrator.preparing) Text(stringResource(R.string.ses_hazirlaniyor),color=TaleMuted,fontSize=12.sp)
        narrator.error?.let {Text(it,color=TaleMuted,fontSize=12.sp)}
        Spacer(Modifier.weight(1f))
        Row(horizontalArrangement=Arrangement.spacedBy(7.dp)) {words.forEachIndexed { i,_ ->
            val width by animateDpAsState(if(i==index) 18.dp else 6.dp,label="dot")
            Box(Modifier.size(width,6.dp).background(if(i<=index) TaleBlue else TaleLine,CircleShape))
        }}
        Spacer(Modifier.height(24.dp))
        if(revealed) {
            Row(horizontalArrangement=Arrangement.spacedBy(10.dp)) {
                OutlinedButton(onClick={next(false)},modifier=Modifier.weight(1f)) {Text(stringResource(R.string.tekrar_et))}
                Button(onClick={next(true)},modifier=Modifier.weight(1f)) {Text(stringResource(R.string.hatirladim))}
            }
        } else Button(onClick={revealed=true},modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.ogren_2))}
    }
}

/** The tint and word that grow on a flung card: green "know it" to the right, orange "again" to the left. */
@Composable
private fun BoxScope.SwipeStamp(fraction: Float) {
    if(abs(fraction)<0.04f) return
    val right=fraction>0
    val c=LocalTaleColors.current
    val accent=if(right) c.success else c.warm
    val strength=(abs(fraction)/0.28f).coerceIn(0f,1f)
    Box(Modifier.matchParentSize().graphicsLayer {alpha=strength}.background(accent.copy(alpha=0.16f),RoundedCornerShape(20.dp)).border(3.dp,accent,RoundedCornerShape(20.dp)))
    Text(stringResource(if(right) R.string.card_stamp_known else R.string.card_stamp_again),color=accent,fontSize=24.sp,fontWeight=FontWeight.ExtraBold,
        modifier=Modifier.align(if(right) Alignment.TopStart else Alignment.TopEnd).padding(20.dp).graphicsLayer {alpha=strength;rotationZ=if(right) -12f else 12f;scaleX=0.8f+strength*0.2f;scaleY=scaleX}
            .border(3.dp,accent,RoundedCornerShape(8.dp)).padding(horizontal=10.dp,vertical=4.dp))
}
