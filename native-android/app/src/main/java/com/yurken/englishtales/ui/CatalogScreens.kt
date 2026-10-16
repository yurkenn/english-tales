package com.yurken.englishtales.ui

import androidx.compose.foundation.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.res.stringResource
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
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.res.stringResource
import com.yurken.englishtales.data.ReadingTime
import com.yurken.englishtales.data.ReadingLength
import com.yurken.englishtales.data.LearningContent
import com.yurken.englishtales.data.LearningSnapshot
import com.yurken.englishtales.data.ReadingStatus
import com.yurken.englishtales.data.StoryFilters
import com.yurken.englishtales.data.Story
import com.yurken.englishtales.data.progressFor

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun StatsHeader(snapshot: LearningSnapshot) {
    FlowRow(Modifier.fillMaxWidth().padding(horizontal=16.dp,vertical=12.dp),horizontalArrangement=Arrangement.SpaceBetween,verticalArrangement=Arrangement.spacedBy(4.dp),maxItemsInEachRow=if(LocalDensity.current.fontScale>=1.5f) 2 else 4) {
        Text("🇺🇸",fontSize=29.sp)
        LearningInfoButton("study",snapshot.level,stringResource(R.string.ingilizce_seviyen),stringResource(R.string.sectigin_seviye_hikaye_onerileri_buna, snapshot.level))
        LearningInfoButton("streak","${snapshot.streak}",stringResource(R.string.calisma_serin),streakExplanation(snapshot))
        LearningInfoButton("points","${snapshot.points}",stringResource(R.string.puanlarin),pointsExplanation(snapshot))
    }
}

