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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.data.*
import com.yurken.englishtales.R
import java.text.SimpleDateFormat
import java.util.Date

@Composable
fun DailyPlan(snapshot: LearningSnapshot,onRead: (String)->Unit,onPractice: (List<String>)->Unit) {
    val position=snapshot.readingPositions[snapshot.lastStoryId]
    val resume=(position?.let {p -> LearningContent.storyById[snapshot.lastStoryId]?.takeIf {p.carriesTo(it)} ?: LearningContent.revision(p.revisionId)} ?: LearningContent.storyById[snapshot.lastStoryId])?.takeIf {snapshot.progressFor(it)<100}
    val next=resume?:LearningContent.recommendedStory(snapshot.level,snapshot.preferredGenre,LearningContent.stories.associate {it.id to snapshot.progressFor(it)})
    Column(Modifier.padding(horizontal=16.dp).fillMaxWidth(),verticalArrangement=Arrangement.spacedBy(16.dp)) {
        Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically) {
            Text(stringResource(R.string.bugunku_planin),style=MaterialTheme.typography.titleLarge,modifier=Modifier.weight(1f))
            Text(stringResource(R.string.adim, snapshot.todaySessions, snapshot.dailyGoal),color=TaleMuted,style=MaterialTheme.typography.labelLarge)
        }
        ReferenceProgress((snapshot.todaySessions.toFloat()/snapshot.dailyGoal).coerceAtMost(1f),Modifier.fillMaxWidth(),TaleBlue)
        Text(if(snapshot.dailyGoalReached) stringResource(R.string.hedef_tamamlandi_istersen_okumaya_devam)
            else stringResource(R.string.bir_hikaye_veya_kisa_bir),style=MaterialTheme.typography.bodyMedium,color=TaleMuted)
        if(next!=null) {
            val progress=snapshot.progressFor(next)
            Surface(shape=MaterialTheme.shapes.large,color=MaterialTheme.colorScheme.surface,
                border=BorderStroke(1.dp,TaleLine),shadowElevation=2.dp,modifier=Modifier.fillMaxWidth().appearIn(1)) {
                Column(Modifier.padding(20.dp),verticalArrangement=Arrangement.spacedBy(16.dp)) {
                    Text(if(resume!=null) stringResource(R.string.kaldigin_hikaye) else if(progress==100) stringResource(R.string.yeniden_kesfet) else stringResource(R.string.siradaki_hikayen),
                        style=MaterialTheme.typography.labelLarge,color=TaleBlue)
                    Row(horizontalArrangement=Arrangement.spacedBy(16.dp),verticalAlignment=Alignment.CenterVertically) {
                        BookCover(next,Modifier.size(68.dp,100.dp))
                        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(8.dp)) {
                            Text(next.title,style=MaterialTheme.typography.titleLarge)
                            Text("${next.level} · ${genreLabel(next.genre)}",style=MaterialTheme.typography.bodyMedium,color=TaleMuted)
                            if(resume!=null) Text(stringResource(R.string.tamamlandi_2, progress),style=MaterialTheme.typography.bodyMedium,color=TaleMuted)
                        }
                    }
                    if(resume!=null) ReferenceProgress(progress/100f,Modifier.fillMaxWidth(),TaleBlue)
                    Button(onClick={onRead(next.id)},modifier=Modifier.fillMaxWidth().heightIn(min=50.dp),shape=RoundedCornerShape(14.dp)) {
                        Text(if(resume!=null) stringResource(R.string.okumaya_devam_et) else if(progress==100) stringResource(R.string.yeniden_oku) else stringResource(R.string.hikayeye_basla))
                    }
                }
            }
        } else Text(stringResource(R.string.yeni_hikayeler_hazirlandiginda_burada_gorunecek),color=TaleMuted)
        if(snapshot.dueWordIds.isNotEmpty()) {
            val batch=ReviewFocus.order(emptyList(),snapshot.weakWordIds.filter {it in snapshot.dueWordIds},snapshot.dueWordIds,emptyList()).take(5)
            PlanActionRow("review",LocalTaleColors.current.tilePurple,stringResource(R.string.kelimeyi_hatirla, batch.size),
                stringResource(R.string.kelimenin_tekrar_zamani_geldi, snapshot.dueWordIds.size)) {onPractice(batch)}
        } else if(snapshot.weakWordIds.isNotEmpty()) {
            // Early practice: LearningPolicy ignores correct answers before the due time, so mastery is not inflated.
            val batch=snapshot.weakWordIds.take(5)
            PlanActionRow("review",LocalTaleColors.current.tileYellow,stringResource(R.string.weak_words_practice, batch.size),
                stringResource(R.string.weak_words_summary)) {onPractice(batch)}
        } else if(snapshot.savedWordIds.isNotEmpty()) {
            Text(stringResource(R.string.tekrarlarin_guncel),color=TaleMuted)
            snapshot.nextReviewAt?.let {at -> Text(stringResource(R.string.sonraki_tekrar, SimpleDateFormat("d MMM, HH:mm",AppLanguage.locale(LocalContext.current)).format(Date(at))),
                style=MaterialTheme.typography.bodyMedium,color=TaleMuted)}
        }
    }
}

