package com.yurken.englishtales.ui

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
import java.util.Locale

@Composable
fun DailyPlan(snapshot: LearningSnapshot,onRead: (String)->Unit,onPractice: (List<String>)->Unit) {
    val position=snapshot.readingPositions[snapshot.lastStoryId]
    val resume=(position?.let {LearningContent.revision(it.revisionId)} ?: LearningContent.storyById[snapshot.lastStoryId])?.takeIf {snapshot.progressFor(it)<100}
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
                border=BorderStroke(1.dp,TaleLine),modifier=Modifier.fillMaxWidth()) {
                Column(Modifier.padding(20.dp),verticalArrangement=Arrangement.spacedBy(16.dp)) {
                    Text(if(resume!=null) stringResource(R.string.kaldigin_hikaye) else if(progress==100) stringResource(R.string.yeniden_kesfet) else stringResource(R.string.siradaki_hikayen),
                        style=MaterialTheme.typography.labelLarge,color=TaleBlue)
                    Row(horizontalArrangement=Arrangement.spacedBy(16.dp),verticalAlignment=Alignment.CenterVertically) {
                        BookCover(next,Modifier.size(68.dp,100.dp))
                        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(8.dp)) {
                            Text(next.title,style=MaterialTheme.typography.titleLarge)
                            Text("${next.level} · ${next.genre}",style=MaterialTheme.typography.bodyMedium,color=TaleMuted)
                            if(resume!=null) Text(stringResource(R.string.tamamlandi_2, progress),style=MaterialTheme.typography.bodyMedium,color=TaleMuted)
                        }
                    }
                    if(resume!=null) ReferenceProgress(progress/100f,Modifier.fillMaxWidth(),TaleBlue)
                    Button(onClick={onRead(next.id)},modifier=Modifier.fillMaxWidth().heightIn(min=48.dp)) {
                        Text(if(resume!=null) stringResource(R.string.okumaya_devam_et) else if(progress==100) stringResource(R.string.yeniden_oku) else stringResource(R.string.hikayeye_basla))
                    }
                }
            }
        } else Text(stringResource(R.string.yeni_hikayeler_hazirlandiginda_burada_gorunecek),color=TaleMuted)
        if(snapshot.dueWordIds.isNotEmpty()) {
            val batch=snapshot.dueWordIds.take(5)
            OutlinedButton(onClick={onPractice(batch)},modifier=Modifier.fillMaxWidth().heightIn(min=48.dp)) {
                Column(Modifier.padding(vertical=8.dp),verticalArrangement=Arrangement.spacedBy(4.dp)) {
                    Text(stringResource(R.string.kelimeyi_hatirla, batch.size),style=MaterialTheme.typography.titleMedium)
                    Text(stringResource(R.string.kelimenin_tekrar_zamani_geldi, snapshot.dueWordIds.size),style=MaterialTheme.typography.bodyMedium,color=TaleMuted)
                }
            }
        } else if(snapshot.savedWordIds.isNotEmpty()) {
            Text(stringResource(R.string.tekrarlarin_guncel),color=TaleMuted)
            snapshot.nextReviewAt?.let {at -> Text(stringResource(R.string.sonraki_tekrar, SimpleDateFormat("d MMM, HH:mm",Locale.forLanguageTag("tr")).format(Date(at))),
                style=MaterialTheme.typography.bodyMedium,color=TaleMuted)}
        }
    }
}

@Composable
fun WeeklyActivity(snapshot: LearningSnapshot) {
    Column(Modifier.fillMaxWidth().padding(16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
        Text(stringResource(R.string.son_7_gun),fontSize=17.sp,fontWeight=FontWeight.Bold)
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(6.dp)) {
            snapshot.weeklyActivity.forEach {day -> Column(Modifier.weight(1f),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(8.dp)) {
                Box(Modifier.fillMaxWidth().heightIn(min=38.dp).background(if(day.sessions>0) TaleBlue else TaleLine,RoundedCornerShape(10.dp)).padding(vertical=9.dp),contentAlignment=Alignment.Center) {Text(if(day.sessions>0) "${day.sessions}" else "·",fontSize=14.sp,color=if(day.sessions>0) Color.White else TaleMuted)}
                Text(day.label,fontSize=10.sp,color=TaleMuted)
            } }
        }
        Text(stringResource(R.string.gun_calistin_adim_tamamladin, snapshot.weeklyActivity.count {it.sessions>0}, snapshot.weeklyActivity.sumOf {it.sessions}),fontSize=12.sp,color=TaleMuted)
    }
}

