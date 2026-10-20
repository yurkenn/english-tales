package com.yurken.englishtales.ui

import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.draw.shadow
import androidx.compose.animation.core.*
import androidx.compose.animation.*
import android.content.Context
import androidx.compose.ui.semantics.Role
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.os.Handler
import android.os.Looper
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.changedToDown
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.withLink
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupProperties
import com.yurken.englishtales.data.*
import java.util.Locale

import kotlinx.coroutines.launch
import kotlinx.coroutines.CancellationException

private const val SENTENCES_PER_PAGE=8

/** The page the reader opens on. A finished story starts over: completion stores its last sentence as the position. */
internal fun initialReaderPage(story: Story, snapshot: LearningSnapshot): Int {
    val pageCount=(story.sentences.size+SENTENCES_PER_PAGE-1)/SENTENCES_PER_PAGE
    val saved=snapshot.progressFor(story)
    if(saved==100) return 0
    val position=snapshot.readingPositions[story.id]?.takeIf {it.carriesTo(story)}
    val sentenceIndex=position?.let {p ->story.sentences.indexOfFirst {it.id==p.sentenceId}}?.takeIf {it>=0}
    return (sentenceIndex?.div(SENTENCES_PER_PAGE)?:((saved*story.sentences.size+99)/100/SENTENCES_PER_PAGE)).coerceIn(0,(pageCount-1).coerceAtLeast(0))
}

/**
 * Utterance bookkeeping for one narration: a list of sentences is queued as one utterance each, so the
 * engine reports which sentence is being read. Only the newest batch counts; callbacks from a flushed
 * batch are ignored.
 */
internal class NarrationQueue {
    private var batch = 0
    private var size = 0
    /** Index of the sentence being read in the current batch, or null when nothing is playing. */
    var current: Int? = null
        private set

    /** Starts a new batch of [count] sentences and returns their utterance ids in order. */
    fun start(count: Int): List<String> {
        batch++; size = count; current = null
        return List(count) { "english-tales-$batch-$it" }
    }
    private fun index(id: String?): Int? {
        val prefix = "english-tales-$batch-"
        return if (size > 0 && id != null && id.startsWith(prefix)) id.removePrefix(prefix).toIntOrNull()?.takeIf { it in 0 until size } else null
    }
    fun owns(id: String?) = index(id) != null
    /** The engine began [id]; returns true when it belongs to the current batch. */
    fun started(id: String?): Boolean = index(id)?.also { current = it } != null
    /** The engine finished [id] normally; returns true when that ends the batch. */
    fun done(id: String?): Boolean = index(id) == size - 1 && size > 0 && finish()
    /** Stopped, failed or flushed: the batch ends whatever sentence it was on. */
    fun finish(): Boolean { size = 0; current = null; return true }
}

internal open class Narrator(context: Context, private val focus: NarrationFocus = SystemNarrationFocus(context)) {
    private val appContext = context.applicationContext
    private var engine: TextToSpeech? = null
    private var ready = false
    private var closed = false
    private var pending: List<String>? = null
    private val queue = NarrationQueue()
    private val main = Handler(Looper.getMainLooper())
    var preparing by mutableStateOf(false)
        private set
    var speaking by mutableStateOf(false)
        private set
    /** Which of the texts passed to [speakAll] is being read; drives the reader's sentence highlight. */
    var spokenIndex by mutableStateOf<Int?>(null)
        private set
    var error by mutableStateOf<String?>(null)
        private set
    /** Null until the engine has started; false when no English voice can be used on this device. */
    var available by mutableStateOf<Boolean?>(null)
        private set

