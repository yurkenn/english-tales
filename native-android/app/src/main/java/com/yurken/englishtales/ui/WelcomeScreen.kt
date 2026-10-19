package com.yurken.englishtales.ui

import androidx.compose.foundation.Image
import androidx.compose.ui.res.stringResource
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
    val dark=LocalTaleColors.current.dark
    OutlinedButton(onClick=onClick,enabled=enabled,modifier=Modifier.fillMaxWidth().heightIn(min=52.dp),
        // Google sign-in button colors for light and dark themes.
        shape=RoundedCornerShape(14.dp),border=BorderStroke(1.dp,if(dark) Color(0xFF8E918F) else Color(0xFFDADCE0)),
        colors=ButtonDefaults.outlinedButtonColors(containerColor=if(dark) Color(0xFF131314) else Color.White,contentColor=if(dark) Color(0xFFE3E3E3) else Color(0xFF1F1F1F))) {
        Image(painterResource(R.drawable.google_g),null,Modifier.size(20.dp))
        Spacer(Modifier.width(12.dp))
        Text(stringResource(R.string.google_ile_devam_et),fontSize=15.sp,fontWeight=FontWeight.Medium)
    }
}

@Composable
fun WelcomeScreen(state: AccountState,onGuest: ()->Unit,onEmail: ()->Unit,onGoogle: ()->Unit) {
    androidx.activity.compose.BackHandler(enabled=state.busy) {}
    Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding().verticalScroll(rememberScrollState()).padding(horizontal=24.dp,vertical=24.dp),
        horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(16.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(stringResource(R.string.english_tales),color=TaleBlue,fontSize=15.sp,fontWeight=FontWeight.Bold,letterSpacing=2.sp,modifier=Modifier.weight(1f))
            if (!state.busy) LanguageControls(compact = true)
        }
        Box(Modifier.fillMaxWidth().height(220.dp).clip(RoundedCornerShape(28.dp)).background(TaleMint),contentAlignment=Alignment.BottomCenter) {
            TalesMascot(MascotMood.Welcome,Modifier.fillMaxHeight(),animate=true)
        }
        Text(stringResource(R.string.her_hikayede_nbiraz_daha_ingilizce),style=MaterialTheme.typography.headlineMedium,textAlign=TextAlign.Center)
        Text(stringResource(R.string.kisa_hikayeler_oku_yeni_kelimeler),style=MaterialTheme.typography.bodyLarge,textAlign=TextAlign.Center,color=TaleMuted)
        Spacer(Modifier.height(8.dp))
        GoogleSignInButton(!state.busy,onGoogle)
        OutlinedButton(onClick=onEmail,enabled=!state.busy,modifier=Modifier.fillMaxWidth().heightIn(min=52.dp),shape=RoundedCornerShape(14.dp)) {Text(stringResource(R.string.e_posta_ile_giris_yap))}
        Button(onClick=onGuest,enabled=!state.busy,modifier=Modifier.fillMaxWidth().heightIn(min=52.dp),shape=RoundedCornerShape(14.dp)) {Text(stringResource(R.string.misafir_olarak_basla))}
        Text(stringResource(R.string.hesap_acmadan_baslayabilirsin_misafir_ilerlemen),style=MaterialTheme.typography.bodySmall,color=TaleMuted,textAlign=TextAlign.Center)
        if(state.busy) LinearProgressIndicator(Modifier.fillMaxWidth())
        AccountMessage(state)
    }
}
