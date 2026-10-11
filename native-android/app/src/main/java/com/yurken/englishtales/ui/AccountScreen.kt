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
fun AccountScreen(state: AccountState,onBack: ()->Unit,onSignIn: (String,String)->Unit,onSignOut: ()->Unit,onGoogle: ()->Unit={},onGuest: ()->Unit=onBack,onTransfer: ()->Unit={},onSync: ()->Unit={}) {
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
                Text("Öğrenme kayıtların hesabın üzerinden eşitlenir. Misafir kayıtların bu cihazda ayrı kalır.",fontSize=14.sp,color=TaleMuted)
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
                        Text("Hesap eşitlemesi",style=MaterialTheme.typography.titleMedium)
                        Text(state.sync.message,fontSize=14.sp)
                        if(state.sync.running) LinearProgressIndicator(Modifier.fillMaxWidth())
                        if(state.sync.lastSuccessAt!=null) Text("Son alınan kayıt: ${java.text.DateFormat.getDateTimeInstance(java.text.DateFormat.SHORT,java.text.DateFormat.SHORT).format(java.util.Date(state.sync.lastSuccessAt))}",fontSize=12.sp,color=TaleMuted)
                        if(state.sync.pending>0) Text("${state.sync.pending} kayıt gönderilmeyi bekliyor.",fontSize=13.sp)
                        if(state.sync.blocked>0) Text("${state.sync.blocked} kayıt için kontrol gerekiyor. Yerel geçmiş korunuyor.",fontSize=13.sp)
                        if(state.sync.deviceOnlyPoints>0) Text("Eski geçmişindeki ${state.sync.deviceOnlyPoints} puan bu cihaza ait; diğer cihazlara aktarılmaz.",fontSize=13.sp,color=TaleMuted)
                        if(state.sync.preferencesPending) Text(if(state.sync.preferencesConflict) "Profil ayarların farklı. Bu cihazdaki seçimlerin korunuyor; ayar eşitlemesi tamamlanmayı bekliyor." else "Profil ayarların şu anda bu cihazda korunuyor; ayar eşitlemesi tamamlanmayı bekliyor.",fontSize=13.sp,color=TaleMuted)
                        OutlinedButton(onClick=onSync,enabled=!state.busy && !state.needsSignIn && !state.sync.running,modifier=Modifier.fillMaxWidth()) {Text("Şimdi eşitle")}
                    }
                }
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
        text={Text("Misafir kelimelerin, okuma ilerlemen ve puanın bu hesabın cihazdaki kayıtlarına bir kez eklenir. Mevcut hesap ayarların korunur. Taşınan geçmiş misafir alanından çıkar. Gönderilebilen öğrenme kayıtları hesabına eşitlenir; eski puanlar bu cihazda korunur.")},
        confirmButton={TextButton(onClick={confirmTransfer=false;onTransfer()}) {Text("Bu hesaba aktar")}},dismissButton={TextButton(onClick={confirmTransfer=false}) {Text("Vazgeç")}})
}
