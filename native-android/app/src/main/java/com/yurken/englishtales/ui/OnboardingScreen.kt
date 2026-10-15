package com.yurken.englishtales.ui

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.R

@Composable
fun OnboardingScreen(analyticsControls: @Composable () -> Unit = { com.yurken.englishtales.analytics.AnalyticsControls() },onContinue: (String,String,Int)->Unit) {
    var step by rememberSaveable { mutableIntStateOf(0) }
    var level by rememberSaveable { mutableStateOf("") }
    var genre by rememberSaveable { mutableStateOf("") }
    var goal by rememberSaveable { mutableIntStateOf(1) }
    var placement by rememberSaveable { mutableStateOf(false) }
    if (placement) {
        PlacementScreen(onUseLevel = { level=it; step=2; placement=false }, onCancel = { placement=false })
        return
    }
    val scroll=rememberScrollState()
    LaunchedEffect(step,scroll.maxValue) { scroll.animateScrollTo(scroll.maxValue) }
    Column(Modifier.fillMaxSize().background(Color.White).statusBarsPadding().navigationBarsPadding()) {
        Row(Modifier.fillMaxWidth().height(46.dp).padding(horizontal=12.dp),verticalAlignment=Alignment.CenterVertically) {
            if(step>0) Box(Modifier.size(48.dp).clickable { step-- },contentAlignment=Alignment.Center) { ReferenceIcon("back",Color(0xFF515157),Modifier.size(20.dp)) }
        }
        Column(Modifier.weight(1f).verticalScroll(scroll).padding(horizontal=16.dp,vertical=10.dp),verticalArrangement=Arrangement.spacedBy(13.dp)) {
            GuideBubble("Hi! 👋")
            GuideBubble("Merhaba! Ben senin okuma arkadaşınım. English Tales'e hoş geldin.")
            Row(Modifier.fillMaxWidth()) {
                Spacer(Modifier.width(40.dp))
                Box(Modifier.width(250.dp).height(170.dp).clip(RoundedCornerShape(10.dp)).background(Color(0xFFE5F5FA)),contentAlignment=Alignment.BottomCenter) {
                    TalesMascot(MascotMood.Welcome,Modifier.fillMaxHeight(),description="Okuma rehberi",animate=true)
                }
            }
            GuideBubble("Birlikte hikâyeler okuyup yeni kelimeler öğreneceğiz. Başlayalım mı?")
            if(step==0) ReplyChoice("Başlayalım") { step=1 }
            if(step>=1) {
                ReplyBubble("Başlayalım")
                GuideBubble("Harika seçim! 🙌 İngilizce seviyeni nasıl değerlendiriyorsun?")
                if(step==1) {
                    ChoiceHint()
                    listOf("A1" to "Yeni başlıyorum","A2" to "Biraz okuyabiliyorum","B1" to "Rahatça okuyorum").forEach { (value,label) -> ReplyChoice(label) {level=value;step=2} }
                    ReplyChoice(stringResource(R.string.placement_entry)) { placement=true }
                }
            }
            if(step>=2) {
                ReplyBubble(level)
                GuideBubble("Okumayı sever misin? 📚 Hangi tür hikâyeler ilgini çekiyor?")
                if(step==2) { ChoiceHint(); listOf("Günlük yaşam","Macera","Gizem").forEach { choice -> ReplyChoice(choice) {genre=choice;step=3} } }
            }
            if(step>=3) {
                ReplyBubble(genre)
                GuideBubble("Her gün ne kadar çalışmak istersin? Bir adım, bir hikâye ya da kısa bir kelime çalışmasıdır. Hedefini sonra değiştirebilirsin.")
                if(step==3) listOf(1 to "Günde 1 adım · Rahat başlangıç",2 to "Günde 2 adım · Düzenli çalışma",3 to "Günde 3 adım · Yoğun çalışma").forEach { (value,label) -> ReplyChoice(label) {goal=value;step=4} }
            }
            if(step>=4) {
                ReplyBubble("Günde $goal adım")
                GuideBubble("Sana ${level} seviyesinde bir hikâye hazırladım. Altı çizili kelimelere dokunarak anlamlarını görebilirsin.")
                analyticsControls()
                ReplyChoice("İlk hikâyeme başla") { onContinue(level,genre,goal) }
            }
            Spacer(Modifier.height(12.dp))
        }
    }
}

@Composable
private fun ChoiceHint() { Box(Modifier.fillMaxWidth(),contentAlignment=Alignment.CenterEnd) { Text("Cevap seç",fontSize=10.sp,color=TaleMuted,modifier=Modifier.padding(end=5.dp)) } }

@Composable
private fun GuideBubble(message: String) {
    Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(9.dp),verticalAlignment=Alignment.Top) {
        Image(painterResource(R.drawable.mascot_avatar),null,Modifier.size(29.dp).clip(CircleShape).background(TaleMint),contentScale=ContentScale.Crop,alignment=Alignment.TopCenter)
        Text(message,fontSize=13.sp,lineHeight=18.sp,color=TaleInk,modifier=Modifier.widthIn(max=285.dp).background(TaleLine,RoundedCornerShape(topStart=4.dp,topEnd=7.dp,bottomStart=7.dp,bottomEnd=7.dp)).padding(horizontal=11.dp,vertical=9.dp))
    }
}

@Composable
private fun ReplyBubble(message: String) { Box(Modifier.fillMaxWidth(),contentAlignment=Alignment.CenterEnd) { Text(message,fontSize=13.sp,color=Color.White,modifier=Modifier.background(TaleBlue,RoundedCornerShape(7.dp)).padding(horizontal=12.dp,vertical=9.dp)) } }

@Composable
private fun ReplyChoice(label: String,onClick: ()->Unit) {
    Box(Modifier.fillMaxWidth(),contentAlignment=Alignment.CenterEnd) {
        Text(label,fontSize=13.sp,color=Color.White,fontWeight=FontWeight.Medium,modifier=Modifier.background(TaleBlue,RoundedCornerShape(7.dp)).clickable(onClick=onClick).padding(horizontal=14.dp,vertical=10.dp))
    }
}
