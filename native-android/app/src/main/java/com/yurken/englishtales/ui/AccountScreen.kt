package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.*
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
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
        SimpleTopBar(stringResource(R.string.hesabin)) {if(!state.busy) onBack()}
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).imePadding().padding(24.dp),verticalArrangement=Arrangement.spacedBy(16.dp)) {
            Text(if(state.userId==null) stringResource(R.string.ogrenmeye_kendi_hesabinla_devam_et) else stringResource(R.string.hesap_acik),fontSize=24.sp)
            if(state.userId!=null) {
                Text(state.email,fontSize=16.sp,color=TaleBlue)
                Text(stringResource(R.string.ogrenme_kayitlarin_hesabin_uzerinden_esitlenir),fontSize=14.sp,color=TaleMuted)
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
                        Text(stringResource(R.string.hesap_esitlemesi),style=MaterialTheme.typography.titleMedium)
                        Text(state.sync.message,fontSize=14.sp)
                        if(state.sync.running) LinearProgressIndicator(Modifier.fillMaxWidth())
                        if(state.sync.lastSuccessAt!=null) Text(stringResource(R.string.son_alinan_kayit, java.text.DateFormat.getDateTimeInstance(java.text.DateFormat.SHORT,java.text.DateFormat.SHORT).format(java.util.Date(state.sync.lastSuccessAt))),fontSize=12.sp,color=TaleMuted)
                        if(state.sync.pending>0) Text(stringResource(R.string.kayit_gonderilmeyi_bekliyor, state.sync.pending),fontSize=13.sp)
                        if(state.sync.blocked>0) Text(stringResource(R.string.kayit_icin_kontrol_gerekiyor_yerel, state.sync.blocked),fontSize=13.sp)
                        if(state.sync.deviceOnlyPoints>0) Text(stringResource(R.string.eski_gecmisindeki_puan_bu_cihaza, state.sync.deviceOnlyPoints),fontSize=13.sp,color=TaleMuted)
                        if(state.sync.preferencesPending) Text(if(state.sync.preferencesConflict) stringResource(R.string.baska_cihazdaki_profil_tercihlerin_farkli) else stringResource(R.string.profil_tercihlerin_gonderilmeyi_bekliyor),fontSize=13.sp,color=TaleMuted)
                        if(state.sync.preferencesConflict) {
                            OutlinedButton(onClick={onResolvePreferences(true)},enabled=!state.busy && !state.sync.running,modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.bu_cihazdaki_tercihleri_kullan))}
                            OutlinedButton(onClick={onResolvePreferences(false)},enabled=!state.busy && !state.sync.running,modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.hesaptaki_tercihleri_kullan))}
                        }
                        OutlinedButton(onClick=onSync,enabled=!state.busy && !state.needsSignIn && !state.sync.running,modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.simdi_esitle))}
                    }
                }
                state.guestTransfer?.let {guest ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
                            Text(stringResource(R.string.misafir_ilerlemen),style=MaterialTheme.typography.titleMedium)
                            Text(stringResource(R.string.kelime_puan_hikaye, guest.words, guest.points, guest.stories),fontSize=14.sp)
                            if(guest.blocked) Text(stringResource(R.string.yarida_kalan_aktarim_baska_hesabina),fontSize=14.sp)
                            else Button(onClick={confirmTransfer=true},enabled=!state.busy && !state.needsSignIn,modifier=Modifier.fillMaxWidth()) {
                                Text(if(guest.pending) stringResource(R.string.aktarimi_tamamla) else stringResource(R.string.bu_hesaba_aktar))
                            }
                        }
                    }
                }
                OutlinedButton(onClick={confirmExit=true},enabled=!state.busy,modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.bu_cihazdan_cikis_yap))}
                TextButton(onClick={confirmDelete=true},enabled=!state.busy && !state.needsSignIn,modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.hesabimi_sil),color=MaterialTheme.colorScheme.error)}
                if(!state.needsSignIn) {
                    GoogleSignInButton(!state.busy,onGoogle)
                    Text(stringResource(R.string.google_hesabinla_da_giris_yapabilirsin),fontSize=13.sp,color=TaleMuted)
                }
                if(state.needsSignIn) Text(stringResource(R.string.kayitlarina_erisimi_dogrulamak_icin_tekrar),color=TaleMuted)
            } else {
                Text(stringResource(R.string.google_ile_devam_edebilir_veya),fontSize=14.sp,color=TaleMuted)
            }
            if(state.userId==null || state.needsSignIn) {
                if(state.emailAction.isNotEmpty()) {
                    Text(if(state.emailAction=="signup") stringResource(R.string.e_postani_dogrula) else stringResource(R.string.yeni_parolani_belirle),style=MaterialTheme.typography.titleMedium)
                    Text(stringResource(R.string.islem_yapilan_e_posta, state.verificationEmail),fontSize=14.sp,color=TaleMuted)
                    Text(if(state.emailAction=="signup")
                        stringResource(R.string.yeni_hesap_icin_english_tales)
                        else stringResource(R.string.english_tales_parola_kurtarma_kodun),fontSize=13.sp,color=TaleMuted)
                    OutlinedTextField(code,{code=it.filter(Char::isDigit).take(8)},label={Text(stringResource(R.string.e_posta_kodu))},singleLine=true,enabled=!state.busy,
                        keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.NumberPassword),modifier=Modifier.fillMaxWidth())
                    if(state.emailAction=="recovery") {
                        OutlinedTextField(password,{password=it},label={Text(stringResource(R.string.yeni_parola_en_az_8))},singleLine=true,enabled=!state.busy,
                            visualTransformation=PasswordVisualTransformation(),keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Password),modifier=Modifier.fillMaxWidth())
                        OutlinedTextField(confirmation,{confirmation=it},label={Text(stringResource(R.string.yeni_parolayi_tekrar_yaz))},singleLine=true,enabled=!state.busy,
                            visualTransformation=PasswordVisualTransformation(),keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Password),modifier=Modifier.fillMaxWidth())
                    }
                    Button(onClick={val submitted=password;val submittedCode=code;password="";confirmation="";code="";onCompleteCode(submittedCode,submitted)},
                        enabled=!state.busy && code.length in 6..8 && (state.emailAction=="signup" || (password.length in 8..128 && password==confirmation)),modifier=Modifier.fillMaxWidth()) {
                        Text(if(state.emailAction=="signup") stringResource(R.string.dogrula_ve_giris_yap) else stringResource(R.string.parolayi_guncelle))
                    }
                    TextButton(onClick=onResendCode,enabled=!state.busy,modifier=Modifier.fillMaxWidth()) {Text(if(state.emailAction=="signup") stringResource(R.string.dogrulama_kodunu_yeniden_iste) else stringResource(R.string.kurtarma_kodunu_yeniden_iste))}
                    TextButton(onClick={password="";confirmation="";code="";onCancelCode()},enabled=!state.busy,modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.giris_ekranina_don))}
                } else {
                GoogleSignInButton(!state.busy,onGoogle)
                Text(when(mode) {"signup"->stringResource(R.string.e_posta_hesabi_olustur);"recovery"->stringResource(R.string.parolani_kurtar);else->stringResource(R.string.veya_e_posta_ile_giris)},color=TaleMuted,fontSize=13.sp)
                OutlinedTextField(email,{email=it},label={Text(stringResource(R.string.e_posta))},singleLine=true,enabled=!state.busy,
                    keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Email),modifier=Modifier.fillMaxWidth())
                if(mode!="recovery") OutlinedTextField(password,{password=it},label={Text(if(mode=="signup") stringResource(R.string.parola_en_az_8_karakter) else stringResource(R.string.parola))},singleLine=true,enabled=!state.busy,
                    visualTransformation=PasswordVisualTransformation(),keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Password),modifier=Modifier.fillMaxWidth())
                if(mode=="signup") OutlinedTextField(confirmation,{confirmation=it},label={Text(stringResource(R.string.parolayi_tekrar_yaz))},singleLine=true,enabled=!state.busy,
                    visualTransformation=PasswordVisualTransformation(),keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Password),modifier=Modifier.fillMaxWidth())
                Button(onClick={val submitted=password;password="";confirmation="";when(mode) {"signup"->onSignUp(email,submitted);"recovery"->onRecovery(email);else->onSignIn(email,submitted)}},
                    enabled=!state.busy && email.isNotBlank() && when(mode) {"signup"->password.length in 8..128 && password==confirmation;"recovery"->true;else->password.isNotEmpty()},modifier=Modifier.fillMaxWidth().heightIn(min=48.dp)) {
                    Text(when(mode) {"signup"->stringResource(R.string.hesap_olustur);"recovery"->stringResource(R.string.kurtarma_kodu_gonder);else->stringResource(R.string.giris_yap)})
                }
                if(mode=="signin") {
                    TextButton(onClick={password="";confirmation="";mode="signup"},enabled=!state.busy,modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.yeni_hesap_olustur))}
                    TextButton(onClick={password="";confirmation="";mode="recovery"},enabled=!state.busy,modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.parolami_unuttum))}
                } else TextButton(onClick={password="";confirmation="";mode="signin"},enabled=!state.busy,modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.giris_ekranina_don))}
                }
                if(state.userId==null) OutlinedButton(onClick=onGuest,enabled=!state.busy,modifier=Modifier.fillMaxWidth().heightIn(min=48.dp)) {Text(stringResource(R.string.misafir_olarak_devam_et))}
            }
            if(state.busy) LinearProgressIndicator(Modifier.fillMaxWidth())
            AccountMessage(state)
            SupportLinks()
        }
    }
    if(confirmExit) TaleDialog(stringResource(R.string.cikis_yapilsin_mi),stringResource(R.string.bu_hesabin_cihazdaki_kayitlari_korunur),
        stringResource(R.string.cikis_yap),onConfirm={confirmExit=false;onSignOut()},onDismissRequest={confirmExit=false},dismissLabel=stringResource(R.string.vazgec))
    if(confirmTransfer) TaleDialog(stringResource(R.string.misafir_ilerlemen_tasinsin_mi),stringResource(R.string.misafir_kelimelerin_okuma_ilerlemen_ve),
        stringResource(R.string.bu_hesaba_aktar),onConfirm={confirmTransfer=false;onTransfer()},onDismissRequest={confirmTransfer=false},dismissLabel=stringResource(R.string.vazgec),mood=MascotMood.Welcome)
    if(confirmDelete) TaleDialog(stringResource(R.string.hesabin_kalici_olarak_silinsin_mi),stringResource(R.string.n_nhesabin_sunucudaki_ogrenme_gecmisin, state.email),
        stringResource(R.string.hesabimi_kalici_olarak_sil),onConfirm={confirmDelete=false;onDeleteAccount()},onDismissRequest={confirmDelete=false},dismissLabel=stringResource(R.string.vazgec),destructive=true)
}
