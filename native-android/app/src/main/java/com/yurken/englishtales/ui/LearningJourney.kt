package com.yurken.englishtales.ui

import androidx.compose.ui.platform.LocalContext
import com.yurken.englishtales.AppLanguage
import androidx.compose.foundation.*
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.selection.selectable
import androidx.compose.ui.semantics.Role
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.data.*
import com.yurken.englishtales.R
import java.text.SimpleDateFormat
import java.util.Date

@Composable
fun DailyPlan(snapshot: LearningSnapshot,onRead: (String)->Unit,onPractice: (List<String>)->Unit,onPlay: (()->Unit)?=null) {
    val position=snapshot.readingPositions[snapshot.lastStoryId]
    val resume=(position?.let {p -> LearningContent.storyById[snapshot.lastStoryId]?.takeIf {p.carriesTo(it)} ?: LearningContent.revision(p.revisionId)} ?: LearningContent.storyById[snapshot.lastStoryId])?.takeIf {snapshot.progressFor(it)<100}
    val next=resume?:LearningContent.recommendedStory(snapshot.level,snapshot.preferredGenre,LearningContent.stories.associate {it.id to snapshot.progressFor(it)})
    Column(Modifier.padding(horizontal=16.dp).fillMaxWidth(),verticalArrangement=Arrangement.spacedBy(14.dp)) {
        GoalHeroCard(snapshot)
        if(next!=null) {
            val progress=snapshot.progressFor(next)
            ChunkyBox(TaleSurface,Modifier.fillMaxWidth().appearIn(1),RoundedCornerShape(24.dp),border=TaleLine) {
                Column(Modifier.padding(14.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
                    Row(horizontalArrangement=Arrangement.spacedBy(14.dp),verticalAlignment=Alignment.CenterVertically) {
                        BookCover(next,Modifier.size(74.dp,106.dp))
                        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(6.dp)) {
                            Text(if(resume!=null) stringResource(R.string.kaldigin_hikaye) else if(progress==100) stringResource(R.string.yeniden_kesfet) else stringResource(R.string.siradaki_hikayen),
                                style=MaterialTheme.typography.labelMedium,color=TaleBlue)
                            Text(next.title,style=MaterialTheme.typography.titleLarge)
                            Text("${next.level} · ${genreLabel(next.genre)}",style=MaterialTheme.typography.bodyMedium,color=TaleMuted)
                            if(resume!=null) {
                                ReferenceProgress(progress/100f,Modifier.fillMaxWidth(),TaleGreen)
                                Text(stringResource(R.string.tamamlandi_2, progress),style=MaterialTheme.typography.labelMedium,color=TaleMuted)
                            }
                        }
                    }
                    ChunkyButton(if(resume!=null) stringResource(R.string.okumaya_devam_et) else if(progress==100) stringResource(R.string.yeniden_oku) else stringResource(R.string.hikayeye_basla),
                        onClick={onRead(next.id)},modifier=Modifier.fillMaxWidth())
                }
            }
        } else Text(stringResource(R.string.yeni_hikayeler_hazirlandiginda_burada_gorunecek),color=TaleMuted)
        // Two bright shortcuts: the words due for review and a quick game; they stack once text is large.
        val review=when {
            snapshot.dueWordIds.isNotEmpty() -> {
                val batch=ReviewFocus.order(emptyList(),snapshot.weakWordIds.filter {it in snapshot.dueWordIds},snapshot.dueWordIds,emptyList()).take(5)
                Triple(batch,stringResource(R.string.kelimeyi_hatirla, batch.size),stringResource(R.string.kelimenin_tekrar_zamani_geldi, snapshot.dueWordIds.size))
            }
            // Early practice: LearningPolicy ignores correct answers before the due time, so mastery is not inflated.
            snapshot.weakWordIds.isNotEmpty() -> snapshot.weakWordIds.take(5).let {Triple(it,stringResource(R.string.weak_words_practice, it.size),stringResource(R.string.weak_words_summary))}
            else -> null
        }
        if(review!=null || onPlay!=null) FlowRow(Modifier.fillMaxWidth().appearIn(2),horizontalArrangement=Arrangement.spacedBy(12.dp),verticalArrangement=Arrangement.spacedBy(12.dp),maxItemsInEachRow=sideBySide(2)) {
            review?.let {(batch,title,subtitle) -> ShortcutTile(TalePurple,TaleOnPurple,title,subtitle,{ReferenceIcon("review",TaleOnPurple,Modifier.size(28.dp))},Modifier.weight(1f)) {onPractice(batch)}}
            onPlay?.let {play -> ShortcutTile(TaleYellow,TaleOnYellow,stringResource(R.string.kelimeleri_eslestir),stringResource(R.string.quick_game),{TaleArt(R.drawable.game_match,Modifier.size(34.dp))},Modifier.weight(1f),play)}
        }
        if(review==null && snapshot.savedWordIds.isNotEmpty()) {
            Text(stringResource(R.string.tekrarlarin_guncel),color=TaleMuted)
            snapshot.nextReviewAt?.let {at -> Text(stringResource(R.string.sonraki_tekrar, SimpleDateFormat("d MMM, HH:mm",AppLanguage.locale(LocalContext.current)).format(Date(at))),
                style=MaterialTheme.typography.bodyMedium,color=TaleMuted)}
        }
    }
}

