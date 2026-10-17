package com.yurken.englishtales

import android.os.Bundle
import android.content.Context
import android.content.Intent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.yurken.englishtales.data.LearningContent
import com.yurken.englishtales.data.StoryLinks
import com.yurken.englishtales.ui.StoryLinkRequest
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
    override fun attachBaseContext(newBase: Context) = super.attachBaseContext(AppLanguage.wrap(newBase))
    private var play: PlayStoreFeatures? = null
    private var dailyPlanRequest by mutableLongStateOf(0L)
    private var storyLinkRequest by mutableStateOf<StoryLinkRequest?>(null)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        dailyPlanRequest=savedInstanceState?.getLong("daily_plan_request")?:0L
        acceptReminder(intent)
        // A recreated activity gets its original intent again; the shared link was already opened then.
        if(savedInstanceState==null) acceptStoryLink(intent)
        // The bundled catalog parses in the background while the brand intro is visible.
        lifecycleScope.launch { LearningContent.load(applicationContext) }
        enableEdgeToEdge()
        val ads=if(BuildConfig.ADS_ENABLED) NativeCompletionAds(this) else CompletionAds.None
        val play=PlayStoreFeatures(this).also {this.play=it}
        setContent {
            CompositionLocalProvider(LocalCompletionAds provides ads,LocalPlayStoreFeatures provides play) {EnglishTalesTheme {
                Box(Modifier.fillMaxSize()) {
                    YurkenBrandIntro {
                        if(LearningContent.ready) TalesApp(dailyPlanRequest=dailyPlanRequest,storyLinkRequest=storyLinkRequest,onStoryLinkHandled={if(storyLinkRequest==it) storyLinkRequest=null})
                        else Box(Modifier.fillMaxSize().background(Color.Black))
                    }
                    if(play.updateReady) UpdateReadyBar(onRestart=play::completeUpdate,modifier=Modifier.align(Alignment.BottomCenter))
                }
            }}
        }
    }
    override fun onResume() {
        super.onResume()
        play?.checkForUpdate()
        lifecycleScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            com.yurken.englishtales.analytics.ProductAnalytics.get(applicationContext).onForeground()
        }
    }
    override fun onStop() {
        super.onStop()
        // The learner returns to the home screen; show the progress they just made.
        lifecycleScope.launch {com.yurken.englishtales.widget.LearningWidget.refresh(applicationContext)}
    }
    override fun onDestroy() {
        play?.dispose()
        super.onDestroy()
    }
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        acceptReminder(intent)
        acceptStoryLink(intent)
    }
    private fun acceptStoryLink(intent: Intent) {
        if(intent.action!=Intent.ACTION_VIEW) return
        StoryLinks.storyId(intent.dataString)?.let {storyLinkRequest=StoryLinkRequest(it,System.currentTimeMillis())}
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