/** A tappable plan step: tinted icon, title and reason, with a chevron; sinks a little while pressed. */
@Composable
private fun PlanActionRow(icon: String,tint: Color,title: String,subtitle: String,onClick: ()->Unit) {
    Row(Modifier.fillMaxWidth().appearIn(2).heightIn(min=64.dp).background(TaleSurface,RoundedCornerShape(16.dp)).border(1.dp,TaleLine,RoundedCornerShape(16.dp))
        .pressScale(onClick=onClick).padding(horizontal=14.dp,vertical=12.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)) {
        Box(Modifier.size(40.dp).background(tint,RoundedCornerShape(12.dp)),contentAlignment=Alignment.Center) { ReferenceIcon(icon,TaleBlue,Modifier.size(22.dp)) }
        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(2.dp)) {
            Text(title,style=MaterialTheme.typography.titleMedium,color=TaleBlue)
            Text(subtitle,style=MaterialTheme.typography.bodyMedium,color=TaleMuted)
        }
        ReferenceIcon("next",TaleMuted,Modifier.size(18.dp))
    }
}

@Composable
fun WeeklyActivity(snapshot: LearningSnapshot) {
    Column(Modifier.fillMaxWidth().padding(16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
        // The streak sits next to the week it comes from, and one line says what today still needs.
        Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically) {
            Text(stringResource(R.string.son_7_gun),fontSize=17.sp,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f))
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
                    Box(Modifier.fillMaxWidth().height(40.dp).background(if(active) TaleBlue else if(frozen) LocalTaleColors.current.tileBlue else TaleLine.copy(alpha=0.6f),RoundedCornerShape(12.dp))
                        .then(if(frozen) Modifier.border(1.5.dp,TaleBlue.copy(alpha=0.5f),RoundedCornerShape(12.dp)).contentLabel(frozenLabel) else Modifier)
                        .then(if(today) Modifier.border(2.dp,if(active) TaleInk.copy(alpha=0.25f) else TaleBlue,RoundedCornerShape(12.dp)) else Modifier),contentAlignment=Alignment.Center) {
                        if(active) Text("${day.sessions}",fontSize=14.sp,fontWeight=FontWeight.Bold,color=TaleOnBlue)
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
            Box(Modifier.size(36.dp).background(if(id in snapshot.badges) TaleYellow else TaleSurface,androidx.compose.foundation.shape.CircleShape),contentAlignment=Alignment.Center) {
                ReferenceIcon("star",if(id in snapshot.badges) TaleGold else TaleLine,Modifier.size(20.dp).then(if(id in snapshot.badges) Modifier.popOn(1) else Modifier))
            }
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
            Text(stringResource(R.string.bir_hikaye_tamamladin),fontSize=22.sp,fontWeight=FontWeight.Bold,modifier=Modifier.appearIn(1))
            Text(story.title,fontSize=15.sp,color=TaleMuted,modifier=Modifier.appearIn(2))
            Text(if(snapshot.dailyGoalReached) stringResource(R.string.gunluk_hedef_tamamlandi) else stringResource(R.string.gunluk_hedef_adim, snapshot.todaySessions, snapshot.dailyGoal),color=TaleBlue,fontWeight=FontWeight.Bold,
                modifier=Modifier.appearIn(3).background(LocalTaleColors.current.tileBlue,RoundedCornerShape(20.dp)).padding(horizontal=14.dp,vertical=6.dp))
            ComprehensionQuiz(story.id,story.questions)
            Text(stringResource(R.string.okudugun_kelimeleri_simdi_hatirlamayi_deneyelim),fontSize=14.sp,color=TaleMuted)
            words.forEach {word -> FlowRow(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(8.dp),maxItemsInEachRow=sideBySide(2)) {Text(word.word,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f));Text(word.translation,color=TaleMuted,modifier=Modifier.weight(1f))} }
            if(words.isNotEmpty()) Button(onClick={onPractice(words.map {it.id})},modifier=Modifier.fillMaxWidth().heightIn(min=50.dp),shape=RoundedCornerShape(14.dp)) {Text(stringResource(R.string.kelimeyi_kaydet_ve_calis, words.size))}
            TextButton(onClick=onDailyPlan) {Text(stringResource(R.string.gunluk_planima_don))}
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