@Composable
private fun ChallengeBanner(onClick: () -> Unit) {
    Column(Modifier.padding(horizontal=16.dp)) {
        Text(stringResource(R.string.okuma_aliskanligin_burada_baslar),fontSize=10.sp,fontWeight=FontWeight.Bold,color=Color(0xFF6C294F),
            modifier=Modifier.background(Color(0xFFFFE85A),RoundedCornerShape(topStart=9.dp,topEnd=9.dp)).padding(horizontal=9.dp,vertical=6.dp))
        Box(Modifier.fillMaxWidth().heightIn(min=126.dp).clip(RoundedCornerShape(topEnd=16.dp,bottomStart=16.dp,bottomEnd=16.dp)).background(Color(0xFFFFF58B)).clickable(role=Role.Button,onClick=onClick)) {
            TalesMascot(MascotMood.Welcome,Modifier.align(Alignment.BottomEnd).width(104.dp).height(126.dp))
            Column(Modifier.fillMaxWidth(0.72f).padding(start=16.dp,top=14.dp,bottom=14.dp),verticalArrangement=Arrangement.spacedBy(4.dp)) {
                Text(stringResource(R.string.bir_hikaye_nyeni_kelimeler),fontSize=19.sp,lineHeight=22.sp,fontWeight=FontWeight.Bold,color=Color(0xFF6C294F))
                Text(stringResource(R.string.oku_dinle_ve_ogren),fontSize=12.sp,lineHeight=17.sp,color=Color(0xFF6C294F))
                Text(stringResource(R.string.okumaya_basla),fontSize=11.sp,lineHeight=14.sp,color=LightTaleColors.onPurple,fontWeight=FontWeight.Bold,
                    modifier=Modifier.background(LightTaleColors.purple,RoundedCornerShape(20.dp)).padding(horizontal=12.dp,vertical=5.dp))
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
            SimpleTopBar(stringResource(R.string.senin_icin)) { showAll=false }
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
        Spacer(Modifier.height(24.dp))
        OutlinedButton(onClick=onOpenWords,modifier=Modifier.padding(horizontal=16.dp).fillMaxWidth().heightIn(min=48.dp)) {
            Text(stringResource(R.string.kelimelerim_kayitli_kelime, snapshot.savedWordIds.size))
        }
        WeeklyActivity(snapshot)
        Spacer(Modifier.height(16.dp))
        BookShelf(stringResource(R.string.senin_icin),stories,onOpenStory) { showAll=true }

    }
}

@Composable
fun CatalogScreen(snapshot: LearningSnapshot, onOpenStory: (String) -> Unit, padding: PaddingValues) {
    var search by rememberSaveable { mutableStateOf("") }
    var listMode by rememberSaveable { mutableStateOf("") }
    var levelFilter by rememberSaveable { mutableStateOf<String?>(null) }
    var statusFilter by rememberSaveable { mutableStateOf<ReadingStatus?>(null) }
    var lengthFilter by rememberSaveable { mutableStateOf<ReadingLength?>(null) }
    val filters=StoryFilters(levelFilter,statusFilter,lengthFilter)
    fun leaveList() { listMode=""; search=""; levelFilter=null; statusFilter=null; lengthFilter=null }
    BackHandler(enabled=listMode.isNotBlank()) { leaveList() }
    val stories=LearningContent.stories
    val newest=LearningContent.newestStories(3)
    val filtered=(if(listMode=="new") newest else stories).filter { story ->
        (listMode!="books" || (snapshot.progressFor(story))>0) &&
        (listMode !in listOf("Macera","Gizem","Günlük yaşam") || story.genre==listMode) &&
        (listMode!="adventure" || story.genre!="Günlük yaşam") &&
        (listMode!="level" || story.level==snapshot.level) &&
        (search.isBlank() || story.title.contains(search,true) || story.description.contains(search,true)) &&
        filters.matches(story,snapshot.progressFor(story))
    }
    Column(Modifier.fillMaxSize().padding(padding)) {
        if(listMode.isBlank()) {
            StatsHeader(snapshot)
            FlowRow(Modifier.fillMaxWidth().padding(horizontal=16.dp,vertical=10.dp),horizontalArrangement=Arrangement.spacedBy(16.dp),verticalArrangement=Arrangement.spacedBy(10.dp),maxItemsInEachRow=sideBySide(2)) {
                listOf(stringResource(R.string.arama) to "search",stringResource(R.string.kitaplarim) to "read").forEachIndexed { i,(label,icon) ->
                    Row(Modifier.weight(1f).heightIn(min=48.dp).background(TaleLine,RoundedCornerShape(7.dp)).clickable(role=Role.Button) { listMode=if(i==0) "search" else "books" },horizontalArrangement=Arrangement.Center,verticalAlignment=Alignment.CenterVertically) {
                        ReferenceIcon(icon,TaleInk,Modifier.size(18.dp)); Spacer(Modifier.width(8.dp)); Text(label,fontSize=14.sp,fontWeight=FontWeight.Medium)
                    }
                }
            }
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                Spacer(Modifier.height(20.dp))
                if(stories.isNotEmpty()) ChallengeBanner { (stories.firstOrNull { it.level==snapshot.level } ?: stories.first()).let {onOpenStory(it.id)} }
                else Text(stringResource(R.string.su_anda_yayimlanmis_hikaye_yok),modifier=Modifier.padding(16.dp),color=TaleMuted)
                Spacer(Modifier.height(38.dp))
                BookShelf(stringResource(R.string.yeni_hikayeler),newest,onOpenStory) { listMode="new" }
                Spacer(Modifier.height(30.dp))
                BookShelf(stringResource(R.string.macera_ve_gizem),stories.filter { it.genre!="Günlük yaşam" },onOpenStory) { listMode="adventure" }
                Spacer(Modifier.height(28.dp))
                BookShelf(stringResource(R.string.seviyene_uygun),stories.filter { it.level==snapshot.level },onOpenStory) { listMode="level" }
                Spacer(Modifier.height(22.dp))
                listOf(stringResource(R.string.kategoriler) to "all","Günlük yaşam" to "Günlük yaşam","Macera" to "Macera","Gizem" to "Gizem").forEach { (label,key) ->
                    Row(Modifier.fillMaxWidth().clickable(role=Role.Button) { listMode=key }.padding(horizontal=18.dp,vertical=14.dp),horizontalArrangement=Arrangement.SpaceBetween) { Text(label,fontSize=14.sp); Text("›",color=TaleMuted) }
                }
            }
        } else {
            SimpleTopBar(if(listMode=="books") stringResource(R.string.kitaplarim) else if(listMode=="search") stringResource(R.string.arama) else if(listMode=="new") stringResource(R.string.yeni_hikayeler) else if(listMode=="level") stringResource(R.string.kitaplari, snapshot.level) else if(listMode=="adventure") stringResource(R.string.macera_ve_gizem) else if(listMode=="all") stringResource(R.string.kitaplar) else listMode) { leaveList() }
            if(listMode!="books") {
                BasicTextField(value=search,onValueChange={search=it},singleLine=true,modifier=Modifier.fillMaxWidth().padding(horizontal=16.dp).background(TaleLine,RoundedCornerShape(6.dp)).padding(12.dp),decorationBox={ inner ->
                    Box { if(search.isEmpty()) Text(stringResource(R.string.kitap_ara),color=TaleMuted,fontSize=14.sp); inner() }
                })
            }
            LibraryFilters(filters,showLevels=listMode!="level",onLevel={levelFilter=it},onStatus={statusFilter=it},
                lengths=stories.mapNotNull {ReadingLength.of(ReadingTime.minutes(it))}.distinct().sorted(),onLength={lengthFilter=it}) { levelFilter=null; statusFilter=null; lengthFilter=null }
            Text(if(listMode=="books") stringResource(R.string.okunanlar) else stringResource(R.string.kitaplar_2),fontSize=10.sp,letterSpacing=1.sp,color=TaleBlue,modifier=Modifier.fillMaxWidth().padding(18.dp))
            HorizontalDivider(color=TaleLine)
            LazyColumn(contentPadding=PaddingValues(16.dp),verticalArrangement=Arrangement.spacedBy(18.dp)) {
                items(filtered,key={it.id}) { story -> StoryCard(story,snapshot.progressFor(story)) { onOpenStory(story.id) } }
                if(filtered.isEmpty()) item { Text(if(filters.active) stringResource(R.string.bu_filtrelere_uyan_kitap_yok) else if(listMode=="books") stringResource(R.string.okumaya_basladigin_kitaplar_burada_gorunecek) else stringResource(R.string.kitap_bulunamadi),color=TaleMuted,fontSize=14.sp) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun LibraryFilters(filters: StoryFilters, showLevels: Boolean, onLevel: (String?)->Unit, onStatus: (ReadingStatus?)->Unit,
    lengths: List<ReadingLength>, onLength: (ReadingLength?)->Unit, onClear: ()->Unit) {
    Column(Modifier.fillMaxWidth().padding(top=8.dp)) {
        if(showLevels) LazyRow(contentPadding=PaddingValues(horizontal=16.dp),horizontalArrangement=Arrangement.spacedBy(8.dp)) {
            item { FilterChip(selected=filters.level==null,onClick={onLevel(null)},label={Text(stringResource(R.string.tum_seviyeler))}) }
            items(StoryFilters.levels) { level -> FilterChip(selected=filters.level==level,onClick={onLevel(if(filters.level==level) null else level)},label={Text(level)}) }
        }
        LazyRow(contentPadding=PaddingValues(horizontal=16.dp),horizontalArrangement=Arrangement.spacedBy(8.dp)) {
            item { FilterChip(selected=filters.status==null,onClick={onStatus(null)},label={Text(stringResource(R.string.tumu))}) }
            items(ReadingStatus.entries) { status -> FilterChip(selected=filters.status==status,onClick={onStatus(if(filters.status==status) null else status)},label={Text(status.label)}) }
        }
        // Only lengths that occur in the catalog are offered, so a chip never leads to an empty list by itself.
        if(lengths.size>1) LazyRow(contentPadding=PaddingValues(horizontal=16.dp),horizontalArrangement=Arrangement.spacedBy(8.dp)) {
            item { FilterChip(selected=filters.length==null,onClick={onLength(null)},label={Text(stringResource(R.string.length_all))}) }
            items(lengths) { length -> FilterChip(selected=filters.length==length,onClick={onLength(if(filters.length==length) null else length)},label={Text(stringResource(length.label))}) }
        }
        if(filters.active) TextButton(onClick=onClear,modifier=Modifier.padding(horizontal=8.dp)) { Text(stringResource(R.string.filtreleri_temizle)) }
    }
}

@Composable
private fun BookShelf(title: String, stories: List<Story>, onOpenStory: (String) -> Unit, onAll: () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal=16.dp),verticalAlignment=Alignment.CenterVertically) {
        Text(title,fontSize=20.sp,modifier=Modifier.weight(1f).padding(end=8.dp))
        Text(stringResource(R.string.tumunu_gor),color=TaleBlue,fontSize=11.sp,fontWeight=FontWeight.Bold,modifier=Modifier.background(TaleLine,RoundedCornerShape(20.dp)).clickable(role=Role.Button,onClick=onAll).padding(horizontal=9.dp,vertical=6.dp))
    }
    Spacer(Modifier.height(22.dp))
    LazyRow(contentPadding=PaddingValues(horizontal=16.dp),horizontalArrangement=Arrangement.spacedBy(16.dp)) {
        items(stories,key={it.id}) { story ->
            Column(Modifier.width(130.dp).clickable(role=Role.Button) { onOpenStory(story.id) }) {
                BookCover(story,Modifier.size(130.dp,190.dp))
                Spacer(Modifier.height(9.dp))
                Text(story.author,color=TaleMuted,fontSize=11.sp,maxLines=1)
                Spacer(Modifier.height(4.dp))
                Text(story.title,fontSize=14.sp,lineHeight=20.sp,maxLines=2,overflow=TextOverflow.Ellipsis)
                ReadingMinutes(story)
            }
        }
    }
}

@Composable
fun StoryDetailScreen(story: Story, progress: Int, onBack: () -> Unit, onRead: () -> Unit, onListen: () -> Unit, onTabSelected: (Int) -> Unit, content: com.yurken.englishtales.data.ContentViewModel? = null) {
    val context=LocalContext.current
    Column(Modifier.fillMaxSize().background(TaleBackground).statusBarsPadding()) {
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
            SimpleTopBar("",onBack)
            FlowRow(Modifier.fillMaxWidth().padding(start=24.dp,end=24.dp,top=32.dp,bottom=24.dp),horizontalArrangement=Arrangement.spacedBy(24.dp),verticalArrangement=Arrangement.spacedBy(16.dp),maxItemsInEachRow=sideBySide(2)) {
                Box { BookCover(story,Modifier.size(140.dp,200.dp)); if(progress>0) ReferenceProgress(progress/100f,Modifier.align(Alignment.BottomCenter).width(106.dp).padding(bottom=7.dp)) }
                Column(Modifier.weight(1f).heightIn(min=200.dp),verticalArrangement=Arrangement.SpaceBetween) {
                    Text(story.author,color=TaleMuted,fontSize=13.sp)
                    Spacer(Modifier.height(8.dp)); Text(story.title,fontSize=20.sp,lineHeight=24.sp,fontWeight=FontWeight.Bold)
                    Spacer(Modifier.height(16.dp))
                    Text("▮▮▮  "+stringResource(when(story.level){"A1"->R.string.zorluk_kolay;"A2"->R.string.zorluk_orta;else->R.string.zorluk_zor}),color=if(story.level=="A1") TaleBlue else TaleWarm,fontSize=14.sp)
                    ReadingMinutes(story,Modifier.padding(top=4.dp))
                    Spacer(Modifier.height(16.dp))
                    Row(horizontalArrangement=Arrangement.spacedBy(4.dp)) {
                        ReferenceIconButton("read",stringResource(R.string.hikayeyi_oku),onRead)
                        ReferenceIconButton("share",stringResource(R.string.hikayeyi_paylas),onClick={
                            val intent=android.content.Intent(android.content.Intent.ACTION_SEND).apply { type="text/plain"; putExtra(android.content.Intent.EXTRA_TEXT,"${story.title} — ${story.description}\nEnglish Tales\nhttps://play.google.com/store/apps/details?id=com.yurken.englishtales") }
                            context.startActivity(android.content.Intent.createChooser(intent,context.getString(R.string.hikayeyi_paylas)))
                        })
                    }
                }
            }
            FlowRow(Modifier.padding(horizontal=24.dp).fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(12.dp),verticalArrangement=Arrangement.spacedBy(12.dp),maxItemsInEachRow=sideBySide(2)) {
                Button(onClick=onRead,shape=RoundedCornerShape(5.dp),contentPadding=PaddingValues(horizontal=8.dp,vertical=12.dp),modifier=Modifier.weight(1f).heightIn(min=48.dp)) { ReferenceIcon("read",TaleOnBlue,Modifier.size(21.dp)); Spacer(Modifier.width(10.dp)); Text(if(progress in 1..99) stringResource(R.string.devam) else stringResource(R.string.oku),letterSpacing=1.sp) }
                Button(onClick=onListen,shape=RoundedCornerShape(5.dp),contentPadding=PaddingValues(horizontal=8.dp,vertical=12.dp),modifier=Modifier.weight(1f).heightIn(min=48.dp)) { ReferenceIcon("headphones",TaleOnBlue,Modifier.size(21.dp)); Spacer(Modifier.width(10.dp)); Text(stringResource(R.string.dinle),letterSpacing=1.sp) }
            }
            Text(story.description,modifier=Modifier.padding(horizontal=24.dp,vertical=26.dp),fontSize=14.sp,lineHeight=22.sp,color=TaleMuted)
            content?.let { ContentDownloadAction(it,story) }
            Text(stringResource(R.string.seviyesinde_hikayesi_cumleleri_cevirerek_oku, story.level, story.genre.lowercase()),modifier=Modifier.padding(horizontal=24.dp),fontSize=14.sp,lineHeight=22.sp,color=TaleMuted)
        }
        TalesBottomBar(1,onTabSelected)
    }
}

@Composable
fun ProfileScreen(snapshot: LearningSnapshot, onOpenWords: () -> Unit, padding: PaddingValues, onSettings: ()->Unit,onAccount: ()->Unit={}) {
    Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),verticalArrangement=Arrangement.spacedBy(16.dp)) {
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically) {
            Text(stringResource(R.string.profilim),fontSize=20.sp,fontWeight=FontWeight.Bold)
            ReferenceIconButton("settings",stringResource(R.string.ayarlar),onSettings)
        }
        Column(Modifier.fillMaxWidth(),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(7.dp)) {
            Box(Modifier.size(64.dp).background(TaleLine,CircleShape),contentAlignment=Alignment.Center) { ReferenceIcon("profile",TaleMuted,Modifier.size(35.dp)) }
            Text(snapshot.displayName,fontWeight=FontWeight.Bold,fontSize=16.sp)
            Text(stringResource(R.string.seviyesi, snapshot.level, snapshot.preferredGenre),color=TaleBlue,fontSize=12.sp)
        }
        Button(onClick=onOpenWords,modifier=Modifier.fillMaxWidth().heightIn(min=48.dp),shape=RoundedCornerShape(12.dp)) { ReferenceIcon("study",TaleOnBlue); Spacer(Modifier.width(12.dp)); Text(stringResource(R.string.kelimelerim),fontSize=16.sp) }
        OutlinedButton(onClick=onAccount,modifier=Modifier.fillMaxWidth().heightIn(min=48.dp)) {Text(if(snapshot.ownerId=="guest") stringResource(R.string.hesabina_giris_yap) else stringResource(R.string.hesabini_yonet))}
        ProfilePanel {
            Text(stringResource(R.string.rutbe),fontSize=12.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold)
            Column(Modifier.fillMaxWidth().padding(top=16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
                RankProgress(snapshot.points)
            }
        }
        FlowRow(horizontalArrangement=Arrangement.spacedBy(16.dp),verticalArrangement=Arrangement.spacedBy(16.dp),maxItemsInEachRow=sideBySide(2)) {
            ProfilePanel(Modifier.weight(1f)) { Text(stringResource(R.string.seri),fontSize=12.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold); LearningInfoButton("streak","${snapshot.streak}",stringResource(R.string.calisma_serin),streakExplanation(snapshot)) }
            ProfilePanel(Modifier.weight(1f)) { Text(stringResource(R.string.puan),fontSize=12.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold); LearningInfoButton("points","${snapshot.points}",stringResource(R.string.puanlarin),pointsExplanation(snapshot)) }
        }
        ProfilePanel {
            FlowRow(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalArrangement=Arrangement.spacedBy(8.dp)) { Text(stringResource(R.string.kelimeler),fontSize=12.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold); Text(stringResource(R.string.kelimelerim_2),color=TaleBlue,fontSize=12.sp,modifier=Modifier.clickable(role=Role.Button,onClick=onOpenWords)) }
            Button(onClick=onOpenWords,modifier=Modifier.fillMaxWidth().padding(top=18.dp),shape=RoundedCornerShape(24.dp)) { Text(stringResource(R.string.ogren, snapshot.savedWordIds.size)) }
        }
        FlowRow(horizontalArrangement=Arrangement.spacedBy(16.dp),verticalArrangement=Arrangement.spacedBy(16.dp),maxItemsInEachRow=sideBySide(2)) {
            ProfilePanel(Modifier.weight(1f)) { Text(stringResource(R.string.hikayeler),fontSize=12.sp,fontWeight=FontWeight.Bold); Text("${snapshot.storyProgress.count {it.value==100}}",fontSize=30.sp,color=TaleBlue,modifier=Modifier.padding(top=14.dp)); Text(stringResource(R.string.tamamlandi),fontSize=12.sp,color=TaleMuted) }
            ProfilePanel(Modifier.weight(1f)) { Text(stringResource(R.string.alistirmalar),fontSize=12.sp,fontWeight=FontWeight.Bold); Text("${snapshot.completedLessons}",fontSize=30.sp,color=TalePurple,modifier=Modifier.padding(top=14.dp)); Text(stringResource(R.string.tamamlandi),fontSize=12.sp,color=TaleMuted) }
        }
        WeeklyActivity(snapshot)
        EarnedBadges(snapshot)
    }

}

@Composable
private fun ProfilePanel(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Card(modifier=modifier.fillMaxWidth(),shape=RoundedCornerShape(10.dp),colors=CardDefaults.cardColors(containerColor=TaleSurface),elevation=CardDefaults.cardElevation(defaultElevation=1.dp)) { Column(Modifier.padding(16.dp),content=content) }
}

@Composable
fun SavedWordsScreen(snapshot: LearningSnapshot, onBack: () -> Unit, onRemoveWord: (String) -> Unit) {
    var selectedStage by rememberSaveable { mutableStateOf("learning") }
    val stages=listOf(Triple("learning",stringResource(R.string.ogreniyorum),TaleBlue),Triple("reviewing",stringResource(R.string.tekrar_ediyorum),Color(0xFF7BCC3A)),Triple("known",stringResource(R.string.biliyorum),TalePurple))
    val words=LearningContent.words.filter { it.id in snapshot.savedWordIds && (snapshot.wordStates[it.id]?:"learning")==selectedStage }
    val narrator=rememberNarrator()
    Column(Modifier.fillMaxSize().background(TaleBackground).statusBarsPadding().navigationBarsPadding()) {
        SimpleTopBar(stringResource(R.string.kelimelerim),onBack)
        if(LocalDensity.current.fontScale>1.4f) {
            Column(Modifier.padding(horizontal=12.dp,vertical=12.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
                stages.forEach { (stage,label,color) ->
                    Row(Modifier.fillMaxWidth().heightIn(min=64.dp).border(if(stage==selectedStage) 3.dp else 2.dp,color.copy(alpha=0.25f),RoundedCornerShape(12.dp)).selectable(selected=stage==selectedStage,role=Role.Tab) {selectedStage=stage}.padding(12.dp),
                        verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)) {
                        ReferenceIcon(if(stage=="learning") "study" else if(stage=="reviewing") "review" else "check",color,Modifier.size(26.dp))
                        Text(label,fontSize=13.sp,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f))
                        Text("${snapshot.savedWordIds.count { (snapshot.wordStates[it]?:"learning")==stage }}",fontSize=24.sp,fontWeight=FontWeight.Bold)
                    }
                }
            }
        } else Row(Modifier.padding(horizontal=12.dp,vertical=12.dp).height(IntrinsicSize.Min),horizontalArrangement=Arrangement.spacedBy(5.dp)) {
            stages.forEach { (stage,label,color) ->
                Column(Modifier.weight(1f).fillMaxHeight().heightIn(min=118.dp).border(if(stage==selectedStage) 3.dp else 2.dp,color.copy(alpha=0.18f),RoundedCornerShape(16.dp)).selectable(selected=stage==selectedStage,role=Role.Tab) { selectedStage=stage }.padding(11.dp),verticalArrangement=Arrangement.spacedBy(6.dp)) {
                    Box(Modifier.height(30.dp),contentAlignment=Alignment.CenterStart) {
                        ReferenceIcon(if(stage=="learning") "study" else if(stage=="reviewing") "review" else "check",color,Modifier.size(23.dp))
                    }
                    Text(label,fontSize=11.sp,fontWeight=FontWeight.Bold)
                    Text("${snapshot.savedWordIds.count { (snapshot.wordStates[it]?:"learning")==stage }}",fontSize=29.sp,fontWeight=FontWeight.Bold)
                }
            }
        }
        narrator.error?.let { Text(it,color=TaleMuted,fontSize=12.sp,modifier=Modifier.padding(horizontal=14.dp)) }
        Text(stringResource(R.string.kelime, words.size),color=TaleMuted,fontSize=19.sp,modifier=Modifier.padding(14.dp))
        LazyColumn(contentPadding=PaddingValues(12.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
            items(words,key={it.id}) { word ->
                Row(Modifier.fillMaxWidth().border(2.dp,TaleLine,RoundedCornerShape(12.dp)).padding(16.dp),verticalAlignment=Alignment.CenterVertically) {
                    Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)) { Text(word.word,fontSize=17.sp,fontWeight=FontWeight.Bold); Text(word.translation,fontSize=14.sp,color=TaleMuted) }
                    ReferenceIconButton("volume",stringResource(R.string.kelimesini_dinle, word.word),{narrator.speak(word.word)})
                    TextButton(onClick={onRemoveWord(word.id)},contentPadding=PaddingValues(4.dp)) { Text(stringResource(R.string.kaldir),fontSize=10.sp,color=TaleMuted) }
                }
            }
            if(words.isEmpty()) item {
                Column(Modifier.fillMaxWidth().padding(16.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(12.dp)) {
                    TalesMascot(MascotMood.Thinking,Modifier.size(140.dp))
                    Text(stringResource(R.string.bu_asamada_henuz_kelime_yok),fontSize=14.sp,color=TaleMuted)
                }
            }
        }
    }
}

