package com.yurken.englishtales.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.selection.selectable
import androidx.compose.ui.semantics.Role
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.data.*
import com.yurken.englishtales.R
import com.yurken.englishtales.data.ListeningQuiz
import com.yurken.englishtales.data.ListeningQuestion
import kotlinx.coroutines.delay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun PracticeScreen(snapshot: LearningSnapshot,onLessonComplete: (Int,String,String,Int,Long)->Unit,onWordReviewed: (String,Boolean)->Unit,padding: PaddingValues,onSessionStart: (String,String,Int)->Unit,onCheckpoint: (String,Long)->Unit,onSessionAbandoned: (String)->Unit,onSessionActive: (Boolean)->Unit={}, launchId: String?=null, launchWordIds: List<String> = emptyList(), onLaunchConsumed: ()->Unit={}, onDailyPlan: ()->Unit={},onCompletedExit: (String,()->Boolean,()->Unit)->Unit={_,active,next ->if(active()) next()}) {
    val saved=snapshot.savedWordList()
    val supplemental=LearningContent.words.filter {it.id !in snapshot.savedWordIds}
    var mode by rememberSaveable { mutableStateOf("") }
    var question by rememberSaveable { mutableIntStateOf(0) }
    var correctCount by rememberSaveable { mutableIntStateOf(0) }
    var finished by rememberSaveable { mutableStateOf(false) }
    var ids by rememberSaveable { mutableStateOf(emptyList<String>()) }
    var sessionKey by rememberSaveable { mutableStateOf("") }
    var session by rememberSaveable { mutableIntStateOf(0) }
    var gapQuestions by rememberSaveable(stateSaver=gapQuestionsSaver) { mutableStateOf(emptyList<GapQuestion>()) }
    var gapUnavailable by rememberSaveable { mutableStateOf(false) }
    var listenQuestions by rememberSaveable(stateSaver=listeningQuestionsSaver) { mutableStateOf(emptyList<ListeningQuestion>()) }
    var orderQuestions by rememberSaveable(stateSaver=orderQuestionsSaver) { mutableStateOf(emptyList<OrderQuestion>()) }
    var ladderModes by rememberSaveable { mutableStateOf(emptyList<String>()) }
    val stories=LearningContent.stories
    val dictionary=LearningContent.words
    val gapPrompts by produceState<List<GapPrompt>?>(null,stories,dictionary) {
        value=withContext(Dispatchers.Default) {SentenceGap.prompts(stories,dictionary)}
        gapUnavailable=false
    }
    val orderCandidates=remember(stories) {SentenceOrder.candidates(stories)}
    val sessionKind=when(mode) {"cloze"->SentenceGap.SESSION_KIND;"listen"->ListeningQuiz.SESSION_KIND;"order"->SentenceOrder.SESSION_KIND;"dictation"->Dictation.SESSION_KIND;"ladder"->PracticeLadder.SESSION_KIND;else->mode}
    fun exit(plan: Boolean=false) {
        val leave={onSessionAbandoned(sessionKey);mode="";if(plan) onDailyPlan()}
        if(plan && finished) {
            val expected=sessionKey
            val active={sessionKey==expected && finished && mode.isNotEmpty()}
            onCompletedExit(expected,active) {if(active()) leave()}
        } else leave()
    }
    BackHandler(enabled=mode.isNotEmpty()) {exit()}
    LaunchedEffect(mode) { onSessionActive(mode.isNotEmpty()) }
    DisposableEffect(Unit) { onDispose {onSessionActive(false)} }
    fun start(value: String, seeded: List<String> = emptyList()) {
        if(value=="cloze") {
            gapQuestions=SentenceGap.session(gapPrompts.orEmpty(),dictionary,ReviewFocus.order(emptyList(),snapshot.weakWordIds,snapshot.dueWordIds,saved.map {it.id}),snapshot.level)
            gapUnavailable=gapQuestions.isEmpty()
            if(gapUnavailable) {if(mode.isNotEmpty()) exit();return}
        }
        if(value=="order" || value=="dictation") {
            orderQuestions=SentenceOrder.session(orderCandidates,snapshot.level)
            if(orderQuestions.isEmpty()) {if(mode.isNotEmpty()) exit();return}
        }
        if(sessionKey.isNotEmpty()) onSessionAbandoned(sessionKey)
        val priority=ReviewFocus.order(seeded,snapshot.weakWordIds,snapshot.dueWordIds,saved.map {it.id}).mapNotNull(snapshot::wordFor)
        val pool=if(seeded.isNotEmpty()) priority.take(seeded.size.coerceIn(1,5)) else (priority+supplemental.shuffled()).distinctBy {it.id}.take(5)
        sessionKey=java.util.UUID.randomUUID().toString()
        session++; ids=if(value=="cloze") gapQuestions.map {it.prompt.wordId} else if(value=="order" || value=="dictation") orderQuestions.map {it.sentenceId} else pool.shuffled().map {it.id};mode=value;question=0;correctCount=0;finished=false
        // Q5.8: each word gets the drill that fits its stage.
        if(value=="ladder") ladderModes=PracticeLadder.modes(ids,snapshot.wordStates)
        if(value=="listen") listenQuestions=ListeningQuiz.questions(ids.mapNotNull(snapshot::wordFor),dictionary)
    }
    // The daily plan's review uses the ladder, so each due word gets the drill that fits its stage (Q5.8).
    LaunchedEffect(launchId) { if(launchId!=null) { start("ladder",launchWordIds);onLaunchConsumed() } }
    LaunchedEffect(sessionKey) {if(sessionKey.isNotEmpty() && mode.isNotEmpty() && !finished) onSessionStart(sessionKey,sessionKind,ids.size)}
    if(mode.isEmpty()) {
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState())) {
            StatsHeader(snapshot)
            Text(stringResource(R.string.kelimelerle_oyna),fontSize=24.sp,fontWeight=FontWeight.Bold,modifier=Modifier.padding(horizontal=16.dp,vertical=20.dp))
            Text(if(saved.isEmpty()) stringResource(R.string.baslamak_icin_ornek_kelimeler_hazir) else stringResource(R.string.kelimenin_tekrar_zamani_geldi_2, snapshot.dueWordIds.size),fontSize=14.sp,color=TaleMuted,modifier=Modifier.padding(horizontal=16.dp))
            if(snapshot.weakWordIds.isNotEmpty()) Text(stringResource(R.string.weak_words_count, snapshot.weakWordIds.size),fontSize=14.sp,color=TaleMuted,modifier=Modifier.padding(horizontal=16.dp,vertical=4.dp))
            Spacer(Modifier.height(20.dp))
            ModeCard(stringResource(R.string.ladder_mode),stringResource(R.string.ladder_subtitle),"review",LocalTaleColors.current.tilePurple) {start("ladder")}
            ModeCard(stringResource(R.string.kelime_kartlari),stringResource(R.string.kelimeleri_tani_ve_dinle),"cards",LocalTaleColors.current.tileBlue) {start("card")}
            ModeCard(stringResource(R.string.bir_ceviri_sec),stringResource(R.string.dogru_anlami_bul),"translate",LocalTaleColors.current.tileYellow) {start("choice")}
            ModeCard(stringResource(R.string.gap_mode),stringResource(R.string.gap_subtitle),"read",LocalTaleColors.current.tileBlue,enabled=gapPrompts?.isNotEmpty()==true) {start("cloze")}
            if(gapPrompts==null || gapPrompts?.isEmpty()==true || gapUnavailable) Text(stringResource(if(gapPrompts==null) R.string.gap_preparing else R.string.gap_unavailable),
                modifier=Modifier.padding(horizontal=16.dp,vertical=8.dp),style=MaterialTheme.typography.bodySmall,color=TaleMuted)
            // Probes the device voice; the mode is offered only when English speech works.
            val voice=rememberNarrator()
            if(voice.available!=false) ModeCard(stringResource(R.string.listen_mode),stringResource(R.string.listen_subtitle),"headphones",LocalTaleColors.current.tileBlue,enabled=voice.available==true) {start("listen")}
            // Dictation needs a voice too; it appears only once English speech is known to work.
            if(voice.available==true && orderCandidates.isNotEmpty()) ModeCard(stringResource(R.string.dictation_mode),stringResource(R.string.dictation_subtitle),"headphones",LocalTaleColors.current.tileYellow) {start("dictation")}
            if(voice.available!=true) Text(stringResource(if(voice.available==null) R.string.listen_preparing else R.string.listen_unavailable),
                modifier=Modifier.padding(horizontal=16.dp,vertical=8.dp),style=MaterialTheme.typography.bodySmall,color=TaleMuted)
            if(orderCandidates.isNotEmpty()) ModeCard(stringResource(R.string.order_mode),stringResource(R.string.order_subtitle),"read",LocalTaleColors.current.tileGreen) {start("order")}
            ModeCard(stringResource(R.string.kelimeleri_eslestir),stringResource(R.string.ingilizce_ve_turkce_ciftleri_bul),"play",LocalTaleColors.current.tilePurple) {start("match")}
            ModeCard(stringResource(R.string.kelimeyi_olustur),stringResource(R.string.harfleri_dogru_siraya_koy),"letters",LocalTaleColors.current.tileGreen) {start("spell")}
        }
        return
    }
    val words=ids.mapNotNull(snapshot::wordFor)
    val timer=rememberActiveLearningTime(sessionKey,snapshot.activeSessionMillis[sessionKey]?:0,!finished,onCheckpoint)
    val count=if(mode=="cloze") gapQuestions.size else if(mode=="order" || mode=="dictation") orderQuestions.size else words.size
    val complete: (Int)->Unit = {finished=true;onLessonComplete(it,sessionKey,sessionKind,count,timer.pause())}
    if(mode=="card") { FlashcardGame(words,session,snapshot.savedWordIds,padding,onWordReviewed,complete,{exit(true)},{start("card")},snapshot);return }
    if(mode=="match") { MatchingGame(words,session,snapshot.savedWordIds,padding,onWordReviewed,complete,{exit(true)},{start("match")},snapshot);return }
    if(finished) { GameResult(stringResource(R.string.dogru, correctCount, count),correctCount*5,padding,{exit(true)},{start(mode)},snapshot);return }
    if(mode=="listen") {
        ListeningGame(listenQuestions,session,padding,onAnswer={id,correct -> if(id in snapshot.savedWordIds) onWordReviewed(id,correct)},
            onComplete={correctCount=it;complete(it)},onExit={exit()})
        return
    }
    if(mode=="dictation") {
        DictationGame(orderQuestions,session,padding,onComplete={correctCount=it;complete(it)},onExit={exit()})
        return
    }
    if(mode=="order") {
        SentenceOrderGame(orderQuestions,session,padding,onComplete={correctCount=it;complete(it)},onExit={exit()})
        return
    }
    if(mode=="cloze") {
        SentenceGapGame(gapQuestions,session,padding,onAnswer={id,correct -> if(id in snapshot.savedWordIds) onWordReviewed(id,correct)},
            onComplete={correctCount=it;complete(it)},onExit={exit()})
        return
    }
    val word=words[question]
    // In the ladder each question has its own drill; other modes use one drill for the whole session.
    val drill=if(mode=="ladder") ladderModes.getOrElse(question) {PracticeLadder.RECOGNISE} else mode
    var answer by rememberSaveable(question,drill,session) { mutableStateOf<String?>(null) }
    var chosen by rememberSaveable(question,drill,session) { mutableStateOf(emptyList<Int>()) }
    // Phrases are spelled without their spaces; a blank tile would be indistinguishable.
    val spelling=word.word.filterNot(Char::isWhitespace)
    val letterText=rememberSaveable(question,drill,session) {spelling.toList().shuffled().joinToString("")}
    val letters=letterText.toList()
    val options=rememberSaveable(question,drill,session) {(listOf(word.translation)+LearningContent.words.map {it.translation}.distinct().filter {it!=word.translation}.shuffled().take(3)).shuffled()}
    var advanceWrong by rememberSaveable(question,drill,session) {mutableStateOf(false)}
    val correct=answer==if(drill=="choice") word.translation else spelling
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
        Row(Modifier.fillMaxWidth().padding(vertical=8.dp),verticalAlignment=Alignment.CenterVertically) {
            Text(if(drill=="choice") stringResource(R.string.bir_ceviri_secin) else stringResource(R.string.kelimeyi_olustur_2),fontSize=16.sp,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f))
            TalesMascot(if(answer!=null && !correct) MascotMood.Support else MascotMood.Thinking,Modifier.size(52.dp))
        }
        Box(Modifier.fillMaxWidth().weight(if(drill=="choice") 1f else 0.6f).background(TalePanel,RoundedCornerShape(12.dp)),contentAlignment=Alignment.Center) {
            Text(if(drill=="choice") word.word else word.translation,fontSize=20.sp,fontWeight=FontWeight.Bold)
        }
        if(drill=="choice") {
            Spacer(Modifier.height(8.dp))
            options.forEach { option ->
                val selected=answer==option
                val color=if(selected) {if(correct) Color(0xFF8CC65C) else Color(0xFFFF866D)} else TaleLine
                Box(Modifier.fillMaxWidth().heightIn(min=50.dp).border(if(selected) 2.dp else 1.dp,color,RoundedCornerShape(10.dp)).selectable(selected=selected,enabled=answer==null,role=Role.RadioButton) {answer=option}.padding(horizontal=12.dp,vertical=8.dp),contentAlignment=Alignment.Center) {Text(option,fontSize=14.sp,fontWeight=FontWeight.Medium)}
            }
        } else {
            Box(Modifier.weight(1f).fillMaxWidth(),contentAlignment=Alignment.Center) {
                Text(chosen.joinToString("") {letters[it].toString()}.ifBlank {"_ ".repeat(spelling.length)},fontSize=20.sp,color=if(answer==null) TaleBlue else if(correct) TaleSuccess else TaleError,modifier=Modifier.border(1.dp,TaleLine,RoundedCornerShape(5.dp)).padding(12.dp))
            }
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(vertical=24.dp),horizontalArrangement=Arrangement.Center) {
                letters.forEachIndexed { i,c ->
                    Box(Modifier.padding(3.dp).size(36.dp,48.dp).border(if(i in chosen) 2.dp else 1.dp,if(i in chosen) TaleBlue else TaleLine,RoundedCornerShape(6.dp)).clickable(enabled=answer==null && i !in chosen,role=Role.Button) {chosen=chosen+i;if(chosen.size==letters.size) answer=chosen.joinToString("") {letters[it].toString()}},contentAlignment=Alignment.Center) {Text(c.toString(),fontSize=16.sp)}
                }
            }
            TextButton(onClick={chosen=emptyList()},enabled=answer==null,modifier=Modifier.align(Alignment.CenterHorizontally)) { Text(stringResource(R.string.temizle),fontSize=12.sp) }
        }
        if(answer!=null && !correct) {
            Text(stringResource(R.string.her_denemede_ogreniyoruz),fontSize=13.sp,color=TaleMuted)
            Text(stringResource(R.string.dogru_cevap, if(drill=="choice") word.translation else word.word),fontSize=14.sp,color=TaleError)
            Button(onClick={advanceWrong=true},modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.anladim_devam_et))}
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun ModeCard(title: String,subtitle: String,icon: String,color: Color,enabled: Boolean=true,onClick: ()->Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal=16.dp,vertical=6.dp).border(1.dp,TaleLine,RoundedCornerShape(12.dp)).clickable(enabled=enabled,role=Role.Button,onClick=onClick).padding(16.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(16.dp)) {
        Box(Modifier.size(64.dp).background(color,RoundedCornerShape(12.dp)),contentAlignment=Alignment.Center) {ReferenceIcon(icon,TaleBlue,Modifier.size(34.dp))}
        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)) {Text(title,fontSize=16.sp,fontWeight=FontWeight.Bold);Text(subtitle,fontSize=12.sp,color=TaleMuted)}
        Text("›",color=TaleMuted,fontSize=22.sp)
    }
}

