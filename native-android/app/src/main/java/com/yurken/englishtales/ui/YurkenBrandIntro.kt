package com.yurken.englishtales.ui

import androidx.activity.compose.LocalActivity
import androidx.core.view.WindowCompat
import androidx.compose.ui.platform.LocalView
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.R
import kotlinx.coroutines.delay

/** A reusable publisher signature, independent of the app's onboarding preferences. */
@Composable
fun YurkenBrandIntro(content: @Composable () -> Unit) {
    var finished by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(1100)
        finished = true
    }
    if (finished) content() else YurkenBrandScreen(onContinue = { finished = true })
}

@Composable
internal fun YurkenBrandScreen(onContinue: () -> Unit) {
    val activity = LocalActivity.current
    val view = LocalView.current
    DisposableEffect(activity, view) {
        val controller = activity?.window?.let { WindowCompat.getInsetsController(it, view) }
        val lightStatus = controller?.isAppearanceLightStatusBars ?: false
        val lightNavigation = controller?.isAppearanceLightNavigationBars ?: false
        controller?.isAppearanceLightStatusBars = false
        controller?.isAppearanceLightNavigationBars = false
        onDispose {
            controller?.isAppearanceLightStatusBars = lightStatus
            controller?.isAppearanceLightNavigationBars = lightNavigation
        }
    }
    Box(
        Modifier.fillMaxSize().background(Color.Black)
            .clickable(onClickLabel = "Uygulamaya geç", onClick = onContinue),
        contentAlignment = Alignment.Center
    ) {
        Image(
            painterResource(R.drawable.yurken_wordmark),
            contentDescription = "Yurken",
            modifier = Modifier.padding(horizontal = 40.dp).widthIn(max = 192.dp).fillMaxWidth().aspectRatio(112f / 87f)
        )
    }
}
