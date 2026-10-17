package com.yurken.englishtales.ui

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.R
import com.yurken.englishtales.data.OrderQuestion

/** Freeze the five sentences and their shuffled tiles, even if the catalog changes mid-session. */
internal val orderQuestionsSaver = listSaver<List<OrderQuestion>, ArrayList<String>>(
    save = { questions -> questions.map { q -> arrayListOf(q.sentence,q.translation,q.storyTitle,q.level,q.sentenceId).apply { addAll(q.tiles) } } },
    restore = { saved -> saved.map { row -> OrderQuestion(row[0],row[1],row[2],row[3],row[4],row.drop(5)) } },
)

/** Q5.9: tap the shuffled words to rebuild a story sentence; a chosen word is tapped again to take it back. */
@OptIn(ExperimentalLayoutApi::class,ExperimentalMaterial3Api::class)
@Composable
fun SentenceOrderGame(questions: List<OrderQuestion>, session: Int, padding: PaddingValues, onComplete: (Int) -> Unit, onExit: () -> Unit) {
    require(questions.isNotEmpty())
    var index by rememberSaveable(session) { mutableIntStateOf(0) }
    var correctCount by rememberSaveable(session) { mutableIntStateOf(0) }
    var chosen by rememberSaveable(session,index) { mutableStateOf(emptyList<Int>()) }
    var checked by rememberSaveable(session,index) { mutableStateOf(false) }
    var advanced by rememberSaveable(session,index) { mutableStateOf(false) }
    val question=questions[index]
    val correct=question.isCorrect(chosen)
    val scroll=rememberScrollState()
    LaunchedEffect(index) {scroll.scrollTo(0)}
    Column(Modifier.fillMaxSize().padding(padding).verticalScroll(scroll).centeredWidth(ContentWidth).padding(16.dp),
        verticalArrangement=Arrangement.spacedBy(14.dp)) {
        Row(verticalAlignment=Alignment.CenterVertically) {
            ReferenceIconButton("back",stringResource(R.string.gap_exit),onExit)
            Text(stringResource(R.string.gap_progress,index+1,questions.size),modifier=Modifier.weight(1f),style=MaterialTheme.typography.titleMedium)
        }
        QuizProgress(index.toFloat()/questions.size)
        Text(stringResource(R.string.order_instruction),style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold)
        Text(stringResource(R.string.order_source,question.storyTitle,question.level),style=MaterialTheme.typography.bodyMedium,color=TaleMuted)
        Text(stringResource(R.string.order_hint,question.translation),style=MaterialTheme.typography.bodyLarge,color=TaleBlue)
        // The sentence being built; each placed word can be taken back until the answer is checked.
        var shakes by remember(index) {mutableIntStateOf(0)}
        LaunchedEffect(checked) {if(checked && !correct) shakes++}
        Surface(color=if(checked) (if(correct) LocalTaleColors.current.tileGreen else TaleError.copy(alpha=0.10f)) else TaleLine,shape=RoundedCornerShape(14.dp),modifier=Modifier.fillMaxWidth().shakeOn(shakes).animateContentSize()) {
            if(chosen.isEmpty()) Text(stringResource(R.string.order_answer_empty),color=TaleMuted,modifier=Modifier.padding(20.dp))
            else FlowRow(Modifier.padding(12.dp),horizontalArrangement=Arrangement.spacedBy(6.dp),verticalArrangement=Arrangement.spacedBy(6.dp)) {
                chosen.forEachIndexed { position,tile ->
                    val removeLabel=stringResource(R.string.order_remove,question.tiles[tile])
                    InputChip(selected=true,enabled=!checked,onClick={chosen=chosen.toMutableList().also {it.removeAt(position)}},
                        label={Text(question.tiles[tile])},modifier=Modifier.semantics {contentDescription=removeLabel})
                }
            }
        }
        FlowRow(horizontalArrangement=Arrangement.spacedBy(8.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
            question.tiles.forEachIndexed { tile,word ->
                if(tile !in chosen) OutlinedButton(enabled=!checked,onClick={chosen=chosen+tile},modifier=Modifier.heightIn(min=48.dp)) { Text(word) }
            }
        }
        AnswerFeedback(checked,correct,if(correct) stringResource(R.string.order_correct,question.sentence) else stringResource(R.string.order_incorrect,question.sentence))
        Button(enabled=chosen.size==question.tiles.size && !advanced,modifier=Modifier.fillMaxWidth().heightIn(min=50.dp),shape=RoundedCornerShape(14.dp),
            colors=if(checked && correct) ButtonDefaults.buttonColors(containerColor=TaleSuccess,contentColor=TaleSurface) else ButtonDefaults.buttonColors(),onClick={
            if(!checked) checked=true
            else if(!advanced) {
                advanced=true
                if(correct) correctCount++
                if(index==questions.lastIndex) onComplete(correctCount) else index++
            }
        }) { Text(stringResource(if(!checked) R.string.gap_check else if(index==questions.lastIndex) R.string.gap_finish else R.string.gap_next)) }
    }
}
