package com.yurken.englishtales.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.R
import com.yurken.englishtales.data.ReadingPlacement

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun PlacementScreen(onUseLevel: (String) -> Unit, onCancel: () -> Unit, fromSettings: Boolean = false) {
    var started by rememberSaveable { mutableStateOf(false) }
    var answers by rememberSaveable(stateSaver = listSaver<List<Int>, Int>(save = { it }, restore = { it })) {
        mutableStateOf(emptyList())
    }
    var selected by rememberSaveable { mutableIntStateOf(-2) }
    var confirmExit by rememberSaveable { mutableStateOf(false) }
    val complete = answers.size == ReadingPlacement.questions.size
    fun exit() { if (started && !complete) confirmExit = true else onCancel() }
    BackHandler { exit() }

    Column(Modifier.fillMaxSize().background(TaleBackground).statusBarsPadding().navigationBarsPadding()) {
        // During the test the top bar is the game header: close, progress and the question count.
        if (started && !complete) Row(Modifier.fillMaxWidth().height(56.dp).padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            IconButton(onClick = ::exit) { Icon(Icons.Default.Close, stringResource(R.string.placement_cancel_confirm), tint = TaleMuted) }
            QuizProgress(answers.size.toFloat() / ReadingPlacement.questions.size, Modifier.weight(1f))
            Text("${answers.size + 1}/${ReadingPlacement.questions.size}", fontWeight = FontWeight.ExtraBold, color = TaleMuted, modifier = Modifier.padding(end = 12.dp))
        } else SimpleTopBar(stringResource(R.string.placement_title), ::exit)
        key(started, answers.size) {
            Column(
                Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                when {
                    !started -> {
                        TalesMascot(MascotMood.Thinking, Modifier.size(120.dp).align(Alignment.CenterHorizontally))
                        Text(stringResource(R.string.placement_intro), style = MaterialTheme.typography.titleLarge, fontFamily = TaleDisplay, fontWeight = FontWeight.ExtraBold)
                        Text(stringResource(R.string.placement_explanation), style = MaterialTheme.typography.bodyLarge)
                        Text(stringResource(R.string.placement_scope), style = MaterialTheme.typography.bodyMedium, color = TaleMuted)
                        ChunkyButton(stringResource(R.string.placement_start), { started = true }, Modifier.fillMaxWidth())
                        TextButton(onClick = onCancel, modifier = Modifier.fillMaxWidth()) { Text(stringResource(R.string.placement_manual)) }
                    }
                    complete -> {
                        val result = remember(answers) { ReadingPlacement.recommend(answers) }
                        TalesMascot(MascotMood.Celebrate, Modifier.size(120.dp).align(Alignment.CenterHorizontally), animate = true)
                        Text(stringResource(R.string.placement_result, result.level), style = MaterialTheme.typography.headlineSmall, fontFamily = TaleDisplay, fontWeight = FontWeight.ExtraBold)
                        Text(stringResource(R.string.placement_result_description), style = MaterialTheme.typography.bodyLarge)
                        ReadingPlacement.levels.forEach { level ->
                            Text(stringResource(R.string.placement_score, level, result.correctByLevel.getValue(level)))
                        }
                        Text(stringResource(R.string.placement_scope), style = MaterialTheme.typography.bodyMedium, color = TaleMuted)
                        if (fromSettings) Text(stringResource(R.string.placement_settings_hint), style = MaterialTheme.typography.bodyMedium, color = TaleMuted)
                        ChunkyButton(stringResource(R.string.placement_use, result.level), { onUseLevel(result.level) }, Modifier.fillMaxWidth())
                        TextButton(onClick = onCancel, modifier = Modifier.fillMaxWidth()) { Text(stringResource(R.string.placement_manual)) }
                    }
                    else -> {
                        val question = ReadingPlacement.questions[answers.size]
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(question.level, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp, color = TaleOnBlue,
                                modifier = Modifier.background(TaleBlue, RoundedCornerShape(8.dp)).padding(horizontal = 8.dp, vertical = 3.dp))
                            Text(stringResource(R.string.placement_progress, answers.size + 1, ReadingPlacement.questions.size), fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TaleMuted)
                        }
                        Text(stringResource(if (question.prompt.isEmpty()) R.string.placement_complete_sentence else R.string.placement_read_question),
                            fontFamily = TaleDisplay, fontSize = 22.sp, lineHeight = 26.sp, fontWeight = FontWeight.ExtraBold)
                        ChunkyBox(TaleSurface, Modifier.fillMaxWidth(), RoundedCornerShape(22.dp), depth = 5.dp, border = TaleLine) {
                            Text(question.passage, fontFamily = TaleDisplay, fontSize = if (question.passage.length > 60) 20.sp else 26.sp,
                                lineHeight = if (question.passage.length > 60) 26.sp else 32.sp, fontWeight = FontWeight.Bold, modifier = Modifier.fillMaxWidth().padding(20.dp))
                        }
                        if (question.prompt.isNotEmpty()) Text(question.prompt, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold)
                        // Short answers sit two by two as big keys; sentences and large text get a row each.
                        val pairs = question.options.all { it.length <= 12 }
                        FlowRow(Modifier.fillMaxWidth().selectableGroup(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp),
                            maxItemsInEachRow = if (pairs) sideBySide(2) else 1) {
                            question.options.forEachIndexed { i, label ->
                                AnswerKey(label, selected == i, big = pairs, modifier = Modifier.weight(1f).appearIn(i)) { selected = i }
                            }
                        }
                        Spacer(Modifier.height(4.dp))
                        FlowRow(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp),
                            maxItemsInEachRow = sideBySide(2)) {
                            AnswerKey(stringResource(R.string.placement_unknown), selected == -1, big = false, modifier = Modifier.weight(1f)) { selected = -1 }
                            val ready = selected != -2
                            ChunkyButton(stringResource(if (answers.size == ReadingPlacement.questions.lastIndex) R.string.placement_finish else R.string.placement_next),
                                { answers = answers + selected; selected = -2 }, Modifier.weight(1f),
                                color = if (ready) TaleGreen else TaleLine, onColor = if (ready) TaleOnGreen else TaleMuted, enabled = ready)
                        }
                    }
                }
            }
        }
    }
    if (confirmExit) TaleDialog(
        title = stringResource(R.string.placement_cancel_title),
        text = stringResource(R.string.placement_cancel_message),
        confirmLabel = stringResource(R.string.placement_cancel_keep),
        onConfirm = { confirmExit = false },
        onDismissRequest = { confirmExit = false },
        dismissLabel = stringResource(R.string.placement_cancel_confirm),
        onDismiss = onCancel,
        mood = MascotMood.Support,
    )
}

/** A chunky answer key of the test; the picked one turns blue. */
@Composable
private fun AnswerKey(label: String, selected: Boolean, big: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val shape = RoundedCornerShape(18.dp)
    Box(modifier.heightIn(min = 56.dp).background(if (selected) TaleBlue else TaleLine, shape).padding(bottom = 5.dp)
        .background(if (selected) TaleMint else TaleSurface, shape).border(2.dp, if (selected) TaleBlue else TaleLine, shape).clip(shape)
        .selectable(selected, role = Role.RadioButton, onClick = onClick).padding(horizontal = 14.dp, vertical = 12.dp), contentAlignment = Alignment.Center) {
        Text(label, fontFamily = if (big) TaleDisplay else TaleBody, fontSize = if (big) 22.sp else 16.sp, fontWeight = FontWeight.ExtraBold,
            color = if (selected) TaleBlue else TaleInk, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
    }
}