@Composable
private fun StoryCard(story: Story, progress: Int, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clickable(role=Role.Button,onClick=onClick),horizontalArrangement=Arrangement.spacedBy(12.dp)) {
        BookCover(story,Modifier.size(54.dp,76.dp))
        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(4.dp)) {
            Text(story.author,color=TaleMuted,fontSize=11.sp)
            Text(story.title,fontSize=15.sp,maxLines=2)
            Text("▮▮  ${story.level}",color=TaleBlue,fontSize=11.sp)
            ReadingMinutes(story)
            if(progress>0) ReferenceProgress(progress/100f,Modifier.width(100.dp),TaleBlue)
        }
    }
}

@Composable
fun SimpleTopBar(title: String, onBack: () -> Unit) {
    Row(Modifier.fillMaxWidth().heightIn(min=54.dp).padding(horizontal=12.dp),verticalAlignment=Alignment.CenterVertically) {
        ReferenceIconButton("back",stringResource(R.string.geri),onBack,if(title.isEmpty()) TaleInk else TaleBlue)
        Text(title,modifier=Modifier.weight(1f).padding(start=4.dp),fontSize=20.sp)
    }
}

@Composable
fun SectionTitle(title: String) { Text(title,fontSize=20.sp) }

/** "~3 dk" under a story; nothing while the text is not downloaded. */
@Composable
internal fun ReadingMinutes(story: Story, modifier: Modifier = Modifier) {
    val minutes=ReadingTime.minutes(story) ?: return
    val description=pluralStringResource(R.plurals.reading_minutes_description,minutes,minutes)
    Text(stringResource(R.string.reading_minutes,minutes),color=TaleMuted,fontSize=11.sp,
        modifier=modifier.semantics {contentDescription=description})
}