@Composable
fun EarnedBadges(snapshot: LearningSnapshot) {
    val labels=linkedMapOf("first_story" to stringResource(R.string.ilk_hikaye), "first_practice" to stringResource(R.string.ilk_calisma), "five_words" to stringResource(R.string.kelime_5), "three_day_streak" to stringResource(R.string.gunluk_seri_3), "seven_day_streak" to stringResource(R.string.gunluk_seri_7))
    Column(Modifier.fillMaxWidth().padding(vertical=8.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
        Text(stringResource(R.string.basarilarin),fontSize=17.sp,fontWeight=FontWeight.Bold)
        labels.forEach {(id,label) -> Row(Modifier.fillMaxWidth().background(if(id in snapshot.badges) Color(0xFFFFF6D5) else TaleLine,RoundedCornerShape(10.dp)).padding(12.dp),verticalAlignment=Alignment.CenterVertically) {
            Text(if(id in snapshot.badges) "★" else "☆",color=if(id in snapshot.badges) Color(0xFFB08000) else TaleMuted,fontSize=24.sp)
            Text(label,fontSize=14.sp,modifier=Modifier.weight(1f).padding(start=12.dp))
            Text(if(id in snapshot.badges) stringResource(R.string.kazanildi) else stringResource(R.string.sirada),color=TaleMuted,fontSize=11.sp)
        } }
    }
}

@Composable
fun ReadingResultScreen(story: Story,snapshot: LearningSnapshot,onPractice: (List<String>)->Unit,onDailyPlan: ()->Unit,onBack: ()->Unit=onDailyPlan) {
    val words=remember(story.id) {LearningContent.wordsForStory(story).take(5)}
    Column(Modifier.fillMaxSize().background(Color.White).statusBarsPadding().navigationBarsPadding().verticalScroll(rememberScrollState())) {
        SimpleTopBar(stringResource(R.string.okuma_tamamlandi),onBack)
        Column(Modifier.padding(24.dp),verticalArrangement=Arrangement.spacedBy(18.dp),horizontalAlignment=Alignment.CenterHorizontally) {
            Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(16.dp)) {
                TalesMascot(MascotMood.Celebrate,Modifier.size(144.dp),animate=true)
                BookCover(story,Modifier.size(64.dp,94.dp))
            }
            Text(stringResource(R.string.bir_hikaye_tamamladin),fontSize=22.sp,fontWeight=FontWeight.Bold)
            Text(story.title,fontSize=15.sp,color=TaleMuted)
            Text(if(snapshot.dailyGoalReached) stringResource(R.string.gunluk_hedef_tamamlandi) else stringResource(R.string.gunluk_hedef_adim, snapshot.todaySessions, snapshot.dailyGoal),color=TaleBlue,fontWeight=FontWeight.Bold)
            Text(stringResource(R.string.okudugun_kelimeleri_simdi_hatirlamayi_deneyelim),fontSize=14.sp,color=TaleMuted)
            words.forEach {word -> Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween) {Text(word.word,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f));Text(word.translation,color=TaleMuted,modifier=Modifier.weight(1f))} }
            if(words.isNotEmpty()) Button(onClick={onPractice(words.map {it.id})},modifier=Modifier.fillMaxWidth(),shape=RoundedCornerShape(10.dp)) {Text(stringResource(R.string.kelimeyi_kaydet_ve_calis, words.size))}
            TextButton(onClick=onDailyPlan) {Text(stringResource(R.string.gunluk_planima_don))}
            if(snapshot.todayReadings==1) ReminderControls()
        }
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
    Column(Modifier.fillMaxSize().background(Color.White).statusBarsPadding().navigationBarsPadding().verticalScroll(rememberScrollState())) {
        SimpleTopBar(stringResource(R.string.ayarlar),onBack)
        Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(14.dp)) {
            OutlinedTextField(value=name,onValueChange={name=it.take(30)},label={Text(stringResource(R.string.adin))},singleLine=true,modifier=Modifier.fillMaxWidth())
            Text(stringResource(R.string.ingilizce_seviyen),fontWeight=FontWeight.Bold)
            PreferenceChoices(listOf("A1","A2","B1"),level) {level=it}
            OutlinedButton(onClick={placement=true},modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.placement_entry))}
            Text(stringResource(R.string.sevdigin_hikayeler),fontWeight=FontWeight.Bold)
            PreferenceChoices(listOf("Günlük yaşam","Macera","Gizem"),genre) {genre=it}
            Text(stringResource(R.string.gunluk_hedefin),fontWeight=FontWeight.Bold)
            PreferenceChoices(listOf(stringResource(R.string.adim_secenek_1),stringResource(R.string.adim_secenek_2),stringResource(R.string.adim_secenek_3)),stringResource(R.string.adim_2, goal)) {goal=it.first().digitToInt()}
            Text(stringResource(R.string.bir_adim_tamamlanan_bir_hikaye),fontSize=12.sp,color=TaleMuted)
            ReminderControls()
            com.yurken.englishtales.ads.AdPrivacyControls()
            com.yurken.englishtales.analytics.AnalyticsControls()
            Button(onClick={onSave(level,genre,goal,name)},modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.degisiklikleri_kaydet))}
            Text(stringResource(R.string.ilerlemen_bu_cihazda_saklanir_uygulama),fontSize=12.sp,color=TaleMuted)
            SupportLinks()
        }
    }
}

@Composable
private fun PreferenceChoices(options: List<String>,selected: String,onSelect: (String)->Unit) {
    Column(Modifier.selectableGroup(),verticalArrangement=Arrangement.spacedBy(6.dp)) {options.forEach {value ->
        Row(Modifier.fillMaxWidth().border(1.dp,if(value==selected) TaleBlue else TaleLine,RoundedCornerShape(10.dp)).selectable(selected=value==selected,role=Role.RadioButton) {onSelect(value)}.padding(12.dp),verticalAlignment=Alignment.CenterVertically) {
            Text(value,fontSize=14.sp,modifier=Modifier.weight(1f));if(value==selected) Text("✓",color=TaleBlue)
        }
    } }
}
