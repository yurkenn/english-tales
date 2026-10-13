package com.yurken.englishtales.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.data.*
import kotlinx.coroutines.delay

@Composable
fun PracticeScreen(snapshot: LearningSnapshot,onLessonComplete: (Int,String,String,Int,Long)->Unit,onWordReviewed: (String,Boolean)->Unit,padding: PaddingValues,onSessionStart: (String,String,Int)->Unit,onCheckpoint: (String,Long)->Unit,onSessionAbandoned: (String)->Unit,onSessionActive: (Boolean)->Unit={}, launchId: String?=null, launchWordIds: List<String> = emptyList(), onLaunchConsumed: ()->Unit={}, onDailyPlan: ()->Unit={},onCompletedExit: (String,()->Unit)->Unit={_,next ->next()}) {
    val saved=LearningContent.words.filter {it.id in snapshot.savedWordIds}
    val supplemental=LearningContent.words.filter {it.id !in snapshot.savedWordIds}
    var mode by rememberSaveable { mutableStateOf("") }
    var question by rememberSaveable { mutableIntStateOf(0) }
    var correctCount by rememberSaveable { mutableIntStateOf(0) }
    var finished by rememberSaveable { mutableStateOf(false) }
    var ids by rememberSaveable { mutableStateOf(emptyList<String>()) }
    var sessionKey by rememberSaveable { mutableStateOf("") }
    var session by rememberSaveable { mutableIntStateOf(0) }
    fun exit(plan: Boolean=false) {
        val leave={onSessionAbandoned(sessionKey);mode="";if(plan) onDailyPlan()}
        if(plan && finished) onCompletedExit(sessionKey,leave) else leave()
    }
    BackHandler(enabled=mode.isNotEmpty()) {exit()}
    LaunchedEffect(mode) { onSessionActive(mode.isNotEmpty()) }
    DisposableEffect(Unit) { onDispose {onSessionActive(false)} }
    fun start(value: String, seeded: List<String> = emptyList()) {
        if(sessionKey.isNotEmpty()) onSessionAbandoned(sessionKey)
        val priority=(seeded+snapshot.dueWordIds+saved.map {it.id}).distinct().mapNotNull(LearningContent.wordById::get)
        val pool=if(seeded.isNotEmpty()) priority.take(seeded.size.coerceIn(1,5)) else (priority+supplemental.shuffled()).distinctBy {it.id}.take(5)
        sessionKey=java.util.UUID.randomUUID().toString()
        session++; ids=pool.shuffled().map {it.id};mode=value;question=0;correctCount=0;finished=false
    }
    LaunchedEffect(launchId) { if(launchId!=null) { start("choice",launchWordIds);onLaunchConsumed() } }
    LaunchedEffect(sessionKey) {if(sessionKey.isNotEmpty() && mode.isNotEmpty() && !finished) onSessionStart(sessionKey,mode,ids.size)}
    if(mode.isEmpty()) {
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState())) {
            StatsHeader(snapshot)
            Text("Kelimelerle oyna",fontSize=24.sp,fontWeight=FontWeight.Bold,modifier=Modifier.padding(horizontal=16.dp,vertical=20.dp))
            Text(if(saved.isEmpty()) "Başlamak için örnek kelimeler hazır." else "${snapshot.dueWordIds.size} kelimenin tekrar zamanı geldi.",fontSize=14.sp,color=TaleMuted,modifier=Modifier.padding(horizontal=16.dp))
            Spacer(Modifier.height(20.dp))
            ModeCard("Kelime kartları","Kelimeleri tanı ve dinle.","cards",Color(0xFFE3F6FF)) {start("card")}
            ModeCard("Bir çeviri seç","Doğru anlamı bul.","translate",Color(0xFFFFF6D5)) {start("choice")}
            ModeCard("Kelimeleri eşleştir","İngilizce ve Türkçe çiftleri bul.","play",Color(0xFFF0E5FF)) {start("match")}
            ModeCard("Kelimeyi oluştur","Harfleri doğru sıraya koy.","study",Color(0xFFE9F7E2)) {start("spell")}
        }
        return
    }
    val words=ids.mapNotNull(LearningContent.wordById::get)
    val timer=rememberActiveLearningTime(sessionKey,snapshot.activeSessionMillis[sessionKey]?:0,!finished,onCheckpoint)
    val complete: (Int)->Unit = {finished=true;onLessonComplete(it,sessionKey,mode,words.size,timer.pause())}
    if(mode=="card") { FlashcardGame(words,session,snapshot.savedWordIds,padding,onWordReviewed,complete,{exit(true)},{start("card")},snapshot);return }
    if(mode=="match") { MatchingGame(words,session,snapshot.savedWordIds,padding,onWordReviewed,complete,{exit(true)},{start("match")},snapshot);return }
    if(finished) { GameResult("$correctCount / ${words.size} doğru",correctCount*5,padding,{exit(true)},{start(mode)},snapshot);return }
    val word=words[question]
    var answer by rememberSaveable(question,mode,session) { mutableStateOf<String?>(null) }
    var chosen by rememberSaveable(question,mode,session) { mutableStateOf(emptyList<Int>()) }
    val letterText=rememberSaveable(question,mode,session) {word.word.toList().shuffled().joinToString("")}
    val letters=letterText.toList()
    val options=rememberSaveable(question,mode,session) {(listOf(word.translation)+LearningContent.words.map {it.translation}.distinct().filter {it!=word.translation}.shuffled().take(3)).shuffled()}
    var advanceWrong by rememberSaveable(question,mode,session) {mutableStateOf(false)}
    val correct=answer==if(mode=="choice") word.translation else word.word
    LaunchedEffect(answer,advanceWrong) {
        if(answer!=null && (correct || advanceWrong)) {
            delay(if(correct) 700 else 0)
            if(correct) correctCount++
            if(word.id in snapshot.savedWordIds) onWordReviewed(word.id,correct)
            if(question==words.lastIndex) {finished=true;complete(correctCount)} else question++
        }
    }
    GameViewport(padding) {
        GameHeader((question+1).toFloat()/words.size) {exit()}
        Text(if(mode=="choice") "Bir çeviri seçin" else "Kelimeyi oluştur.",fontSize=16.sp,fontWeight=FontWeight.Bold,modifier=Modifier.fillMaxWidth().padding(vertical=12.dp))
        Box(Modifier.fillMaxWidth().weight(if(mode=="choice") 1f else 0.6f).background(Color(0xFFF8F8F8),RoundedCornerShape(12.dp)),contentAlignment=Alignment.Center) {
            Text(if(mode=="choice") word.word else word.translation,fontSize=20.sp,fontWeight=FontWeight.Bold)
        }
        if(mode=="choice") {
            Spacer(Modifier.height(8.dp))
            options.forEach { option ->
                val selected=answer==option
                val color=if(selected) {if(correct) Color(0xFF8CC65C) else Color(0xFFFF866D)} else TaleLine
                Box(Modifier.fillMaxWidth().heightIn(min=50.dp).border(if(selected) 2.dp else 1.dp,color,RoundedCornerShape(10.dp)).clickable(enabled=answer==null) {answer=option}.padding(horizontal=12.dp,vertical=8.dp),contentAlignment=Alignment.Center) {Text(option,fontSize=14.sp,fontWeight=FontWeight.Medium)}
            }
        } else {
            Box(Modifier.weight(1f).fillMaxWidth(),contentAlignment=Alignment.Center) {
                Text(chosen.joinToString("") {letters[it].toString()}.ifBlank {"_ ".repeat(word.word.length)},fontSize=20.sp,color=if(answer==null) TaleBlue else if(correct) Color(0xFF79BB46) else Color(0xFFED725F),modifier=Modifier.border(1.dp,TaleLine,RoundedCornerShape(5.dp)).padding(12.dp))
            }
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(vertical=24.dp),horizontalArrangement=Arrangement.Center) {
                letters.forEachIndexed { i,c ->
                    Box(Modifier.padding(3.dp).size(36.dp,48.dp).border(if(i in chosen) 2.dp else 1.dp,if(i in chosen) TaleBlue else TaleLine,RoundedCornerShape(6.dp)).clickable(enabled=answer==null && i !in chosen) {chosen=chosen+i;if(chosen.size==letters.size) answer=chosen.joinToString("") {letters[it].toString()}},contentAlignment=Alignment.Center) {Text(c.toString(),fontSize=16.sp)}
                }
            }
            TextButton(onClick={chosen=emptyList()},enabled=answer==null,modifier=Modifier.align(Alignment.CenterHorizontally)) { Text("Temizle",fontSize=12.sp) }
        }
        if(answer!=null && !correct) {
            Text("Doğru cevap: ${if(mode=="choice") word.translation else word.word}",fontSize=14.sp,color=Color(0xFFE77458))
            Button(onClick={advanceWrong=true},modifier=Modifier.fillMaxWidth()) {Text("Anladım, devam et")}
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun ModeCard(title: String,subtitle: String,icon: String,color: Color,onClick: ()->Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal=16.dp,vertical=6.dp).border(1.dp,TaleLine,RoundedCornerShape(12.dp)).clickable(onClick=onClick).padding(16.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(16.dp)) {
        Box(Modifier.size(64.dp).background(color,RoundedCornerShape(12.dp)),contentAlignment=Alignment.Center) {ReferenceIcon(icon,TaleBlue,Modifier.size(34.dp))}
        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)) {Text(title,fontSize=16.sp,fontWeight=FontWeight.Bold);Text(subtitle,fontSize=12.sp,color=TaleMuted)}
        Text("›",color=TaleMuted,fontSize=22.sp)
    }
}

