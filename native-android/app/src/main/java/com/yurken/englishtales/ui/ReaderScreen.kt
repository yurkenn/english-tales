package com.yurken.englishtales.ui

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

internal open class Narrator(context: Context, private val focus: NarrationFocus = SystemNarrationFocus(context)) {
    private val appContext = context.applicationContext
    private var engine: TextToSpeech? = null
    private var ready = false
    private var closed = false
    private var pending: String? = null
    private var utteranceNumber = 0
    private var activeId: String? = null
    private val main = Handler(Looper.getMainLooper())
    var preparing by mutableStateOf(false)
        private set
    var speaking by mutableStateOf(false)
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
                        pending?.let { speak(it) }
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
            override fun onStart(id: String?) { main.post { if (!closed && id == activeId) speaking = true } }
            override fun onDone(id: String?) { main.post { if (!closed && id == activeId) { speaking = false; activeId = null; focus.abandon() } } }
            override fun onStop(id: String?, interrupted: Boolean) { main.post { if (!closed && id == activeId) { speaking = false; activeId = null; focus.abandon() } } }
            @Deprecated("Required callback for older Android engines")
            override fun onError(id: String?) { main.post { if (!closed && id == activeId) { speaking = false; activeId = null; focus.abandon(); error = appContext.getString(R.string.seslendirme_tamamlanamadi) } } }
        })
    }

    fun speak(text: String) {
        if (closed) return
        if (!ready) { if (error == null) {pending = text;preparing = true}; return }
        if (!focus.request()) { error = appContext.getString(R.string.ses_su_anda_baska_bir); return }
        error = null
        activeId = "english-tales-${++utteranceNumber}"
        speaking = engine?.speak(text, TextToSpeech.QUEUE_FLUSH, null, activeId) == TextToSpeech.SUCCESS
        if (!speaking) { error = appContext.getString(R.string.seslendirme_baslatilamadi); focus.abandon() }
    }
    open fun stop() { preparing = false; pending = null; activeId = null; engine?.stop(); speaking = false; focus.abandon() }
    fun close() { preparing = false; closed = true; pending = null; activeId = null; engine?.shutdown(); focus.abandon(); main.removeCallbacksAndMessages(null) }
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
fun ReaderScreen(story: Story, snapshot: LearningSnapshot, onBack: () -> Unit, onSaveWord: (String) -> Unit, onProgress: (Int,String) -> Unit, autoListen: Boolean=false, onComplete: (Long)->Unit, onHintDismiss: ()->Unit,sessionId: String,onCheckpoint: (String,Long)->Unit,onOpenWords: ()->Unit={},appearanceStore: ReadingPreferencesStore?=null) {
    val context=LocalContext.current
    val narrator=rememberNarrator()
    val pageCount=(story.sentences.size+SENTENCES_PER_PAGE-1)/SENTENCES_PER_PAGE
    val saved=snapshot.progressFor(story)
    val position=snapshot.readingPositions[story.id]?.takeIf {it.carriesTo(story)}
    val sentenceIndex=position?.let {p ->story.sentences.indexOfFirst {it.id==p.sentenceId}}?.takeIf {it>=0}
    var page by rememberSaveable(story.revisionId) { mutableIntStateOf((sentenceIndex?.div(SENTENCES_PER_PAGE)?:(((if(saved==100) 0 else saved)*story.sentences.size+99)/100/SENTENCES_PER_PAGE)).coerceIn(0,pageCount-1)) }
    val timer=rememberActiveLearningTime(sessionId,snapshot.activeSessionMillis[sessionId]?:0,true,onCheckpoint)
    var completed by rememberSaveable(sessionId) {mutableStateOf(false)}
    val preferences=remember(context,appearanceStore) {appearanceStore?:ReadingPreferencesStore(context)}
    var appearance by remember(preferences) {mutableStateOf(preferences.read())}
    var appearanceError by remember {mutableStateOf<String?>(null)}
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
    val dark=appearance.dark
    val fontSize=appearance.fontSize
    var options by remember { mutableStateOf(false) }
    var selectedWord by remember { mutableStateOf<WordInfo?>(null) }
    var more by remember { mutableStateOf(false) }
    val translations=remember(story.id) { mutableStateListOf<String>() }
    val pageSentences=story.sentences.drop(page*SENTENCES_PER_PAGE).take(SENTENCES_PER_PAGE)
    val scroll=rememberScrollState()
    // The reader follows its own light/dark choice, independent of the system theme.
    TaleColorTheme(if(dark) DarkTaleColors else LightTaleColors) {
        val background=if(dark) Color(0xFF080808) else Color.White
        val foreground=if(dark) Color.White else TaleInk
        val accent=if(dark) Color(0xFF7DD3FC) else TaleBlue
        val muted=if(dark) Color(0xFFB7C5D7) else TaleMuted
        LaunchedEffect(page) { scroll.scrollTo(0) }
        LaunchedEffect(autoListen) { if(autoListen) { narrator.speak(pageSentences.joinToString(" ") { it.english }) } }
        fun changePage(next: Int) {
            val target=next.coerceIn(0,pageCount-1)
            if(target==page) return
            narrator.stop(); page=target
            onProgress((page*SENTENCES_PER_PAGE*100/story.sentences.size).coerceAtMost(99),story.sentences[page*SENTENCES_PER_PAGE].id)
        }
        Box(Modifier.fillMaxSize().background(background).statusBarsPadding().navigationBarsPadding()) {
            Column(Modifier.fillMaxSize()) {
                Row(Modifier.fillMaxWidth().heightIn(min=52.dp).padding(horizontal=14.dp),verticalAlignment=Alignment.CenterVertically) {
                    ReferenceIconButton("back",stringResource(R.string.geri),{narrator.stop();onBack()},tint=accent)
                    Spacer(Modifier.weight(1f))
                    TextButton(onClick={options=true},colors=ButtonDefaults.textButtonColors(contentColor=accent),modifier=Modifier.contentLabel(stringResource(R.string.okuma_gorunumu))) {
                        Text(stringResource(R.string.aa),fontSize=22.sp)
                    }
                    Row(Modifier.heightIn(min=48.dp).contentLabel(stringResource(R.string.kelimelerim_kayitli_kelime_2, snapshot.savedWordIds.size)).clickable(role=Role.Button) {narrator.stop();onOpenWords()}.background(if(dark) Color(0xFF222222) else TaleLine,RoundedCornerShape(8.dp)).padding(8.dp),verticalAlignment=Alignment.CenterVertically) {
                        ReferenceIcon("cards",muted,Modifier.size(19.dp)); Spacer(Modifier.width(5.dp)); Text("${snapshot.savedWordIds.size}",color=muted,fontSize=14.sp)
                    }
                }
                Column(Modifier.weight(1f).verticalScroll(scroll).padding(start=24.dp,end=12.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
                    if(!snapshot.readerHintSeen) {
                        Column(Modifier.fillMaxWidth().background(accent.copy(alpha=0.08f),RoundedCornerShape(10.dp)).padding(12.dp)) {
                            Text(stringResource(R.string.okurken_ogren),fontWeight=FontWeight.Bold,fontSize=14.sp,color=accent)
                            Text(stringResource(R.string.alti_cizili_kelimeye_dokun_ve),fontSize=12.sp,color=foreground)
                            TextButton(onClick=onHintDismiss,colors=ButtonDefaults.textButtonColors(contentColor=accent)) { Text(stringResource(R.string.anladim)) }
                        }
                    }
                    Text("${page+1}.",fontFamily=FontFamily.Serif,fontSize=18.sp,color=foreground,modifier=Modifier.align(Alignment.CenterHorizontally).padding(vertical=9.dp))
                    pageSentences.forEach { sentence ->
                        Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.Top,horizontalArrangement=Arrangement.spacedBy(12.dp)) {
                            val phrases=if(story.vocabulary!=null) remember(story.revisionId,sentence.id) {PhraseMatcher.Index(LearningContent.wordsForSentence(story,sentence))} else LearningContent.phraseIndex
                            TappableSentence(sentence,fontSize,foreground,Modifier.weight(1f),phrases,lineSpacing=appearance.spacing.multiplier) { selectedWord=it; more=false }
                            Box(Modifier.size(32.dp).contentLabel(if(sentence.id in translations) stringResource(R.string.ceviriyi_gizle) else stringResource(R.string.cumleyi_cevir)).clickable(role=Role.Button) { if(sentence.id in translations) translations.remove(sentence.id) else translations.add(sentence.id) },contentAlignment=Alignment.Center) { ReferenceIcon("translate",if(sentence.id in translations) accent else muted,Modifier.size(23.dp)) }
                        }
                        if(sentence.id in translations) Text(sentence.translation,color=TaleOnBlue,fontSize=13.sp,lineHeight=19.sp,
                            modifier=Modifier.fillMaxWidth().padding(end=36.dp).background(TaleBlue,RoundedCornerShape(4.dp)).padding(10.dp))
                    }
                }
                narrator.error?.let { Text(it,color=muted,fontSize=12.sp,modifier=Modifier.padding(horizontal=16.dp)) }
                Text("${page+1} / $pageCount",color=muted,fontSize=12.sp,modifier=Modifier.align(Alignment.CenterHorizontally).padding(top=12.dp,bottom=4.dp))
                Row(Modifier.fillMaxWidth().padding(horizontal=16.dp),verticalAlignment=Alignment.CenterVertically) {
                    Slider(value=page.toFloat(),onValueChange={changePage(it.toInt())},valueRange=0f..(pageCount-1).coerceAtLeast(1).toFloat(),steps=(pageCount-2).coerceAtLeast(0),modifier=Modifier.weight(1f),thumb={ Box(Modifier.size(12.dp).background(TaleBlue,CircleShape)) },track={ ReferenceProgress(if(pageCount>1) page.toFloat()/(pageCount-1) else 1f,Modifier.fillMaxWidth(),accent) })
                    Box(Modifier.size(48.dp).contentLabel(if(narrator.speaking || narrator.preparing) stringResource(R.string.seslendirmeyi_durdur) else stringResource(R.string.sayfayi_dinle)).clickable(role=Role.Button) { if(narrator.speaking || narrator.preparing) { narrator.stop() } else { narrator.speak(pageSentences.joinToString(" ") {it.english}) } },contentAlignment=Alignment.Center) { if(narrator.speaking || narrator.preparing) Text("Ⅱ",color=accent,fontSize=25.sp) else ReferenceIcon("headphones",accent,Modifier.size(26.dp)) }
                }
                Row(Modifier.fillMaxWidth().padding(horizontal=16.dp),horizontalArrangement=Arrangement.SpaceBetween) {
                    TextButton(onClick={changePage(page-1)},enabled=page>0,colors=ButtonDefaults.textButtonColors(contentColor=accent)) { Text(stringResource(R.string.onceki),fontSize=12.sp) }
                    TextButton(enabled=!completed,colors=ButtonDefaults.textButtonColors(contentColor=accent),onClick={ if(page==pageCount-1) {completed=true;narrator.stop();onComplete(timer.pause())} else changePage(page+1) }) { Text(if(page==pageCount-1) stringResource(R.string.bitir) else stringResource(R.string.sonraki),fontSize=12.sp) }
                }
            }
            if(options) ReaderAppearancePanel(appearance,appearanceError,onDismiss={options=false},onChange=::changeAppearance)
            selectedWord?.let { word ->
                Popup(alignment=Alignment.TopCenter,offset=IntOffset(0,130),onDismissRequest={selectedWord=null},properties=PopupProperties(focusable=true)) {
                    Column(Modifier.width(260.dp).border(1.dp,TaleMuted.copy(alpha=0.5f),RoundedCornerShape(12.dp)).background(TaleSurface,RoundedCornerShape(12.dp))) {
                        Row(Modifier.fillMaxWidth().padding(16.dp),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically) {
                            ReferenceIconButton("volume",stringResource(R.string.kelimesini_dinle, word.word),{narrator.speak(word.word)})
                            Text(word.word,fontSize=20.sp,fontWeight=FontWeight.Bold)
                            Text(if(word.id in snapshot.savedWordIds) stringResource(R.string.kayitli) else stringResource(R.string.kaydedilmedi),fontSize=11.sp,color=TaleMuted)
                        }
                        Text(word.translation,fontSize=18.sp,modifier=Modifier.align(Alignment.CenterHorizontally).padding(4.dp))
                        TextButton(onClick={more=!more},modifier=Modifier.align(Alignment.CenterHorizontally)) { Text(if(more) word.pronunciation else stringResource(R.string.daha_fazla_goster),textDecoration=TextDecoration.Underline) }
                        if(more) Text(word.example,color=TaleMuted,fontSize=12.sp,modifier=Modifier.padding(horizontal=16.dp,vertical=8.dp))
                        Row(Modifier.fillMaxWidth().background(TaleBlue,RoundedCornerShape(bottomStart=12.dp,bottomEnd=12.dp))) {
                            Box(Modifier.weight(1f).height(45.dp).clickable(role=Role.Button) { selectedWord=null },contentAlignment=Alignment.Center) { Text(stringResource(R.string.kapat),color=TaleOnBlue,fontSize=16.sp,fontWeight=FontWeight.Bold) }
                            Box(Modifier.width(1.dp).height(28.dp).align(Alignment.CenterVertically).background(TaleOnBlue.copy(alpha=0.65f)))
                            Box(Modifier.weight(1f).height(45.dp).clickable(role=Role.Button) { onSaveWord(word.id); selectedWord=null },contentAlignment=Alignment.Center) { Text(if(word.id in snapshot.savedWordIds) stringResource(R.string.kaldir) else stringResource(R.string.ogren_2),color=TaleOnBlue,fontSize=16.sp,fontWeight=FontWeight.Bold) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TappableSentence(sentence: StorySentence,fontSize: Int,color: Color,modifier: Modifier=Modifier,phrases: PhraseMatcher.Index,lineSpacing: Float=1.65f,onWord: (WordInfo)->Unit) {
    val matches=remember(sentence,phrases) {PhraseMatcher.find(sentence.english,phrases)}
    val currentOnWord by rememberUpdatedState(onWord)
    // Each word/phrase is a link: tappable and exposed to accessibility services as its own element.
    val annotated=remember(sentence,color,matches) {
        buildAnnotatedString {
            var cursor=0
            matches.forEach { match ->
                append(sentence.english.substring(cursor,match.start))
                withLink(LinkAnnotation.Clickable(match.word.id,TextLinkStyles(SpanStyle(color=color,textDecoration=TextDecoration.Underline))) {currentOnWord(match.word)}) {
                    append(sentence.english.substring(match.start,match.end))
                }
                cursor=match.end
            }
            append(sentence.english.substring(cursor))
        }
    }
    Text(text=annotated,modifier=modifier,style=TextStyle(fontSize=fontSize.sp,lineHeight=(fontSize*lineSpacing).sp,fontFamily=FontFamily.Serif,color=color))
}
