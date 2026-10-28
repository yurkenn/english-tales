package com.yurken.englishtales.ui

import androidx.compose.foundation.*
import androidx.compose.ui.semantics.Role
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.R
import kotlinx.coroutines.delay

/** First launch as one question per screen: a progress bar, the mascot asking, and big chunky answers. */
@Composable
fun OnboardingScreen(analyticsControls: @Composable () -> Unit = { com.yurken.englishtales.analytics.AnalyticsControls() },onContinue: (String,String,Int)->Unit) {
    var step by rememberSaveable { mutableIntStateOf(0) }
    var level by rememberSaveable { mutableStateOf("") }
    var genre by rememberSaveable { mutableStateOf("") }
    var goal by rememberSaveable { mutableIntStateOf(1) }
    var placement by rememberSaveable { mutableStateOf(false) }
    // A tapped answer lights up for a moment before the next question slides in.
    var picked by remember(step) { mutableStateOf<String?>(null) }
    LaunchedEffect(picked) { if (picked != null) { delay(280); step++ } }
    if (placement) {
        PlacementScreen(onUseLevel = { level=it; step=2; placement=false }, onCancel = { placement=false })
        return
    }
    Column(Modifier.fillMaxSize().background(TaleBackground).statusBarsPadding().navigationBarsPadding()) {
        Row(Modifier.fillMaxWidth().height(56.dp).padding(horizontal=12.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)) {
            if(step>0) Box(Modifier.size(48.dp).contentLabel(stringResource(R.string.geri)).clickable(role=Role.Button) { step-- },contentAlignment=Alignment.Center) { ReferenceIcon("back",TaleInk,Modifier.size(22.dp)) }
            if(step>0) QuizProgress(step/4f,Modifier.weight(1f).padding(end=12.dp))
        }
        key(step) {
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal=20.dp,vertical=8.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
                when(step) {
                    0 -> {
                        ChunkyBox(LocalTaleColors.current.tileBlue,Modifier.fillMaxWidth().height(230.dp).appearIn(0),RoundedCornerShape(28.dp),depth=6.dp,contentAlignment=Alignment.BottomCenter) {
                            TalesMascot(MascotMood.Welcome,Modifier.fillMaxHeight().padding(top=12.dp),description=stringResource(R.string.okuma_rehberi),animate=true)
                        }
                        Spacer(Modifier.height(4.dp))
                        GuideBubble(stringResource(R.string.hi))
                        GuideBubble(stringResource(R.string.merhaba_ben_senin_okuma_arkadasinim))
                        GuideBubble(stringResource(R.string.birlikte_hikayeler_okuyup_yeni_kelimeler))
                    }
                    1 -> {
                        GuideBubble(stringResource(R.string.harika_secim_ingilizce_seviyeni_nasil),large=true)
                        Column(Modifier.selectableGroup(),verticalArrangement=Arrangement.spacedBy(12.dp)) {
                            listOf(Triple("A1",R.string.yeni_basliyorum,R.string.onboarding_level_a1),Triple("A2",R.string.biraz_okuyabiliyorum,R.string.onboarding_level_a2),
                                Triple("B1",R.string.rahatca_okuyorum,R.string.onboarding_level_b1)).forEachIndexed { i,(value,title,detail) ->
                                AnswerCard(stringResource(title),picked==value || (picked==null && level==value),Modifier.appearIn(i+1),badge=value,detail=stringResource(detail)) {level=value;picked=value}
                            }
                        }
                        TextButton(onClick={placement=true},modifier=Modifier.fillMaxWidth().heightIn(min=48.dp)) {
                            Text(stringResource(R.string.placement_entry),fontSize=15.sp,fontWeight=FontWeight.ExtraBold,color=TaleBlue)
                        }
                    }
                    2 -> {
                        GuideBubble(stringResource(R.string.okumayi_sever_misin_hangi_tur),large=true)
                        Column(Modifier.selectableGroup(),verticalArrangement=Arrangement.spacedBy(12.dp)) {
                            listOf("Günlük yaşam","Macera","Gizem").forEachIndexed { i,choice ->
                                AnswerCard(genreLabel(choice),picked==choice || (picked==null && genre==choice),Modifier.appearIn(i+1)) {genre=choice;picked=choice}
                            }
                        }
                    }
                    3 -> {
                        GuideBubble(stringResource(R.string.her_gun_ne_kadar_calismak),large=true)
                        ChunkyBox(LocalTaleColors.current.tileYellow,Modifier.fillMaxWidth().height(140.dp).appearIn(1),RoundedCornerShape(24.dp),contentAlignment=Alignment.BottomCenter) {
                            TaleArt(R.drawable.mascot_goal,Modifier.fillMaxHeight().padding(top=8.dp))
                        }
                        Column(Modifier.selectableGroup(),verticalArrangement=Arrangement.spacedBy(12.dp)) {
                            listOf(1 to stringResource(R.string.gunde_1_adim_rahat_baslangic),2 to stringResource(R.string.gunde_2_adim_duzenli_calisma),3 to stringResource(R.string.gunde_3_adim_yogun_calisma)).forEachIndexed { i,(value,label) ->
                                AnswerCard(label,picked=="$value",Modifier.appearIn(i+2)) {goal=value;picked="$value"}
                            }
                        }
                    }
                    else -> {
                        ChunkyBox(LocalTaleColors.current.tileGreen,Modifier.fillMaxWidth().height(200.dp).appearIn(0),RoundedCornerShape(28.dp),depth=6.dp,contentAlignment=Alignment.BottomCenter) {
                            TalesMascot(MascotMood.Celebrate,Modifier.fillMaxHeight().padding(top=12.dp),animate=true)
                        }
                        GuideBubble(stringResource(R.string.sana_seviyesinde_bir_hikaye_hazirladim, level),large=true)
                        analyticsControls()
                    }
                }
                // The forward button ends the intro and the last step; answers move on by themselves.
                if(step==0) ChunkyButton(stringResource(R.string.baslayalim),{step=1},Modifier.fillMaxWidth().padding(top=6.dp))
                else if(step>=4) ChunkyButton(stringResource(R.string.ilk_hikayeme_basla),{onContinue(level,genre,goal)},Modifier.fillMaxWidth().padding(top=6.dp))
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

/** The mascot's line in a speech bubble; [large] marks the question the screen asks. */
@Composable
private fun GuideBubble(message: String, large: Boolean = false) {
    Row(Modifier.fillMaxWidth().appearIn(),horizontalArrangement=Arrangement.spacedBy(10.dp),verticalAlignment=Alignment.Bottom) {
        Image(painterResource(R.drawable.mascot_avatar),null,Modifier.size(if(large) 56.dp else 34.dp).clip(CircleShape).background(TaleMint),contentScale=ContentScale.Crop,alignment=Alignment.TopCenter)
        val shape=RoundedCornerShape(topStart=20.dp,topEnd=20.dp,bottomEnd=20.dp,bottomStart=6.dp)
        Text(message,fontSize=if(large) 16.sp else 14.sp,lineHeight=if(large) 22.sp else 19.sp,color=TaleInk,fontWeight=FontWeight.Bold,
            modifier=Modifier.weight(1f,fill=false).background(TaleSurface,shape).border(2.dp,TaleLine,shape).padding(horizontal=14.dp,vertical=12.dp))
    }
}

/** A big chunky answer: an optional level badge, the answer and a line about it; the picked one turns blue. */
@Composable
private fun AnswerCard(label: String, selected: Boolean, modifier: Modifier = Modifier, badge: String? = null, detail: String? = null, onClick: ()->Unit) {
    val shape=RoundedCornerShape(20.dp)
    Row(modifier.fillMaxWidth().background(if(selected) TaleBlue else TaleLine,shape).padding(bottom=5.dp)
        .background(if(selected) TaleMint else TaleSurface,shape).border(2.dp,if(selected) TaleBlue else TaleLine,shape).clip(shape)
        .selectable(selected,role=Role.RadioButton,onClick=onClick).heightIn(min=64.dp).padding(horizontal=16.dp,vertical=14.dp),
        verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(14.dp)) {
        if(badge!=null) Box(Modifier.size(46.dp).background(if(selected) TaleBlue else LocalTaleColors.current.tileBlue,RoundedCornerShape(14.dp)),contentAlignment=Alignment.Center) {
            Text(badge,fontFamily=TaleDisplay,fontSize=18.sp,fontWeight=FontWeight.ExtraBold,color=if(selected) TaleOnBlue else TaleBlue)
        }
        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(2.dp)) {
            Text(label,fontSize=16.sp,fontWeight=FontWeight.ExtraBold,color=TaleInk)
            if(detail!=null) Text(detail,fontSize=13.sp,fontWeight=FontWeight.SemiBold,color=TaleMuted)
        }
    }
}
