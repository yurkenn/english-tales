package com.yurken.englishtales.ui

import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import com.yurken.englishtales.AppLanguage
import androidx.compose.foundation.*
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.selection.selectable
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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
            // The design's continue card: the cover on the left, and title, progress and the green button stacked beside it.
            ChunkyBox(TaleSurface,Modifier.fillMaxWidth().appearIn(1),RoundedCornerShape(24.dp),border=TaleLine) {
                Row(Modifier.padding(14.dp),horizontalArrangement=Arrangement.spacedBy(14.dp),verticalAlignment=Alignment.CenterVertically) {
                    BookCover(next,Modifier.size(78.dp,112.dp))
                    Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(6.dp)) {
                        Text((if(resume!=null) stringResource(R.string.kaldigin_hikaye) else if(progress==100) stringResource(R.string.yeniden_kesfet) else stringResource(R.string.siradaki_hikayen)),
                            fontSize=13.sp,fontWeight=FontWeight.ExtraBold,color=TaleBlue)
                        Text(next.title,style=MaterialTheme.typography.titleLarge,lineHeight=23.sp)
                        if(resume!=null) Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                            ReferenceProgress(progress/100f,Modifier.weight(1f),TaleGreen)
                            Text(stringResource(R.string.tamamlandi_2, progress),fontSize=13.sp,fontWeight=FontWeight.ExtraBold,color=TaleMuted)
                        } else Text("${next.level} · ${genreLabel(next.genre)}",style=MaterialTheme.typography.bodyMedium,color=TaleMuted)
                        ChunkyButton(if(resume!=null) stringResource(R.string.okumaya_devam_et) else if(progress==100) stringResource(R.string.yeniden_oku) else stringResource(R.string.hikayeye_basla),
                            onClick={onRead(next.id)},modifier=Modifier.fillMaxWidth().padding(top=4.dp),color=TaleGreen,onColor=TaleOnGreen)
                    }
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

