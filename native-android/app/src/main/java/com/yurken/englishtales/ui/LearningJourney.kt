package com.yurken.englishtales.ui

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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun DailyPlan(snapshot: LearningSnapshot,onRead: (String)->Unit,onPractice: (List<String>)->Unit) {
    val position=snapshot.readingPositions[snapshot.lastStoryId]
    val resume=(position?.let {LearningContent.revision(it.revisionId)} ?: LearningContent.storyById[snapshot.lastStoryId])?.takeIf {snapshot.progressFor(it)<100}
    val next=resume?:LearningContent.recommendedStory(snapshot.level,snapshot.preferredGenre,LearningContent.stories.associate {it.id to snapshot.progressFor(it)})
    Column(Modifier.padding(horizontal=16.dp).fillMaxWidth().border(1.dp,TaleLine,RoundedCornerShape(14.dp)).padding(16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment=Alignment.CenterVertically) {
            Text("Bugünkü planın",fontSize=20.sp,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f))
            Text("${snapshot.todaySessions} / ${snapshot.dailyGoal}",color=TaleBlue,fontWeight=FontWeight.Bold)
        }
        ReferenceProgress((snapshot.todaySessions.toFloat()/snapshot.dailyGoal).coerceAtMost(1f),Modifier.fillMaxWidth(),TaleBlue)
        Text(if(snapshot.dailyGoalReached) "Hedef tamamlandı! Bugünkü emeğin kaydedildi. Yarın yeni bir adımla devam edebilirsin." else "Bir hikâye veya kısa bir kelime çalışması = 1 adım.",fontSize=12.sp,color=TaleMuted)
        if(snapshot.dueWordIds.isNotEmpty()) {
            PlanAction("${snapshot.dueWordIds.size} kelimeyi hatırla","Tekrar zamanı geldi", "review") {onPractice(snapshot.dueWordIds.take(5))}
        } else if(snapshot.savedWordIds.isNotEmpty()) {
            Text("Tekrarların güncel ✓",fontSize=14.sp,color=TaleBlue)
            snapshot.nextReviewAt?.let {at -> Text("Sonraki tekrar: ${SimpleDateFormat("d MMM, HH:mm",Locale.forLanguageTag("tr")).format(Date(at))}",fontSize=12.sp,color=TaleMuted)}
        }
        if(next!=null) PlanAction(if(resume!=null) "Okumaya devam et" else "Sıradaki hikâyen",next.title+" · "+next.level,"read") {onRead(next.id)}
        else Text("Yeni hikâyeler hazırlandığında burada görünecek.",color=TaleMuted,fontSize=14.sp)
    }
}

@Composable
private fun PlanAction(title: String,subtitle: String,icon: String,onClick: ()->Unit) {
    Row(Modifier.fillMaxWidth().background(TaleBlue.copy(alpha=0.06f),RoundedCornerShape(10.dp)).clickable(onClick=onClick).padding(12.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)) {
        ReferenceIcon(icon,TaleBlue,Modifier.size(25.dp))
        Column(Modifier.weight(1f)) {Text(title,fontSize=14.sp,fontWeight=FontWeight.Bold);Text(subtitle,fontSize=12.sp,color=TaleMuted)}
        Text("›",color=TaleBlue,fontSize=24.sp)
    }
}

@Composable
fun WeeklyActivity(snapshot: LearningSnapshot) {
    Column(Modifier.fillMaxWidth().padding(16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
        Text("Son 7 gün",fontSize=17.sp,fontWeight=FontWeight.Bold)
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(6.dp)) {
            snapshot.weeklyActivity.forEach {day -> Column(Modifier.weight(1f),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(8.dp)) {
                Box(Modifier.fillMaxWidth().heightIn(min=38.dp).background(if(day.sessions>0) TaleBlue else TaleLine,RoundedCornerShape(10.dp)).padding(vertical=9.dp),contentAlignment=Alignment.Center) {Text(if(day.sessions>0) "${day.sessions}" else "·",fontSize=14.sp,color=if(day.sessions>0) Color.White else TaleMuted)}
                Text(day.label,fontSize=10.sp,color=TaleMuted)
            } }
        }
        Text("${snapshot.weeklyActivity.count {it.sessions>0}} gün çalıştın · ${snapshot.weeklyActivity.sumOf {it.sessions}} adım tamamladın",fontSize=12.sp,color=TaleMuted)
    }
}

