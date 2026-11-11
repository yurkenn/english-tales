package com.yurken.englishtales.ads

import androidx.compose.runtime.staticCompositionLocalOf

enum class EnergyAdOutcome { Completed, NoReward, Interrupted }

interface CompletionAds {
    fun canRewardEnergy(): Boolean = false
    fun rewardEnergy(user: String, nonce: String, isCurrent: ()->Boolean, onFinished: (EnergyAdOutcome)->Unit) { onFinished(EnergyAdOutcome.NoReward) }
    fun recordCompletion(id: String)
    fun afterCompletion(id: String, isCurrent: ()->Boolean, onContinue: ()->Unit)
    fun privacyOptions(onMessage: (String)->Unit)
    class Disabled(private val context: android.content.Context): CompletionAds by None {
        override fun privacyOptions(onMessage: (String)->Unit) {
            onMessage(context.getString(com.yurken.englishtales.R.string.ads_disabled_message))
        }
    }
    object None: CompletionAds {
        override fun recordCompletion(id: String) {}
        override fun afterCompletion(id: String,isCurrent: ()->Boolean,onContinue: ()->Unit) {if(isCurrent()) onContinue()}
        override fun privacyOptions(onMessage: (String)->Unit) {onMessage("")}
    }
}
val LocalCompletionAds=staticCompositionLocalOf<CompletionAds> {CompletionAds.None}
