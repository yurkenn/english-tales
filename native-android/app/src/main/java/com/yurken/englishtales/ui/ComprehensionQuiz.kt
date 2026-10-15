package com.yurken.englishtales.ui

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.R
import com.yurken.englishtales.data.ComprehensionResults
import com.yurken.englishtales.data.QuizScore
import com.yurken.englishtales.data.StoryQuestion

/** Post-reading comprehension check (Q5.3). It does not change points or the learning plan. */
@Composable
internal fun ComprehensionQuiz(storyId: String, questions: List<StoryQuestion>, modifier: Modifier = Modifier,
    results: ComprehensionResults = ComprehensionResults(LocalContext.current)) {
    if (questions.isEmpty()) return
    var attempt by rememberSaveable(storyId) { mutableIntStateOf(0) }
    var index by rememberSaveable(storyId, attempt) { mutableIntStateOf(0) }
    var correctCount by rememberSaveable(storyId, attempt) { mutableIntStateOf(0) }
    var selected by rememberSaveable(storyId, attempt, index) { mutableStateOf<Int?>(null) }
    var checked by rememberSaveable(storyId, attempt, index) { mutableStateOf(false) }
    var finished by rememberSaveable(storyId, attempt) { mutableStateOf(false) }
    var best by remember(storyId) { mutableStateOf(results.best(storyId)) }
    Surface(modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), color = TaleLine.copy(alpha = 0.5f)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(stringResource(R.string.quiz_title), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            if (finished) {
                Text(stringResource(R.string.quiz_result, correctCount, questions.size), style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
                best?.let { Text(stringResource(R.string.quiz_best, it.correct, it.total), color = TaleMuted) }
                OutlinedButton(onClick = { attempt++ }, modifier = Modifier.fillMaxWidth()) { Text(stringResource(R.string.quiz_retry)) }
                return@Column
            }
            val question = questions[index]
            Text(stringResource(R.string.quiz_intro), style = MaterialTheme.typography.bodySmall, color = TaleMuted)
            Text(stringResource(R.string.quiz_progress, index + 1, questions.size) + " · " + stringResource(when (question.kind) {
                "main" -> R.string.quiz_kind_main; "detail" -> R.string.quiz_kind_detail; else -> R.string.quiz_kind_inference }),
                style = MaterialTheme.typography.labelMedium, color = TaleMuted)
            Text(question.prompt, style = MaterialTheme.typography.titleMedium)
            Column(Modifier.selectableGroup(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                question.options.forEachIndexed { i, option ->
                    Row(Modifier.fillMaxWidth().border(1.dp, if (selected == i) TaleBlue else TaleLine, RoundedCornerShape(10.dp))
                        .selectable(selected = selected == i, enabled = !checked, role = Role.RadioButton, onClick = { selected = i }).padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        RadioButton(selected = selected == i, onClick = null, enabled = !checked)
                        Text(option, style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }
            if (checked) Text(
                if (selected == question.answer) stringResource(R.string.quiz_correct)
                else stringResource(R.string.quiz_incorrect, question.options[question.answer]),
                style = MaterialTheme.typography.bodyLarge, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
            Button(enabled = selected != null, modifier = Modifier.fillMaxWidth(), onClick = {
                if (!checked) {
                    checked = true
                    if (selected == question.answer) correctCount++
                } else if (index == questions.lastIndex) {
                    best = results.record(storyId, QuizScore(correctCount, questions.size))
                    finished = true
                } else index++
            }) { Text(stringResource(if (!checked) R.string.quiz_check else if (index == questions.lastIndex) R.string.quiz_finish else R.string.quiz_next)) }
        }
    }
}
