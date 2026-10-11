package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.data.AccountState

@Composable
fun AccountScreen(state: AccountState,onBack: ()->Unit,onSignIn: (String,String)->Unit,onSignOut: ()->Unit,onGoogle: ()->Unit={},onGuest: ()->Unit=onBack,onTransfer: ()->Unit={}) {
    var email by remember {mutableStateOf(state.email)}
    // Password is deliberately not rememberSaveable; process/rotation restoration must not persist it.
    var password by remember {mutableStateOf("")}
    var confirmExit by remember {mutableStateOf(false)}
    var confirmTransfer by remember {mutableStateOf(false)}
    androidx.activity.compose.BackHandler(enabled=state.busy) {}
    Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding()) {
        SimpleTopBar("Hesabın") {if(!state.busy) onBack()}
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).imePadding().padding(24.dp),verticalArrangement=Arrangement.spacedBy(16.dp)) {
            Text(if(state.userId==null) "Öğrenmeye kendi hesabınla devam et" else "Hesap açık",fontSize=24.sp)
            if(state.userId!=null) {
                Text(state.email,fontSize=16.sp,color=TaleBlue)
                Text("Bu hesabın kayıtları ayrı tutulur. İstersen misafir ilerlemeni bu hesaba taşıyabilirsin. Cihazlar arası eşitleme henüz bağlı değil.",fontSize=14.sp,color=TaleMuted)
                state.guestTransfer?.let {guest ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
                            Text("Misafir ilerlemen",style=MaterialTheme.typography.titleMedium)
                            Text("${guest.words} kelime · ${guest.points} puan · ${guest.stories} hikâye",fontSize=14.sp)
                            if(guest.blocked) Text("Yarıda kalan aktarım başka hesabına ait. Tamamlamak için ilgili hesaba giriş yap.",fontSize=14.sp)
                            else Button(onClick={confirmTransfer=true},enabled=!state.busy && !state.needsSignIn,modifier=Modifier.fillMaxWidth()) {
                                Text(if(guest.pending) "Aktarımı tamamla" else "Bu hesaba aktar")
                            }
                        }
                    }
                }
                OutlinedButton(onClick={confirmExit=true},enabled=!state.busy,modifier=Modifier.fillMaxWidth()) {Text("Bu cihazdan çıkış yap")}
                if(!state.needsSignIn) {
                    GoogleSignInButton(!state.busy,onGoogle)
                    Text("Google hesabınla da giriş yapabilirsin. Hesapların kayıtları ayrı korunur.",fontSize=13.sp,color=TaleMuted)
                }
                if(state.needsSignIn) Text("Kayıtlarına erişimi doğrulamak için tekrar giriş yap.",color=TaleMuted)
            } else {
                Text("Mevcut English Tales hesabınla giriş yapabilirsin. Misafir ilerlemen cihazında ayrı kalır. Yeni hesap ve parola kurtarma akışı sonraki adımdadır.",fontSize=14.sp,color=TaleMuted)
            }
            if(state.userId==null || state.needsSignIn) {
                GoogleSignInButton(!state.busy,onGoogle)
                Text("veya e-posta ile giriş yap",color=TaleMuted,fontSize=13.sp)
                OutlinedTextField(email,{email=it},label={Text("E-posta")},singleLine=true,enabled=!state.busy,
                    keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Email),modifier=Modifier.fillMaxWidth())
                OutlinedTextField(password,{password=it},label={Text("Parola")},singleLine=true,enabled=!state.busy,
                    visualTransformation=PasswordVisualTransformation(),keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Password),modifier=Modifier.fillMaxWidth())
                Button(onClick={val submitted=password;password="";onSignIn(email,submitted)},enabled=!state.busy && email.isNotBlank() && password.isNotEmpty(),modifier=Modifier.fillMaxWidth().heightIn(min=48.dp)) {Text("Giriş yap")}
                if(state.userId==null) OutlinedButton(onClick=onGuest,enabled=!state.busy,modifier=Modifier.fillMaxWidth().heightIn(min=48.dp)) {Text("Misafir olarak devam et")}
            }
            if(state.busy) LinearProgressIndicator(Modifier.fillMaxWidth())
            if(state.message.isNotBlank()) Text(state.message,fontSize=14.sp,color=TaleMuted)
        }
    }
    if(confirmExit) AlertDialog(onDismissRequest={confirmExit=false},title={Text("Çıkış yapılsın mı?")},
        text={Text("Bu hesabın cihazdaki kayıtları korunur. Misafir olarak devam edeceksin.")},
        confirmButton={TextButton(onClick={confirmExit=false;onSignOut()}) {Text("Çıkış yap")}},dismissButton={TextButton(onClick={confirmExit=false}) {Text("Vazgeç")}})
    if(confirmTransfer) AlertDialog(onDismissRequest={confirmTransfer=false},title={Text("Misafir ilerlemen taşınsın mı?")},
        text={Text("Misafir kelimelerin, okuma ilerlemen ve puanın bu hesabın cihazdaki kayıtlarına bir kez eklenir. Mevcut hesap ayarların korunur. Taşınan geçmiş misafir alanından çıkar; misafir olarak yeniden çalışmaya başlayabilirsin. Bulut eşitlemesi henüz bağlı değil.")},
        confirmButton={TextButton(onClick={confirmTransfer=false;onTransfer()}) {Text("Bu hesaba aktar")}},dismissButton={TextButton(onClick={confirmTransfer=false}) {Text("Vazgeç")}})
}