    init {
        focus.onLoss = { main.post { if (!closed) stop() } }
        engine = TextToSpeech(context) { result ->
            if (!closed) {
                ready = result == TextToSpeech.SUCCESS
                if (ready) {
                    engine?.setAudioAttributes(NarrationFocus.attributes)
                    val language = engine?.setLanguage(Locale.US)
                    if (language == TextToSpeech.LANG_MISSING_DATA || language == TextToSpeech.LANG_NOT_SUPPORTED) {
                        ready = false
                        speaking = false
                        error = appContext.getString(R.string.cihazin_ingilizce_ses_verisi_hazir)
                        available = false
                    } else {
                        available = true
                        pending?.let { speakAll(it) }
                    }
                } else {
                    speaking = false
                    error = appContext.getString(R.string.cihazin_seslendirme_motoru_baslatilamadi)
                    available = false
                }
                preparing = false
                pending = null
            }
        }
        engine?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) { main.post { if (!closed && queue.started(id)) { speaking = true; spokenIndex = queue.current } } }
            override fun onDone(id: String?) { main.post { if (!closed && queue.done(id)) ended() } }
            override fun onStop(id: String?, interrupted: Boolean) { main.post { if (!closed && queue.owns(id)) { queue.finish(); ended() } } }
            @Deprecated("Required callback for older Android engines")
            override fun onError(id: String?) { main.post { if (!closed && queue.owns(id)) { queue.finish(); ended(); error = appContext.getString(R.string.seslendirme_tamamlanamadi) } } }
        })
    }
    private fun ended() { speaking = false; spokenIndex = null; focus.abandon() }

    fun speak(text: String) = speakAll(listOf(text))

    /** Reads [texts] one after another as separate utterances, so [spokenIndex] follows the reading. */
    open fun speakAll(texts: List<String>) {
        if (closed || texts.isEmpty()) return
        if (!ready) { if (error == null) {pending = texts;preparing = true}; return }
        if (!focus.request()) { error = appContext.getString(R.string.ses_su_anda_baska_bir); return }
        error = null
        val ids = queue.start(texts.size)
        speaking = texts.indices.all { i -> engine?.speak(texts[i], if (i == 0) TextToSpeech.QUEUE_FLUSH else TextToSpeech.QUEUE_ADD, null, ids[i]) == TextToSpeech.SUCCESS }
        spokenIndex = if (speaking) 0 else null
        if (!speaking) { queue.finish(); engine?.stop(); error = appContext.getString(R.string.seslendirme_baslatilamadi); focus.abandon() }
    }
    open fun stop() { preparing = false; pending = null; queue.finish(); engine?.stop(); speaking = false; spokenIndex = null; focus.abandon() }
    fun close() { preparing = false; closed = true; pending = null; queue.finish(); spokenIndex = null; engine?.shutdown(); focus.abandon(); main.removeCallbacksAndMessages(null) }
}

