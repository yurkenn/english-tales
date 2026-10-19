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

/** App kind -> Phosphor icon. Feature icons are duotone, navigation glyphs regular, small status marks bold; a selected tab is drawn filled. */
private val duotoneIcons = mapOf(
    "study" to R.drawable.ic_ph_graduation_cap_duotone, "read" to R.drawable.ic_ph_book_open_text_duotone,
    "play" to R.drawable.ic_ph_game_controller_duotone, "gamepad" to R.drawable.ic_ph_game_controller_duotone,
    "letters" to R.drawable.ic_ph_text_aa_duotone, "profile" to R.drawable.ic_ph_user_circle_duotone,
    "review" to R.drawable.ic_ph_arrows_clockwise_duotone, "headphones" to R.drawable.ic_ph_headphones_duotone,
    "volume" to R.drawable.ic_ph_speaker_high_duotone, "translate" to R.drawable.ic_ph_translate_duotone,
    "bookmark" to R.drawable.ic_ph_bookmark_simple_duotone, "cards" to R.drawable.ic_ph_cards_duotone,
    "settings" to R.drawable.ic_ph_gear_six_duotone, "bolt" to R.drawable.ic_ph_lightning_duotone,
    "streak" to R.drawable.ic_ph_fire_duotone, "flame" to R.drawable.ic_ph_fire_duotone,
    "points" to R.drawable.ic_ph_star_four_duotone, "star" to R.drawable.ic_ph_star_duotone,
    "lock" to R.drawable.ic_ph_lock_simple_duotone)
private val regularIcons = mapOf(
    "search" to R.drawable.ic_ph_magnifying_glass_regular, "back" to R.drawable.ic_ph_arrow_left_regular,
    "share" to R.drawable.ic_ph_share_network_regular, "close" to R.drawable.ic_ph_x_bold,
    "info" to R.drawable.ic_ph_info_bold, "warning" to R.drawable.ic_ph_exclamation_mark_bold,
    "next" to R.drawable.ic_ph_caret_right_regular, "prev" to R.drawable.ic_ph_caret_left_regular,
    "download" to R.drawable.ic_ph_download_simple_regular, "refresh" to R.drawable.ic_ph_arrow_clockwise_regular,
    "play_arrow" to R.drawable.ic_ph_play_fill, "pause" to R.drawable.ic_ph_pause_fill)
private val filledIcons = mapOf(
    "study" to R.drawable.ic_ph_graduation_cap_fill, "read" to R.drawable.ic_ph_book_open_text_fill,
    "play" to R.drawable.ic_ph_game_controller_fill, "profile" to R.drawable.ic_ph_user_circle_fill)

@Composable
fun ReferenceIcon(kind: String, tint: Color = TaleBlue, modifier: Modifier = Modifier.size(23.dp), filled: Boolean = false) {
    val icon = (if (filled) filledIcons[kind] else null) ?: duotoneIcons[kind] ?: regularIcons[kind] ?: R.drawable.ic_ph_check_bold
    // Direction glyphs point the other way in Arabic and Urdu.
    val mirror = androidx.compose.ui.platform.LocalLayoutDirection.current == androidx.compose.ui.unit.LayoutDirection.Rtl && kind in setOf("back", "next", "prev", "chevron")
    Icon(painterResource(icon), contentDescription = null, tint = tint,
        modifier = if (mirror) modifier.then(Modifier.graphicsLayer { scaleX = -1f }) else modifier)
}

@Composable
fun ReferenceProgress(progress: Float, modifier: Modifier = Modifier, color: Color = TaleYellow) {
    // Fills smoothly from empty on first show and glides on every change.
    val target=progress.coerceIn(0f,1f)
    val shown=remember {androidx.compose.animation.core.Animatable(0f)}
    androidx.compose.runtime.LaunchedEffect(target) {shown.animateTo(target,androidx.compose.animation.core.tween(TaleMotion.emphasized*2,easing=androidx.compose.animation.core.FastOutSlowInEasing))}
    Box(modifier.semantics {progressBarRangeInfo=ProgressBarRangeInfo(target,0f..1f)}.height(6.dp).background(TaleLine,RoundedCornerShape(4.dp))) {
        if(shown.value>0f) Box(Modifier.fillMaxWidth(shown.value).height(6.dp).background(color,RoundedCornerShape(4.dp)))
    }
}

@Composable
fun TalesBottomBar(selected: Int, onSelect: (Int) -> Unit) {
    val tabs = listOf(stringResource(R.string.calis) to "study", stringResource(R.string.oku_2) to "read", stringResource(R.string.oyna) to "play", stringResource(R.string.profilim) to "profile")
    // Grows with the label instead of clipping it at large font sizes.
    // A light tick confirms a tab change; tapping the open tab again stays silent.
    val haptics=androidx.compose.ui.platform.LocalHapticFeedback.current
    Column(Modifier.fillMaxWidth().background(TaleSurface).navigationBarsPadding()) {
    Box(Modifier.fillMaxWidth().height(1.dp).background(TaleLine))
    Row(Modifier.fillMaxWidth().heightIn(min=56.dp).height(IntrinsicSize.Min)) {
        tabs.forEachIndexed { index,(label,kind) ->
            val active=selected==index
            // The chosen tab's colour glides over and a soft pill grows behind its icon, so the switch reads as motion.
            val tint by androidx.compose.animation.animateColorAsState(if(active) TaleBlue else TaleMuted,androidx.compose.animation.core.tween(TaleMotion.standard),label="tab")
            val pill by androidx.compose.animation.core.animateFloatAsState(if(active) 1f else 0f,TaleMotion.spring,label="pill")
            var pops by remember { androidx.compose.runtime.mutableIntStateOf(0) }
            androidx.compose.runtime.LaunchedEffect(active) { if(active) pops++ }
            val pillColor=LocalTaleColors.current.tileBlue
            Column(Modifier.weight(1f).fillMaxHeight().semantics { this.selected=active }.clickable(role=Role.Tab) { if(!active) haptics.performHapticFeedback(androidx.compose.ui.hapticfeedback.HapticFeedbackType.SegmentTick); onSelect(index) }.padding(top=6.dp,bottom=6.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(2.dp)) {
                Box(Modifier.size(52.dp,28.dp).drawBehind {
                    if(pill>0f) {
                        val w=size.width*(0.5f+0.5f*pill)
                        drawRoundRect(pillColor.copy(alpha=pill.coerceIn(0f,1f)),Offset((size.width-w)/2f,0f),Size(w,size.height),CornerRadius(size.height/2f))
                    }
                }.popOn(pops),contentAlignment=Alignment.Center) {
                    ReferenceIcon(kind,tint,Modifier.size(22.dp),filled=active)
                }
                Text(label,color=tint,fontSize=11.sp,fontWeight=if(active) FontWeight.SemiBold else FontWeight.Normal)
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
fun GameViewport(padding: PaddingValues, minimumHeight: Dp = 450.dp, content: @Composable ColumnScope.() -> Unit) {
    val textAllowance=150.dp*(LocalDensity.current.fontScale-1f).coerceAtLeast(0f)
    BoxWithConstraints(Modifier.fillMaxSize().padding(padding)) {
        val contentHeight=maxOf(maxHeight,minimumHeight+textAllowance)
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            Column(Modifier.fillMaxWidth().height(contentHeight).padding(horizontal=16.dp,vertical=6.dp),
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
