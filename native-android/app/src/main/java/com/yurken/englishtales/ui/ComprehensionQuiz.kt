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
import androidx.compose.ui.unit.sp
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
    // The design's white quiz card: a small blue heading, the question, chunky answers and a green check key.
    ChunkyBox(TaleSurface, modifier.fillMaxWidth(), RoundedCornerShape(22.dp), depth = 5.dp, border = TaleLine) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(stringResource(R.string.quiz_title), fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = TaleBlue)
            if (finished) {
                val alerts = LocalTaleAlerts.current
                val perfect = stringResource(R.string.alert_quiz_perfect)
                LaunchedEffect(attempt) { if (correctCount == questions.size) alerts.reward(perfect) }
                Text(stringResource(R.string.quiz_result, correctCount, questions.size), style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite }.popOn(1))
                best?.let { Text(stringResource(R.string.quiz_best, it.correct, it.total), color = TaleMuted) }
                ChunkyButton(stringResource(R.string.quiz_retry), { attempt++ }, Modifier.fillMaxWidth(), color = TaleSurface, onColor = TaleInk, border = TaleLine)
                return@Column
            }
            val question = questions[index]
            Text(stringResource(R.string.quiz_intro), style = MaterialTheme.typography.bodySmall, color = TaleMuted)
            Text(stringResource(R.string.quiz_progress, index + 1, questions.size) + " · " + stringResource(when (question.kind) {
                "main" -> R.string.quiz_kind_main; "detail" -> R.string.quiz_kind_detail; else -> R.string.quiz_kind_inference }),
                style = MaterialTheme.typography.labelMedium, color = TaleMuted)
            Text(question.prompt, fontFamily = TaleDisplay, fontSize = 18.sp, lineHeight = 23.sp, fontWeight = FontWeight.ExtraBold)
            Column(Modifier.selectableGroup(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                question.options.forEachIndexed { i, option ->
                    AnswerOption(option, selected == i, optionState(selected == i, checked, i == question.answer), !checked, { selected = i })
                }
            }
            AnswerFeedback(checked, selected == question.answer, if (selected == question.answer) stringResource(R.string.quiz_correct)
                else stringResource(R.string.quiz_incorrect, englishArgument(question.options[question.answer])))
            ChunkyButton(stringResource(if (!checked) R.string.quiz_check else if (index == questions.lastIndex) R.string.quiz_finish else R.string.quiz_next), {
                if (!checked) {
                    checked = true
                    if (selected == question.answer) correctCount++
                } else if (index == questions.lastIndex) {
                    best = results.record(storyId, QuizScore(correctCount, questions.size))
                    finished = true
                } else index++
            }, Modifier.fillMaxWidth(), color = if (selected != null) TaleGreen else TaleLine, onColor = if (selected != null) TaleOnGreen else TaleMuted, enabled = selected != null)
        }
    }
}
