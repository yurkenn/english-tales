package com.yurken.englishtales.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.yurken.englishtales.R
import kotlinx.coroutines.delay

/** What an in-app alert is about; drives its color, icon and how long it stays. */
enum class TaleAlertKind { Success, Info, Warning, Error, Reward }

@Immutable
data class TaleAlert(val message: String, val kind: TaleAlertKind = TaleAlertKind.Info, val id: Long = System.nanoTime())

/**
 * Short, self-dismissing alerts at the top of the app: a success, a reward or something that went wrong.
 * The newest alert replaces the one on screen; errors stay a little longer.
 */
@Stable
class TaleAlerts {
    var current by mutableStateOf<TaleAlert?>(null)
        private set
    fun show(message: String, kind: TaleAlertKind = TaleAlertKind.Info) { current = TaleAlert(message, kind) }
    fun success(message: String) = show(message, TaleAlertKind.Success)
    fun error(message: String) = show(message, TaleAlertKind.Error)
    fun reward(message: String) = show(message, TaleAlertKind.Reward)
    fun dismiss() { current = null }
}

/** Screens outside an alert host (tests, previews) get a working instance that nobody draws. */
val LocalTaleAlerts = staticCompositionLocalOf { TaleAlerts() }

private data class AlertLook(val fill: Color, val accent: Color, val icon: String)

@Composable
private fun TaleAlertKind.look(): AlertLook {
    val c = LocalTaleColors.current
    return when(this) {
        TaleAlertKind.Success -> AlertLook(c.tileGreen, c.success, "check")
        TaleAlertKind.Info -> AlertLook(c.tileBlue, c.blue, "info")
        TaleAlertKind.Warning -> AlertLook(c.tileYellow, c.gold, "warning")
        TaleAlertKind.Error -> AlertLook(c.surface, c.error, "warning")
        TaleAlertKind.Reward -> AlertLook(c.tilePurple, c.purple, "star")
    }
}

/** Hosts [content] and draws the current alert above it, springing down from the status bar. */
@Composable
fun TaleAlertHost(alerts: TaleAlerts = remember { TaleAlerts() }, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalTaleAlerts provides alerts) {
        Box(Modifier.fillMaxSize()) {
            content()
            val alert = alerts.current
            LaunchedEffect(alert?.id) {
                if (alert != null) {
                    delay(if (alert.kind == TaleAlertKind.Error) 4500 else 2800)
                    if (alerts.current?.id == alert.id) alerts.dismiss()
                }
            }
            // The last alert keeps rendering while it slides away.
            var shown by remember { mutableStateOf<TaleAlert?>(null) }
            if (alert != null) shown = alert
            AnimatedVisibility(alert != null, Modifier.align(Alignment.TopCenter).statusBarsPadding().padding(horizontal = 16.dp, vertical = 8.dp),
                enter = slideInVertically(spring(dampingRatio = 0.72f, stiffness = Spring.StiffnessMedium)) { -it * 2 } + fadeIn(tween(TaleMotion.quick)),
                exit = slideOutVertically(tween(TaleMotion.standard)) { -it * 2 } + fadeOut(tween(TaleMotion.quick))) {
                shown?.let { AlertCard(it, alerts::dismiss) }
            }
        }
    }
}

@Composable
private fun AlertCard(alert: TaleAlert, onDismiss: () -> Unit) {
    val look = alert.kind.look()
    val shape = RoundedCornerShape(18.dp)
    val dismissLabel = stringResource(R.string.alert_dismiss)
    Row(Modifier.widthIn(max = 520.dp).fillMaxWidth()
        .shadow(12.dp, shape, ambientColor = Color.Black.copy(alpha = 0.18f), spotColor = Color.Black.copy(alpha = 0.22f))
        .background(look.fill, shape).border(1.5.dp, look.accent.copy(alpha = 0.45f), shape)
        .clickable(onClickLabel = dismissLabel, onClick = onDismiss).padding(horizontal = 14.dp, vertical = 12.dp)
        .semantics(mergeDescendants = true) { liveRegion = if (alert.kind == TaleAlertKind.Error) LiveRegionMode.Assertive else LiveRegionMode.Polite },
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        val still = reduceMotion()
        val badge = remember(alert.id) { Animatable(if (still) 1f else 0.3f) }
        LaunchedEffect(alert.id) { badge.animateTo(1f, spring(dampingRatio = 0.42f, stiffness = Spring.StiffnessMedium)) }
        Box(Modifier.size(32.dp).graphicsLayer { scaleX = badge.value; scaleY = badge.value }.background(look.accent, CircleShape), contentAlignment = Alignment.Center) {
            ReferenceIcon(look.icon, LocalTaleColors.current.surface, Modifier.size(17.dp))
        }
        Text(alert.message, Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = TaleInk)
    }
}

