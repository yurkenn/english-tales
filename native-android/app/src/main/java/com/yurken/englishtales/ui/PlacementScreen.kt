package com.yurken.englishtales.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
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
        SimpleTopBar(stringResource(R.string.placement_title), ::exit)
        key(started, answers.size) {
            Column(
                Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                when {
                    !started -> {
                        TalesMascot(MascotMood.Thinking, Modifier.size(120.dp).align(Alignment.CenterHorizontally))
                        Text(stringResource(R.string.placement_intro), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Text(stringResource(R.string.placement_explanation), style = MaterialTheme.typography.bodyLarge)
                        Text(stringResource(R.string.placement_scope), style = MaterialTheme.typography.bodyMedium, color = TaleMuted)
                        Button(onClick = { started = true }, modifier = Modifier.fillMaxWidth()) {
                            Text(stringResource(R.string.placement_start))
                        }
                        TextButton(onClick = onCancel, modifier = Modifier.fillMaxWidth()) { Text(stringResource(R.string.placement_manual)) }
                    }
                    complete -> {
                        val result = remember(answers) { ReadingPlacement.recommend(answers) }
                        TalesMascot(MascotMood.Celebrate, Modifier.size(120.dp).align(Alignment.CenterHorizontally))
                        Text(stringResource(R.string.placement_result, result.level), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                        Text(stringResource(R.string.placement_result_description), style = MaterialTheme.typography.bodyLarge)
                        ReadingPlacement.levels.forEach { level ->
                            Text(stringResource(R.string.placement_score, level, result.correctByLevel.getValue(level)))
                        }
                        Text(stringResource(R.string.placement_scope), style = MaterialTheme.typography.bodyMedium, color = TaleMuted)
                        if (fromSettings) Text(stringResource(R.string.placement_settings_hint), style = MaterialTheme.typography.bodyMedium, color = TaleMuted)
                        Button(onClick = { onUseLevel(result.level) }, modifier = Modifier.fillMaxWidth()) {
                            Text(stringResource(R.string.placement_use, result.level))
                        }
                        TextButton(onClick = onCancel, modifier = Modifier.fillMaxWidth()) { Text(stringResource(R.string.placement_manual)) }
                    }
                    else -> {
                        val question = ReadingPlacement.questions[answers.size]
                        Text(stringResource(R.string.placement_progress, answers.size + 1, ReadingPlacement.questions.size), style = MaterialTheme.typography.labelLarge, color = TaleBlue)
                        LinearProgressIndicator(progress = { answers.size.toFloat() / ReadingPlacement.questions.size }, modifier = Modifier.fillMaxWidth())
                        Text(stringResource(if (question.prompt.isEmpty()) R.string.placement_complete_sentence else R.string.placement_read_question), style = MaterialTheme.typography.titleMedium)
                        Surface(color = TaleLine, shape = RoundedCornerShape(12.dp)) {
                            Text(question.passage, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.fillMaxWidth().padding(18.dp))
                        }
                        if (question.prompt.isNotEmpty()) Text(question.prompt, style = MaterialTheme.typography.titleMedium)
                        Column(Modifier.selectableGroup(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            (question.options.indices.toList() + -1).forEach { option ->
                                val chosen = selected == option
                                Row(
                                    Modifier.fillMaxWidth()
                                        .border(1.dp, if (chosen) TaleBlue else TaleLine, RoundedCornerShape(10.dp))
                                        .selectable(selected = chosen, role = Role.RadioButton, onClick = { selected = option })
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                ) {
                                    RadioButton(selected = chosen, onClick = null)
                                    Text(if (option == -1) stringResource(R.string.placement_unknown) else question.options[option], style = MaterialTheme.typography.bodyLarge)
                                }
                            }
                        }
                        Button(
                            enabled = selected != -2,
                            onClick = { answers = answers + selected; selected = -2 },
                            modifier = Modifier.fillMaxWidth(),
                        ) { Text(stringResource(if (answers.size == ReadingPlacement.questions.lastIndex) R.string.placement_finish else R.string.placement_next)) }
                        TextButton(onClick = ::exit, modifier = Modifier.fillMaxWidth()) { Text(stringResource(R.string.placement_cancel_confirm)) }
                    }
                }
            }
        }
    }
    if (confirmExit) AlertDialog(
        onDismissRequest = { confirmExit = false },
        title = { Text(stringResource(R.string.placement_cancel_title)) },
        text = { Text(stringResource(R.string.placement_cancel_message)) },
        confirmButton = { TextButton(onClick = onCancel) { Text(stringResource(R.string.placement_cancel_confirm)) } },
        dismissButton = { TextButton(onClick = { confirmExit = false }) { Text(stringResource(R.string.placement_cancel_keep)) } },
    )
}
