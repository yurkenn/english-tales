package com.yurken.englishtales.ui

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.Spring
import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.R

/** The lip under a chunky surface: the face color a little darker, or the border color on outlined cards. */
internal fun chunkEdge(face: Color) = lerp(face, Color.Black, 0.22f)

/**
 * The playful look's block: a face sitting on a darker lip, so cards and buttons read as things to press.
 * A pressed block sinks onto its lip instead of shrinking.
 */
@Composable
internal fun ChunkyBox(color: Color, modifier: Modifier = Modifier, shape: Shape = RoundedCornerShape(22.dp), depth: Dp = 5.dp,
    border: Color? = null, edge: Color = border ?: chunkEdge(color), contentAlignment: Alignment = Alignment.TopStart,
    onClick: (() -> Unit)? = null, enabled: Boolean = true, content: @Composable BoxScope.() -> Unit) {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val still = reduceMotion()
    val sink by animateDpAsState(if (pressed && onClick != null && enabled) depth * 0.8f else 0.dp,
        if (still) spring(stiffness = Spring.StiffnessHigh) else spring(dampingRatio = 0.6f, stiffness = Spring.StiffnessMedium), label = "sink")
    val clickable = onClick?.let { Modifier.clickable(interactionSource = source, indication = LocalIndication.current, enabled = enabled, role = Role.Button, onClick = it) } ?: Modifier
    Box(modifier.then(clickable), propagateMinConstraints = true) {
        Box(Modifier.matchParentSize().padding(top = depth).background(edge, shape))
        Box(Modifier.padding(top = sink, bottom = depth - sink).clip(shape).background(color, shape)
            .then(if (border != null) Modifier.border(2.dp, border, shape) else Modifier),
            contentAlignment = contentAlignment, content = content)
    }
}

/** A full-width "go" button of the playful look. */
@Composable
internal fun ChunkyButton(label: String, onClick: () -> Unit, modifier: Modifier = Modifier, color: Color = TaleGreen, onColor: Color = TaleOnGreen,
    enabled: Boolean = true, border: Color? = null) {
    ChunkyBox(color, modifier.heightIn(min = 52.dp), RoundedCornerShape(16.dp), depth = 4.dp, border = border, contentAlignment = Alignment.Center,
        onClick = onClick, enabled = enabled) {
        Text(label, Modifier.padding(horizontal = 16.dp, vertical = 12.dp), color = onColor, style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center)
    }
}

/** A rounded stat in the home header; a tap explains it like the other learning indicators. */
@Composable
internal fun StatPill(value: String, title: String, explanation: String, caption: String, icon: @Composable () -> Unit) {
    var open by remember { mutableStateOf(false) }
    var last by remember { mutableStateOf(value) }
    var bumps by remember { mutableIntStateOf(0) }
    LaunchedEffect(value) { if (value != last) { bumps++; last = value } }
    Row(Modifier.minimumInteractiveComponentSize().contentLabel(stringResource(R.string.bilgi, title, value)).clip(RoundedCornerShape(22.dp))
        .clickable(role = Role.Button) { open = true }.background(TaleSurface, RoundedCornerShape(22.dp)).border(2.dp, TaleLine, RoundedCornerShape(22.dp))
        .padding(horizontal = 12.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(Modifier.popOn(bumps)) { icon() }
        Text(value, fontFamily = TaleDisplay, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, color = TaleInk, modifier = Modifier.popOn(bumps))
        Text(caption, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TaleMuted, maxLines = 1)
    }
    if (open) TaleDialog(title, explanation, stringResource(R.string.anladim), onConfirm = { open = false }, onDismissRequest = { open = false }, mood = MascotMood.Welcome)
}
