package com.yurken.englishtales.ui

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.activity.compose.BackHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.R
import com.yurken.englishtales.data.LearningContent
import com.yurken.englishtales.data.LearningSnapshot
import com.yurken.englishtales.data.Story
import com.yurken.englishtales.data.progressFor

@Composable
fun StatsHeader(snapshot: LearningSnapshot) {
    Row(Modifier.fillMaxWidth().padding(horizontal=16.dp,vertical=12.dp),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically) {
        Text("🇺🇸",fontSize=29.sp)
        LearningInfoButton("study",snapshot.level,"İngilizce seviyen","Seçtiğin seviye ${snapshot.level}. Hikâye önerileri buna göre hazırlanır. Seviyeni Profilim → Ayarlar ekranından değiştirebilirsin.")
        LearningInfoButton("fire","${snapshot.streak}","Çalışma serin",streakExplanation(snapshot))
        LearningInfoButton("diamond","${snapshot.points}","Puanların",pointsExplanation(snapshot))
    }
}

@Composable
private fun ChallengeBanner(onClick: () -> Unit) {
    Column(Modifier.padding(horizontal=16.dp)) {
        Text("okuma alışkanlığın burada başlar",fontSize=10.sp,fontWeight=FontWeight.Bold,color=Color(0xFF6C294F),
            modifier=Modifier.background(Color(0xFFFFE85A),RoundedCornerShape(topStart=9.dp,topEnd=9.dp)).padding(horizontal=9.dp,vertical=6.dp))
        Box(Modifier.fillMaxWidth().heightIn(min=126.dp).clip(RoundedCornerShape(topEnd=16.dp,bottomStart=16.dp,bottomEnd=16.dp)).background(Color(0xFFFFF58B)).clickable(onClick=onClick)) {
            Image(painterResource(R.drawable.reading_guide),null,Modifier.align(Alignment.BottomEnd).width(104.dp).height(126.dp),contentScale=ContentScale.Crop,alignment=Alignment.TopCenter)
            Column(Modifier.fillMaxWidth(0.72f).padding(start=16.dp,top=14.dp,bottom=14.dp),verticalArrangement=Arrangement.spacedBy(4.dp)) {
                Text("Bir hikâye,\nyeni kelimeler",fontSize=19.sp,lineHeight=22.sp,fontWeight=FontWeight.Bold,color=Color(0xFF6C294F))
                Text("Oku, dinle ve öğren",fontSize=12.sp,lineHeight=17.sp,color=Color(0xFF6C294F))
                Text("Okumaya başla",fontSize=11.sp,lineHeight=14.sp,color=Color.White,fontWeight=FontWeight.Bold,
                    modifier=Modifier.background(TalePurple,RoundedCornerShape(20.dp)).padding(horizontal=12.dp,vertical=5.dp))
            }
        }
    }
}

@Composable
fun StudyScreen(snapshot: LearningSnapshot, onOpenStory: (String) -> Unit, onOpenWords: () -> Unit, padding: PaddingValues, onRead: (String)->Unit, onPractice: (List<String>)->Unit) {
    val stories=LearningContent.stories.sortedByDescending { it.level==snapshot.level }
    var showAll by rememberSaveable { mutableStateOf(false) }
    BackHandler(enabled=showAll) { showAll=false }
    if(showAll) {
        Column(Modifier.fillMaxSize().padding(padding)) {
            SimpleTopBar("Senin için") { showAll=false }
            LazyColumn(contentPadding=PaddingValues(16.dp),verticalArrangement=Arrangement.spacedBy(18.dp)) {
                items(stories,key={it.id}) { story -> StoryCard(story,snapshot.progressFor(story)) {onOpenStory(story.id)} }
            }
        }
        return
    }
    Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState())) {
        StatsHeader(snapshot)
        Spacer(Modifier.height(15.dp))
        DailyPlan(snapshot,onRead,onPractice)
        WeeklyActivity(snapshot)
        Spacer(Modifier.height(25.dp))
        Row(Modifier.padding(horizontal=16.dp).fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically) {
            Text("Kelimelerin",fontSize=20.sp)
            Text("Kelimelerim →",color=TaleBlue,fontSize=12.sp,modifier=Modifier.clickable(onClick=onOpenWords).padding(8.dp))
        }
        Row(Modifier.padding(16.dp).fillMaxWidth().border(1.dp,TaleLine,RoundedCornerShape(10.dp)).clickable(onClick=onOpenWords).padding(18.dp),verticalAlignment=Alignment.CenterVertically) {
            ReferenceIcon("study",TaleBlue,Modifier.size(35.dp))
            Column(Modifier.weight(1f).padding(start=16.dp)) {
                Text("${snapshot.savedWordIds.size} kelime",fontSize=20.sp,fontWeight=FontWeight.Bold)
                Text("Öğrenmeye devam et",color=TaleMuted,fontSize=12.sp)
            }
            Text("→",color=TaleBlue,fontSize=24.sp)
        }
        BookShelf("Senin için",stories,onOpenStory) { showAll=true }
    }
}

