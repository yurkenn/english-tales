package com.yurken.englishtales.ui

import android.os.SystemClock
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.yurken.englishtales.data.ForegroundLearningClock
import kotlinx.coroutines.delay

/** Checkpoints every five seconds and on pause/disposal; results remain invisible in the UI. */
@Composable
fun rememberActiveLearningTime(sessionId: String,initialMillis: Long,enabled: Boolean,onCheckpoint: (String,Long)->Unit): ForegroundLearningClock {
    var savedMillis by rememberSaveable(sessionId) {mutableLongStateOf(initialMillis)}
    val timer=remember(sessionId) {ForegroundLearningClock(maxOf(savedMillis,initialMillis),SystemClock::elapsedRealtime)}
    val checkpoint by rememberUpdatedState(onCheckpoint)
    val lifecycle=LocalLifecycleOwner.current.lifecycle
    DisposableEffect(timer,lifecycle,enabled) {
        fun save() {savedMillis=timer.pause();checkpoint(sessionId,savedMillis)}
        val observer=LifecycleEventObserver {_,event ->
            if(event==Lifecycle.Event.ON_RESUME && enabled) timer.resume()
            if(event==Lifecycle.Event.ON_PAUSE) save()
        }
        lifecycle.addObserver(observer)
        if(enabled && lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) timer.resume() else timer.pause()
        onDispose {save();lifecycle.removeObserver(observer)}
    }
    LaunchedEffect(timer,enabled) {
        while(enabled) {delay(5000);savedMillis=timer.totalMillis();checkpoint(sessionId,savedMillis)}
    }
    return timer
}
