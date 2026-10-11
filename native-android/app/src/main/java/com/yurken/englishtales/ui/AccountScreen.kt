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
fun AccountScreen(state: AccountState,onBack: ()->Unit,onSignIn: (String,String)->Unit,onSignOut: ()->Unit,onGoogle: ()->Unit={},onGuest: ()->Unit=onBack,onTransfer: ()->Unit={},onSync: ()->Unit={},onResolvePreferences: (Boolean)->Unit={},onSignUp: (String,String)->Unit={_,_->},onRecovery: (String)->Unit={},onCompleteCode: (String,String)->Unit={_,_->},onResendCode: ()->Unit={},onCancelCode: ()->Unit={},onDeleteAccount: ()->Unit={}) {
    var email by remember {mutableStateOf(state.email)}
    // Password is deliberately not rememberSaveable; process/rotation restoration must not persist it.
    var password by remember {mutableStateOf("")}
    var confirmation by remember {mutableStateOf("")}
    var code by remember {mutableStateOf("")}
    var mode by remember {mutableStateOf("signin")}
    LaunchedEffect(state.emailAction,state.scope) {password="";confirmation="";code="";if(state.emailAction.isEmpty()) mode="signin"}
    var confirmExit by remember {mutableStateOf(false)}
    var confirmDelete by remember {mutableStateOf(false)}
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
                        if(state.sync.preferencesPending) Text(if(state.sync.preferencesConflict) "Başka cihazdaki profil tercihlerin farklı. Hangi tercihleri kullanmak istersin?" else "Profil tercihlerin gönderilmeyi bekliyor.",fontSize=13.sp,color=TaleMuted)
                        if(state.sync.preferencesConflict) {
                            OutlinedButton(onClick={onResolvePreferences(true)},enabled=!state.busy && !state.sync.running,modifier=Modifier.fillMaxWidth()) {Text("Bu cihazdaki tercihleri kullan")}
                            OutlinedButton(onClick={onResolvePreferences(false)},enabled=!state.busy && !state.sync.running,modifier=Modifier.fillMaxWidth()) {Text("Hesaptaki tercihleri kullan")}
                        }
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
                TextButton(onClick={confirmDelete=true},enabled=!state.busy && !state.needsSignIn,modifier=Modifier.fillMaxWidth()) {Text("Hesabımı sil",color=MaterialTheme.colorScheme.error)}
                if(!state.needsSignIn) {
                    GoogleSignInButton(!state.busy,onGoogle)
                    Text("Google hesabınla da giriş yapabilirsin. Hesapların kayıtları ayrı korunur.",fontSize=13.sp,color=TaleMuted)
                }
                if(state.needsSignIn) Text("Kayıtlarına erişimi doğrulamak için tekrar giriş yap.",color=TaleMuted)
            } else {
                Text("Google ile devam edebilir veya e-posta hesabı oluşturabilirsin. Misafir ilerlemen cihazında ayrı kalır; girişten sonra aktarımı seçebilirsin.",fontSize=14.sp,color=TaleMuted)
            }
            if(state.userId==null || state.needsSignIn) {
                if(state.emailAction.isNotEmpty()) {
                    Text(if(state.emailAction=="signup") "E-postanı doğrula" else "Yeni parolanı belirle",style=MaterialTheme.typography.titleMedium)
                    Text("İşlem yapılan e-posta: ${state.verificationEmail}",fontSize=14.sp,color=TaleMuted)
                    Text(if(state.emailAction=="signup")
                        "Yeni hesap için “English Tales — E-posta doğrulama kodun” konulu e-postadaki kodu kullan. Parola kurtarma kodu bu ekranda geçmez. Bu adresle zaten hesabın varsa yeni doğrulama e-postası gelmeyebilir; giriş ekranına dönüp giriş yap."
                        else "“English Tales — Parola kurtarma kodun” konulu en son e-postadaki kodu kullan. Hesap oluşturma kodu bu ekranda geçmez.",fontSize=13.sp,color=TaleMuted)
                    OutlinedTextField(code,{code=it.filter(Char::isDigit).take(8)},label={Text("E-posta kodu")},singleLine=true,enabled=!state.busy,
                        keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.NumberPassword),modifier=Modifier.fillMaxWidth())
                    if(state.emailAction=="recovery") {
                        OutlinedTextField(password,{password=it},label={Text("Yeni parola (en az 8 karakter)")},singleLine=true,enabled=!state.busy,
                            visualTransformation=PasswordVisualTransformation(),keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Password),modifier=Modifier.fillMaxWidth())
                        OutlinedTextField(confirmation,{confirmation=it},label={Text("Yeni parolayı tekrar yaz")},singleLine=true,enabled=!state.busy,
                            visualTransformation=PasswordVisualTransformation(),keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Password),modifier=Modifier.fillMaxWidth())
                    }
                    Button(onClick={val submitted=password;val submittedCode=code;password="";confirmation="";code="";onCompleteCode(submittedCode,submitted)},
                        enabled=!state.busy && code.length in 6..8 && (state.emailAction=="signup" || (password.length in 8..128 && password==confirmation)),modifier=Modifier.fillMaxWidth()) {
                        Text(if(state.emailAction=="signup") "Doğrula ve giriş yap" else "Parolayı güncelle")
                    }
                    TextButton(onClick=onResendCode,enabled=!state.busy,modifier=Modifier.fillMaxWidth()) {Text(if(state.emailAction=="signup") "Doğrulama kodunu yeniden iste" else "Kurtarma kodunu yeniden iste")}
                    TextButton(onClick={password="";confirmation="";code="";onCancelCode()},enabled=!state.busy,modifier=Modifier.fillMaxWidth()) {Text("Giriş ekranına dön")}
                } else {
                GoogleSignInButton(!state.busy,onGoogle)
                Text(when(mode) {"signup"->"E-posta hesabı oluştur";"recovery"->"Parolanı kurtar";else->"veya e-posta ile giriş yap"},color=TaleMuted,fontSize=13.sp)
                OutlinedTextField(email,{email=it},label={Text("E-posta")},singleLine=true,enabled=!state.busy,
                    keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Email),modifier=Modifier.fillMaxWidth())
                if(mode!="recovery") OutlinedTextField(password,{password=it},label={Text(if(mode=="signup") "Parola (en az 8 karakter)" else "Parola")},singleLine=true,enabled=!state.busy,
                    visualTransformation=PasswordVisualTransformation(),keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Password),modifier=Modifier.fillMaxWidth())
                if(mode=="signup") OutlinedTextField(confirmation,{confirmation=it},label={Text("Parolayı tekrar yaz")},singleLine=true,enabled=!state.busy,
                    visualTransformation=PasswordVisualTransformation(),keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Password),modifier=Modifier.fillMaxWidth())
                Button(onClick={val submitted=password;password="";confirmation="";when(mode) {"signup"->onSignUp(email,submitted);"recovery"->onRecovery(email);else->onSignIn(email,submitted)}},
                    enabled=!state.busy && email.isNotBlank() && when(mode) {"signup"->password.length in 8..128 && password==confirmation;"recovery"->true;else->password.isNotEmpty()},modifier=Modifier.fillMaxWidth().heightIn(min=48.dp)) {
                    Text(when(mode) {"signup"->"Hesap oluştur";"recovery"->"Kurtarma kodu gönder";else->"Giriş yap"})
                }
                if(mode=="signin") {
                    TextButton(onClick={password="";confirmation="";mode="signup"},enabled=!state.busy,modifier=Modifier.fillMaxWidth()) {Text("Yeni hesap oluştur")}
                    TextButton(onClick={password="";confirmation="";mode="recovery"},enabled=!state.busy,modifier=Modifier.fillMaxWidth()) {Text("Parolamı unuttum")}
                } else TextButton(onClick={password="";confirmation="";mode="signin"},enabled=!state.busy,modifier=Modifier.fillMaxWidth()) {Text("Giriş ekranına dön")}
                }
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
    if(confirmDelete) AlertDialog(onDismissRequest={confirmDelete=false},title={Text("Hesabın kalıcı olarak silinsin mi?")},
        text={Text("${state.email}\n\nHesabın, sunucudaki öğrenme geçmişin ve bu cihazdaki hesap kayıtların silinir. Gönderilmeyi bekleyen hesap kayıtları da silinir. Bu işlem geri alınamaz. Misafir kayıtların ayrı kalır. Silmeden önce yeniden giriş yapman istenebilir.")},
        confirmButton={TextButton(onClick={confirmDelete=false;onDeleteAccount()}) {Text("Hesabımı kalıcı olarak sil",color=MaterialTheme.colorScheme.error)}},dismissButton={TextButton(onClick={confirmDelete=false}) {Text("Vazgeç")}})
}