@Composable
fun CatalogScreen(snapshot: LearningSnapshot, onOpenStory: (String) -> Unit, padding: PaddingValues) {
    var search by rememberSaveable { mutableStateOf("") }
    var listMode by rememberSaveable { mutableStateOf("") }
    BackHandler(enabled=listMode.isNotBlank()) { listMode=""; search="" }
    val stories=LearningContent.stories
    val filtered=stories.filter { story ->
        (listMode!="books" || (snapshot.progressFor(story))>0) &&
        (listMode !in listOf("Macera","Gizem","Günlük yaşam") || story.genre==listMode) &&
        (listMode!="adventure" || story.genre!="Günlük yaşam") &&
        (listMode!="level" || story.level==snapshot.level) &&
        (listMode!="new" || story in stories.takeLast(3)) &&
        (search.isBlank() || story.title.contains(search,true) || story.description.contains(search,true))
    }
    Column(Modifier.fillMaxSize().padding(padding)) {
        if(listMode.isBlank()) {
            StatsHeader(snapshot)
            Row(Modifier.fillMaxWidth().padding(horizontal=16.dp,vertical=10.dp),horizontalArrangement=Arrangement.spacedBy(16.dp)) {
                listOf("Arama" to "search","Kitaplarım" to "read").forEachIndexed { i,(label,icon) ->
                    Row(Modifier.weight(1f).height(36.dp).background(TaleLine,RoundedCornerShape(7.dp)).clickable { listMode=if(i==0) "search" else "books" },horizontalArrangement=Arrangement.Center,verticalAlignment=Alignment.CenterVertically) {
                        ReferenceIcon(icon,TaleInk,Modifier.size(18.dp)); Spacer(Modifier.width(8.dp)); Text(label,fontSize=14.sp,fontWeight=FontWeight.Medium)
                    }
                }
            }
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                Spacer(Modifier.height(20.dp))
                if(stories.isNotEmpty()) ChallengeBanner { (stories.firstOrNull { it.level==snapshot.level } ?: stories.first()).let {onOpenStory(it.id)} }
                else Text("Şu anda yayımlanmış hikâye yok.",modifier=Modifier.padding(16.dp),color=TaleMuted)
                Spacer(Modifier.height(38.dp))
                BookShelf("Yeni hikâyeler",stories.takeLast(3),onOpenStory) { listMode="new" }
                Spacer(Modifier.height(30.dp))
                BookShelf("Macera ve gizem",stories.filter { it.genre!="Günlük yaşam" },onOpenStory) { listMode="adventure" }
                Spacer(Modifier.height(28.dp))
                BookShelf("Seviyene uygun",stories.filter { it.level==snapshot.level },onOpenStory) { listMode="level" }
                Spacer(Modifier.height(22.dp))
                listOf("Kategoriler" to "all","Günlük yaşam" to "Günlük yaşam","Macera" to "Macera","Gizem" to "Gizem").forEach { (label,key) ->
                    Row(Modifier.fillMaxWidth().clickable { listMode=key }.padding(horizontal=18.dp,vertical=14.dp),horizontalArrangement=Arrangement.SpaceBetween) { Text(label,fontSize=14.sp); Text("›",color=TaleMuted) }
                }
            }
        } else {
            SimpleTopBar(if(listMode=="books") "Kitaplarım" else if(listMode=="search") "Arama" else if(listMode=="new") "Yeni hikâyeler" else if(listMode=="level") "${snapshot.level} kitapları" else if(listMode=="adventure") "Macera ve gizem" else if(listMode=="all") "Kitaplar" else listMode) { listMode=""; search="" }
            if(listMode!="books") {
                BasicTextField(value=search,onValueChange={search=it},singleLine=true,modifier=Modifier.fillMaxWidth().padding(horizontal=16.dp).background(TaleLine,RoundedCornerShape(6.dp)).padding(12.dp),decorationBox={ inner ->
                    Box { if(search.isEmpty()) Text("Kitap ara",color=TaleMuted,fontSize=14.sp); inner() }
                })
            }
            Text(if(listMode=="books") "OKUNANLAR" else "KİTAPLAR",fontSize=10.sp,letterSpacing=1.sp,color=TaleBlue,modifier=Modifier.fillMaxWidth().padding(18.dp))
            HorizontalDivider(color=TaleLine)
            LazyColumn(contentPadding=PaddingValues(16.dp),verticalArrangement=Arrangement.spacedBy(18.dp)) {
                items(filtered,key={it.id}) { story -> StoryCard(story,snapshot.progressFor(story)) { onOpenStory(story.id) } }
                if(filtered.isEmpty()) item { Text(if(listMode=="books") "Okumaya başladığın kitaplar burada görünecek." else "Kitap bulunamadı.",color=TaleMuted,fontSize=14.sp) }
            }
        }
    }
}