/** One narrator per screen: released on dispose and silenced when the app leaves the foreground. */
@Composable
internal fun rememberNarrator(factory: (Context) -> Narrator = ::Narrator): Narrator {
    val context = LocalContext.current
    val narrator = remember(context) { factory(context) }
    val lifecycle = androidx.lifecycle.compose.LocalLifecycleOwner.current.lifecycle
    DisposableEffect(narrator, lifecycle) {
        val observer = androidx.lifecycle.LifecycleEventObserver { _, event -> if (event == androidx.lifecycle.Lifecycle.Event.ON_STOP) narrator.stop() }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer); narrator.close() }
    }
    return narrator
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ReaderScreen(story: Story, snapshot: LearningSnapshot, onBack: () -> Unit, onSaveWord: (String) -> Unit, onProgress: (Int,String) -> Unit, autoListen: Boolean=false, onComplete: (Long)->Unit, onHintDismiss: ()->Unit,sessionId: String,onCheckpoint: (String,Long)->Unit,onOpenWords: ()->Unit={},appearanceStore: ReadingPreferencesStore?=null,onSaveGlossaryWord: (WordInfo)->Unit={},onLookup: (WordInfo)->Unit={},narratorFactory: (Context)->Narrator=::Narrator) {
    val context=LocalContext.current
    val narrator=rememberNarrator(narratorFactory)
    val pageCount=(story.sentences.size+SENTENCES_PER_PAGE-1)/SENTENCES_PER_PAGE
    var page by rememberSaveable(story.revisionId) { mutableIntStateOf(initialReaderPage(story,snapshot)) }
    // Scrubbing the slider only moves the page on screen; the position is reported once the drag ends,
    // so a long scrub writes one progress event instead of one per page crossed.
    var reportedPage by rememberSaveable(story.revisionId) { mutableIntStateOf(page) }
    fun reportProgress() {
        if(page==reportedPage) return
        reportedPage=page
        onProgress((page*SENTENCES_PER_PAGE*100/story.sentences.size).coerceAtMost(99),story.sentences[page*SENTENCES_PER_PAGE].id)
    }
    val flushProgress by rememberUpdatedState({ reportProgress() })
    DisposableEffect(story.revisionId) { onDispose { flushProgress() } }
    val timer=rememberActiveLearningTime(sessionId,snapshot.activeSessionMillis[sessionId]?:0,true,onCheckpoint)
    var completed by rememberSaveable(sessionId) {mutableStateOf(false)}
    val preferences=remember(context,appearanceStore) {appearanceStore?:ReadingPreferencesStore(context)}
    var appearance by remember(preferences) {mutableStateOf(preferences.read())}
    var appearanceError by remember {mutableStateOf<String?>(null)}
    val alerts=LocalTaleAlerts.current
    fun savedText(word: String)=context.getString(R.string.alert_word_saved,word)
    fun removedText(word: String)=context.getString(R.string.alert_word_removed,word)
    LaunchedEffect(appearanceError) {appearanceError?.let(alerts::error)}
    val scope=rememberCoroutineScope()
    fun changeAppearance(change: (ReadingPreferences)->ReadingPreferences) {
        scope.launch {
            try {appearance=preferences.update(change);appearanceError=null}
            catch(error: Exception) {
                if(error is CancellationException) throw error
                appearanceError=context.getString(R.string.okuma_ayari_kaydedilemedi_tekrar_deneyebilirsin)
            }
        }
    }
    val palette=readerPalette(appearance.theme)
    val fontSize=appearance.fontSize
    var options by remember { mutableStateOf(false) }
    var selectedWord by remember { mutableStateOf<WordInfo?>(null) }
    // Which occurrence was tapped, so that word stays marked while its card is open.
    var selectedLink by remember { mutableStateOf<String?>(null) }
    var more by remember { mutableStateOf(false) }
    val translations=remember(story.id) { mutableStateListOf<String>() }
    val pageSentences=story.sentences.drop(page*SENTENCES_PER_PAGE).take(SENTENCES_PER_PAGE)
    val scroll=rememberScrollState()
    // The reader follows its own page theme, independent of the system theme; sepia is a light page.
    TaleColorTheme(if(appearance.dark) DarkTaleColors else LightTaleColors) {
        val background=palette.background
        val foreground=palette.foreground
        val accent=palette.accent
        val muted=palette.muted
        LaunchedEffect(page) { scroll.scrollTo(0) }
        // Each sentence is its own utterance, so the one being read can be highlighted (Q4.8).
        var narrationFrom by remember { mutableIntStateOf(0) }
        fun listen(from: Int=0) { narrationFrom=from; narrator.speakAll(pageSentences.drop(from).map { it.english }) }
        val readingIndex=narrator.spokenIndex?.let { narrationFrom+it }
        // Starts once per reader visit: a rotation or restore must not restart speech the learner paused.
        var autoListened by rememberSaveable(story.revisionId) { mutableStateOf(false) }
        LaunchedEffect(autoListen) { if(autoListen && !autoListened) { autoListened=true;listen() } }
        fun changePage(next: Int,report: Boolean=true) {
            val target=next.coerceIn(0,pageCount-1)
            if(target==page) return
            narrator.stop(); page=target
            if(report) reportProgress()
        }
        fun toggleTranslation(id: String) { if(id in translations) translations.remove(id) else translations.add(id) }
        val pageTranslated=pageSentences.isNotEmpty() && pageSentences.all {it.id in translations}
        // A sideways swipe turns the page, like a book; the threshold keeps a vertical scroll from flipping it.
        val swipeThreshold=with(androidx.compose.ui.platform.LocalDensity.current) {72.dp.toPx()}
        // Where the last touch landed decides whether the word card opens above or below it, so it never hides the word.
        var touchY by remember { mutableFloatStateOf(0f) }
        var screenHeight by remember { mutableIntStateOf(0) }
        Box(Modifier.fillMaxSize().background(background).onSizeChanged {screenHeight=it.height}.pointerInput(Unit) {
                awaitPointerEventScope { while(true) { awaitPointerEvent(PointerEventPass.Initial).changes.firstOrNull {it.changedToDown()}?.let {touchY=it.position.y} } }
            }.statusBarsPadding().navigationBarsPadding()) {
            // On tablets and in landscape the page keeps a book-like line length instead of spanning the screen.
            Column(Modifier.fillMaxHeight().centeredWidth(ReadingWidth)) {
                Row(Modifier.fillMaxWidth().heightIn(min=52.dp).padding(horizontal=14.dp),verticalAlignment=Alignment.CenterVertically) {
                    ReferenceIconButton("back",stringResource(R.string.geri),{narrator.stop();onBack()},tint=accent)
                    Spacer(Modifier.weight(1f))
                    TextButton(onClick={options=true},colors=ButtonDefaults.textButtonColors(contentColor=accent),modifier=Modifier.contentLabel(stringResource(R.string.okuma_gorunumu))) {
                        Text(stringResource(R.string.aa),fontSize=20.sp,fontFamily=FontFamily.Serif)
                    }
                    Row(Modifier.heightIn(min=48.dp).contentLabel(stringResource(R.string.kelimelerim_kayitli_kelime_2, snapshot.savedWordIds.size)).clickable(role=Role.Button) {narrator.stop();onOpenWords()}.padding(horizontal=6.dp),verticalAlignment=Alignment.CenterVertically) {
                        ReferenceIcon("cards",muted,Modifier.size(19.dp)); Spacer(Modifier.width(5.dp)); Text("${snapshot.savedWordIds.size}",color=muted,fontSize=14.sp)
                    }
                }
                Column(Modifier.weight(1f).pointerInput(page,pageCount) {
                        var drag=0f
                        detectHorizontalDragGestures(onDragStart={drag=0f},onDragEnd={
                            if(drag<=-swipeThreshold) changePage(page+1) else if(drag>=swipeThreshold) changePage(page-1)
                        }) {change,amount -> drag+=amount; change.consume()}
                    }.verticalScroll(scroll).padding(start=28.dp,end=28.dp,top=12.dp,bottom=24.dp),verticalArrangement=Arrangement.spacedBy(14.dp)) {
                    if(!snapshot.readerHintSeen) {
                        Column(Modifier.fillMaxWidth().appearIn().background(accent.copy(alpha=0.08f),RoundedCornerShape(14.dp)).border(1.dp,accent.copy(alpha=0.25f),RoundedCornerShape(14.dp)).padding(14.dp)) {
                            Text(stringResource(R.string.okurken_ogren),fontWeight=FontWeight.Bold,fontSize=14.sp,color=accent)
                            Text(stringResource(R.string.reader_hint_word),fontSize=12.sp,color=foreground)
                            Text(stringResource(R.string.reader_hint_sentence),fontSize=12.sp,color=foreground)
                            Text(stringResource(R.string.reader_hint_swipe),fontSize=12.sp,color=foreground)
                            TextButton(onClick=onHintDismiss,colors=ButtonDefaults.textButtonColors(contentColor=accent)) { Text(stringResource(R.string.anladim)) }
                        }
                    }
                    // The book's title sits quietly over the page, as in a printed book's running head.
                    Text(story.title,color=muted,fontSize=13.sp,fontFamily=FontFamily.Serif,letterSpacing=0.6.sp,textAlign=TextAlign.Center,modifier=Modifier.fillMaxWidth())
                    val listenLabel=stringResource(R.string.listen_from_sentence)
                    val translateLabel=stringResource(R.string.cumleyi_cevir)
                    val hideLabel=stringResource(R.string.ceviriyi_gizle)
                    // Only a story's own study words are underlined; with the general word list every line would be.
                    val curated=story.vocabulary!=null
                    // The page reads as running prose. A sentence whose translation is open ends its paragraph, so the
                    // translation sits right under it and the text carries on below.
                    val paragraphs=buildList {
                        var run=mutableListOf<StorySentence>()
                        pageSentences.forEach { run+=it; if(it.id in translations) { add(run.toList()); run=mutableListOf() } }
                        if(run.isNotEmpty()) add(run.toList())
                    }
                    paragraphs.forEachIndexed { index,paragraph -> key(page,paragraph.first().id) {
                        val first=pageSentences.indexOf(paragraph.first())
                        val reading=readingIndex?.let {pageSentences.getOrNull(it)}?.id
                        val actions=paragraph.flatMapIndexed { i,sentence ->
                            // With several sentences in one paragraph, each action names the sentence it acts on.
                            fun label(base: String)=if(paragraph.size==1) base else "$base: ${sentence.english.preview()}"
                            listOf(CustomAccessibilityAction(label(if(sentence.id in translations) hideLabel else translateLabel)) { toggleTranslation(sentence.id); true },
                                CustomAccessibilityAction(label(listenLabel)) { listen(first+i); true })
                        }
                        TappableParagraph(paragraph,{sentence -> if(curated) PhraseMatcher.Index(LearningContent.wordsForSentence(story,sentence)) else LearningContent.phraseIndex},
                            fontSize,foreground,Modifier.fillMaxWidth().appearIn(index).semantics {customActions=actions},LearningContent.glossary,lineSpacing=appearance.spacing.multiplier,
                            saved=snapshot.savedWordIds,underlineStudyWords=curated,savedTint=accent.copy(alpha=0.14f),
                            reading=reading,readingTint=accent.copy(alpha=0.18f),selected=selectedLink.takeIf {selectedWord!=null},selectedTint=accent.copy(alpha=0.28f),
                            // Long press translates the sentence; while the page is being read aloud it moves the reading there instead.
                            onLongPress={sentence -> if(narrator.speaking || narrator.preparing) listen(pageSentences.indexOf(sentence)) else toggleTranslation(sentence.id)}) { word,link ->
                            selectedWord=word; selectedLink=link; more=false; onLookup(word)
                        }
                        if(paragraph.last().id in translations) {
                            val translationSize=(fontSize-3).coerceAtLeast(13)
                            // A quiet line under the sentence: the English stays the main text.
                            Text(paragraph.last().translation,color=muted,fontSize=translationSize.sp,lineHeight=(translationSize*1.45f).sp,
                                modifier=Modifier.fillMaxWidth().appearIn().drawBehind {
                                    val bar=2.dp.toPx()
                                    val x=if(layoutDirection==androidx.compose.ui.unit.LayoutDirection.Rtl) size.width-bar else 0f
                                    drawRect(accent.copy(alpha=0.5f),topLeft=androidx.compose.ui.geometry.Offset(x,0f),size=androidx.compose.ui.geometry.Size(bar,size.height))
                                }.padding(start=14.dp,top=2.dp,bottom=2.dp))
                        }
                    } }
                }
                narrator.error?.let { Text(it,color=muted,fontSize=12.sp,modifier=Modifier.padding(horizontal=16.dp)) }
                // One slim progress line between the page actions, then the page turns: no stacked bars of controls.
                Row(Modifier.fillMaxWidth().padding(horizontal=8.dp),verticalAlignment=Alignment.CenterVertically) {
                    Box(Modifier.size(48.dp).contentLabel(stringResource(if(pageTranslated) R.string.page_translate_hide else R.string.page_translate)).clickable(role=Role.Button) {
                        if(pageTranslated) translations.removeAll(pageSentences.map {it.id}.toSet()) else pageSentences.forEach {if(it.id !in translations) translations.add(it.id)}
                    },contentAlignment=Alignment.Center) { ReferenceIcon("translate",if(pageTranslated) accent else muted,Modifier.size(24.dp).background(if(pageTranslated) accent.copy(alpha=0.14f) else Color.Transparent,RoundedCornerShape(6.dp))) }
                    Slider(value=page.toFloat(),onValueChange={changePage(it.toInt(),report=false)},onValueChangeFinished={reportProgress()},valueRange=0f..(pageCount-1).coerceAtLeast(1).toFloat(),steps=(pageCount-2).coerceAtLeast(0),modifier=Modifier.weight(1f).padding(horizontal=4.dp),
                        thumb={ Box(Modifier.size(12.dp).background(accent,CircleShape)) },
                        track={ val shown=if(pageCount>1) page.toFloat()/(pageCount-1) else 1f
                            Box(Modifier.fillMaxWidth().height(3.dp).background(palette.line,RoundedCornerShape(2.dp))) { Box(Modifier.fillMaxWidth(shown).height(3.dp).background(accent.copy(alpha=0.7f),RoundedCornerShape(2.dp))) } })
                    Text("${page+1} / $pageCount",style=LocalTextStyle.current.copy(textDirection=androidx.compose.ui.text.style.TextDirection.Ltr),color=muted,fontSize=12.sp,modifier=Modifier.padding(start=6.dp,end=2.dp))
                    Box(Modifier.size(48.dp).pulseWhile(narrator.speaking).contentLabel(if(narrator.speaking || narrator.preparing) stringResource(R.string.seslendirmeyi_durdur) else stringResource(R.string.sayfayi_dinle)).clickable(role=Role.Button) { if(narrator.speaking || narrator.preparing) { narrator.stop() } else { listen() } },contentAlignment=Alignment.Center) { if(narrator.speaking || narrator.preparing) Text("Ⅱ",color=accent,fontSize=25.sp) else ReferenceIcon("headphones",accent,Modifier.size(26.dp)) }
                }
                Row(Modifier.fillMaxWidth().padding(horizontal=8.dp),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically) {
                    TextButton(onClick={changePage(page-1)},enabled=page>0,modifier=Modifier.heightIn(min=48.dp),colors=ButtonDefaults.textButtonColors(contentColor=accent,disabledContentColor=muted.copy(alpha=0.5f))) { Text(stringResource(R.string.onceki),fontSize=15.sp) }
                    if(page==pageCount-1) Button(enabled=!completed,modifier=Modifier.heightIn(min=48.dp),colors=ButtonDefaults.buttonColors(containerColor=accent,contentColor=background),onClick={completed=true;narrator.stop();onComplete(timer.pause())}) { Text(stringResource(R.string.bitir),fontSize=15.sp) }
                    else TextButton(modifier=Modifier.heightIn(min=48.dp),colors=ButtonDefaults.textButtonColors(contentColor=accent),onClick={changePage(page+1)}) { Text(stringResource(R.string.sonraki),fontSize=15.sp,fontWeight=FontWeight.SemiBold) }
                }
            }
            if(options) ReaderAppearancePanel(appearance,appearanceError,onDismiss={options=false},onChange=::changeAppearance)
            selectedWord?.let { word ->
                // Like a book app's dictionary card: it opens on the half of the page away from the word.
                val below=touchY<screenHeight/2f
                val headerOffset=with(androidx.compose.ui.platform.LocalDensity.current) {52.dp.roundToPx()}
                Popup(alignment=if(below) Alignment.BottomCenter else Alignment.TopCenter,offset=IntOffset(0,if(below) 0 else headerOffset),onDismissRequest={selectedWord=null},properties=PopupProperties(focusable=true)) {
                    val still=reduceMotion()
                    val open=remember(word.id) {Animatable(if(still) 1f else 0.92f)}
                    LaunchedEffect(word.id) {open.animateTo(1f,spring(dampingRatio=0.7f,stiffness=Spring.StiffnessMedium))}
                    // Padding inside the popup window leaves room for the shadow instead of clipping it into a grey box.
                    Column(Modifier.padding(16.dp).widthIn(max=440.dp).fillMaxWidth().graphicsLayer {scaleX=open.value;scaleY=open.value;alpha=((open.value-0.92f)/0.08f).coerceIn(0f,1f)}
                        .shadow(18.dp,RoundedCornerShape(20.dp)).border(1.dp,palette.line,RoundedCornerShape(20.dp)).background(palette.surface,RoundedCornerShape(20.dp)).padding(bottom=14.dp)) {
                        val lookupOnly=Glossary.isLookupOnly(word)
                        val lemma=Glossary.lemmaOf(word)
                        Row(Modifier.fillMaxWidth().padding(start=20.dp,end=8.dp,top=8.dp),verticalAlignment=Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(word.word,fontSize=24.sp,fontFamily=FontFamily.Serif,fontWeight=FontWeight.SemiBold,color=foreground)
                                Text(if(lookupOnly && word.id !in snapshot.savedWordIds) stringResource(R.string.glossary_label) else if(word.id in snapshot.savedWordIds) stringResource(R.string.kayitli) else stringResource(R.string.kaydedilmedi),fontSize=11.sp,color=muted)
                            }
                            ReferenceIconButton("volume",stringResource(R.string.kelimesini_dinle, word.word),{narrator.speak(word.word)},tint=accent)
                        }
                        if(lookupOnly && !lemma.equals(word.word,ignoreCase=true)) Text(stringResource(R.string.glossary_lemma,lemma),fontSize=13.sp,color=muted,modifier=Modifier.padding(horizontal=20.dp))
                        Text(word.translation,fontSize=18.sp,color=foreground,modifier=Modifier.padding(horizontal=20.dp,vertical=8.dp))
                        if(word.pronunciation.isNotBlank() || word.example.isNotBlank()) TextButton(onClick={more=!more},modifier=Modifier.padding(horizontal=8.dp),colors=ButtonDefaults.textButtonColors(contentColor=accent)) { Text(if(more) word.pronunciation else stringResource(R.string.daha_fazla_goster)) }
                        if(more) Text(word.example,color=muted,fontSize=13.sp,fontFamily=FontFamily.Serif,modifier=Modifier.padding(horizontal=20.dp,vertical=4.dp))
                        Row(Modifier.fillMaxWidth().padding(start=16.dp,end=16.dp,top=8.dp),horizontalArrangement=Arrangement.spacedBy(10.dp)) {
                            OutlinedButton(onClick={selectedWord=null},modifier=Modifier.weight(1f).heightIn(min=48.dp),border=BorderStroke(1.dp,palette.line),colors=ButtonDefaults.outlinedButtonColors(contentColor=foreground)) { Text(stringResource(R.string.kapat),fontSize=15.sp) }
                            // A glossary word is saved in its dictionary form with its meaning (Q4.3a).
                            Button(onClick={
                                val wasSaved=word.id in snapshot.savedWordIds
                                if(lookupOnly) onSaveGlossaryWord(WordInfo(word.id,lemma,word.translation,"","")) else onSaveWord(word.id); selectedWord=null
                                if(wasSaved) alerts.show(removedText(word.word),TaleAlertKind.Info) else alerts.success(savedText(if(lookupOnly) lemma else word.word))
                            },modifier=Modifier.weight(1f).heightIn(min=48.dp),colors=ButtonDefaults.buttonColors(containerColor=accent,contentColor=background)) { Text(if(word.id in snapshot.savedWordIds) stringResource(R.string.kaldir) else stringResource(R.string.ogren_2),fontSize=15.sp,fontWeight=FontWeight.SemiBold) }
                        }
                    }
                }
            }
        }
    }
}

