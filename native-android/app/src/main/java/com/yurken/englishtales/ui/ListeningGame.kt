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
    val combo = LocalCombo.current
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
        QuizHeader(index, questions.size, stringResource(R.string.listen_exit), { narrator.stop(); onExit() }, R.string.listen_progress)
        Text(stringResource(R.string.listen_instruction), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        val playLabel = stringResource(if (playing) R.string.listen_stop else if (index == 0 && !checked && selected == null) R.string.listen_play else R.string.listen_replay)
        NarrationPlayButton(narrator, playLabel) { if (playing) narrator.stop() else narrator.speak(question.word) }
        Column(Modifier.selectableGroup(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            question.options.forEachIndexed { i, option ->
                AnswerOption(option, selected == option, optionState(selected == option, checked, option == question.answer), !checked, { selected = option }, Modifier.appearIn(i))
            }
        }
        AnswerFeedback(checked, correct, if (correct) stringResource(R.string.listen_correct, englishArgument(question.word))
            else stringResource(R.string.listen_incorrect, englishArgument(question.word), question.answer))
        QuizCheckButton(selected != null && !advanced, checked, correct, index == questions.lastIndex, onClick = {
            if (!checked) { checked = true; combo.record(correct) }
            else if (!advanced) {
                advanced = true
                narrator.stop()
                onAnswer(question.wordId, correct)
                if (correct) correctCount++
                if (index == questions.lastIndex) onComplete(correctCount) else index++
            }
        }, labels = QuizButtonLabels(R.string.listen_check, R.string.listen_next, R.string.listen_finish))
    }
}