@Composable
private fun BookShelf(title: String, stories: List<Story>, onOpenStory: (String) -> Unit, onAll: () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal=16.dp),verticalAlignment=Alignment.CenterVertically) {
        Text(title,fontSize=20.sp,modifier=Modifier.weight(1f),maxLines=1,overflow=TextOverflow.Ellipsis)
        Text("Tümünü gör",color=TaleBlue,fontSize=11.sp,fontWeight=FontWeight.Bold,modifier=Modifier.background(TaleLine,RoundedCornerShape(20.dp)).clickable(onClick=onAll).padding(horizontal=9.dp,vertical=6.dp))
    }
    Spacer(Modifier.height(22.dp))
    LazyRow(contentPadding=PaddingValues(horizontal=16.dp),horizontalArrangement=Arrangement.spacedBy(16.dp)) {
        items(stories,key={it.id}) { story ->
            Column(Modifier.width(130.dp).clickable { onOpenStory(story.id) }) {
                BookCover(story,Modifier.size(130.dp,190.dp))
                Spacer(Modifier.height(9.dp))
                Text(story.author,color=TaleMuted,fontSize=11.sp,maxLines=1)
                Spacer(Modifier.height(4.dp))
                Text(story.title,fontSize=14.sp,lineHeight=20.sp,maxLines=2,overflow=TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
fun StoryDetailScreen(story: Story, progress: Int, onBack: () -> Unit, onRead: () -> Unit, onListen: () -> Unit, onTabSelected: (Int) -> Unit, content: com.yurken.englishtales.data.ContentViewModel? = null) {
    val context=LocalContext.current
    Column(Modifier.fillMaxSize().background(Color.White).statusBarsPadding()) {
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
            SimpleTopBar("",onBack)
            Row(Modifier.fillMaxWidth().padding(start=24.dp,end=24.dp,top=32.dp,bottom=24.dp),horizontalArrangement=Arrangement.spacedBy(24.dp)) {
                Box { BookCover(story,Modifier.size(140.dp,200.dp)); if(progress>0) ReferenceProgress(progress/100f,Modifier.align(Alignment.BottomCenter).width(106.dp).padding(bottom=7.dp)) }
                Column(Modifier.weight(1f).heightIn(min=200.dp),verticalArrangement=Arrangement.SpaceBetween) {
                    Text(story.author,color=TaleMuted,fontSize=13.sp)
                    Spacer(Modifier.height(8.dp)); Text(story.title,fontSize=20.sp,lineHeight=24.sp,fontWeight=FontWeight.Bold)
                    Spacer(Modifier.height(16.dp))
                    Text("▮▮▮  ${when(story.level){"A1"->"Kolay";"A2"->"Orta";else->"Zor"}}",color=if(story.level=="A1") TaleBlue else Color(0xFFFF6338),fontSize=14.sp)
                    Spacer(Modifier.height(16.dp))
                    Row(horizontalArrangement=Arrangement.spacedBy(4.dp)) {
                        ReferenceIconButton("read","Hikâyeyi oku",onRead)
                        ReferenceIconButton("share","Hikâyeyi paylaş",onClick={
                            val intent=android.content.Intent(android.content.Intent.ACTION_SEND).apply { type="text/plain"; putExtra(android.content.Intent.EXTRA_TEXT,"${story.title} — ${story.description}\nEnglish Tales\nhttps://play.google.com/store/apps/details?id=com.yurken.englishtales") }
                            context.startActivity(android.content.Intent.createChooser(intent,"Hikâyeyi paylaş"))
                        })
                    }
                }
            }
            Row(Modifier.padding(horizontal=24.dp).fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(12.dp)) {
                Button(onClick=onRead,shape=RoundedCornerShape(5.dp),contentPadding=PaddingValues(horizontal=8.dp,vertical=12.dp),modifier=Modifier.weight(1f).heightIn(min=48.dp)) { ReferenceIcon("read",Color.White,Modifier.size(21.dp)); Spacer(Modifier.width(10.dp)); Text(if(progress in 1..99) "DEVAM" else "OKU",letterSpacing=1.sp) }
                Button(onClick=onListen,shape=RoundedCornerShape(5.dp),contentPadding=PaddingValues(horizontal=8.dp,vertical=12.dp),modifier=Modifier.weight(1f).heightIn(min=48.dp)) { ReferenceIcon("headphones",Color.White,Modifier.size(21.dp)); Spacer(Modifier.width(10.dp)); Text("DİNLE",letterSpacing=1.sp) }
            }
            Text(story.description,modifier=Modifier.padding(horizontal=24.dp,vertical=26.dp),fontSize=14.sp,lineHeight=22.sp,color=Color(0xFF53565A))
            content?.let { ContentDownloadAction(it,story) }
            Text("${story.level} seviyesinde ${story.genre.lowercase()} hikâyesi. Cümleleri çevirerek oku, yeni kelimeleri kaydet ve dinleyerek tekrar et.",modifier=Modifier.padding(horizontal=24.dp),fontSize=14.sp,lineHeight=22.sp,color=Color(0xFF53565A))
        }
        TalesBottomBar(1,onTabSelected)
    }
}

@Composable
fun ProfileScreen(snapshot: LearningSnapshot, onOpenWords: () -> Unit, padding: PaddingValues, onSettings: ()->Unit,onAccount: ()->Unit={}) {
    Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),verticalArrangement=Arrangement.spacedBy(16.dp)) {
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically) {
            Text("Profilim",fontSize=20.sp,fontWeight=FontWeight.Bold)
            ReferenceIconButton("settings","Ayarlar",onSettings)
        }
        Column(Modifier.fillMaxWidth(),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(7.dp)) {
            Box(Modifier.size(64.dp).background(TaleLine,CircleShape),contentAlignment=Alignment.Center) { ReferenceIcon("profile",TaleMuted,Modifier.size(35.dp)) }
            Text(snapshot.displayName,fontWeight=FontWeight.Bold,fontSize=16.sp)
            Text("${snapshot.level} seviyesi · ${snapshot.preferredGenre}",color=TaleBlue,fontSize=12.sp)
        }
        Button(onClick=onOpenWords,modifier=Modifier.fillMaxWidth().height(48.dp),shape=RoundedCornerShape(12.dp)) { ReferenceIcon("study",Color.White); Spacer(Modifier.width(12.dp)); Text("Kelimelerim",fontSize=16.sp) }
        OutlinedButton(onClick=onAccount,modifier=Modifier.fillMaxWidth().heightIn(min=48.dp)) {Text(if(snapshot.ownerId=="guest") "Hesabına giriş yap" else "Hesabını yönet")}
        ProfilePanel {
            Text("RÜTBE",fontSize=12.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold)
            Column(Modifier.fillMaxWidth().padding(top=16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
                RankProgress(snapshot.points)
            }
        }
        Row(horizontalArrangement=Arrangement.spacedBy(16.dp)) {
            ProfilePanel(Modifier.weight(1f)) { Text("SERİ",fontSize=12.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold); LearningInfoButton("fire","${snapshot.streak}","Çalışma serin",streakExplanation(snapshot)) }
            ProfilePanel(Modifier.weight(1f)) { Text("PUAN",fontSize=12.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold); LearningInfoButton("diamond","${snapshot.points}","Puanların",pointsExplanation(snapshot)) }
        }
        ProfilePanel {
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween) { Text("KELİMELER",fontSize=12.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold); Text("KELİMELERİM",color=TaleBlue,fontSize=12.sp,modifier=Modifier.clickable(onClick=onOpenWords)) }
            Button(onClick=onOpenWords,modifier=Modifier.fillMaxWidth().padding(top=18.dp),shape=RoundedCornerShape(24.dp)) { Text("Öğren   ${snapshot.savedWordIds.size}") }
        }
        Row(horizontalArrangement=Arrangement.spacedBy(16.dp)) {
            ProfilePanel(Modifier.weight(1f)) { Text("HİKÂYELER",fontSize=12.sp,fontWeight=FontWeight.Bold); Text("${snapshot.storyProgress.count {it.value==100}}",fontSize=30.sp,color=TaleBlue,modifier=Modifier.padding(top=14.dp)); Text("tamamlandı",fontSize=12.sp,color=TaleMuted) }
            ProfilePanel(Modifier.weight(1f)) { Text("ALIŞTIRMALAR",fontSize=12.sp,fontWeight=FontWeight.Bold); Text("${snapshot.completedLessons}",fontSize=30.sp,color=TalePurple,modifier=Modifier.padding(top=14.dp)); Text("tamamlandı",fontSize=12.sp,color=TaleMuted) }
        }
        WeeklyActivity(snapshot)
        EarnedBadges(snapshot)
    }

}