/** The blue welcome card: a greeting for the time of day, what counts as a step, and today's goal filling up beside the mascot. */
@Composable
private fun GoalHeroCard(snapshot: LearningSnapshot) {
    val hour=remember {java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)}
    val greeting=stringResource(when(hour) {in 5..11 -> R.string.greeting_morning; in 12..17 -> R.string.greeting_afternoon; else -> R.string.greeting_evening})
    ChunkyBox(TaleBlue,Modifier.fillMaxWidth().appearIn(0),RoundedCornerShape(26.dp)) {
        Box(Modifier.fillMaxWidth().heightIn(min=150.dp)) {
            TalesMascot(if(snapshot.dailyGoalReached) MascotMood.Celebrate else MascotMood.Welcome,
                Modifier.align(Alignment.BottomEnd).offset(x=6.dp,y=8.dp).size(116.dp,140.dp),animate=true)
            Column(Modifier.fillMaxWidth(0.64f).padding(start=18.dp,top=16.dp,bottom=18.dp),verticalArrangement=Arrangement.spacedBy(6.dp)) {
                Text(greeting,style=MaterialTheme.typography.headlineSmall,color=TaleOnBlue)
                Text(if(snapshot.dailyGoalReached) stringResource(R.string.hedef_tamamlandi_istersen_okumaya_devam) else stringResource(R.string.bir_hikaye_veya_kisa_bir),
                    style=MaterialTheme.typography.bodyMedium,fontWeight=FontWeight.SemiBold,color=TaleOnBlue)
                Spacer(Modifier.height(2.dp))
                Text(stringResource(R.string.bugunku_planin),style=MaterialTheme.typography.labelMedium,color=TaleOnBlue)
                ReferenceProgress((snapshot.todaySessions.toFloat()/snapshot.dailyGoal).coerceAtMost(1f),Modifier.fillMaxWidth(),TaleYellow,TaleOnBlue.copy(alpha=0.25f),10.dp)
                Text(stringResource(R.string.adim, snapshot.todaySessions, snapshot.dailyGoal),style=MaterialTheme.typography.labelLarge,fontWeight=FontWeight.ExtraBold,color=TaleOnBlue)
            }
        }
    }
}

/** A bright square shortcut with an icon, a bold title and one line of reason. */
@Composable
private fun ShortcutTile(color: Color,onColor: Color,title: String,subtitle: String,icon: @Composable ()->Unit,modifier: Modifier,onClick: ()->Unit) {
    ChunkyBox(color,modifier.heightIn(min=118.dp),RoundedCornerShape(22.dp),onClick=onClick) {
        Column(Modifier.padding(14.dp),verticalArrangement=Arrangement.spacedBy(4.dp)) {
            icon()
            Spacer(Modifier.height(2.dp))
            Text(title,style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.ExtraBold,color=onColor)
            Text(subtitle,style=MaterialTheme.typography.bodySmall,fontWeight=FontWeight.Bold,color=onColor)
        }
    }
}

