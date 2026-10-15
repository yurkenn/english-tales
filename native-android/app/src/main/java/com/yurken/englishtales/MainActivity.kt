package com.yurken.englishtales

import android.os.Bundle
import android.content.Intent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.yurken.englishtales.data.LearningContent
import com.yurken.englishtales.ui.EnglishTalesTheme
import com.yurken.englishtales.ui.TalesApp
import com.yurken.englishtales.ui.YurkenBrandIntro
import androidx.compose.runtime.CompositionLocalProvider
import com.yurken.englishtales.ads.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import com.yurken.englishtales.play.*
import androidx.compose.ui.Alignment

class MainActivity : ComponentActivity() {
    private var play: PlayStoreFeatures? = null
    private var dailyPlanRequest by mutableLongStateOf(0L)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        dailyPlanRequest=savedInstanceState?.getLong("daily_plan_request")?:0L
        acceptReminder(intent)
        // The bundled catalog parses in the background while the brand intro is visible.
        lifecycleScope.launch { LearningContent.load(applicationContext) }
        enableEdgeToEdge()
        val ads=if(BuildConfig.ADS_ENABLED) NativeCompletionAds(this) else CompletionAds.None
        val play=PlayStoreFeatures(this).also {this.play=it}
        if(savedInstanceState==null) play.checkForUpdate()
        setContent {
            CompositionLocalProvider(LocalCompletionAds provides ads,LocalPlayStoreFeatures provides play) {EnglishTalesTheme {
                Box(Modifier.fillMaxSize()) {
                    YurkenBrandIntro {
                        if(LearningContent.ready) TalesApp(dailyPlanRequest=dailyPlanRequest)
                        else Box(Modifier.fillMaxSize().background(Color.Black))
                    }
                    if(play.updateReady) UpdateReadyBar(onRestart=play::completeUpdate,modifier=Modifier.align(Alignment.BottomCenter))
                }
            }}
        }
    }
    override fun onDestroy() {
        play?.dispose()
        super.onDestroy()
    }
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        acceptReminder(intent)
    }
    private fun acceptReminder(intent: Intent) {
        intent.getLongExtra("daily_plan_request",0L).takeIf {it>0}?.let {dailyPlanRequest=it}
        intent.removeExtra("daily_plan_request")
    }
    override fun onSaveInstanceState(outState: Bundle) {
        outState.putLong("daily_plan_request",dailyPlanRequest)
        super.onSaveInstanceState(outState)
    }
}
