package com.yurken.englishtales.ui

import androidx.compose.runtime.remember
import androidx.compose.foundation.Canvas
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.ui.res.painterResource
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp

/** App kind -> icon drawn from the B · Oyunlu canvas: round 2-2.6 strokes on a 24 grid, with the flame, star and media marks solid. */
private val icons = mapOf(
    "check" to R.drawable.ic_dc_check,
    "study" to R.drawable.ic_dc_study, "read" to R.drawable.ic_dc_read, "play" to R.drawable.ic_dc_gamepad, "gamepad" to R.drawable.ic_dc_gamepad,
    "profile" to R.drawable.ic_dc_profile, "letters" to R.drawable.ic_dc_letters, "review" to R.drawable.ic_dc_review, "refresh" to R.drawable.ic_dc_review,
    "headphones" to R.drawable.ic_dc_headphones, "volume" to R.drawable.ic_dc_volume, "translate" to R.drawable.ic_dc_translate,
    "bookmark" to R.drawable.ic_dc_bookmark, "cards" to R.drawable.ic_dc_cards, "settings" to R.drawable.ic_dc_settings, "bolt" to R.drawable.ic_dc_bolt,
    "streak" to R.drawable.ic_dc_flame, "flame" to R.drawable.ic_dc_flame, "points" to R.drawable.ic_dc_star, "star" to R.drawable.ic_dc_star,
    "lock" to R.drawable.ic_dc_lock, "search" to R.drawable.ic_dc_search, "back" to R.drawable.ic_dc_back, "prev" to R.drawable.ic_dc_back,
    "next" to R.drawable.ic_dc_next, "chevron" to R.drawable.ic_dc_next, "share" to R.drawable.ic_dc_share, "close" to R.drawable.ic_dc_close,
    "info" to R.drawable.ic_dc_info, "warning" to R.drawable.ic_dc_warning, "download" to R.drawable.ic_dc_download,
    "play_arrow" to R.drawable.ic_dc_play_arrow, "pause" to R.drawable.ic_dc_pause, "clock" to R.drawable.ic_dc_clock,
    "language" to R.drawable.ic_dc_globe, "theme" to R.drawable.ic_dc_moon, "bell" to R.drawable.ic_dc_bell, "mail" to R.drawable.ic_dc_mail,
    "heart" to R.drawable.ic_dc_heart, "forward" to R.drawable.ic_dc_forward)

@Composable
fun ReferenceIcon(kind: String, tint: Color = TaleBlue, modifier: Modifier = Modifier.size(23.dp)) {
    val icon = icons[kind] ?: R.drawable.ic_dc_check
    // Direction glyphs point the other way in Arabic and Urdu.
    val mirror = androidx.compose.ui.platform.LocalLayoutDirection.current == androidx.compose.ui.unit.LayoutDirection.Rtl && kind in setOf("back", "next", "prev", "chevron", "forward")
    Icon(painterResource(icon), contentDescription = null, tint = tint,
        modifier = if (mirror) modifier.then(Modifier.graphicsLayer { scaleX = -1f }) else modifier)
}

@Composable
fun ReferenceProgress(progress: Float, modifier: Modifier = Modifier, color: Color = TaleYellow, track: Color = TaleLine, height: Dp = 6.dp) {
    // Fills smoothly from empty on first show and glides on every change.
    val target=progress.coerceIn(0f,1f)
    val shown=remember {androidx.compose.animation.core.Animatable(0f)}
    androidx.compose.runtime.LaunchedEffect(target) {shown.animateTo(target,androidx.compose.animation.core.tween(TaleMotion.emphasized*2,easing=androidx.compose.animation.core.FastOutSlowInEasing))}
    Box(modifier.semantics {progressBarRangeInfo=ProgressBarRangeInfo(target,0f..1f)}.height(height).background(track,RoundedCornerShape(height/2))) {
        if(shown.value>0f) Box(Modifier.fillMaxWidth(shown.value).height(height).background(color,RoundedCornerShape(height/2)))
    }
}

