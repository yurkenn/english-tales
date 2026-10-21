package com.yurken.englishtales.ui

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.R
import com.yurken.englishtales.data.Dictation
import com.yurken.englishtales.data.OrderQuestion

/** Q5.9: each sentence is read aloud on arrival and can be replayed; the learner types it and checks. */
@Composable
internal fun DictationGame(
    questions: List<OrderQuestion>, session: Int, padding: PaddingValues, onComplete: (Int) -> Unit, onExit: () -> Unit,
    narrator: Narrator = rememberNarrator(),
) {
    require(questions.isNotEmpty())
    val combo = LocalCombo.current
    var index by rememberSaveable(session) { mutableIntStateOf(0) }
    var correctCount by rememberSaveable(session) { mutableIntStateOf(0) }
    var typed by rememberSaveable(session, index) { mutableStateOf("") }
    var checked by rememberSaveable(session, index) { mutableStateOf(false) }
    var advanced by rememberSaveable(session, index) { mutableStateOf(false) }
    val question = questions[index]
    val result = Dictation.check(question.sentence, typed)
    val playing = narrator.speaking || narrator.preparing
    LaunchedEffect(session, index) { narrator.speak(question.sentence) }
    Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).centeredWidth(ContentWidth).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            ReferenceIconButton("back", stringResource(R.string.gap_exit), { narrator.stop(); onExit() })
            Text(stringResource(R.string.gap_progress, index + 1, questions.size), modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleMedium)
            ComboBadge()
        }
        QuizProgress(index.toFloat() / questions.size)
        Text(stringResource(R.string.dictation_instruction), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        val playLabel = stringResource(if (playing) R.string.listen_stop else R.string.dictation_play)
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Box(Modifier.size(88.dp).pulseWhile(playing).background(TaleBlue, CircleShape).contentLabel(playLabel)
                .clickable(role = Role.Button) { if (playing) narrator.stop() else narrator.speak(question.sentence) },
                contentAlignment = Alignment.Center) {
                if (playing) Text("Ⅱ", color = TaleOnBlue, style = MaterialTheme.typography.headlineSmall)
                else ReferenceIcon("volume", TaleOnBlue, Modifier.size(36.dp))
            }
            if (narrator.preparing) Text(stringResource(R.string.listen_preparing), color = TaleMuted, style = MaterialTheme.typography.bodySmall)
            narrator.error?.let { Text(it, color = TaleMuted, style = MaterialTheme.typography.bodySmall) }
        }
        OutlinedTextField(value = typed, onValueChange = { if (!checked) typed = it.take(300) }, enabled = !checked,
            label = { Text(stringResource(R.string.dictation_field)) }, modifier = Modifier.fillMaxWidth(),
            textStyle = LocalTextStyle.current.copy(textDirection = androidx.compose.ui.text.style.TextDirection.Ltr),
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences))
        AnswerFeedback(checked, result.correct, if (result.correct) stringResource(R.string.dictation_correct, englishArgument(question.sentence))
            else pluralStringResource(R.plurals.dictation_incorrect, result.wrongWords, result.wrongWords, englishArgument(question.sentence)))
        Button(enabled = typed.isNotBlank() && !advanced, modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp), shape = RoundedCornerShape(14.dp),
            colors = if (checked && result.correct) ButtonDefaults.buttonColors(containerColor = TaleSuccess, contentColor = TaleSurface) else ButtonDefaults.buttonColors(), onClick = {
            if (!checked) { checked = true; combo.record(result.correct) }
            else if (!advanced) {
                advanced = true
                narrator.stop()
                if (result.correct) correctCount++
                if (index == questions.lastIndex) onComplete(correctCount) else index++
            }
        }) { Text(stringResource(if (!checked) R.string.gap_check else if (index == questions.lastIndex) R.string.gap_finish else R.string.gap_next)) }
    }
}