@Composable
fun GameResult(subtitle: String,points: Int,padding: PaddingValues,onExit: ()->Unit,onRestart: ()->Unit,snapshot: LearningSnapshot?=null) {
    Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),horizontalAlignment=Alignment.CenterHorizontally) {
        Text(stringResource(R.string.harika_puan_kazandin, points),color=TaleOnPurple,fontSize=14.sp,modifier=Modifier.fillMaxWidth().background(TalePurple,RoundedCornerShape(4.dp)).padding(12.dp))
        Spacer(Modifier.height(36.dp))
        TalesMascot(MascotMood.Celebrate,Modifier.size(156.dp),animate=true)
        Spacer(Modifier.height(24.dp))
        Text(stringResource(R.string.calisma_tamamlandi),fontSize=25.sp,fontWeight=FontWeight.Light)
        Text(subtitle,fontSize=14.sp,color=TaleMuted,modifier=Modifier.padding(12.dp))
        snapshot?.let {
            Text(if(it.dailyGoalReached) stringResource(R.string.gunluk_hedefin_tamamlandi) else stringResource(R.string.bugunku_hedef_adim, it.todaySessions, it.dailyGoal),color=TaleBlue,fontSize=14.sp,modifier=Modifier.padding(12.dp))
            if(it.completedLessons==1 && !LearningReminders.enabled(androidx.compose.ui.platform.LocalContext.current)) ReminderControls()
        }
        Button(onClick=onExit,shape=RoundedCornerShape(24.dp)) {Text(stringResource(R.string.gunluk_planima_don))}
        TextButton(onClick=onRestart) {Text(stringResource(R.string.yeniden_calis),fontSize=12.sp)}
    }
}