@Composable
fun TalesBottomBar(selected: Int, onSelect: (Int) -> Unit) {
    val tabs = listOf(stringResource(R.string.calis) to "study", stringResource(R.string.oku_2) to "read", stringResource(R.string.oyna) to "play", stringResource(R.string.profilim) to "profile")
    // Grows with the label instead of clipping it at large font sizes.
    // A light tick confirms a tab change; tapping the open tab again stays silent.
    val haptics=androidx.compose.ui.platform.LocalHapticFeedback.current
    Column(Modifier.fillMaxWidth().background(TaleSurface).navigationBarsPadding()) {
    Box(Modifier.fillMaxWidth().height(2.dp).background(TaleLine))
    Row(Modifier.fillMaxWidth().heightIn(min=64.dp).height(IntrinsicSize.Min)) {
        tabs.forEachIndexed { index,(label,kind) ->
            val active=selected==index
            // The chosen tab's colour glides over and a soft pill grows behind its icon, so the switch reads as motion.
            val tint by androidx.compose.animation.animateColorAsState(if(active) TaleBlue else TaleMuted,androidx.compose.animation.core.tween(TaleMotion.standard),label="tab")
            val pill by androidx.compose.animation.core.animateFloatAsState(if(active) 1f else 0f,TaleMotion.spring,label="pill")
            var pops by remember { androidx.compose.runtime.mutableIntStateOf(0) }
            androidx.compose.runtime.LaunchedEffect(active) { if(active) pops++ }
            val pillColor=TaleMint
            val pillEdge=TaleBlue
            Column(Modifier.weight(1f).fillMaxHeight().semantics { this.selected=active }.clickable(role=Role.Tab) { if(!active) haptics.performHapticFeedback(androidx.compose.ui.hapticfeedback.HapticFeedbackType.SegmentTick); onSelect(index) }.padding(top=6.dp,bottom=6.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(2.dp)) {
                // The open tab sits in a mint tile outlined in blue, like a picked answer.
                Box(Modifier.size(50.dp,34.dp).drawBehind {
                    if(pill>0f) {
                        val w=size.width*(0.6f+0.4f*pill)
                        val a=pill.coerceIn(0f,1f)
                        drawRoundRect(pillColor.copy(alpha=a),Offset((size.width-w)/2f,0f),Size(w,size.height),CornerRadius(12.dp.toPx()))
                        drawRoundRect(pillEdge.copy(alpha=a),Offset((size.width-w)/2f+1.dp.toPx(),1.dp.toPx()),Size(w-2.dp.toPx(),size.height-2.dp.toPx()),
                            CornerRadius(11.dp.toPx()),style=androidx.compose.ui.graphics.drawscope.Stroke(2.dp.toPx()))
                    }
                }.popOn(pops),contentAlignment=Alignment.Center) {
                    ReferenceIcon(kind,tint,Modifier.size(22.dp))
                }
                // Every label is bold on the canvas; 11sp SemiBold is the widest that keeps "Profilim" on one line at double text size.
                Text(label,color=tint,fontSize=11.sp,fontWeight=FontWeight.SemiBold)
            }
        }
    }
    }
}

@Composable
fun ReferenceIconButton(kind: String, label: String, onClick: () -> Unit, tint: Color = TaleBlue) {
    Box(Modifier.size(48.dp).semantics { contentDescription=label }.clickable(role=Role.Button,onClick=onClick),contentAlignment=Alignment.Center) {
        ReferenceIcon(kind,tint,Modifier.size(24.dp))
    }
}

/** Keeps the reference layout on tall screens and makes short/large-text screens scrollable. */
@Composable
fun GameViewport(padding: PaddingValues, minimumHeight: Dp = 450.dp, growForContent: Boolean = false, content: @Composable ColumnScope.() -> Unit) {
    val textAllowance=150.dp*(LocalDensity.current.fontScale-1f).coerceAtLeast(0f)
    BoxWithConstraints(Modifier.fillMaxSize().padding(padding)) {
        val contentHeight=maxOf(maxHeight,minimumHeight+textAllowance)
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            // Decks and matching boards need their text's intrinsic height at large font scales.
            // A fixed height made weighted cards shrink below the height of a wrapped translation.
            val height=if(growForContent) Modifier.heightIn(min=contentHeight).height(IntrinsicSize.Min) else Modifier.height(contentHeight)
            Column(Modifier.fillMaxWidth().then(height).padding(horizontal=16.dp,vertical=6.dp),
                horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(12.dp),content=content)
        }
    }
}

@Composable
fun GameHeader(progress: Float, onExit: () -> Unit) {
    Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(14.dp)) {
        Box(Modifier.size(48.dp).clickable(role=Role.Button,onClick=onExit).contentLabel(stringResource(R.string.alistirmadan_cik)),contentAlignment=Alignment.Center) { Text("×",fontSize=25.sp,color=TaleMuted) }
        ReferenceProgress(progress,Modifier.weight(1f))
    }
}

/** Screen reader label; the text is resolved in the calling composable. */
internal fun Modifier.contentLabel(label: String) = semantics { contentDescription = label }

/** Side-by-side items stack once system text is large (fontScale >= 1.5), so words are not split. */
@Composable
internal fun sideBySide(items: Int) = if(LocalDensity.current.fontScale>=1.5f) 1 else items
