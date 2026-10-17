package com.yurken.englishtales.ui

import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.ui.draw.shadow
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
import com.yurken.englishtales.data.StoryLinks
import com.yurken.englishtales.data.LearningSnapshot
import com.yurken.englishtales.data.savedWordList
import com.yurken.englishtales.data.WordStage
import com.yurken.englishtales.data.StoryDifficulty
import com.yurken.englishtales.data.ReadingStatus
import com.yurken.englishtales.data.StoryFilters
import com.yurken.englishtales.data.Story
import com.yurken.englishtales.data.StoryTag
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
        Box(Modifier.fillMaxWidth().heightIn(min=126.dp).pressScale(onClick=onClick).clip(RoundedCornerShape(topEnd=16.dp,bottomStart=16.dp,bottomEnd=16.dp)).background(Color(0xFFFFF58B))) {
            TalesMascot(MascotMood.Welcome,Modifier.align(Alignment.BottomEnd).width(104.dp).height(126.dp),animate=true)
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
    // Q5.6: unfinished stories at the learner's level that they can read most comfortably come first.
    val catalog=LearningContent.stories
    val stories=remember(catalog,snapshot) {StoryDifficulty.recommended(catalog,snapshot)}
    var showAll by rememberSaveable { mutableStateOf(false) }
    BackHandler(enabled=showAll) { showAll=false }
    if(showAll) {
        Column(Modifier.fillMaxSize().padding(padding)) {
            SimpleTopBar(stringResource(R.string.senin_icin)) { showAll=false }
            StoryList(stories,{ story -> StoryCard(story,snapshot.progressFor(story)) {onOpenStory(story.id)} })
        }
        return
    }
    Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState())) {
        StatsHeader(snapshot)
        Spacer(Modifier.height(15.dp))
        DailyPlan(snapshot,onRead,onPractice)
        Spacer(Modifier.height(20.dp))
        // A card-like row instead of a bare outlined button, with the count as a badge.
        Row(Modifier.padding(horizontal=16.dp).fillMaxWidth().appearIn(2).heightIn(min=56.dp).background(TaleSurface,RoundedCornerShape(16.dp)).border(1.dp,TaleLine,RoundedCornerShape(16.dp))
            .pressScale(onClick=onOpenWords).padding(horizontal=14.dp,vertical=10.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)) {
            Box(Modifier.size(36.dp).background(LocalTaleColors.current.tileBlue,RoundedCornerShape(10.dp)),contentAlignment=Alignment.Center) { ReferenceIcon("cards",TaleBlue,Modifier.size(20.dp)) }
            Text(stringResource(R.string.kelimelerim_kayitli_kelime, snapshot.savedWordIds.size),Modifier.weight(1f),fontWeight=FontWeight.SemiBold,color=TaleInk)
            ReferenceIcon("next",TaleMuted,Modifier.size(18.dp))
        }
        Box(Modifier.appearIn(3)) { WeeklyActivity(snapshot) }
        Spacer(Modifier.height(16.dp))
        BookShelf(stringResource(R.string.senin_icin),stories,onOpenStory) { showAll=true }

    }
}

private const val TAG_LIST = "tag:"
private const val FAVORITES = "favorites"

