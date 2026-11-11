package com.yurken.englishtales.ui

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.revenuecat.purchases.PackageType
import com.yurken.englishtales.BuildConfig
import com.yurken.englishtales.R
import com.yurken.englishtales.ads.LocalCompletionAds
import com.yurken.englishtales.monetization.*
import java.text.DateFormat
import java.util.Date

internal fun Context.activity(): Activity? = when(this) {
    is Activity -> this
    is ContextWrapper -> baseContext.activity()
    else -> null
}

/** Every reader entry, including restored navigation, passes here before download or session creation. */
@Composable
internal fun ReaderEnergyAccess(model: MonetizationViewModel, storyId: String, guest: Boolean,
    onAccount: ()->Unit, onBack: ()->Unit, content: @Composable ()->Unit) {
    if(!BuildConfig.MONETIZATION_ENABLED) {content();return}
    var allowed by remember(model,storyId) {mutableStateOf(false)}
    LaunchedEffect(model,storyId) {model.authorize(storyId) {allowed=true}}
    if(allowed) content() else EnergyScreen(model,guest,onAccount,onBack,onRead={model.authorize(storyId) {allowed=true}})
}

@Composable
internal fun EnergyStatusButton(model: MonetizationViewModel, onOpen: ()->Unit) {
    val ui by model.state.collectAsState()
    if(!ui.policyEnabled && ui.energy?.premium(System.currentTimeMillis())!=true) return
    TextButton(onClick=onOpen,modifier=Modifier.fillMaxWidth()) {
        Text(if(ui.energy?.premium(System.currentTimeMillis())==true) stringResource(R.string.energy_premium_active)
            else ui.energy?.let {stringResource(R.string.energy_balance,it.balance)} ?: stringResource(R.string.energy_title))
    }
}

@Composable
internal fun EnergyScreen(model: MonetizationViewModel, guest: Boolean, onAccount: ()->Unit, onBack: ()->Unit,
    onRead: (()->Unit)?=null) {
    val ui by model.state.collectAsState()
    val ads=LocalCompletionAds.current
    val context=LocalContext.current
    val links=LocalUriHandler.current
    val premium=ui.energy?.premium(System.currentTimeMillis())==true
    LaunchedEffect(guest) {model.paywallViewed()}
    LaunchedEffect(guest,ui.busy,ui.policyEnabled) {if(!guest && ui.policyEnabled && !ui.busy && !ui.offersLoaded) model.offers()}
    Column(Modifier.fillMaxSize().background(TaleBackground).safeDrawingPadding().verticalScroll(rememberScrollState())
        .padding(horizontal=24.dp,vertical=16.dp),verticalArrangement=Arrangement.spacedBy(16.dp)) {
        TextButton(onClick=onBack) {Text(stringResource(R.string.energy_close))}
        Surface(shape=RoundedCornerShape(24.dp),color=if(premium) LocalTaleColors.current.tilePurple else LocalTaleColors.current.tileBlue) {
            Column(Modifier.fillMaxWidth().padding(24.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
                Text(if(premium) stringResource(R.string.energy_premium_active) else stringResource(R.string.energy_title),
                    style=MaterialTheme.typography.headlineSmall,fontWeight=FontWeight.Bold)
                if(!premium) Text(ui.energy?.let {stringResource(R.string.energy_balance,it.balance)} ?: stringResource(R.string.energy_checking),
                    style=MaterialTheme.typography.titleLarge)
                Text(stringResource(if(premium) R.string.energy_premium_description else R.string.energy_description))
                ui.energy?.let {energy ->
                    val at=if(premium) energy.premiumUntil else energy.resetsAt
                    Text(stringResource(if(premium) R.string.energy_premium_end else R.string.energy_reset,
                        DateFormat.getDateTimeInstance(DateFormat.SHORT,DateFormat.SHORT).format(Date(at))),style=MaterialTheme.typography.bodySmall)
                }
            }
        }
        if(ui.busy) LinearProgressIndicator(Modifier.fillMaxWidth())
        if(ui.error) Text(stringResource(R.string.energy_unavailable),color=MaterialTheme.colorScheme.error)
        if(ui.pending) Text(stringResource(R.string.energy_pending),style=MaterialTheme.typography.bodyMedium)
        if(onRead!=null) {
            Text(stringResource(if(ui.energy?.balance==0 && !premium) R.string.energy_empty else R.string.energy_gate_description),
                style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.Bold)
            OutlinedButton(onClick=onRead,enabled=!ui.busy && (ui.error || premium || (ui.energy?.balance ?: 0)>0),modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.energy_retry_read))}
        }
        if(guest) {
            Text(stringResource(R.string.energy_guest_note),style=MaterialTheme.typography.bodyMedium)
            Button(onClick=onAccount,enabled=!ui.busy,modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.energy_sign_in))}
        } else if(!premium && ui.policyEnabled) {
            Button(onClick={model.reward(ads)},enabled=!ui.busy && !ui.pending && ui.energy!=null && ui.energy!!.adCredits+ui.energy!!.pendingAdRewards<3,
                modifier=Modifier.fillMaxWidth().heightIn(min=52.dp)) {Text(stringResource(R.string.energy_watch))}
            if((ui.energy?.adCredits ?: 0)>=3) Text(stringResource(R.string.energy_reward_limit),style=MaterialTheme.typography.bodySmall)
            HorizontalDivider()
            Text(stringResource(R.string.energy_premium),style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold)
            Text(stringResource(R.string.energy_premium_description))
            if(ui.packages.isEmpty()) Text(stringResource(R.string.energy_offer_unavailable),style=MaterialTheme.typography.bodySmall)
            ui.packages.forEach {offer ->
                OutlinedButton(onClick={context.activity()?.let {model.buy(it,offer)}},enabled=!ui.busy,
                    modifier=Modifier.fillMaxWidth().heightIn(min=52.dp)) {
                    Text(stringResource(if(offer.packageType==PackageType.ANNUAL) R.string.energy_annual else R.string.energy_monthly,
                        offer.product.price.formatted))
                }
            }
            Text(stringResource(R.string.energy_renewal),style=MaterialTheme.typography.bodySmall,color=TaleMuted)
        }
        if(!guest) {
            TextButton(onClick={context.activity()?.let {model.restore(it)}},enabled=!ui.busy && PremiumBilling.configured,
                modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.energy_restore))}
            TextButton(onClick={links.openUri("https://play.google.com/store/account/subscriptions?package=com.yurken.englishtales")},
                modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.energy_manage))}
        }
        TextButton(onClick={
            if(guest || ui.adPending) model.refresh()
            else if(ui.purchasePending) model.verifyPremium()
            else if(ui.packages.isEmpty() && !premium && PremiumBilling.configured) model.offers(force=true)
            else model.verifyPremium()
        },enabled=!ui.busy,modifier=Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.energy_refresh))
        }
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceEvenly) {
            TextButton(onClick={links.openUri("https://englishtales-app.web.app/privacy")}) {Text(stringResource(R.string.energy_privacy))}
            TextButton(onClick={links.openUri("https://englishtales-app.web.app/subscription-terms.html")}) {Text(stringResource(R.string.energy_terms))}
        }
    }
}
