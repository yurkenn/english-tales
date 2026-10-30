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
import androidx.compose.ui.platform.testTag
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
    EnergyStatusContent(ui,onOpen)
}

@Composable
internal fun EnergyStatusContent(ui: MonetizationUi,onOpen: ()->Unit) {
    if(!ui.policyEnabled && ui.energy?.premium(System.currentTimeMillis())!=true) return
    ChunkyBox(TaleSurface,Modifier.padding(horizontal=16.dp,vertical=6.dp).fillMaxWidth().testTag("energy_status"),
        RoundedCornerShape(16.dp),depth=3.dp,border=TaleLine,onClick=onOpen) {
        Row(Modifier.fillMaxWidth().heightIn(min=48.dp).padding(horizontal=14.dp,vertical=8.dp),
            verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)) {
            ReferenceIcon("bolt",TalePurple,Modifier.size(22.dp))
            Text(if(ui.energy?.premium(System.currentTimeMillis())==true) stringResource(R.string.energy_premium_active)
                else ui.energy?.let {stringResource(R.string.energy_balance,it.balance)} ?: stringResource(R.string.energy_title),
                Modifier.weight(1f),fontWeight=FontWeight.ExtraBold,color=TaleInk)
            ReferenceIcon("next",TaleBlue,Modifier.size(20.dp))
        }
    }
}

/** UI callbacks keep provider, account and ad operations in the ViewModel-backed wrapper. */
internal data class EnergyScreenActions(val onBack: ()->Unit={},val onAccount: ()->Unit={},val onReward: ()->Unit={},
    val onBuy: (com.revenuecat.purchases.Package)->Unit={},val onRestore: ()->Unit={},val onManage: ()->Unit={},
    val onRefresh: ()->Unit={},val onPrivacy: ()->Unit={},val onTerms: ()->Unit={},val onRead: (()->Unit)?=null)

@Composable
internal fun EnergyScreen(model: MonetizationViewModel, guest: Boolean, onAccount: ()->Unit, onBack: ()->Unit,
    onRead: (()->Unit)?=null) {
    val ui by model.state.collectAsState()
    val ads=LocalCompletionAds.current
    val context=LocalContext.current
    val links=LocalUriHandler.current
    LaunchedEffect(guest) {model.paywallViewed()}
    LaunchedEffect(guest,ui.busy,ui.policyEnabled) {if(!guest && ui.policyEnabled && !ui.busy && !ui.offersLoaded) model.offers()}
    EnergyScreenContent(ui,guest,PremiumBilling.configured,EnergyScreenActions(
        onBack=onBack,onAccount=onAccount,onReward={model.reward(ads)},onBuy={offer ->context.activity()?.let {model.buy(it,offer)}},
        onRestore={context.activity()?.let {model.restore(it)}},
        onManage={links.openUri("https://play.google.com/store/account/subscriptions?package=com.yurken.englishtales")},
        onRefresh={
            if(guest || ui.adPending) model.refresh()
            else if(ui.purchasePending) model.verifyPremium()
            else if(ui.packages.isEmpty() && ui.energy?.premium(System.currentTimeMillis())!=true && PremiumBilling.configured) model.offers(force=true)
            else model.verifyPremium()
        },
        onPrivacy={links.openUri("https://englishtales-app.web.app/privacy")},
        onTerms={links.openUri("https://englishtales-app.web.app/subscription-terms.html")},onRead=onRead))
}