@Composable
private fun ProfilePanel(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Card(modifier=modifier.fillMaxWidth(),shape=RoundedCornerShape(10.dp),colors=CardDefaults.cardColors(containerColor=Color.White),elevation=CardDefaults.cardElevation(defaultElevation=1.dp)) { Column(Modifier.padding(16.dp),content=content) }
}

@Composable
fun SavedWordsScreen(snapshot: LearningSnapshot, onBack: () -> Unit, onRemoveWord: (String) -> Unit) {
    var selectedStage by rememberSaveable { mutableStateOf("learning") }
    val stages=listOf(Triple("learning","Öğreniyorum",TaleBlue),Triple("reviewing","Tekrar ediyorum",Color(0xFF7BCC3A)),Triple("known","Biliyorum",TalePurple))
    val words=LearningContent.words.filter { it.id in snapshot.savedWordIds && (snapshot.wordStates[it.id]?:"learning")==selectedStage }
    val context=LocalContext.current
    val narrator=remember(context) { Narrator(context) }
    DisposableEffect(narrator) { onDispose { narrator.close() } }
    Column(Modifier.fillMaxSize().background(Color.White).statusBarsPadding().navigationBarsPadding()) {
        SimpleTopBar("Kelimelerim",onBack)
        if(LocalDensity.current.fontScale>1.4f) {
            Column(Modifier.padding(horizontal=12.dp,vertical=12.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
                stages.forEach { (stage,label,color) ->
                    Row(Modifier.fillMaxWidth().heightIn(min=64.dp).border(if(stage==selectedStage) 3.dp else 2.dp,color.copy(alpha=0.25f),RoundedCornerShape(12.dp)).clickable {selectedStage=stage}.padding(12.dp),
                        verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)) {
                        ReferenceIcon(if(stage=="learning") "study" else if(stage=="reviewing") "review" else "check",color,Modifier.size(26.dp))
                        Text(label,fontSize=13.sp,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f))
                        Text("${snapshot.savedWordIds.count { (snapshot.wordStates[it]?:"learning")==stage }}",fontSize=24.sp,fontWeight=FontWeight.Bold)
                    }
                }
            }
        } else Row(Modifier.padding(horizontal=12.dp,vertical=12.dp).height(IntrinsicSize.Min),horizontalArrangement=Arrangement.spacedBy(5.dp)) {
            stages.forEach { (stage,label,color) ->
                Column(Modifier.weight(1f).fillMaxHeight().heightIn(min=118.dp).border(if(stage==selectedStage) 3.dp else 2.dp,color.copy(alpha=0.18f),RoundedCornerShape(16.dp)).clickable { selectedStage=stage }.padding(11.dp),verticalArrangement=Arrangement.spacedBy(6.dp)) {
                    Box(Modifier.height(30.dp),contentAlignment=Alignment.CenterStart) {
                        ReferenceIcon(if(stage=="learning") "study" else if(stage=="reviewing") "review" else "check",color,Modifier.size(23.dp))
                    }
                    Text(label,fontSize=11.sp,fontWeight=FontWeight.Bold)
                    Text("${snapshot.savedWordIds.count { (snapshot.wordStates[it]?:"learning")==stage }}",fontSize=29.sp,fontWeight=FontWeight.Bold)
                }
            }
        }
        narrator.error?.let { Text(it,color=TaleMuted,fontSize=12.sp,modifier=Modifier.padding(horizontal=14.dp)) }
        Text("${words.size} kelime",color=TaleMuted,fontSize=19.sp,modifier=Modifier.padding(14.dp))
        LazyColumn(contentPadding=PaddingValues(12.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
            items(words,key={it.id}) { word ->
                Row(Modifier.fillMaxWidth().border(2.dp,TaleLine,RoundedCornerShape(12.dp)).padding(16.dp),verticalAlignment=Alignment.CenterVertically) {
                    Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)) { Text(word.word,fontSize=17.sp,fontWeight=FontWeight.Bold); Text(word.translation,fontSize=14.sp,color=TaleMuted) }
                    ReferenceIconButton("volume","${word.word} kelimesini dinle",{narrator.speak(word.word)})
                    TextButton(onClick={onRemoveWord(word.id)},contentPadding=PaddingValues(4.dp)) { Text("Kaldır",fontSize=10.sp,color=TaleMuted) }
                }
            }
            if(words.isEmpty()) item { Text("Bu aşamada henüz kelime yok. Okurken kelimeleri kaydedebilirsin.",fontSize=14.sp,color=TaleMuted,modifier=Modifier.padding(8.dp)) }
        }
    }
}

@Composable
private fun StoryCard(story: Story, progress: Int, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clickable(onClick=onClick),horizontalArrangement=Arrangement.spacedBy(12.dp)) {
        BookCover(story,Modifier.size(54.dp,76.dp))
        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(4.dp)) {
            Text(story.author,color=TaleMuted,fontSize=11.sp)
            Text(story.title,fontSize=15.sp,maxLines=2)
            Text("▮▮  ${story.level}",color=TaleBlue,fontSize=11.sp)
            if(progress>0) ReferenceProgress(progress/100f,Modifier.width(100.dp),TaleBlue)
        }
    }
}

@Composable
fun SimpleTopBar(title: String, onBack: () -> Unit) {
    Row(Modifier.fillMaxWidth().height(54.dp).padding(horizontal=12.dp),verticalAlignment=Alignment.CenterVertically) {
        ReferenceIconButton("back","Geri",onBack,if(title.isEmpty()) Color(0xFF515157) else TaleBlue)
        Text(title,modifier=Modifier.padding(start=4.dp),fontSize=20.sp,maxLines=1)
    }
}

@Composable
fun SectionTitle(title: String) { Text(title,fontSize=20.sp) }
