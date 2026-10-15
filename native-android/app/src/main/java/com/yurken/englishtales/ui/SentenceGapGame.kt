package com.yurken.englishtales.ui

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
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.R
import com.yurken.englishtales.data.GapOption
import com.yurken.englishtales.data.GapPrompt
import com.yurken.englishtales.data.GapQuestion

/** Freeze the five source sentences and choices, even if the catalog changes mid-session. */
internal val gapQuestionsSaver = listSaver<List<GapQuestion>, ArrayList<String>>(
    save = { questions -> questions.map { q ->
        val p=q.prompt
        arrayListOf(p.wordId,p.word,p.translation,p.sentence,p.start.toString(),p.end.toString(),p.storyTitle,p.revisionId,p.sentenceId,p.level)
            .apply { q.options.forEach { add(it.wordId);add(it.label) } }
    } },
    restore = { saved -> saved.map { row ->
        GapQuestion(GapPrompt(row[0],row[1],row[2],row[3],row[4].toInt(),row[5].toInt(),row[6],row[7],row[8],row[9]),
            row.drop(10).chunked(2).map { GapOption(it[0],it[1]) })
    } },
)

@Composable
fun SentenceGapGame(
    questions: List<GapQuestion>, session: Int, padding: PaddingValues,
    onAnswer: (String, Boolean) -> Unit, onComplete: (Int) -> Unit, onExit: () -> Unit,
) {
    require(questions.isNotEmpty())
    var index by rememberSaveable(session) { mutableIntStateOf(0) }
    var correctCount by rememberSaveable(session) { mutableIntStateOf(0) }
    var selected by rememberSaveable(session,index) { mutableStateOf<String?>(null) }
    var checked by rememberSaveable(session,index) { mutableStateOf(false) }
    var advanced by rememberSaveable(session,index) { mutableStateOf(false) }
    val question=questions[index]
    val prompt=question.prompt
    val correct=selected==prompt.wordId
    val scroll=rememberScrollState()
    LaunchedEffect(index) {scroll.scrollTo(0)}
    Column(Modifier.fillMaxSize().padding(padding).background(Color.White).verticalScroll(scroll).padding(16.dp),
        verticalArrangement=Arrangement.spacedBy(14.dp)) {
        Row(verticalAlignment=Alignment.CenterVertically) {
            ReferenceIconButton("back",stringResource(R.string.gap_exit),onExit)
            Text(stringResource(R.string.gap_progress,index+1,questions.size),modifier=Modifier.weight(1f),style=MaterialTheme.typography.titleMedium)
        }
        LinearProgressIndicator(progress={index.toFloat()/questions.size},modifier=Modifier.fillMaxWidth())
        Text(stringResource(R.string.gap_instruction),style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold)
        // A title such as 'The Fox and the Grapes' must not give away the missing word.
        Text(if(checked) stringResource(R.string.gap_source,prompt.storyTitle,prompt.level) else stringResource(R.string.gap_source_pending,prompt.level),
            style=MaterialTheme.typography.bodyMedium,color=TaleMuted)
        Surface(color=TaleLine,shape=RoundedCornerShape(12.dp)) {
            Text(if(checked) prompt.sentence else prompt.masked,style=MaterialTheme.typography.bodyLarge,modifier=Modifier.fillMaxWidth().padding(20.dp))
        }
        Text(stringResource(R.string.gap_hint,prompt.translation),style=MaterialTheme.typography.bodyLarge,color=TaleBlue)
        Column(Modifier.selectableGroup(),verticalArrangement=Arrangement.spacedBy(8.dp)) {
            question.options.forEach { option ->
                Row(Modifier.fillMaxWidth().border(1.dp,if(selected==option.wordId) TaleBlue else TaleLine,RoundedCornerShape(10.dp))
                    .selectable(selected=selected==option.wordId,enabled=!checked,role=Role.RadioButton,onClick={selected=option.wordId}).padding(12.dp),
                    verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)) {
                    RadioButton(selected=selected==option.wordId,onClick=null,enabled=!checked)
                    Text(option.label,style=MaterialTheme.typography.bodyLarge)
                }
            }
        }
        if(checked) Text(
            if(correct) stringResource(R.string.gap_correct) else stringResource(R.string.gap_incorrect,prompt.answer),
            style=MaterialTheme.typography.bodyLarge,
            modifier=Modifier.semantics {liveRegion=LiveRegionMode.Polite},
        )
        Button(enabled=selected!=null && !advanced,modifier=Modifier.fillMaxWidth(),onClick={
            if(!checked) checked=true
            else if(!advanced) {
                advanced=true
                onAnswer(prompt.wordId,correct)
                if(correct) correctCount++
                if(index==questions.lastIndex) onComplete(correctCount) else index++
            }
        }) { Text(stringResource(if(!checked) R.string.gap_check else if(index==questions.lastIndex) R.string.gap_finish else R.string.gap_next)) }
    }
}
