package com.yurken.englishtales.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.R
import com.yurken.englishtales.data.ListeningQuestion

/** Freeze the words and choices of a session across configuration changes. */
internal val listeningQuestionsSaver = listSaver<List<ListeningQuestion>, ArrayList<String>>(
    save = { questions -> questions.map { q -> arrayListOf(q.wordId, q.word, q.answer).apply { addAll(q.options) } } },
    restore = { saved -> saved.map { row -> ListeningQuestion(row[0], row[1], row[2], row.drop(3)) } },
)

@Composable
internal fun ListeningGame(
    questions: List<ListeningQuestion>, session: Int, padding: PaddingValues,
    onAnswer: (String, Boolean) -> Unit, onComplete: (Int) -> Unit, onExit: () -> Unit,
    narrator: Narrator = rememberNarrator(),
) {
    require(questions.isNotEmpty())
    var index by rememberSaveable(session) { mutableIntStateOf(0) }
    var correctCount by rememberSaveable(session) { mutableIntStateOf(0) }
    var selected by rememberSaveable(session, index) { mutableStateOf<String?>(null) }
    var checked by rememberSaveable(session, index) { mutableStateOf(false) }
    var advanced by rememberSaveable(session, index) { mutableStateOf(false) }
    val question = questions[index]
    val correct = selected == question.answer
    val playing = narrator.speaking || narrator.preparing
    // Each new word is played once on arrival; the learner can replay it as often as needed.
    LaunchedEffect(session, index) { narrator.speak(question.word) }
    Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            ReferenceIconButton("back", stringResource(R.string.listen_exit), { narrator.stop(); onExit() })
            Text(stringResource(R.string.listen_progress, index + 1, questions.size), modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleMedium)
        }
        LinearProgressIndicator(progress = { index.toFloat() / questions.size }, modifier = Modifier.fillMaxWidth())
        Text(stringResource(R.string.listen_instruction), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        val playLabel = stringResource(if (playing) R.string.listen_stop else if (index == 0 && !checked && selected == null) R.string.listen_play else R.string.listen_replay)
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Box(Modifier.size(88.dp).background(TaleBlue, CircleShape).semantics { contentDescription = playLabel }
                .clickable(role = Role.Button) { if (playing) narrator.stop() else narrator.speak(question.word) },
                contentAlignment = Alignment.Center) {
                if (playing) Text("Ⅱ", color = Color.White, style = MaterialTheme.typography.headlineSmall)
                else ReferenceIcon("volume", Color.White, Modifier.size(36.dp))
            }
            if (narrator.preparing) Text(stringResource(R.string.listen_preparing), color = TaleMuted, style = MaterialTheme.typography.bodySmall)
            narrator.error?.let { Text(it, color = TaleMuted, style = MaterialTheme.typography.bodySmall) }
        }
        Column(Modifier.selectableGroup(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            question.options.forEach { option ->
                Row(Modifier.fillMaxWidth().border(1.dp, if (selected == option) TaleBlue else TaleLine, RoundedCornerShape(10.dp))
                    .selectable(selected = selected == option, enabled = !checked, role = Role.RadioButton, onClick = { selected = option }).padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    RadioButton(selected = selected == option, onClick = null, enabled = !checked)
                    Text(option, style = MaterialTheme.typography.bodyLarge)
                }
            }
        }
        if (checked) Text(
            if (correct) stringResource(R.string.listen_correct, question.word)
            else stringResource(R.string.listen_incorrect, question.word, question.answer),
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
        )
        Button(enabled = selected != null && !advanced, modifier = Modifier.fillMaxWidth(), onClick = {
            if (!checked) checked = true
            else if (!advanced) {
                advanced = true
                narrator.stop()
                onAnswer(question.wordId, correct)
                if (correct) correctCount++
                if (index == questions.lastIndex) onComplete(correctCount) else index++
            }
        }) { Text(stringResource(if (!checked) R.string.listen_check else if (index == questions.lastIndex) R.string.listen_finish else R.string.listen_next)) }
    }
}