@Composable
fun EarnedBadges(snapshot: LearningSnapshot) {
    val labels=linkedMapOf("first_story" to "İlk hikâye", "first_practice" to "İlk çalışma", "five_words" to "5 kelime", "three_day_streak" to "3 günlük seri", "seven_day_streak" to "7 günlük seri")
    Column(Modifier.fillMaxWidth().padding(vertical=8.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
        Text("Başarıların",fontSize=17.sp,fontWeight=FontWeight.Bold)
        labels.forEach {(id,label) -> Row(Modifier.fillMaxWidth().background(if(id in snapshot.badges) Color(0xFFFFF6D5) else TaleLine,RoundedCornerShape(10.dp)).padding(12.dp),verticalAlignment=Alignment.CenterVertically) {
            Text(if(id in snapshot.badges) "★" else "☆",color=if(id in snapshot.badges) Color(0xFFB08000) else TaleMuted,fontSize=24.sp)
            Text(label,fontSize=14.sp,modifier=Modifier.weight(1f).padding(start=12.dp))
            Text(if(id in snapshot.badges) "Kazanıldı" else "Sırada",color=TaleMuted,fontSize=11.sp)
        } }
    }
}

@Composable
fun ReadingResultScreen(story: Story,snapshot: LearningSnapshot,onPractice: (List<String>)->Unit,onDailyPlan: ()->Unit) {
    val words=remember(story.id) {LearningContent.wordsForStory(story).take(5)}
    Column(Modifier.fillMaxSize().background(Color.White).statusBarsPadding().navigationBarsPadding().verticalScroll(rememberScrollState())) {
        SimpleTopBar("Okuma tamamlandı",onDailyPlan)
        Column(Modifier.padding(24.dp),verticalArrangement=Arrangement.spacedBy(18.dp),horizontalAlignment=Alignment.CenterHorizontally) {
            BookCover(story,Modifier.size(112.dp,164.dp))
            Text("Bir hikâye tamamladın!",fontSize=22.sp,fontWeight=FontWeight.Bold)
            Text(story.title,fontSize=15.sp,color=TaleMuted)
            Text(if(snapshot.dailyGoalReached) "Günlük hedef tamamlandı ✓" else "Günlük hedef: ${snapshot.todaySessions} / ${snapshot.dailyGoal} adım",color=TaleBlue,fontWeight=FontWeight.Bold)
            Text("Okuduğun kelimeleri şimdi hatırlamayı deneyelim. Kaydettiğin kelimeler daha sonra tekrar planına alınacak.",fontSize=14.sp,color=TaleMuted)
            words.forEach {word -> Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween) {Text(word.word,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f));Text(word.translation,color=TaleMuted,modifier=Modifier.weight(1f))} }
            if(words.isNotEmpty()) Button(onClick={onPractice(words.map {it.id})},modifier=Modifier.fillMaxWidth(),shape=RoundedCornerShape(10.dp)) {Text("${words.size} kelimeyi kaydet ve çalış")}
            TextButton(onClick=onDailyPlan) {Text("Günlük planıma dön")}
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
    Column(Modifier.fillMaxSize().background(Color.White).statusBarsPadding().navigationBarsPadding().verticalScroll(rememberScrollState())) {
        SimpleTopBar("Ayarlar",onBack)
        Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(14.dp)) {
            OutlinedTextField(value=name,onValueChange={name=it.take(30)},label={Text("Adın")},singleLine=true,modifier=Modifier.fillMaxWidth())
            Text("İngilizce seviyen",fontWeight=FontWeight.Bold)
            PreferenceChoices(listOf("A1","A2","B1"),level) {level=it}
            Text("Sevdiğin hikâyeler",fontWeight=FontWeight.Bold)
            PreferenceChoices(listOf("Günlük yaşam","Macera","Gizem"),genre) {genre=it}
            Text("Günlük hedefin",fontWeight=FontWeight.Bold)
            PreferenceChoices(listOf("1 adım","2 adım","3 adım"),"$goal adım") {goal=it.first().digitToInt()}
            Text("Bir adım = tamamlanan bir hikâye veya kelime çalışması.",fontSize=12.sp,color=TaleMuted)
            ReminderControls()
            Button(onClick={onSave(level,genre,goal,name)},modifier=Modifier.fillMaxWidth()) {Text("Değişiklikleri kaydet")}
            Text("İlerlemen bu cihazda saklanır. Uygulama verilerini silmek ilerlemeni de siler.",fontSize=12.sp,color=TaleMuted)
        }
    }
}

@Composable
private fun PreferenceChoices(options: List<String>,selected: String,onSelect: (String)->Unit) {
    Column(verticalArrangement=Arrangement.spacedBy(6.dp)) {options.forEach {value ->
        Row(Modifier.fillMaxWidth().border(1.dp,if(value==selected) TaleBlue else TaleLine,RoundedCornerShape(10.dp)).clickable {onSelect(value)}.padding(12.dp),verticalAlignment=Alignment.CenterVertically) {
            Text(value,fontSize=14.sp,modifier=Modifier.weight(1f));if(value==selected) Text("✓",color=TaleBlue)
        }
    } }
}