@Composable
fun GameResult(subtitle: String,points: Int,padding: PaddingValues,onExit: ()->Unit,onRestart: ()->Unit,snapshot: LearningSnapshot?=null) {
    Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),horizontalAlignment=Alignment.CenterHorizontally) {
        Text("⭐  Harika! $points puan kazandın!",color=Color.White,fontSize=14.sp,modifier=Modifier.fillMaxWidth().background(TalePurple,RoundedCornerShape(4.dp)).padding(12.dp))
        Spacer(Modifier.height(36.dp))
        Text("🏆",fontSize=110.sp)
        Spacer(Modifier.height(24.dp))
        Text("Çalışma tamamlandı",fontSize=25.sp,fontWeight=FontWeight.Light)
        Text(subtitle,fontSize=14.sp,color=TaleMuted,modifier=Modifier.padding(12.dp))
        snapshot?.let {
            Text(if(it.dailyGoalReached) "Günlük hedefin tamamlandı ✓" else "Bugünkü hedef: ${it.todaySessions} / ${it.dailyGoal} adım",color=TaleBlue,fontSize=14.sp,modifier=Modifier.padding(12.dp))
            if(it.completedLessons==1 && !LearningReminders.enabled(androidx.compose.ui.platform.LocalContext.current)) ReminderControls()
        }
        Button(onClick=onExit,shape=RoundedCornerShape(24.dp)) {Text("Günlük planıma dön")}
        TextButton(onClick=onRestart) {Text("Yeniden çalış",fontSize=12.sp)}
    }
}
