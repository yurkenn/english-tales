package com.yurken.englishtales.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.R
import com.yurken.englishtales.data.AccountState

@Composable
fun GoogleSignInButton(enabled: Boolean,onClick: ()->Unit) {
    OutlinedButton(onClick=onClick,enabled=enabled,modifier=Modifier.fillMaxWidth().heightIn(min=52.dp),
        shape=RoundedCornerShape(14.dp),border=BorderStroke(1.dp,Color(0xFFDADCE0)),
        colors=ButtonDefaults.outlinedButtonColors(containerColor=Color.White,contentColor=Color(0xFF1F1F1F))) {
        Image(painterResource(R.drawable.google_g),null,Modifier.size(20.dp))
        Spacer(Modifier.width(12.dp))
        Text("Google ile devam et",fontSize=15.sp,fontWeight=FontWeight.Medium)
    }
}

@Composable
fun WelcomeScreen(state: AccountState,onGuest: ()->Unit,onEmail: ()->Unit,onGoogle: ()->Unit) {
    androidx.activity.compose.BackHandler(enabled=state.busy) {}
    Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding().verticalScroll(rememberScrollState()).padding(horizontal=24.dp,vertical=24.dp),
        horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(16.dp)) {
        Text("ENGLISH TALES",color=TaleBlue,fontSize=15.sp,fontWeight=FontWeight.Bold,letterSpacing=2.sp)
        Box(Modifier.fillMaxWidth().height(220.dp).clip(RoundedCornerShape(28.dp)).background(TaleMint),contentAlignment=Alignment.BottomCenter) {
            Image(painterResource(R.drawable.reading_guide),null,Modifier.fillMaxHeight())
        }
        Text("Her hikâyede\nbiraz daha İngilizce",style=MaterialTheme.typography.headlineMedium,textAlign=TextAlign.Center)
        Text("Kısa hikâyeler oku, yeni kelimeler keşfet. Her gün kendi hızında ilerle.",style=MaterialTheme.typography.bodyLarge,textAlign=TextAlign.Center,color=Color(0xFF626B78))
        Spacer(Modifier.height(8.dp))
        GoogleSignInButton(!state.busy,onGoogle)
        OutlinedButton(onClick=onEmail,enabled=!state.busy,modifier=Modifier.fillMaxWidth().heightIn(min=52.dp),shape=RoundedCornerShape(14.dp)) {Text("E-posta ile giriş yap")}
        Button(onClick=onGuest,enabled=!state.busy,modifier=Modifier.fillMaxWidth().heightIn(min=52.dp),shape=RoundedCornerShape(14.dp)) {Text("Misafir olarak başla")}
        Text("Hesap açmadan başlayabilirsin. Misafir ilerlemen bu cihazda saklanır.",style=MaterialTheme.typography.bodySmall,color=Color(0xFF626B78),textAlign=TextAlign.Center)
        if(state.busy) LinearProgressIndicator(Modifier.fillMaxWidth())
        if(state.message.isNotBlank()) Text(state.message,style=MaterialTheme.typography.bodyMedium,color=Color(0xFF626B78),textAlign=TextAlign.Center)
    }
}
