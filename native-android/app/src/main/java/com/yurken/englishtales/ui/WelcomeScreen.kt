package com.yurken.englishtales.ui

import androidx.compose.foundation.Image
import androidx.compose.ui.res.stringResource
import androidx.compose.foundation.background
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
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
    Column(Modifier.fillMaxSize().background(TaleSurface).verticalScroll(rememberScrollState())) {
        // A blue stage with the brand, the promise and the mascot standing on its bottom edge.
        Box(Modifier.fillMaxWidth().heightIn(min=400.dp).clip(RoundedCornerShape(bottomStart=36.dp,bottomEnd=36.dp)).background(TaleBlue)) {
            Box(Modifier.align(Alignment.BottomCenter).padding(bottom=60.dp).size(300.dp).background(Color.White.copy(alpha=0.10f),CircleShape))
            Column(Modifier.fillMaxWidth().statusBarsPadding().padding(start=24.dp,end=24.dp,top=12.dp),horizontalAlignment=Alignment.CenterHorizontally) {
                Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically) {
                    Text(stringResource(R.string.english_tales),fontFamily=TaleDisplay,fontSize=18.sp,fontWeight=FontWeight.ExtraBold,color=TaleOnBlue,modifier=Modifier.weight(1f))
                    if(!state.busy) Box(Modifier.background(TaleSurface,RoundedCornerShape(14.dp))) {LanguageControls(compact=true)}
                }
                Spacer(Modifier.height(18.dp))
                Text(stringResource(R.string.her_hikayede_nbiraz_daha_ingilizce),fontFamily=TaleDisplay,fontSize=32.sp,lineHeight=36.sp,
                    fontWeight=FontWeight.ExtraBold,color=TaleOnBlue,textAlign=TextAlign.Center,modifier=Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                TalesMascot(MascotMood.Welcome,Modifier.size(200.dp,230.dp).offset(y=10.dp),animate=true)
            }
        }
        Column(Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal=22.dp,vertical=24.dp),
            horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(14.dp)) {
            Text(stringResource(R.string.kisa_hikayeler_oku_yeni_kelimeler),fontSize=16.sp,lineHeight=23.sp,fontWeight=FontWeight.Bold,
                color=TaleInk,textAlign=TextAlign.Center,modifier=Modifier.fillMaxWidth())
            Spacer(Modifier.height(6.dp))
            ChunkyButton(stringResource(R.string.misafir_olarak_basla),onGuest,Modifier.fillMaxWidth(),enabled=!state.busy)
            GoogleSignInButton(!state.busy,onGoogle)
            TextButton(onClick=onEmail,enabled=!state.busy,modifier=Modifier.heightIn(min=48.dp)) {
                Text(stringResource(R.string.e_posta_ile_giris_yap),fontSize=15.sp,fontWeight=FontWeight.ExtraBold,color=TaleBlue)
            }
            Text(stringResource(R.string.hesap_acmadan_baslayabilirsin_misafir_ilerlemen),fontSize=12.sp,lineHeight=17.sp,fontWeight=FontWeight.SemiBold,
                color=TaleMuted,textAlign=TextAlign.Center,modifier=Modifier.fillMaxWidth())
            if(state.busy) LinearProgressIndicator(Modifier.fillMaxWidth(),color=TaleGreen,trackColor=TaleLine)
            AccountMessage(state)
        }
    }
}
