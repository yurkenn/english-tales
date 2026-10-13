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
import androidx.compose.runtime.CompositionLocalProvider
import com.yurken.englishtales.ads.*

class MainActivity : ComponentActivity() {
    private var dailyPlanRequest by mutableLongStateOf(0L)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        dailyPlanRequest=savedInstanceState?.getLong("daily_plan_request")?:0L
        acceptReminder(intent)
        LearningContent.initialize(applicationContext)
        enableEdgeToEdge()
        val ads=if(BuildConfig.ADS_ENABLED) NativeCompletionAds(this) else CompletionAds.None
        setContent {
            CompositionLocalProvider(LocalCompletionAds provides ads) {EnglishTalesTheme {
                TalesApp(dailyPlanRequest=dailyPlanRequest)
            }}
        }
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
