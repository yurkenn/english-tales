package com.yurken.englishtales.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.R

/** How an answer choice looks: untouched, picked, or graded. */
enum class OptionState { Idle, Selected, Correct, Wrong }

/** Grades a choice once the answer is checked: the right one turns green, a wrong pick red, the rest fade back. */
internal fun optionState(selected: Boolean, checked: Boolean, isAnswer: Boolean) = when {
    !checked -> if (selected) OptionState.Selected else OptionState.Idle
    isAnswer -> OptionState.Correct
    selected -> OptionState.Wrong
    else -> OptionState.Idle
}

/**
 * A single answer row shared by every quiz: colors cross-fade between states, a correct answer pops
 * with a check badge and a wrong pick shakes, so the result reads at a glance without relying on color alone.
 */
@Composable
internal fun AnswerOption(label: String, selected: Boolean, state: OptionState, enabled: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier, role: Role = Role.RadioButton) {
    val c = LocalTaleColors.current
    val border by animateColorAsState(when (state) {
        OptionState.Idle -> c.line; OptionState.Selected -> c.blue; OptionState.Correct -> c.success; OptionState.Wrong -> c.error
    }, tween(TaleMotion.standard), label = "border")
    val fill by animateColorAsState(when (state) {
        OptionState.Idle -> c.surface; OptionState.Selected -> c.mint; OptionState.Correct -> c.tileGreen; OptionState.Wrong -> c.error.copy(alpha = 0.10f)
    }, tween(TaleMotion.standard), label = "fill")
    var pops by remember { mutableIntStateOf(0) }
    var shakes by remember { mutableIntStateOf(0) }
    LaunchedEffect(state) { if (state == OptionState.Correct) pops++; if (state == OptionState.Wrong) shakes++ }
    val shape = RoundedCornerShape(16.dp)
    // The playful look: the option sits on a lip in its border color, like a key to press.
    Row(modifier.fillMaxWidth().popOn(pops).shakeOn(shakes).heightIn(min = 56.dp)
        .selectable(selected = selected, enabled = enabled, role = role, onClick = onClick)
        .background(border, shape).padding(bottom = 4.dp)
        .background(fill, shape).border(2.dp, border, shape)
        .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        OptionBadge(state, border)
        Text(label, Modifier.weight(1f), style = MaterialTheme.typography.bodyLarge, fontWeight = if (state == OptionState.Idle) FontWeight.SemiBold else FontWeight.ExtraBold, color = TaleInk)
    }
}

@Composable
private fun OptionBadge(state: OptionState, color: Color) {
    val c = LocalTaleColors.current
    Box(Modifier.size(24.dp), contentAlignment = Alignment.Center) {
        AnimatedContent(state, transitionSpec = { (scaleIn(spring(dampingRatio = 0.5f)) + fadeIn()) togetherWith fadeOut(tween(90)) }, label = "badge") { s ->
            when (s) {
                OptionState.Idle -> Box(Modifier.size(22.dp).border(2.dp, c.line, CircleShape))
                OptionState.Selected -> Box(Modifier.size(22.dp).border(2.dp, color, CircleShape), contentAlignment = Alignment.Center) { Box(Modifier.size(12.dp).background(color, CircleShape)) }
                OptionState.Correct -> Box(Modifier.size(24.dp).background(c.success, CircleShape), contentAlignment = Alignment.Center) { ReferenceIcon("check", c.surface, Modifier.size(15.dp)) }
                OptionState.Wrong -> Box(Modifier.size(24.dp).background(c.error, CircleShape), contentAlignment = Alignment.Center) { ReferenceIcon("close", c.surface, Modifier.size(13.dp)) }
            }
        }
    }
}

/**
 * The verdict after "Kontrol et": a tinted panel that slides up with an icon, a short title and the explanation.
 * It is a polite live region, so TalkBack reads the result without moving focus.
 */