@Composable
fun WeeklyActivity(snapshot: LearningSnapshot) {
    Column(Modifier.fillMaxWidth().padding(horizontal=16.dp,vertical=12.dp).background(TaleSurface,RoundedCornerShape(22.dp)).border(2.dp,TaleLine,RoundedCornerShape(22.dp))
        .padding(14.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
        // The streak sits next to the week it comes from, and one line says what today still needs.
        Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically) {
            Text(stringResource(R.string.son_7_gun),style=MaterialTheme.typography.titleLarge,modifier=Modifier.weight(1f))
            if(snapshot.streak>0) Row(Modifier.background(LocalTaleColors.current.tileYellow,RoundedCornerShape(20.dp)).padding(horizontal=10.dp,vertical=4.dp),
                verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(4.dp)) {
                ReferenceIcon("streak",TaleWarm,Modifier.size(16.dp))
                Text("${snapshot.streak} · ${stringResource(R.string.stat_streak)}",fontSize=12.sp,fontWeight=FontWeight.Bold,color=TaleInk)
            }
            // Banked freezes sit next to the streak they protect.
            if(snapshot.streakFreezes>0) Row(Modifier.padding(start=6.dp).background(LocalTaleColors.current.tileBlue,RoundedCornerShape(20.dp)).padding(horizontal=10.dp,vertical=4.dp)
                .contentLabel(stringResource(R.string.streak_freeze_chip,snapshot.streakFreezes)),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(4.dp)) {
                Text("❄",fontSize=13.sp,color=TaleBlue)
                Text("${snapshot.streakFreezes}",fontSize=12.sp,fontWeight=FontWeight.Bold,color=TaleInk)
            }
        }
        val todayText=when {
            snapshot.dailyGoalReached -> stringResource(R.string.weekly_today_done)
            snapshot.todaySessions>0 -> stringResource(R.string.weekly_today_progress,snapshot.todaySessions,snapshot.dailyGoal)
            else -> stringResource(R.string.weekly_today_pending)
        }
        Text(todayText,fontSize=13.sp,color=if(snapshot.dailyGoalReached) TaleBlue else TaleMuted,fontWeight=if(snapshot.dailyGoalReached) FontWeight.SemiBold else FontWeight.Normal)
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(6.dp)) {
            snapshot.weeklyActivity.forEachIndexed {i,day ->
                // Today is outlined so the learner sees where the week stands; empty days stay quiet instead of showing a dot.
                val today=i==snapshot.weeklyActivity.lastIndex
                val active=day.sessions>0
                val frozen=day.day in snapshot.frozenDays
                val frozenLabel=stringResource(R.string.streak_freeze_day)
                Column(Modifier.weight(1f).appearIn(i),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(8.dp)) {
                    // A day with practice burns like the streak it builds, with its step count beside the flame.
                    Box(Modifier.fillMaxWidth().heightIn(min=40.dp).background(if(active) LocalTaleColors.current.tileYellow else if(frozen) LocalTaleColors.current.tileBlue else TaleLine.copy(alpha=0.6f),RoundedCornerShape(12.dp))
                        .then(if(frozen) Modifier.border(1.5.dp,TaleBlue.copy(alpha=0.5f),RoundedCornerShape(12.dp)).contentLabel(frozenLabel) else Modifier)
                        .then(if(today) Modifier.border(2.dp,if(active) TaleWarm.copy(alpha=0.6f) else TaleBlue,RoundedCornerShape(12.dp)) else Modifier),contentAlignment=Alignment.Center) {
                        if(active) Column(Modifier.padding(vertical=3.dp),horizontalAlignment=Alignment.CenterHorizontally) {
                            ReferenceIcon("streak",TaleWarm,Modifier.size(15.dp))
                            Text("${day.sessions}",fontSize=11.sp,lineHeight=13.sp,fontWeight=FontWeight.ExtraBold,color=TaleInk)
                        }
                        else if(frozen) Text("❄",fontSize=16.sp,color=TaleBlue)
                    }
                    Text(if(today) stringResource(R.string.weekly_today) else day.label,fontSize=10.sp,fontWeight=if(today) FontWeight.Bold else FontWeight.Normal,color=if(today) TaleBlue else TaleMuted,maxLines=1)
                }
            }
        }
        if(snapshot.streak>0 || snapshot.streakFreezes>0) Text(stringResource(R.string.streak_freeze_info,StreakFreeze.EARN_EVERY,StreakFreeze.MAX_FREEZES),fontSize=12.sp,color=TaleMuted)
        Text(stringResource(R.string.gun_calistin_adim_tamamladin, snapshot.weeklyActivity.count {it.sessions>0}, snapshot.weeklyActivity.sumOf {it.sessions}),fontSize=12.sp,color=TaleMuted)
        // Q5.10: what the week's reading added up to, from the stories actually finished.
        if(snapshot.weeklyWordsRead>0 || snapshot.knownWordCount>0) Text(stringResource(R.string.weekly_reading_summary,snapshot.weeklyWordsRead,snapshot.knownWordCount),fontSize=12.sp,color=TaleMuted)
    }
}

