package com.yurken.englishtales.ui

import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.animateContentSize
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
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
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
    // Frozen at start: a sync can drop a word mid-session, but the store expects the count the session began with.
    var sessionCount by rememberSaveable { mutableIntStateOf(0) }
    var session by rememberSaveable { mutableIntStateOf(0) }
    var gapQuestions by rememberSaveable(stateSaver=gapQuestionsSaver) { mutableStateOf(emptyList<GapQuestion>()) }
    var gapUnavailable by rememberSaveable { mutableStateOf(false) }
    var listenQuestions by rememberSaveable(stateSaver=listeningQuestionsSaver) { mutableStateOf(emptyList<ListeningQuestion>()) }
    var orderQuestions by rememberSaveable(stateSaver=orderQuestionsSaver) { mutableStateOf(emptyList<OrderQuestion>()) }
    var ladderModes by rememberSaveable { mutableStateOf(emptyList<String>()) }
    // Q5.8: 0 = per-word drills, 1 = context questions, 2 = listening.
    var ladderStep by rememberSaveable { mutableIntStateOf(0) }
    // Known once the menu has probed the English voice; until then the ladder has no listening rung.
    var voiceReady by remember { mutableStateOf(false) }
    val stories=LearningContent.stories
    val dictionary=LearningContent.words
    val gapPrompts by produceState<List<GapPrompt>?>(null,stories,dictionary) {
        value=withContext(Dispatchers.Default) {SentenceGap.prompts(stories,dictionary)}
        gapUnavailable=false
    }
    val orderCandidates by produceState<List<OrderQuestion>?>(null,stories) {value=withContext(Dispatchers.Default) {SentenceOrder.candidates(stories)}}
    fun kindOf(value: String)=when(value) {"cloze"->SentenceGap.SESSION_KIND;"listen"->ListeningQuiz.SESSION_KIND;"order"->SentenceOrder.SESSION_KIND;"dictation"->Dictation.SESSION_KIND;"ladder"->PracticeLadder.SESSION_KIND;else->value}
    val sessionKind=kindOf(mode)
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
    val scope=rememberCoroutineScope()
    var startJob by remember { mutableStateOf<Job?>(null) }
    // Gap sessions scan the whole dictionary, so they are built on Default; every other step stays on Main.
    suspend fun gapSession(prompts: List<GapPrompt>, priority: List<String>, level: String)=withContext(Dispatchers.Default) {SentenceGap.session(prompts,dictionary,priority,level)}
    suspend fun begin(value: String, seeded: List<String>) {
        if(value=="cloze") {
            gapQuestions=gapSession(gapPrompts.orEmpty(),ReviewFocus.order(emptyList(),snapshot.weakWordIds,snapshot.dueWordIds,saved.map {it.id}),snapshot.level)
            gapUnavailable=gapQuestions.isEmpty()
            if(gapUnavailable) {if(mode.isNotEmpty()) exit();return}
        }
        if(value=="order" || value=="dictation") {
            orderQuestions=SentenceOrder.session(orderCandidates.orEmpty(),snapshot.level)
            if(orderQuestions.isEmpty()) {if(mode.isNotEmpty()) exit();return}
        }
        val priority=ReviewFocus.order(seeded,snapshot.weakWordIds,snapshot.dueWordIds,saved.map {it.id}).mapNotNull(snapshot::wordFor)
        // Seeded words can be missing from the loaded content (a synced account offline on a new phone); fall back to the usual mix.
        val pool=(if(seeded.isNotEmpty()) priority.take(seeded.size.coerceIn(1,5)) else emptyList())
            .ifEmpty {(priority+supplemental.shuffled()).distinctBy {it.id}.take(5)}
        val drawn=if(value=="cloze") gapQuestions.map {it.prompt.wordId} else if(value=="order" || value=="dictation") orderQuestions.map {it.sentenceId} else pool.shuffled().map {it.id}
        // Built before any session state changes, so the previous screen stays intact until the new one is ready.
        val candidates=if(value=="ladder" && pool.isNotEmpty()) gapSession(gapPrompts.orEmpty().filter {it.wordId in drawn},drawn,snapshot.level) else emptyList()
        if(sessionKey.isNotEmpty()) onSessionAbandoned(sessionKey)
        val sentenceMode=value=="cloze" || value=="order" || value=="dictation"
        if(!sentenceMode && pool.isEmpty()) {if(mode.isNotEmpty()) exit();return}
        session++; ids=drawn;mode=value;question=0;correctCount=0;finished=false
        // Q5.8: each word gets the drill that fits its stage, and the session climbs from word drills to games.
        if(value=="ladder") {
            val plan=PracticeLadder.plan(ids,snapshot.wordStates,snapshot.wordStability,candidates.map {it.prompt.wordId}.toSet(),voiceReady)
            ids=plan.map {it.first};ladderModes=plan.map {it.second}
            val context=plan.filter {it.second==PracticeLadder.CONTEXT}.map {it.first}.toSet()
            gapQuestions=candidates.filter {it.prompt.wordId in context}
            listenQuestions=ListeningQuiz.questions(plan.filter {it.second==PracticeLadder.LISTEN}.mapNotNull {snapshot.wordFor(it.first)},dictionary)
            ladderStep=if(ladderModes.any(PracticeLadder::isWordDrill)) 0 else if(gapQuestions.isNotEmpty()) 1 else 2
        }
        if(value=="listen") listenQuestions=ListeningQuiz.questions(ids.mapNotNull(snapshot::wordFor),dictionary)
        sessionCount=ids.size
        // Written last: the start effect keys on it and reads the count, so it must never see a new key with the old count.
        sessionKey=java.util.UUID.randomUUID().toString()
    }
    // Undispatched: modes without a gap session start in this frame, as before. A start already building is not doubled.
    fun start(value: String, seeded: List<String> = emptyList()) {
        if(startJob?.isActive==true) return
        startJob=scope.launch(start=CoroutineStart.UNDISPATCHED) {begin(value,seeded)}
    }
    // The daily plan's review uses the ladder, so each due word gets the drill that fits its stage (Q5.8).
    LaunchedEffect(launchId) { if(launchId!=null) { start("ladder",launchWordIds);onLaunchConsumed() } }
    // The kind is read from the live mode: a value captured in an earlier frame could still be empty and the store would reject it.
    LaunchedEffect(sessionKey) {if(sessionKey.isNotEmpty() && mode.isNotEmpty() && !finished) onSessionStart(sessionKey,kindOf(mode),sessionCount)}
    if(mode.isEmpty()) {
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState())) {
            StatsHeader(snapshot)
            Text(stringResource(R.string.kelimelerle_oyna),fontSize=24.sp,fontWeight=FontWeight.Bold,modifier=Modifier.padding(horizontal=16.dp,vertical=20.dp))
            Text(if(saved.isEmpty()) stringResource(R.string.baslamak_icin_ornek_kelimeler_hazir) else stringResource(R.string.kelimenin_tekrar_zamani_geldi_2, snapshot.dueWordIds.size),fontSize=14.sp,color=TaleMuted,modifier=Modifier.padding(horizontal=16.dp))
            if(snapshot.weakWordIds.isNotEmpty()) Text(stringResource(R.string.weak_words_count, snapshot.weakWordIds.size),fontSize=14.sp,color=TaleMuted,modifier=Modifier.padding(horizontal=16.dp,vertical=4.dp))
            Spacer(Modifier.height(20.dp))
            ModeCard(stringResource(R.string.ladder_mode),stringResource(R.string.ladder_subtitle),"review",LocalTaleColors.current.tilePurple,index=1) {start("ladder")}
            ModeCard(stringResource(R.string.kelime_kartlari),stringResource(R.string.kelimeleri_tani_ve_dinle),"cards",LocalTaleColors.current.tileBlue,index=2) {start("card")}
            ModeCard(stringResource(R.string.bir_ceviri_sec),stringResource(R.string.dogru_anlami_bul),"translate",LocalTaleColors.current.tileYellow,index=3) {start("choice")}
            ModeCard(stringResource(R.string.gap_mode),stringResource(R.string.gap_subtitle),"read",LocalTaleColors.current.tileBlue,enabled=gapPrompts?.isNotEmpty()==true,index=4) {start("cloze")}
            if(gapPrompts==null || gapPrompts?.isEmpty()==true || gapUnavailable) Text(stringResource(if(gapPrompts==null) R.string.gap_preparing else R.string.gap_unavailable),
                modifier=Modifier.padding(horizontal=16.dp,vertical=8.dp),style=MaterialTheme.typography.bodySmall,color=TaleMuted)
            // Probes the device voice; the mode is offered only when English speech works.
            val voice=rememberNarrator()
            LaunchedEffect(voice.available) {voiceReady=voice.available==true}
            if(voice.available!=false) ModeCard(stringResource(R.string.listen_mode),stringResource(R.string.listen_subtitle),"headphones",LocalTaleColors.current.tileBlue,enabled=voice.available==true,index=5) {start("listen")}
            // Dictation needs a voice too; it appears only once English speech is known to work.
            if(voice.available==true && orderCandidates?.isEmpty()!=true) ModeCard(stringResource(R.string.dictation_mode),stringResource(R.string.dictation_subtitle),"headphones",LocalTaleColors.current.tileYellow,enabled=orderCandidates!=null,index=4) {start("dictation")}
            if(voice.available!=true) Text(stringResource(if(voice.available==null) R.string.listen_preparing else R.string.listen_unavailable),
                modifier=Modifier.padding(horizontal=16.dp,vertical=8.dp),style=MaterialTheme.typography.bodySmall,color=TaleMuted)
            if(orderCandidates?.isEmpty()!=true) ModeCard(stringResource(R.string.order_mode),stringResource(R.string.order_subtitle),"read",LocalTaleColors.current.tileGreen,enabled=orderCandidates!=null,index=5) {start("order")}
            ModeCard(stringResource(R.string.kelimeleri_eslestir),stringResource(R.string.ingilizce_ve_turkce_ciftleri_bul),"play",LocalTaleColors.current.tilePurple,index=6) {start("match")}
            ModeCard(stringResource(R.string.kelimeyi_olustur),stringResource(R.string.harfleri_dogru_siraya_koy),"letters",LocalTaleColors.current.tileGreen,index=7) {start("spell")}
        }
        return
    }
    val words=ids.mapNotNull(snapshot::wordFor)
    val timer=rememberActiveLearningTime(sessionKey,snapshot.activeSessionMillis[sessionKey]?:0,!finished,onCheckpoint)
    val count=sessionCount
    val complete: (Int)->Unit = {finished=true;onLessonComplete(it.coerceIn(0,count),sessionKey,sessionKind,count,timer.pause())}
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
    // The ladder's games follow its per-word drills; a step with no questions is skipped.
    fun nextLadderStep(from: Int) {
        var step=from+1
        if(step==1 && gapQuestions.isEmpty()) step=2
        if(step==2 && listenQuestions.isEmpty()) step=3
        if(step==3) {finished=true;complete(correctCount)} else ladderStep=step
    }
    if(mode=="ladder" && ladderStep==1) {
        SentenceGapGame(gapQuestions,session,padding,onAnswer={id,correct -> if(id in snapshot.savedWordIds) onWordReviewed(id,correct)},
            onComplete={correctCount+=it;nextLadderStep(1)},onExit={exit()})
        return
    }
    if(mode=="ladder" && ladderStep==2) {
        ListeningGame(listenQuestions,session,padding,onAnswer={id,correct -> if(id in snapshot.savedWordIds) onWordReviewed(id,correct)},
            onComplete={correctCount+=it;nextLadderStep(2)},onExit={exit()})
        return
    }
    // A sync can remove a word mid-session; the session then ends with what was answered.
    val word=words.getOrNull(question)
    if(word==null) {LaunchedEffect(session) {if(!finished) {finished=true;complete(correctCount)}};return}
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
            val lastDrill=if(mode=="ladder") ladderModes.count(PracticeLadder::isWordDrill)-1 else words.lastIndex
            if(question==lastDrill) {if(mode=="ladder") nextLadderStep(0) else {finished=true;complete(correctCount)}} else question++
        }
    }
    GameViewport(padding) {
        GameHeader((question+1).toFloat()/(if(mode=="ladder") ladderModes.count(PracticeLadder::isWordDrill).coerceAtLeast(1) else words.size)) {exit()}
        Row(Modifier.fillMaxWidth().padding(vertical=8.dp),verticalAlignment=Alignment.CenterVertically) {
            Text(if(drill=="choice") stringResource(R.string.bir_ceviri_secin) else stringResource(R.string.kelimeyi_olustur_2),fontSize=16.sp,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f))
            TalesMascot(if(answer!=null && !correct) MascotMood.Support else MascotMood.Thinking,Modifier.size(52.dp))
        }
        Box(Modifier.fillMaxWidth().weight(if(drill=="choice") 1f else 0.6f).background(TalePanel,RoundedCornerShape(12.dp)),contentAlignment=Alignment.Center) {
            Text(if(drill=="choice") word.word else word.translation,fontSize=20.sp,fontWeight=FontWeight.Bold)
        }
        if(drill=="choice") {
            Spacer(Modifier.height(8.dp))
            options.forEachIndexed { i,option ->
                // The right translation lights up green as soon as any choice is made.
                AnswerOption(option,answer==option,optionState(answer==option,answer!=null,option==word.translation),answer==null,{answer=option},Modifier.appearIn(i))
            }
        } else {
            Box(Modifier.weight(1f).fillMaxWidth(),contentAlignment=Alignment.Center) {
                var shakes by remember(question,session) {mutableIntStateOf(0)}
                var pops by remember(question,session) {mutableIntStateOf(0)}
                LaunchedEffect(answer) {if(answer!=null) {if(correct) pops++ else shakes++}}
                Text(chosen.joinToString("") {letters[it].toString()}.ifBlank {"_ ".repeat(spelling.length)},fontSize=22.sp,fontWeight=FontWeight.Bold,letterSpacing=2.sp,color=if(answer==null) TaleBlue else if(correct) TaleSuccess else TaleError,
                    modifier=Modifier.shakeOn(shakes).popOn(pops).border(2.dp,if(answer==null) TaleLine else if(correct) TaleSuccess else TaleError,RoundedCornerShape(12.dp)).padding(horizontal=18.dp,vertical=12.dp).animateContentSize())
            }
            CompositionLocalProvider(androidx.compose.ui.platform.LocalLayoutDirection provides androidx.compose.ui.unit.LayoutDirection.Ltr) {
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(vertical=24.dp),horizontalArrangement=Arrangement.Center) {
                letters.forEachIndexed { i,c ->
                    val used=i in chosen
                    val tileAlpha by animateFloatAsState(if(used) 0.35f else 1f,label="tile")
                    Box(Modifier.padding(3.dp).size(38.dp,50.dp).graphicsLayer {alpha=tileAlpha}.background(if(used) TaleLine else TaleSurface,RoundedCornerShape(10.dp)).border(if(used) 2.dp else 1.5.dp,if(used) TaleBlue else TaleLine,RoundedCornerShape(10.dp)).pressScale(enabled=answer==null && !used) {chosen=chosen+i;if(chosen.size==letters.size) answer=chosen.joinToString("") {letters[it].toString()}},contentAlignment=Alignment.Center) {Text(c.toString(),fontSize=17.sp,fontWeight=FontWeight.Bold)}
                }
            }
            }
            TextButton(onClick={chosen=emptyList()},enabled=answer==null,modifier=Modifier.align(Alignment.CenterHorizontally)) { Text(stringResource(R.string.temizle),fontSize=12.sp) }
        }
        AnswerFeedback(answer!=null,correct,if(correct) stringResource(R.string.feedback_correct_title)
            else stringResource(R.string.her_denemede_ogreniyoruz)+" "+stringResource(R.string.dogru_cevap, if(drill=="choice") word.translation else englishArgument(word.word)))
        if(answer!=null && !correct) Button(onClick={advanceWrong=true},modifier=Modifier.fillMaxWidth().heightIn(min=50.dp),shape=RoundedCornerShape(14.dp)) {Text(stringResource(R.string.anladim_devam_et))}
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun ModeCard(title: String,subtitle: String,icon: String,color: Color,enabled: Boolean=true,index: Int=0,onClick: ()->Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal=16.dp,vertical=6.dp).appearIn(index).background(TaleSurface,RoundedCornerShape(16.dp)).border(1.dp,TaleLine,RoundedCornerShape(16.dp)).pressScale(enabled=enabled,onClick=onClick).padding(14.dp).graphicsLayer {alpha=if(enabled) 1f else 0.5f},verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(16.dp)) {
        Box(Modifier.size(60.dp).background(color,RoundedCornerShape(16.dp)),contentAlignment=Alignment.Center) {ReferenceIcon(icon,TaleBlue,Modifier.size(32.dp))}
        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)) {Text(title,fontSize=16.sp,fontWeight=FontWeight.Bold);Text(subtitle,fontSize=12.sp,color=TaleMuted)}
        Text("›",color=TaleMuted,fontSize=22.sp)
    }
}

