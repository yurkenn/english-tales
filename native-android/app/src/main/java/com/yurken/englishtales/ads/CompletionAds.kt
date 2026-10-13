package com.yurken.englishtales.ads

import androidx.compose.runtime.staticCompositionLocalOf

interface CompletionAds {
    fun recordCompletion(id: String)
    fun afterCompletion(id: String, isCurrent: ()->Boolean, onContinue: ()->Unit)
    fun privacyOptions(onMessage: (String)->Unit)
    object None: CompletionAds {
        override fun recordCompletion(id: String) {}
        override fun afterCompletion(id: String,isCurrent: ()->Boolean,onContinue: ()->Unit) {if(isCurrent()) onContinue()}
        override fun privacyOptions(onMessage: (String)->Unit) {onMessage("Bu sürümde reklamlar kapalı.")}
    }
}
val LocalCompletionAds=staticCompositionLocalOf<CompletionAds> {CompletionAds.None}