/**
 * The app's dialog: a rounded card that springs in, with an optional mascot above it.
 * [destructive] paints the confirm action in the error color.
 */
@Composable
internal fun TaleDialog(
    title: String,
    text: String?,
    confirmLabel: String,
    onConfirm: () -> Unit,
    onDismissRequest: () -> Unit,
    dismissLabel: String? = null,
    onDismiss: () -> Unit = onDismissRequest,
    destructive: Boolean = false,
    mood: MascotMood? = null,
    body: (@Composable ColumnScope.() -> Unit)? = null,
) {
    Dialog(onDismissRequest, DialogProperties(usePlatformDefaultWidth = false)) {
        val still = reduceMotion()
        val entrance = remember { Animatable(if (still) 1f else 0.86f) }
        LaunchedEffect(Unit) { entrance.animateTo(1f, spring(dampingRatio = 0.66f, stiffness = Spring.StiffnessMediumLow)) }
        val centered = mood != null
        Box(Modifier.padding(horizontal = 24.dp).widthIn(max = 420.dp).fillMaxWidth()
            .graphicsLayer { scaleX = entrance.value; scaleY = entrance.value; alpha = ((entrance.value - 0.86f) / 0.14f).coerceIn(0f, 1f) }
            .semantics { paneTitle = title }) {
            Surface(Modifier.fillMaxWidth().padding(top = if (centered) 64.dp else 0.dp), shape = RoundedCornerShape(26.dp), color = TaleSurface, tonalElevation = 0.dp, shadowElevation = 8.dp) {
                Column(Modifier.padding(start = 24.dp, end = 24.dp, bottom = 20.dp, top = if (centered) 56.dp else 24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = TaleInk,
                        textAlign = if (centered) TextAlign.Center else TextAlign.Start, modifier = Modifier.fillMaxWidth())
                    text?.let { Text(it, style = MaterialTheme.typography.bodyLarge, color = TaleMuted,
                        textAlign = if (centered) TextAlign.Center else TextAlign.Start, modifier = Modifier.fillMaxWidth()) }
                    body?.invoke(this)
                    Spacer(Modifier.height(4.dp))
                    Button(onClick = onConfirm, modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp), shape = RoundedCornerShape(14.dp),
                        colors = if (destructive) ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error, contentColor = TaleSurface) else ButtonDefaults.buttonColors()) {
                        Text(confirmLabel, fontWeight = FontWeight.Bold)
                    }
                    dismissLabel?.let { TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) { Text(it) } }
                }
            }
            if (centered) Box(Modifier.align(Alignment.TopCenter).size(120.dp).background(TaleMint, CircleShape).border(4.dp, TaleSurface, CircleShape), contentAlignment = Alignment.BottomCenter) {
                TalesMascot(mood!!, Modifier.size(108.dp), animate = true)
            }
        }
    }
}

/** An inline message that stays on screen (sync state, account results, a failed save) in the alert colors. */
@Composable
internal fun TaleNotice(text: String, kind: TaleAlertKind = TaleAlertKind.Info, modifier: Modifier = Modifier, action: (@Composable () -> Unit)? = null) {
    val look = kind.look()
    AnimatedVisibility(text.isNotBlank(), modifier, enter = fadeIn(tween(TaleMotion.standard)) + expandVertically(tween(TaleMotion.standard)), exit = fadeOut() + shrinkVertically()) {
        Row(Modifier.fillMaxWidth().background(look.fill, RoundedCornerShape(14.dp)).border(1.dp, look.accent.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp)
            .semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(Modifier.size(24.dp).background(look.accent, CircleShape), contentAlignment = Alignment.Center) {
                ReferenceIcon(look.icon, LocalTaleColors.current.surface, Modifier.size(13.dp))
            }
            Text(text, Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium, color = TaleInk)
            action?.invoke()
        }
    }
}