@Composable
fun GameResult(subtitle: String,points: Int,padding: PaddingValues,onExit: ()->Unit,onRestart: ()->Unit,snapshot: LearningSnapshot?=null) {
    Box(Modifier.fillMaxSize()) {
    Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),horizontalAlignment=Alignment.CenterHorizontally) {
        Text(stringResource(R.string.harika_puan_kazandin, points),color=TaleOnPurple,fontSize=14.sp,fontWeight=FontWeight.SemiBold,modifier=Modifier.fillMaxWidth().appearIn(0).background(TalePurple,RoundedCornerShape(14.dp)).padding(14.dp))
        Spacer(Modifier.height(28.dp))
        TalesMascot(MascotMood.Celebrate,Modifier.size(156.dp).appearIn(1),animate=true)
        Spacer(Modifier.height(16.dp))
        // The points count up like a scoreboard; the earned amount is the final value.
        AnimatedCounter(points,Modifier.appearIn(2),style=MaterialTheme.typography.displaySmall.copy(fontWeight=FontWeight.Bold),color=TalePurple,prefix="+")
        Text(stringResource(R.string.calisma_tamamlandi),fontSize=25.sp,fontWeight=FontWeight.SemiBold,modifier=Modifier.appearIn(3))
        Text(subtitle,fontSize=14.sp,color=TaleMuted,modifier=Modifier.padding(12.dp).appearIn(4))
        snapshot?.let {
            Text(if(it.dailyGoalReached) stringResource(R.string.gunluk_hedefin_tamamlandi) else stringResource(R.string.bugunku_hedef_adim, it.todaySessions, it.dailyGoal),color=TaleBlue,fontSize=14.sp,modifier=Modifier.padding(12.dp))
            if(it.completedLessons==1 && !LearningReminders.enabled(androidx.compose.ui.platform.LocalContext.current)) ReminderControls()
        }
        Button(onClick=onExit,shape=RoundedCornerShape(14.dp),modifier=Modifier.fillMaxWidth().heightIn(min=50.dp).appearIn(5)) {Text(stringResource(R.string.gunluk_planima_don))}
        TextButton(onClick=onRestart) {Text(stringResource(R.string.yeniden_calis),fontSize=13.sp)}
    }
    ConfettiBurst(Modifier.fillMaxSize(),subtitle)
    }
}