@Composable
internal fun AnswerFeedback(visible: Boolean, correct: Boolean, message: String, modifier: Modifier = Modifier) {
    val c = LocalTaleColors.current
    // The next question resets its answer before this panel's exit animation finishes.
    // Keep the last visible verdict and explanation together until the panel has left.
    var lastFeedback by remember { mutableStateOf(correct to message) }
    val feedback = if (visible) correct to message else lastFeedback
    SideEffect { if (visible) lastFeedback = feedback }
    AnimatedVisibility(visible, modifier,
        enter = fadeIn(tween(TaleMotion.quick)) + slideInVertically(spring(dampingRatio = 0.75f, stiffness = Spring.StiffnessMediumLow)) { it / 2 } + expandVertically(tween(TaleMotion.standard)),
        exit = fadeOut(tween(TaleMotion.quick)) + shrinkVertically(tween(TaleMotion.quick))) {
        val (correct, message) = feedback
        val accent = if (correct) c.success else c.error
        var pops by remember { mutableIntStateOf(0) }
        val haptics = LocalHapticFeedback.current
        // A short confirm or reject tick lets the verdict land even before the eyes reach the panel.
        LaunchedEffect(Unit) { pops++; haptics.performHapticFeedback(if (correct) HapticFeedbackType.Confirm else HapticFeedbackType.Reject) }
        Row(Modifier.fillMaxWidth().background(if (correct) c.tileGreen else c.error.copy(alpha = 0.10f), RoundedCornerShape(16.dp))
            .border(1.5.dp, accent.copy(alpha = 0.5f), RoundedCornerShape(16.dp)).padding(14.dp)
            .semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(Modifier.size(36.dp).popOn(pops).background(accent, CircleShape), contentAlignment = Alignment.Center) {
                ReferenceIcon(if (correct) "check" else "close", c.surface, Modifier.size(if (correct) 20.dp else 16.dp))
            }
            // Messages that already open with the verdict ("Doğru! …") are shown whole instead of repeating it.
            val title = stringResource(if (correct) R.string.feedback_correct_title else R.string.feedback_wrong_title)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                if (message.startsWith(title)) Text(message, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = accent)
                else {
                    Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = accent)
                    Text(message, style = MaterialTheme.typography.bodyMedium, color = TaleInk)
                }
            }
        }
    }
}

/** Rounded quiz progress that glides to each new question instead of jumping. */
@Composable
internal fun QuizProgress(fraction: Float, modifier: Modifier = Modifier) {
    val value by animateFloatAsState(fraction.coerceIn(0f, 1f), tween(TaleMotion.emphasized, easing = FastOutSlowInEasing), label = "quiz")
    androidx.compose.material3.LinearProgressIndicator(progress = { value }, modifier = modifier.fillMaxWidth().height(14.dp),
        color = TaleGreen, trackColor = TaleLine, strokeCap = androidx.compose.ui.graphics.StrokeCap.Round, gapSize = 0.dp, drawStopIndicator = {})
}

/** The top of a quiz game: exit button, "question n / total" and the combo badge, with the progress bar below. */
@Composable
internal fun QuizHeader(index: Int, total: Int, exitLabel: String, onExit: () -> Unit, progressLabel: Int = R.string.gap_progress) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        ReferenceIconButton("back", exitLabel, onExit)
        Text(stringResource(progressLabel, index + 1, total), modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
        ComboBadge()
    }
    QuizProgress(index.toFloat() / total)
}

/** Labels of the check button: before checking, after checking, and after the last question is checked. */
internal data class QuizButtonLabels(val check: Int, val next: Int, val finish: Int)

internal val GapButtonLabels = QuizButtonLabels(R.string.gap_check, R.string.gap_next, R.string.gap_finish)

/** The "check, then next" button of a quiz game; it turns green once a correct answer is checked. */
@Composable
internal fun QuizCheckButton(enabled: Boolean, checked: Boolean, correct: Boolean, last: Boolean, onClick: () -> Unit, labels: QuizButtonLabels = GapButtonLabels) {
    // A chunky go button: green to check and continue, the success color after a right answer, grey until there is an answer.
    val face = if (!enabled) TaleLine else if (checked && correct) TaleSuccess else TaleGreen
    val ink = if (!enabled) TaleMuted else if (checked && correct) TaleSurface else TaleOnGreen
    ChunkyBox(face, Modifier.fillMaxWidth().heightIn(min = 52.dp), RoundedCornerShape(16.dp), depth = 4.dp, contentAlignment = Alignment.Center, onClick = onClick, enabled = enabled) {
        Text(stringResource(if (!checked) labels.check else if (last) labels.finish else labels.next), Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            color = ink, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
    }
}

/** The large round play/stop button of the listening games, with the narrator's preparing and error notes below it. */
@Composable
internal fun NarrationPlayButton(narrator: Narrator, label: String, onToggle: () -> Unit) {
    val playing = narrator.speaking || narrator.preparing
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(Modifier.size(88.dp).pulseWhile(playing).background(TaleBlue, CircleShape).contentLabel(label)
            .clickable(role = Role.Button, onClick = onToggle),
            contentAlignment = Alignment.Center) {
            if (playing) Text("Ⅱ", color = TaleOnBlue, style = MaterialTheme.typography.headlineSmall)
            else ReferenceIcon("volume", TaleOnBlue, Modifier.size(36.dp))
        }
        if (narrator.preparing) Text(stringResource(R.string.listen_preparing), color = TaleMuted, style = MaterialTheme.typography.bodySmall)
        narrator.error?.let { Text(it, color = TaleMuted, style = MaterialTheme.typography.bodySmall) }
    }
}