@Composable
fun CatalogScreen(snapshot: LearningSnapshot, onOpenStory: (String) -> Unit, padding: PaddingValues) {
    var search by rememberSaveable { mutableStateOf("") }
    var listMode by rememberSaveable { mutableStateOf("") }
    var levelFilter by rememberSaveable { mutableStateOf<String?>(null) }
    var statusFilter by rememberSaveable { mutableStateOf<ReadingStatus?>(null) }
    var lengthFilter by rememberSaveable { mutableStateOf<ReadingLength?>(null) }
    var offlineFilter by rememberSaveable { mutableStateOf(false) }
    val filters=StoryFilters(levelFilter,statusFilter,lengthFilter,offlineFilter)
    fun clearFilters() { levelFilter=null; statusFilter=null; lengthFilter=null; offlineFilter=false }
    fun leaveList() { listMode=""; search=""; clearFilters() }
    BackHandler(enabled=listMode.isNotBlank()) { leaveList() }
    val stories=LearningContent.stories
    val newest=LearningContent.newestStories(3)
    // Categories come from the stories' tags (Q4.5), so a new tag needs no app release.
    val categories=stories.flatMap(StoryTag::of).distinctBy { it.id }.sortedBy { LearningContent.tagOrder.indexOf(it.id).let { i -> if(i<0) Int.MAX_VALUE else i } }
    val filtered=(if(listMode=="new") newest else stories).filter { story ->
        (listMode!="books" || (snapshot.progressFor(story))>0) &&
        (listMode!=FAVORITES || story.id in snapshot.favoriteStoryIds) &&
        (!listMode.startsWith(TAG_LIST) || StoryTag.of(story).any { it.id==listMode.removePrefix(TAG_LIST) }) &&
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
                    Row(Modifier.weight(1f).heightIn(min=48.dp).pressScale { listMode=if(i==0) "search" else "books" }.background(TaleLine,RoundedCornerShape(12.dp)),horizontalArrangement=Arrangement.Center,verticalAlignment=Alignment.CenterVertically) {
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
                val favoriteCount=stories.count { it.id in snapshot.favoriteStoryIds }
                (listOf(stringResource(R.string.kategoriler) to "all")+(if(favoriteCount>0) listOf(stringResource(R.string.favorites_title,favoriteCount) to FAVORITES) else emptyList())+categories.map { it.name to TAG_LIST+it.id }).forEach { (label,key) ->
                    Row(Modifier.fillMaxWidth().clickable(role=Role.Button) { listMode=key }.padding(horizontal=18.dp,vertical=14.dp),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically) { Text(label,fontSize=14.sp); ReferenceIcon("next",TaleMuted,Modifier.size(16.dp)) }
                }
            }
        } else {
            SimpleTopBar(if(listMode=="books") stringResource(R.string.kitaplarim) else if(listMode=="search") stringResource(R.string.arama) else if(listMode=="new") stringResource(R.string.yeni_hikayeler) else if(listMode=="level") stringResource(R.string.kitaplari, snapshot.level) else if(listMode=="adventure") stringResource(R.string.macera_ve_gizem) else if(listMode=="all") stringResource(R.string.kitaplar) else if(listMode==FAVORITES) stringResource(R.string.favorites_title,filtered.size) else categories.firstOrNull { TAG_LIST+it.id==listMode }?.name ?: stringResource(R.string.kitaplar)) { leaveList() }
            if(listMode!="books") {
                BasicTextField(value=search,onValueChange={search=it},singleLine=true,modifier=Modifier.fillMaxWidth().padding(horizontal=16.dp).background(TaleLine,RoundedCornerShape(6.dp)).padding(12.dp),decorationBox={ inner ->
                    Box { if(search.isEmpty()) Text(stringResource(R.string.kitap_ara),color=TaleMuted,fontSize=14.sp); inner() }
                })
            }
            LibraryFilters(filters,showLevels=listMode!="level",onLevel={levelFilter=it},onStatus={statusFilter=it},
                lengths=stories.mapNotNull {ReadingLength.of(ReadingTime.minutes(it))}.distinct().sorted(),onLength={lengthFilter=it},
                offerOffline=stories.any {!StoryFilters.readableOffline(it)},onOffline={offlineFilter=it}) { clearFilters() }
            Text(if(listMode=="books") stringResource(R.string.okunanlar) else stringResource(R.string.kitaplar_2),fontSize=10.sp,letterSpacing=1.sp,color=TaleBlue,modifier=Modifier.fillMaxWidth().padding(18.dp))
            HorizontalDivider(color=TaleLine)
            // Favorites read most recently added first; other lists keep catalog order.
            StoryList(if(listMode==FAVORITES) filtered.sortedBy { snapshot.favoriteStoryIds.indexOf(it.id) } else filtered,{ story -> StoryCard(story,snapshot.progressFor(story)) { onOpenStory(story.id) } }) {
                Text(if(filters.active) stringResource(R.string.bu_filtrelere_uyan_kitap_yok) else if(listMode=="books") stringResource(R.string.okumaya_basladigin_kitaplar_burada_gorunecek) else stringResource(R.string.kitap_bulunamadi),color=TaleMuted,fontSize=14.sp)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun LibraryFilters(filters: StoryFilters, showLevels: Boolean, onLevel: (String?)->Unit, onStatus: (ReadingStatus?)->Unit,
    lengths: List<ReadingLength>, onLength: (ReadingLength?)->Unit, offerOffline: Boolean, onOffline: (Boolean)->Unit, onClear: ()->Unit) {
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
        // Offered only while some story still needs a download; otherwise the chip would change nothing.
        if(offerOffline || filters.offlineOnly) Row(Modifier.padding(horizontal=16.dp)) {
            FilterChip(selected=filters.offlineOnly,onClick={onOffline(!filters.offlineOnly)},label={Text(stringResource(R.string.offline_ready))})
        }
        if(filters.active) TextButton(onClick=onClear,modifier=Modifier.padding(horizontal=8.dp)) { Text(stringResource(R.string.filtreleri_temizle)) }
    }
}

@Composable
private fun BookShelf(title: String, stories: List<Story>, onOpenStory: (String) -> Unit, onAll: () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal=16.dp),verticalAlignment=Alignment.CenterVertically) {
        Text(title,fontSize=20.sp,modifier=Modifier.weight(1f).padding(end=8.dp))
        Text(stringResource(R.string.tumunu_gor),color=TaleBlue,fontSize=11.sp,fontWeight=FontWeight.Bold,modifier=Modifier.pressScale(onClick=onAll).background(TaleLine,RoundedCornerShape(20.dp)).padding(horizontal=9.dp,vertical=6.dp))
    }
    Spacer(Modifier.height(22.dp))
    LazyRow(contentPadding=PaddingValues(horizontal=16.dp),horizontalArrangement=Arrangement.spacedBy(16.dp)) {
        itemsIndexed(stories,key={_,it -> it.id}) { i,story ->
            Column(Modifier.width(130.dp).appearIn(i).pressScale { onOpenStory(story.id) }) {
                BookCover(story,Modifier.size(130.dp,190.dp).shadow(6.dp,RoundedCornerShape(10.dp)))
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
fun StoryDetailScreen(story: Story, progress: Int, onBack: () -> Unit, onRead: () -> Unit, onListen: () -> Unit, onTabSelected: (Int) -> Unit, content: com.yurken.englishtales.data.ContentViewModel? = null,
    favorite: Boolean = false, onToggleFavorite: (() -> Unit)? = null, newWords: Int? = null) {
    val context=LocalContext.current
    Column(Modifier.fillMaxSize().background(TaleBackground).statusBarsPadding()) {
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).centeredWidth(ContentWidth)) {
            SimpleTopBar("",onBack)
            FlowRow(Modifier.fillMaxWidth().padding(start=24.dp,end=24.dp,top=32.dp,bottom=24.dp),horizontalArrangement=Arrangement.spacedBy(24.dp),verticalArrangement=Arrangement.spacedBy(16.dp),maxItemsInEachRow=sideBySide(2)) {
                Box(Modifier.appearIn(0)) { BookCover(story,Modifier.size(140.dp,200.dp).shadow(10.dp,RoundedCornerShape(10.dp))); if(progress>0) ReferenceProgress(progress/100f,Modifier.align(Alignment.BottomCenter).width(106.dp).padding(bottom=7.dp)) }
                Column(Modifier.weight(1f).heightIn(min=200.dp),verticalArrangement=Arrangement.SpaceBetween) {
                    Text(story.author,color=TaleMuted,fontSize=13.sp)
                    Spacer(Modifier.height(8.dp)); Text(story.title,fontSize=20.sp,lineHeight=24.sp,fontWeight=FontWeight.Bold)
                    Spacer(Modifier.height(16.dp))
                    Text("▮▮▮  "+stringResource(when(story.level){"A1"->R.string.zorluk_kolay;"A2"->R.string.zorluk_orta;else->R.string.zorluk_zor}),color=if(story.level=="A1") TaleBlue else TaleWarm,fontSize=14.sp)
                    ReadingMinutes(story,Modifier.padding(top=4.dp))
                    // Q5.6: shown once the learner has known words, so a new learner is not told "120 new words".
                    newWords?.let { Text(pluralStringResource(R.plurals.story_new_words,it,it),color=TaleMuted,fontSize=11.sp,modifier=Modifier.padding(top=4.dp)) }
                    Spacer(Modifier.height(16.dp))
                    Row(horizontalArrangement=Arrangement.spacedBy(4.dp)) {
                        ReferenceIconButton("read",stringResource(R.string.hikayeyi_oku),onRead)
                        onToggleFavorite?.let { toggle ->
                            val alerts=LocalTaleAlerts.current
                            val added=stringResource(R.string.alert_favorite_added); val removed=stringResource(R.string.alert_favorite_removed)
                            ReferenceIconButton("bookmark",stringResource(if(favorite) R.string.favorite_remove else R.string.favorite_add),{
                                toggle(); if(favorite) alerts.show(removed,TaleAlertKind.Info) else alerts.success(added)
                            },if(favorite) TaleWarm else TaleBlue)
                        }
                        ReferenceIconButton("share",stringResource(R.string.hikayeyi_paylas),onClick={
                            val intent=android.content.Intent(android.content.Intent.ACTION_SEND).apply { type="text/plain"; putExtra(android.content.Intent.EXTRA_TEXT,"${story.title} — ${story.description}\nEnglish Tales\n${StoryLinks.url(story.id)}") }
                            SafeIntents.startFirst(context,android.content.Intent.createChooser(intent,context.getString(R.string.hikayeyi_paylas)))
                        })
                    }
                }
            }
            FlowRow(Modifier.padding(horizontal=24.dp).fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(12.dp),verticalArrangement=Arrangement.spacedBy(12.dp),maxItemsInEachRow=sideBySide(2)) {
                Button(onClick=onRead,shape=RoundedCornerShape(14.dp),contentPadding=PaddingValues(horizontal=8.dp,vertical=12.dp),modifier=Modifier.weight(1f).heightIn(min=48.dp)) { ReferenceIcon("read",TaleOnBlue,Modifier.size(21.dp)); Spacer(Modifier.width(10.dp)); Text(if(progress in 1..99) stringResource(R.string.devam) else stringResource(R.string.oku),letterSpacing=1.sp) }
                Button(onClick=onListen,shape=RoundedCornerShape(14.dp),contentPadding=PaddingValues(horizontal=8.dp,vertical=12.dp),modifier=Modifier.weight(1f).heightIn(min=48.dp)) { ReferenceIcon("headphones",TaleOnBlue,Modifier.size(21.dp)); Spacer(Modifier.width(10.dp)); Text(stringResource(R.string.dinle),letterSpacing=1.sp) }
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
    Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).centeredWidth(ContentWidth).padding(16.dp),verticalArrangement=Arrangement.spacedBy(16.dp)) {
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically) {
            Text(stringResource(R.string.profilim),fontSize=20.sp,fontWeight=FontWeight.Bold)
            ReferenceIconButton("settings",stringResource(R.string.ayarlar),onSettings)
        }
        Column(Modifier.fillMaxWidth(),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(7.dp)) {
            Box(Modifier.size(72.dp).appearIn(0).background(TaleMint,CircleShape).border(3.dp,TaleSurface,CircleShape),contentAlignment=Alignment.Center) { ReferenceIcon("profile",TaleBlue,Modifier.size(38.dp)) }
            Text(snapshot.displayName,fontWeight=FontWeight.Bold,fontSize=16.sp)
            Text(stringResource(R.string.seviyesi, snapshot.level, snapshot.preferredGenre),color=TaleBlue,fontSize=12.sp)
        }
        Button(onClick=onOpenWords,modifier=Modifier.fillMaxWidth().heightIn(min=50.dp).appearIn(1),shape=RoundedCornerShape(14.dp)) { ReferenceIcon("study",TaleOnBlue); Spacer(Modifier.width(12.dp)); Text(stringResource(R.string.kelimelerim),fontSize=16.sp) }
        OutlinedButton(onClick=onAccount,modifier=Modifier.fillMaxWidth().heightIn(min=48.dp)) {Text(if(snapshot.ownerId=="guest") stringResource(R.string.hesabina_giris_yap) else stringResource(R.string.hesabini_yonet))}
        ProfilePanel(index=2){
            Text(stringResource(R.string.rutbe),fontSize=12.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold)
            Column(Modifier.fillMaxWidth().padding(top=16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
                RankProgress(snapshot.points)
            }
        }
        FlowRow(horizontalArrangement=Arrangement.spacedBy(16.dp),verticalArrangement=Arrangement.spacedBy(16.dp),maxItemsInEachRow=sideBySide(2)) {
            ProfilePanel(Modifier.weight(1f)) { Text(stringResource(R.string.seri),fontSize=12.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold); LearningInfoButton("streak","${snapshot.streak}",stringResource(R.string.calisma_serin),streakExplanation(snapshot)) }
            ProfilePanel(Modifier.weight(1f)) { Text(stringResource(R.string.puan),fontSize=12.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold); LearningInfoButton("points","${snapshot.points}",stringResource(R.string.puanlarin),pointsExplanation(snapshot)) }
        }
        ProfilePanel(index=3){
            FlowRow(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalArrangement=Arrangement.spacedBy(8.dp)) { Text(stringResource(R.string.kelimeler),fontSize=12.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold); Text(stringResource(R.string.kelimelerim_2),color=TaleBlue,fontSize=12.sp,modifier=Modifier.clickable(role=Role.Button,onClick=onOpenWords)) }
            Button(onClick=onOpenWords,modifier=Modifier.fillMaxWidth().padding(top=18.dp),shape=RoundedCornerShape(24.dp)) { Text(stringResource(R.string.ogren, snapshot.savedWordIds.size)) }
        }
        // Q5.5: how many words the learner knows, from practice and from reading.
        ProfilePanel(index=4){
            Text(stringResource(R.string.known_words_title),fontSize=12.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold)
            AnimatedCounter(snapshot.knownWordCount,Modifier.padding(top=10.dp),style=LocalTextStyle.current.copy(fontSize=30.sp,fontWeight=FontWeight.Bold),color=TaleBlue)
            Text(stringResource(R.string.known_words_detail,snapshot.wordStages.count {it.value==WordStage.SEEN || it.value==WordStage.LOOKED_UP},
                snapshot.wordStages.count {it.value==WordStage.SAVED || it.value==WordStage.REVIEWING}),fontSize=12.sp,color=TaleMuted)
            Text(stringResource(R.string.known_words_explanation),fontSize=12.sp,color=TaleMuted,modifier=Modifier.padding(top=6.dp))
        }
        FlowRow(horizontalArrangement=Arrangement.spacedBy(16.dp),verticalArrangement=Arrangement.spacedBy(16.dp),maxItemsInEachRow=sideBySide(2)) {
            ProfilePanel(Modifier.weight(1f)) { Text(stringResource(R.string.hikayeler),fontSize=12.sp,fontWeight=FontWeight.Bold); AnimatedCounter(snapshot.storyProgress.count {it.value==100},Modifier.padding(top=14.dp),style=LocalTextStyle.current.copy(fontSize=30.sp,fontWeight=FontWeight.Bold),color=TaleBlue); Text(stringResource(R.string.tamamlandi),fontSize=12.sp,color=TaleMuted) }
            ProfilePanel(Modifier.weight(1f)) { Text(stringResource(R.string.alistirmalar),fontSize=12.sp,fontWeight=FontWeight.Bold); AnimatedCounter(snapshot.completedLessons,Modifier.padding(top=14.dp),style=LocalTextStyle.current.copy(fontSize=30.sp,fontWeight=FontWeight.Bold),color=TalePurple); Text(stringResource(R.string.tamamlandi),fontSize=12.sp,color=TaleMuted) }
        }
        WeeklyActivity(snapshot)
        EarnedBadges(snapshot)
    }

}

@Composable
private fun ProfilePanel(modifier: Modifier = Modifier, index: Int = 0, content: @Composable ColumnScope.() -> Unit) {
    Card(modifier=modifier.fillMaxWidth().appearIn(index),shape=RoundedCornerShape(16.dp),colors=CardDefaults.cardColors(containerColor=TaleSurface),border=BorderStroke(1.dp,TaleLine),elevation=CardDefaults.cardElevation(defaultElevation=0.dp)) { Column(Modifier.padding(16.dp),content=content) }
}

@Composable
fun SavedWordsScreen(snapshot: LearningSnapshot, onBack: () -> Unit, onRemoveWord: (String) -> Unit) {
    var selectedStage by rememberSaveable { mutableStateOf("learning") }
    val stages=listOf(Triple("learning",stringResource(R.string.ogreniyorum),TaleBlue),Triple("reviewing",stringResource(R.string.tekrar_ediyorum),Color(0xFF7BCC3A)),Triple("known",stringResource(R.string.biliyorum),TalePurple))
    val words=snapshot.savedWordList().filter { (snapshot.wordStates[it.id]?:"learning")==selectedStage }
    val narrator=rememberNarrator()
    val alerts=LocalTaleAlerts.current
    val context=LocalContext.current
    // The background spans the screen; the word list keeps a readable width on tablets.
    Column(Modifier.fillMaxSize().background(TaleBackground).statusBarsPadding().navigationBarsPadding().centeredWidth(ContentWidth)) {
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
                Row(Modifier.fillMaxWidth().animateItem().background(TaleSurface,RoundedCornerShape(14.dp)).border(1.5.dp,TaleLine,RoundedCornerShape(14.dp)).padding(16.dp),verticalAlignment=Alignment.CenterVertically) {
                    Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)) { Text(word.word,fontSize=17.sp,fontWeight=FontWeight.Bold); Text(word.translation,fontSize=14.sp,color=TaleMuted) }
                    ReferenceIconButton("volume",stringResource(R.string.kelimesini_dinle, word.word),{narrator.speak(word.word)})
                    TextButton(onClick={onRemoveWord(word.id);alerts.show(context.getString(R.string.alert_word_removed,word.word),TaleAlertKind.Info)},contentPadding=PaddingValues(4.dp)) { Text(stringResource(R.string.kaldir),fontSize=10.sp,color=TaleMuted) }
                }
            }
            if(words.isEmpty()) item {
                Column(Modifier.fillMaxWidth().padding(16.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(12.dp)) {
                    TalesMascot(MascotMood.Thinking,Modifier.size(140.dp).appearIn(),animate=true)
                    Text(stringResource(R.string.bu_asamada_henuz_kelime_yok),fontSize=14.sp,color=TaleMuted)
                }
            }
        }
    }
}

@Composable
private fun StoryCard(story: Story, progress: Int, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().appearIn().pressScale(onClick=onClick),horizontalArrangement=Arrangement.spacedBy(12.dp)) {
        BookCover(story,Modifier.size(54.dp,76.dp).shadow(3.dp,RoundedCornerShape(10.dp)))
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