/** Renders actual provider state without starting billing or network work during composition. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun EnergyScreenContent(ui: MonetizationUi,guest: Boolean,restoreAvailable: Boolean,actions: EnergyScreenActions) {
    val premium=ui.energy?.premium(System.currentTimeMillis())==true
    val face=if(premium) TalePurple else TaleBlue
    val ink=if(premium) TaleOnPurple else TaleOnBlue
    val canRead=!ui.busy && (ui.error || premium || (ui.energy?.balance ?: 0)>0)
    val canReward=!ui.busy && !ui.pending && ui.energy!=null && ui.energy!!.adCredits+ui.energy!!.pendingAdRewards<3
    Column(Modifier.fillMaxSize().background(TaleBackground).safeDrawingPadding().verticalScroll(rememberScrollState())
        .padding(horizontal=24.dp,vertical=16.dp),verticalArrangement=Arrangement.spacedBy(16.dp)) {
        Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)) {
            ReferenceIconButton("back",stringResource(R.string.energy_close),actions.onBack)
            Text(stringResource(R.string.energy_premium),style=MaterialTheme.typography.titleLarge,color=TaleInk)
        }
        ChunkyBox(face,Modifier.fillMaxWidth().testTag("energy_summary"),RoundedCornerShape(24.dp)) {
            Column(Modifier.fillMaxWidth().padding(24.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
                ReferenceIcon(if(premium) "star" else "bolt",ink,Modifier.size(32.dp))
                Text(if(premium) stringResource(R.string.energy_premium_active) else stringResource(R.string.energy_title),
                    modifier=Modifier.fillMaxWidth(),style=MaterialTheme.typography.headlineSmall,fontWeight=FontWeight.ExtraBold,color=ink)
                if(!premium) Text(ui.energy?.let {stringResource(R.string.energy_balance,it.balance)} ?: stringResource(R.string.energy_checking),
                    modifier=Modifier.fillMaxWidth(),style=MaterialTheme.typography.titleLarge,color=ink)
                Text(stringResource(if(premium) R.string.energy_premium_description else R.string.energy_description),color=ink)
                ui.energy?.let {energy ->
                    val at=if(premium) energy.premiumUntil else energy.resetsAt
                    Text(stringResource(if(premium) R.string.energy_premium_end else R.string.energy_reset,
                        DateFormat.getDateTimeInstance(DateFormat.SHORT,DateFormat.SHORT).format(Date(at))),style=MaterialTheme.typography.bodySmall,color=ink)
                }
            }
        }
        if(ui.busy) LinearProgressIndicator(Modifier.fillMaxWidth())
        if(ui.error) Text(stringResource(R.string.energy_unavailable),color=MaterialTheme.colorScheme.error)
        if(ui.pending) Text(stringResource(R.string.energy_pending),style=MaterialTheme.typography.bodyMedium)
        if(actions.onRead!=null) {
            Text(stringResource(if(ui.energy?.balance==0 && !premium) R.string.energy_empty else R.string.energy_gate_description),
                style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.Bold)
            ChunkyButton(stringResource(R.string.energy_retry_read),actions.onRead,Modifier.fillMaxWidth(),
                enabled=canRead,color=if(canRead) TaleGreen else TaleLine,onColor=if(canRead) TaleOnGreen else TaleMuted)
        }
        if(guest) {
            Text(stringResource(R.string.energy_guest_note),style=MaterialTheme.typography.bodyMedium)
            ChunkyButton(stringResource(R.string.energy_sign_in),actions.onAccount,Modifier.fillMaxWidth(),enabled=!ui.busy,
                color=if(ui.busy) TaleLine else TaleGreen,onColor=if(ui.busy) TaleMuted else TaleOnGreen)
        } else if(!premium && ui.policyEnabled) {
            ChunkyButton(stringResource(R.string.energy_watch),actions.onReward,Modifier.fillMaxWidth(),
                enabled=canReward,color=if(canReward) TaleGreen else TaleLine,onColor=if(canReward) TaleOnGreen else TaleMuted)
            if((ui.energy?.adCredits ?: 0)>=3) Text(stringResource(R.string.energy_reward_limit),style=MaterialTheme.typography.bodySmall)
            HorizontalDivider()
            Text(stringResource(R.string.energy_premium),style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold)
            Text(stringResource(R.string.energy_premium_description))
            if(ui.packages.isEmpty()) Text(stringResource(R.string.energy_offer_unavailable),style=MaterialTheme.typography.bodySmall)
            ui.packages.forEach {offer ->
                ChunkyButton(stringResource(if(offer.packageType==PackageType.ANNUAL) R.string.energy_annual else R.string.energy_monthly,
                    offer.product.price.formatted),{actions.onBuy(offer)},Modifier.fillMaxWidth(),enabled=!ui.busy,
                    color=TaleSurface,onColor=TaleInk,border=TaleLine)
            }
            Text(stringResource(R.string.energy_renewal),style=MaterialTheme.typography.bodySmall,color=TaleMuted)
        }
        if(!guest) {
            TextButton(onClick=actions.onRestore,enabled=!ui.busy && restoreAvailable,
                modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.energy_restore))}
            TextButton(onClick=actions.onManage,
                modifier=Modifier.fillMaxWidth()) {Text(stringResource(R.string.energy_manage))}
        }
        TextButton(onClick=actions.onRefresh,enabled=!ui.busy,modifier=Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.energy_refresh))
        }
        FlowRow(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceEvenly,maxItemsInEachRow=sideBySide(2)) {
            TextButton(onClick=actions.onPrivacy,modifier=Modifier.weight(1f)) {Text(stringResource(R.string.energy_privacy))}
            TextButton(onClick=actions.onTerms,modifier=Modifier.weight(1f)) {Text(stringResource(R.string.energy_terms))}
        }
    }
}