/** The first few words of a sentence, enough for a spoken action label to say which sentence it is. */
private fun String.preview(words: Int=4)=split(' ').let {if(it.size<=words) this else it.take(words).joinToString(" ")+"…"}

/**
 * A run of sentences set as one paragraph. Every known word or phrase is a link; a long press lands on the
 * sentence under the finger. [reading] and [selected] mark the sentence being read aloud and the tapped word.
 */
@Composable
private fun TappableParagraph(sentences: List<StorySentence>,phrasesFor: (StorySentence)->PhraseMatcher.Index,fontSize: Int,color: Color,modifier: Modifier=Modifier,
    glossary: Glossary?=null,lineSpacing: Float=1.65f,saved: Set<String> = emptySet(),underlineStudyWords: Boolean=true,savedTint: Color=Color.Transparent,
    reading: String?=null,readingTint: Color=Color.Transparent,selected: String?=null,selectedTint: Color=Color.Transparent,
    onLongPress: (StorySentence)->Unit,onWord: (WordInfo,String)->Unit) {
    // Where each sentence starts in the paragraph, and its links with paragraph-wide offsets.
    val layout=remember(sentences,glossary) {
        var base=0
        sentences.map { sentence ->
            val matches=PhraseMatcher.find(sentence.english,phrasesFor(sentence))
            val links=(matches.map {Triple(it.start,it.end,it.word)}+glossary?.spans(sentence.english,matches).orEmpty().map {Triple(it.start,it.end,it.word)}).sortedBy {it.first}
            Triple(sentence,base,links).also {base+=sentence.english.length+1}
        }
    }
    val currentOnWord by rememberUpdatedState(onWord)
    val currentOnLongPress by rememberUpdatedState(onLongPress)
    // Each word/phrase is a link: tappable and exposed to accessibility services as its own element.
    val annotated=remember(layout,color,saved,underlineStudyWords,savedTint,reading,readingTint,selected,selectedTint) {
        buildAnnotatedString {
            layout.forEachIndexed { i,(sentence,base,links) ->
                if(i>0) append(' ')
                val sentenceStart=length
                var cursor=0
                links.forEach { (start,end,word) ->
                    append(sentence.english.substring(cursor,start))
                    val key=word.id+"@"+(base+start)
                    val style=when {
                        key==selected -> SpanStyle(color=color,background=selectedTint)
                        word.id in saved -> SpanStyle(color=color,background=savedTint,textDecoration=TextDecoration.Underline)
                        underlineStudyWords && !Glossary.isLookupOnly(word) -> SpanStyle(color=color,textDecoration=TextDecoration.Underline)
                        else -> SpanStyle(color=color)
                    }
                    withLink(LinkAnnotation.Clickable(key,TextLinkStyles(style)) {currentOnWord(word,key)}) {
                        append(sentence.english.substring(start,end))
                    }
                    cursor=end
                }
                append(sentence.english.substring(cursor))
                if(sentence.id==reading) addStyle(SpanStyle(background=readingTint),sentenceStart,length)
            }
        }
    }
    var textLayout by remember { mutableStateOf<TextLayoutResult?>(null) }
    // Almost every word is a link, so the long press is watched before the links see the touch; once it fires,
    // the rest of the touch is swallowed and the word under the finger does not open as well.
    Box(modifier.pointerInput(layout) { awaitEachGesture {
        val down=awaitFirstDown(requireUnconsumed=false,pass=PointerEventPass.Initial)
        val released=withTimeoutOrNull(viewConfiguration.longPressTimeoutMillis) {
            while(true) {
                val change=awaitPointerEvent(PointerEventPass.Initial).changes.firstOrNull {it.id==down.id} ?: break
                if(!change.pressed || (change.position-down.position).getDistance()>viewConfiguration.touchSlop) break
            }
        }
        if(released==null) {
            textLayout?.getOffsetForPosition(down.position)?.let {offset -> layout.lastOrNull {it.second<=offset}?.let {currentOnLongPress(it.first)}}
            do { val event=awaitPointerEvent(PointerEventPass.Initial); event.changes.forEach {it.consume()} } while(event.changes.any {it.pressed})
        }
    } }) {
        Text(text=annotated,onTextLayout={textLayout=it},style=TextStyle(fontSize=fontSize.sp,lineHeight=(fontSize*lineSpacing).sp,fontFamily=FontFamily.Serif,color=color,
            textDirection=androidx.compose.ui.text.style.TextDirection.Ltr,textAlign=TextAlign.Left))
    }
}