/** One bright number of the reading result with what it counts under it. */
@Composable
private fun ResultStat(value: String,caption: String,face: Color,ink: Color,modifier: Modifier) {
    ChunkyBox(face,modifier,RoundedCornerShape(16.dp),depth=4.dp) {
        Column(Modifier.fillMaxWidth().padding(10.dp),horizontalAlignment=Alignment.CenterHorizontally) {
            Text(value,fontFamily=TaleDisplay,fontSize=22.sp,lineHeight=26.sp,fontWeight=FontWeight.ExtraBold,color=ink,textAlign=TextAlign.Center,modifier=Modifier.fillMaxWidth())
            Text(caption,fontSize=12.sp,fontWeight=FontWeight.ExtraBold,color=ink,textAlign=TextAlign.Center,modifier=Modifier.fillMaxWidth())
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
fun WeeklyActivity(snapshot: LearningSnapshot, modifier: Modifier = Modifier.padding(horizontal=16.dp,vertical=12.dp)) {
    // The canvas's streak week: a white card, a square tile per day, a solid flame on the days practised and a dashed tile for today.
    Column(modifier.fillMaxWidth().background(TaleSurface,RoundedCornerShape(22.dp))
        .padding(horizontal=14.dp,vertical=12.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
        // The streak sits next to the week it comes from, and one line says what today still needs.
        Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically) {
            Text(stringResource(R.string.son_7_gun),fontSize=15.sp,fontWeight=FontWeight.ExtraBold,modifier=Modifier.weight(1f))
            if(snapshot.streak>0) Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(4.dp)) {
                ReferenceIcon("streak",TaleOrange,Modifier.size(16.dp))
                Text("${snapshot.streak} · ${stringResource(R.string.stat_streak)}",fontSize=14.sp,fontWeight=FontWeight.ExtraBold,color=TaleWarm)
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
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(4.dp)) {
            snapshot.weeklyActivity.forEachIndexed {i,day ->
                val today=i==snapshot.weeklyActivity.lastIndex
                val active=day.sessions>0
                val frozen=day.day in snapshot.frozenDays
                val frozenLabel=stringResource(R.string.streak_freeze_day)
                val dash=TaleBlue
                Column(Modifier.weight(1f).appearIn(i),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(4.dp)) {
                    Box(Modifier.size(32.dp).background(if(active) TaleOrange.copy(alpha=0.22f) else if(frozen) LocalTaleColors.current.tileBlue else TaleLine.copy(alpha=0.6f),RoundedCornerShape(10.dp))
                        .then(if(frozen) Modifier.contentLabel(frozenLabel) else Modifier)
                        .then(if(today && !active) Modifier.drawBehind {
                            val w=2.5.dp.toPx()
                            drawRoundRect(dash,Offset(w/2,w/2),Size(size.width-w,size.height-w),CornerRadius(10.dp.toPx()-w/2),
                                style=Stroke(w,pathEffect=PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(),3.dp.toPx()))))
                        } else Modifier),contentAlignment=Alignment.Center) {
                        if(active) ReferenceIcon("streak",TaleOrange,Modifier.size(17.dp))
                        else if(frozen) Text("❄",fontSize=15.sp,color=TaleBlue)
                    }
                    Text(if(today) stringResource(R.string.weekly_today) else day.label,fontSize=11.sp,fontWeight=FontWeight.ExtraBold,color=if(today) TaleBlue else TaleMuted,maxLines=1)
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
    // The design's badge card: medals in a grid of three, earned ones in color with their name under them.
    ChunkyBox(TaleSurface,Modifier.fillMaxWidth(),RoundedCornerShape(22.dp),depth=5.dp,border=TaleLine) {
        Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
            Text(stringResource(R.string.basarilarin),fontFamily=TaleDisplay,fontSize=19.sp,fontWeight=FontWeight.ExtraBold)
            FlowRow(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(10.dp),verticalArrangement=Arrangement.spacedBy(12.dp),maxItemsInEachRow=if(sideBySide(2)==1) 2 else 3) {
                labels.entries.forEachIndexed {i,(id,label) ->
                    val earned=id in snapshot.badges
                    val status=if(earned) stringResource(R.string.kazanildi) else stringResource(R.string.sirada)
                    Column(Modifier.weight(1f).appearIn(i).semantics(mergeDescendants=true) {contentDescription="$label, $status"},horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(6.dp)) {
                        Box(Modifier.size(72.dp).background(if(earned) LocalTaleColors.current.tileYellow else TaleLine.copy(alpha=0.6f),RoundedCornerShape(18.dp)),contentAlignment=Alignment.Center) {
                            TaleArt(badgeArt(id),Modifier.size(56.dp).then(if(earned) Modifier.popOn(1) else Modifier),locked=!earned)
                        }
                        Text(label,fontSize=12.sp,lineHeight=15.sp,fontWeight=FontWeight.ExtraBold,color=if(earned) TaleInk else TaleMuted,textAlign=TextAlign.Center,modifier=Modifier.fillMaxWidth())
                    }
                }
            }
        }
    }
}

@Composable
fun ReadingResultScreen(story: Story,snapshot: LearningSnapshot,onPractice: (List<String>)->Unit,onDailyPlan: ()->Unit,onBack: ()->Unit=onDailyPlan) {
    val words=remember(story.id) {LearningContent.wordsForStory(story).take(5)}
    val goalDone=stringResource(R.string.gunluk_hedef_tamamlandi)
    val goalText=stringResource(R.string.gunluk_hedef_adim, snapshot.todaySessions, snapshot.dailyGoal)
    Box(Modifier.fillMaxSize()) {
    Column(Modifier.fillMaxSize().background(TaleBackground).statusBarsPadding().navigationBarsPadding().verticalScroll(rememberScrollState())) {
        SimpleTopBar(stringResource(R.string.okuma_tamamlandi),onBack)
        Column(Modifier.padding(horizontal=20.dp,vertical=8.dp),verticalArrangement=Arrangement.spacedBy(16.dp),horizontalAlignment=Alignment.CenterHorizontally) {
            Row(Modifier.appearIn(0),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(16.dp)) {
                TalesMascot(MascotMood.Celebrate,Modifier.size(144.dp),animate=true)
                BookCover(story,Modifier.size(64.dp,94.dp).popOn(1))
            }
            Text(stringResource(R.string.bir_hikaye_tamamladin),fontFamily=TaleDisplay,fontSize=24.sp,lineHeight=28.sp,fontWeight=FontWeight.ExtraBold,textAlign=TextAlign.Center,modifier=Modifier.fillMaxWidth().appearIn(1))
            Text(story.title,fontSize=15.sp,fontWeight=FontWeight.Bold,color=TaleMuted,textAlign=TextAlign.Center,modifier=Modifier.fillMaxWidth().appearIn(2))
            // The design's three bright numbers: sentences read, minutes spent and today's goal.
            FlowRow(Modifier.fillMaxWidth().appearIn(3).semantics(mergeDescendants=true) {
                contentDescription=if(snapshot.dailyGoalReached) goalDone else goalText
            },horizontalArrangement=Arrangement.spacedBy(10.dp),verticalArrangement=Arrangement.spacedBy(10.dp),maxItemsInEachRow=sideBySide(3)) {
                ResultStat("${story.sentences.size}",stringResource(R.string.story_stat_sentences),TalePurple,TaleOnPurple,Modifier.weight(1f))
                ResultStat(ReadingTime.minutes(story)?.let {"$it"} ?: "–",stringResource(R.string.story_stat_minutes),TaleBlue,TaleOnBlue,Modifier.weight(1f))
                ResultStat("${snapshot.todaySessions.coerceAtMost(snapshot.dailyGoal)}/${snapshot.dailyGoal}",stringResource(R.string.bugunku_planin),TaleYellow,TaleOnYellow,Modifier.weight(1f))
            }
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
        // The design's grouped settings: a colored icon tile names each group, and its rows sit together on one white card.
        Column(Modifier.padding(horizontal=18.dp,vertical=8.dp),verticalArrangement=Arrangement.spacedBy(18.dp)) {
            SettingsCard {
                OutlinedTextField(value=name,onValueChange={name=it.take(30)},label={Text(stringResource(R.string.adin))},singleLine=true,modifier=Modifier.fillMaxWidth().padding(12.dp))
            }
            // The design's short rows: each shows its current value and opens its choices in place.
            var open by rememberSaveable {mutableStateOf("")}
            fun toggle(key: String) { open=if(open==key) "" else key }
            val goalOptions=listOf(stringResource(R.string.adim_secenek_1),stringResource(R.string.adim_secenek_2),stringResource(R.string.adim_secenek_3))
            SettingsSection(stringResource(R.string.settings_section_learning))
            SettingsCard { Column(Modifier.padding(6.dp)) {
                SettingsRow(stringResource(R.string.ingilizce_seviyen),level,"study",TaleGreen,TaleOnGreen,open=="level") {toggle("level")}
                if(open=="level") PreferenceChoices(listOf("A1","A2","B1"),level) {level=it}
                SettingsDivider()
                SettingsRow(stringResource(R.string.sevdigin_hikayeler),genreLabel(genre),"read",TalePurple,TaleOnPurple,open=="genre") {toggle("genre")}
                if(open=="genre") PreferenceChoices(listOf("Günlük yaşam","Macera","Gizem"),genre,label={genreLabel(it)}) {genre=it}
                SettingsDivider()
                SettingsRow(stringResource(R.string.gunluk_hedefin),goalOptions[goal.coerceIn(1,3)-1],"streak",TaleOrange,TaleOnOrange,open=="goal") {toggle("goal")}
                if(open=="goal") {
                    PreferenceChoices(goalOptions,goalOptions[goal.coerceIn(1,3)-1]) {goal=goalOptions.indexOf(it)+1}
                    Text(stringResource(R.string.bir_adim_tamamlanan_bir_hikaye),fontSize=12.sp,color=TaleMuted,modifier=Modifier.padding(horizontal=12.dp,vertical=8.dp))
                }
                SettingsDivider()
                Row(Modifier.fillMaxWidth().heightIn(min=56.dp).clip(RoundedCornerShape(14.dp)).clickable(role=Role.Button) {placement=true}.padding(horizontal=12.dp),
                    verticalAlignment=Alignment.CenterVertically) {
                    Text(stringResource(R.string.placement_entry),fontSize=15.sp,fontWeight=FontWeight.ExtraBold,color=TaleBlue,modifier=Modifier.weight(1f))
                    ReferenceIcon("next",TaleBlue,Modifier.size(18.dp))
                }
            } }
            SettingsSection(stringResource(R.string.settings_section_reminders))
            SettingsCard { Column(Modifier.padding(12.dp)) { ReminderControls() } }
            SettingsCard { Column(Modifier.padding(12.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
                com.yurken.englishtales.ads.AdPrivacyControls()
                Box(Modifier.fillMaxWidth().height(1.dp).background(TaleLine))
                com.yurken.englishtales.analytics.AnalyticsControls()
            } }
            SettingsSection(stringResource(R.string.settings_section_app))
            SettingsCard { Column(Modifier.padding(8.dp)) {
                LanguageControls(row=true)
                SettingsDivider()
                Box(Modifier.padding(horizontal=10.dp,vertical=8.dp)) { ThemeControls() }
            } }
            val alerts=LocalTaleAlerts.current
            val savedText=stringResource(R.string.alert_settings_saved)
            ChunkyButton(stringResource(R.string.degisiklikleri_kaydet),{onSave(level,genre,goal,name);alerts.success(savedText)},Modifier.fillMaxWidth())
            Text(stringResource(R.string.ilerlemen_bu_cihazda_saklanir_uygulama),fontSize=12.sp,color=TaleMuted)
            SupportLinks()
        }
    }
}

@Composable
private fun PreferenceChoices(options: List<String>,selected: String,label: @Composable (String)->String = {it},onSelect: (String)->Unit) {
    // Rows of one group card: the picked one turns mint with a filled green check, the others show an empty ring.
    Column(Modifier.selectableGroup()) {options.forEachIndexed {i,value ->
        val on=value==selected; val shape=RoundedCornerShape(14.dp)
        if(i>0) SettingsDivider()
        Row(Modifier.fillMaxWidth().clip(shape).background(if(on) TaleMint else Color.Transparent,shape).selectable(selected=on,role=Role.RadioButton) {onSelect(value)}
            .heightIn(min=56.dp).padding(horizontal=12.dp,vertical=10.dp),verticalAlignment=Alignment.CenterVertically) {
            Text(label(value),fontSize=15.sp,fontWeight=FontWeight.ExtraBold,color=TaleInk,modifier=Modifier.weight(1f))
            Box(Modifier.size(26.dp).background(if(on) TaleGreen else Color.Transparent,androidx.compose.foundation.shape.CircleShape)
                .border(2.dp,if(on) TaleGreen else TaleLine,androidx.compose.foundation.shape.CircleShape),contentAlignment=Alignment.Center) {
                if(on) Text("✓",color=TaleOnGreen,fontSize=14.sp,fontWeight=FontWeight.ExtraBold)
            }
        }
    } }
}

/** A capitalised section name over a settings card, as in the design. */
@Composable
private fun SettingsSection(title: String) {
    Text(title.uppercase(AppLanguage.locale(LocalContext.current)),fontSize=12.sp,fontWeight=FontWeight.ExtraBold,letterSpacing=1.sp,color=TaleMuted,
        modifier=Modifier.padding(start=4.dp,top=6.dp).semantics {heading()})
}

/** One settings row: a colored icon tile, the setting, its current value and a chevron that turns when the choices are open. */
@Composable
internal fun SettingsRow(title: String,value: String,icon: String,color: Color,onColor: Color,expanded: Boolean,modifier: Modifier=Modifier,onClick: ()->Unit) {
    val turn by animateFloatAsState(if(expanded) 90f else 0f,label="chevron")
    Row(modifier.fillMaxWidth().heightIn(min=60.dp).clip(RoundedCornerShape(14.dp)).clickable(role=Role.Button,onClick=onClick)
        .semantics {stateDescription=value}.padding(horizontal=10.dp,vertical=8.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)) {
        Box(Modifier.size(36.dp).background(color,RoundedCornerShape(11.dp)),contentAlignment=Alignment.Center) { ReferenceIcon(icon,onColor,Modifier.size(20.dp)) }
        // The value hides while its choices are open, so it is never shown twice; large text moves it under the title.
        val stacked=LocalDensity.current.fontScale>1.4f
        Column(Modifier.weight(1f)) {
            Text(title,fontSize=15.sp,fontWeight=FontWeight.ExtraBold,color=TaleInk)
            if(stacked && !expanded) Text(value,fontSize=14.sp,fontWeight=FontWeight.Bold,color=TaleMuted)
        }
        if(!stacked && !expanded) Text(value,fontSize=14.sp,fontWeight=FontWeight.Bold,color=TaleMuted,textAlign=TextAlign.End,modifier=Modifier.widthIn(max=120.dp))
        ReferenceIcon("next",TaleMuted,Modifier.size(16.dp).graphicsLayer {rotationZ=turn})
    }
}

@Composable
private fun SettingsCard(content: @Composable ()->Unit) {
    ChunkyBox(TaleSurface,Modifier.fillMaxWidth(),RoundedCornerShape(22.dp),depth=5.dp,border=TaleLine) { content() }
}

@Composable
private fun SettingsDivider() = Box(Modifier.padding(horizontal=12.dp).fillMaxWidth().height(1.dp).background(TaleLine))