@Composable
fun EarnedBadges(snapshot: LearningSnapshot) {
    val labels=linkedMapOf("first_story" to stringResource(R.string.ilk_hikaye), "first_practice" to stringResource(R.string.ilk_calisma), "five_words" to stringResource(R.string.kelime_5), "three_day_streak" to stringResource(R.string.gunluk_seri_3), "seven_day_streak" to stringResource(R.string.gunluk_seri_7))
    Column(Modifier.fillMaxWidth().padding(vertical=8.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
        Text(stringResource(R.string.basarilarin),fontSize=17.sp,fontWeight=FontWeight.Bold)
        labels.entries.forEachIndexed {i,(id,label) -> Row(Modifier.fillMaxWidth().appearIn(i).background(if(id in snapshot.badges) LocalTaleColors.current.tileYellow else TaleLine.copy(alpha=0.6f),RoundedCornerShape(14.dp)).padding(12.dp),verticalAlignment=Alignment.CenterVertically) {
            TaleArt(badgeArt(id),Modifier.size(52.dp).then(if(id in snapshot.badges) Modifier.popOn(1) else Modifier),locked=id !in snapshot.badges)
            Text(label,fontSize=14.sp,modifier=Modifier.weight(1f).padding(start=12.dp))
            Text(if(id in snapshot.badges) stringResource(R.string.kazanildi) else stringResource(R.string.sirada),color=TaleMuted,fontSize=11.sp)
        } }
    }
}

@Composable
fun ReadingResultScreen(story: Story,snapshot: LearningSnapshot,onPractice: (List<String>)->Unit,onDailyPlan: ()->Unit,onBack: ()->Unit=onDailyPlan) {
    val words=remember(story.id) {LearningContent.wordsForStory(story).take(5)}
    Box(Modifier.fillMaxSize()) {
    Column(Modifier.fillMaxSize().background(TaleBackground).statusBarsPadding().navigationBarsPadding().verticalScroll(rememberScrollState())) {
        SimpleTopBar(stringResource(R.string.okuma_tamamlandi),onBack)
        Column(Modifier.padding(24.dp),verticalArrangement=Arrangement.spacedBy(18.dp),horizontalAlignment=Alignment.CenterHorizontally) {
            Row(Modifier.appearIn(0),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(16.dp)) {
                TalesMascot(MascotMood.Celebrate,Modifier.size(144.dp),animate=true)
                BookCover(story,Modifier.size(64.dp,94.dp).popOn(1))
            }
            Text(stringResource(R.string.bir_hikaye_tamamladin),fontFamily=TaleDisplay,fontSize=26.sp,lineHeight=30.sp,fontWeight=FontWeight.ExtraBold,textAlign=TextAlign.Center,modifier=Modifier.appearIn(1))
            Text(story.title,fontSize=15.sp,fontWeight=FontWeight.Bold,color=TaleMuted,textAlign=TextAlign.Center,modifier=Modifier.appearIn(2))
            Text(if(snapshot.dailyGoalReached) stringResource(R.string.gunluk_hedef_tamamlandi) else stringResource(R.string.gunluk_hedef_adim, snapshot.todaySessions, snapshot.dailyGoal),color=TaleOnYellow,fontWeight=FontWeight.ExtraBold,
                modifier=Modifier.appearIn(3).background(TaleYellow,RoundedCornerShape(20.dp)).padding(horizontal=16.dp,vertical=8.dp))
            ComprehensionQuiz(story.id,story.questions)
            Text(stringResource(R.string.okudugun_kelimeleri_simdi_hatirlamayi_deneyelim),fontSize=14.sp,fontWeight=FontWeight.Bold,color=TaleMuted)
            // The story's words as one card of rows, each word beside its meaning.
            if(words.isNotEmpty()) ChunkyBox(TaleSurface,Modifier.fillMaxWidth(),depth=5.dp,border=TaleLine) {
                Column(Modifier.padding(horizontal=16.dp,vertical=6.dp)) {
                    words.forEachIndexed {i,word ->
                        if(i>0) HorizontalDivider(color=TaleLine,thickness=2.dp)
                        FlowRow(Modifier.fillMaxWidth().padding(vertical=10.dp),horizontalArrangement=Arrangement.spacedBy(8.dp),maxItemsInEachRow=sideBySide(2)) {
                            Text(word.word,fontFamily=TaleDisplay,fontSize=18.sp,fontWeight=FontWeight.ExtraBold,modifier=Modifier.weight(1f))
                            Text(word.translation,color=TaleMuted,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f))
                        }
                    }
                }
            }
            if(words.isNotEmpty()) ChunkyButton(stringResource(R.string.kelimeyi_kaydet_ve_calis, words.size),{onPractice(words.map {it.id})},Modifier.fillMaxWidth())
            TextButton(onClick=onDailyPlan,modifier=Modifier.heightIn(min=48.dp)) {Text(stringResource(R.string.gunluk_planima_don),fontWeight=FontWeight.ExtraBold)}
            if(snapshot.todayReadings==1) ReminderControls()
        }
    }
    ConfettiBurst(Modifier.fillMaxSize(),story.id)
    }
}

@Composable
fun LearningSettingsScreen(snapshot: LearningSnapshot,onBack: ()->Unit,onSave: (String,String,Int,String)->Unit) {
    var name by rememberSaveable {mutableStateOf(snapshot.displayName)}
    var level by rememberSaveable {mutableStateOf(snapshot.level)}
    var genre by rememberSaveable {mutableStateOf(snapshot.preferredGenre)}
    var goal by rememberSaveable {mutableIntStateOf(snapshot.dailyGoal)}
    var placement by rememberSaveable {mutableStateOf(false)}
    if (placement) {
        PlacementScreen(onUseLevel={level=it;placement=false},onCancel={placement=false},fromSettings=true)
        return
    }
    Column(Modifier.fillMaxSize().background(TaleBackground).statusBarsPadding().navigationBarsPadding().verticalScroll(rememberScrollState())) {
        SimpleTopBar(stringResource(R.string.ayarlar),onBack)
        Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(14.dp)) {
            OutlinedTextField(value=name,onValueChange={name=it.take(30)},label={Text(stringResource(R.string.adin))},singleLine=true,modifier=Modifier.fillMaxWidth())
            Text(stringResource(R.string.ingilizce_seviyen),fontWeight=FontWeight.Bold)
            PreferenceChoices(listOf("A1","A2","B1"),level) {level=it}
            OutlinedButton(onClick={placement=true},modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.placement_entry))}
            Text(stringResource(R.string.sevdigin_hikayeler),fontWeight=FontWeight.Bold)
            PreferenceChoices(listOf("Günlük yaşam","Macera","Gizem"),genre,label={genreLabel(it)}) {genre=it}
            Text(stringResource(R.string.gunluk_hedefin),fontWeight=FontWeight.Bold)
            val goalOptions=listOf(stringResource(R.string.adim_secenek_1),stringResource(R.string.adim_secenek_2),stringResource(R.string.adim_secenek_3))
            PreferenceChoices(goalOptions,goalOptions[goal.coerceIn(1,3)-1]) {goal=goalOptions.indexOf(it)+1}
            Text(stringResource(R.string.bir_adim_tamamlanan_bir_hikaye),fontSize=12.sp,color=TaleMuted)
            ReminderControls()
            com.yurken.englishtales.ads.AdPrivacyControls()
            com.yurken.englishtales.analytics.AnalyticsControls()
            LanguageControls()
            ThemeControls()
            val alerts=LocalTaleAlerts.current
            val savedText=stringResource(R.string.alert_settings_saved)
            Button(onClick={onSave(level,genre,goal,name);alerts.success(savedText)},modifier=Modifier.fillMaxWidth().heightIn(min=50.dp),shape=RoundedCornerShape(14.dp)) {Text(stringResource(R.string.degisiklikleri_kaydet))}
            Text(stringResource(R.string.ilerlemen_bu_cihazda_saklanir_uygulama),fontSize=12.sp,color=TaleMuted)
            SupportLinks()
        }
    }
}

@Composable
private fun PreferenceChoices(options: List<String>,selected: String,label: @Composable (String)->String = {it},onSelect: (String)->Unit) {
    Column(Modifier.selectableGroup(),verticalArrangement=Arrangement.spacedBy(6.dp)) {options.forEach {value ->
        Row(Modifier.fillMaxWidth().border(1.dp,if(value==selected) TaleBlue else TaleLine,RoundedCornerShape(10.dp)).selectable(selected=value==selected,role=Role.RadioButton) {onSelect(value)}.padding(12.dp),verticalAlignment=Alignment.CenterVertically) {
            Text(label(value),fontSize=14.sp,modifier=Modifier.weight(1f));if(value==selected) Text("✓",color=TaleBlue)
        }
    } }
}
