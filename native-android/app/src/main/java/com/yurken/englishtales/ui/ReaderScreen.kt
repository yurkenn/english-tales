package com.yurken.englishtales.ui

import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.draw.shadow
import androidx.compose.animation.core.*
import androidx.compose.animation.*
import android.content.Context
import androidx.compose.ui.semantics.Role
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
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
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.clip
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

import kotlinx.coroutines.launch
import kotlinx.coroutines.CancellationException

/** The sentence the reader opens on. A finished story starts over: completion stores its last sentence as the position. */
internal fun initialReaderSentence(story: Story, snapshot: LearningSnapshot): Int {
    val saved=snapshot.progressFor(story)
    if(saved==100) return 0
    val position=snapshot.readingPositions[story.id]?.takeIf {it.carriesTo(story)}
    val sentenceIndex=position?.let {p ->story.sentences.indexOfFirst {it.id==p.sentenceId}}?.takeIf {it>=0}
    return (sentenceIndex?:((saved*story.sentences.size+99)/100)).coerceIn(0,(story.sentences.size-1).coerceAtLeast(0))
}

/**
 * Where each page starts. A page takes as many sentences as [fits] says the screen holds, and always at least one,
 * so short A1 sentences fill the page instead of leaving half of it empty.
 */
internal fun readerPageStarts(count: Int,fits: (from: Int,to: Int)->Boolean): List<Int> = buildList {
    var start=0
    while(start<count) {
        add(start)
        var end=start+1
        while(end<count && fits(start,end+1)) end++
        start=end
    }
}.ifEmpty {listOf(0)}

/**
 * Pages cut as evenly as their count allows: the room each page offers shrinks by [fits]'s slack for as long as the
 * story still needs no extra page, so sentences spread over the pages instead of leaving the last one a stub.
 */
internal fun balancedPageStarts(count: Int,maxSlack: Int,fits: (from: Int,to: Int,slack: Int)->Boolean): List<Int> {
    fun cut(slack: Int)=readerPageStarts(count) {from,to -> fits(from,to,slack)}
    val pages=cut(0).size
    var low=0; var high=maxSlack.coerceAtLeast(0)
    while(low<high) { val mid=(low+high+1)/2; if(cut(mid).size==pages) low=mid else high=mid-1 }
    return cut(low)
}

// Like a book app's reading page: roomy margins and each sentence set apart on its own line, as its own small paragraph.
private val PageStartPadding=32.dp
private val PageEndPadding=16.dp
private val RowGap=20.dp
private val SentenceButtonSize=48.dp
private val SentenceButtonGap=10.dp

/** The page text's style, shared by the page and the measuring that decides how much of it fits. */
private fun readerTextStyle(fontSize: Int,lineSpacing: Float,font: ReadingFont,color: Color=Color.Unspecified)=TextStyle(fontSize=fontSize.sp,lineHeight=(fontSize*lineSpacing).sp,
    fontFamily=font.body,color=color,textDirection=androidx.compose.ui.text.style.TextDirection.Ltr,textAlign=TextAlign.Left)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ReaderScreen(story: Story, snapshot: LearningSnapshot, onBack: () -> Unit, onSaveWord: (String) -> Unit, onProgress: (Int,String) -> Unit, autoListen: Boolean=false, onComplete: (Long)->Unit, onHintDismiss: ()->Unit,sessionId: String,onCheckpoint: (String,Long)->Unit,onOpenWords: ()->Unit={},appearanceStore: ReadingPreferencesStore?=null,onSaveGlossaryWord: (WordInfo)->Unit={},onLookup: (WordInfo)->Unit={},narratorFactory: (Context)->Narrator=::Narrator,pageFits: ((from: Int,to: Int)->Boolean)?=null) {
    val context=LocalContext.current
    val narrator=rememberNarrator(narratorFactory)
    // The reader keeps its place by sentence, not by page: a new font size or a rotation repaginates and the
    // page holding this sentence stays on screen.
    var anchor by rememberSaveable(story.revisionId) { mutableIntStateOf(initialReaderSentence(story,snapshot)) }
    // Scrubbing the slider only moves the page on screen; the position is reported once the drag ends,
    // so a long scrub writes one progress event instead of one per page crossed.
    var reportedAnchor by rememberSaveable(story.revisionId) { mutableIntStateOf(anchor) }
    fun reportProgress() {
        if(anchor==reportedAnchor) return
        reportedAnchor=anchor
        onProgress((anchor*100/story.sentences.size).coerceAtMost(99),story.sentences[anchor].id)
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
    // The sentence the tapped word came from; the card shows its translation for context.
    var selectedSentence by remember { mutableStateOf<StorySentence?>(null) }
    var more by remember { mutableStateOf(false) }
    val translations=remember(story.id) { mutableStateListOf<String>() }
    // The page area's size, known after the first layout; pages are cut to fill it at the chosen font size and spacing.
    var viewport by remember { mutableStateOf(androidx.compose.ui.unit.IntSize.Zero) }
    val measurer=androidx.compose.ui.text.rememberTextMeasurer()
    val density=androidx.compose.ui.platform.LocalDensity.current
    val titleStyle=LocalTextStyle.current.merge(TextStyle(fontSize=13.sp,fontFamily=appearance.font.body,letterSpacing=0.6.sp,textAlign=TextAlign.Center))
    // The first page opens under the story's title set large, as a book's chapter opens; later pages carry it as a quiet running head.
    val headingStyle=TextStyle(fontSize=(fontSize+9).sp,lineHeight=((fontSize+9)*1.25f).sp,fontFamily=appearance.font.heading,fontWeight=FontWeight.Bold,textAlign=TextAlign.Center)
    val pageStarts=remember(story.revisionId,viewport,fontSize,appearance.spacing,density,titleStyle,headingStyle,pageFits) {
        if(viewport.height==0) return@remember null
        // Tests can fix how many sentences a page holds; the app measures it.
        pageFits?.let {return@remember readerPageStarts(story.sentences.size,it)}
        with(density) {
            val width=(viewport.width-(PageStartPadding+PageEndPadding).roundToPx()).coerceAtLeast(1)
            fun height(text: String,style: TextStyle,maxWidth: Int=width)=measurer.measure(text,style,constraints=androidx.compose.ui.unit.Constraints(maxWidth=maxWidth.coerceAtLeast(1))).size.height
            // The page's padding, its running head and the gap under it come off the room the sentences get.
            val gap=RowGap.roundToPx()
            val page=viewport.height-12.dp.roundToPx()-24.dp.roundToPx()-gap
            val firstRoom=page-height(story.title,headingStyle)
            val room=page-height(story.title,titleStyle)
            val style=readerTextStyle(fontSize,appearance.spacing.multiplier,appearance.font)
            // A sentence's line is as tall as its text, and never shorter than its translate button.
            val textWidth=width-(SentenceButtonSize+SentenceButtonGap).roundToPx()
            val button=SentenceButtonSize.roundToPx()
            val rows=story.sentences.map {maxOf(height(it.english,style,textWidth),button)}
            val below=rows.runningFold(0) {sum,row -> sum+row+gap}
            balancedPageStarts(story.sentences.size,room) {from,to,slack -> below[to]-below[from]-gap<=(if(from==0) firstRoom else room)-slack}
        }
    }
    val starts=pageStarts?:listOf(0)
    val pageCount=starts.size
    val page=starts.indexOfLast {it<=anchor}.coerceAtLeast(0)
    val pageStart=starts[page]
    val pageSentences=if(pageStarts==null) emptyList() else story.sentences.subList(pageStart,starts.getOrNull(page+1)?:story.sentences.size)
    val scroll=rememberScrollState()
    // The reader follows its own page theme, independent of the system theme; sepia is a light page.
    TaleColorTheme(if(appearance.dark) DarkTaleColors else LightTaleColors) {
        val background=palette.background
        val foreground=palette.foreground
        val accent=palette.accent
        val muted=palette.muted
        LaunchedEffect(pageStart) { scroll.scrollTo(0) }
        // Each sentence is its own utterance, so the one being read can be highlighted (Q4.8).
        var narrationFrom by remember { mutableIntStateOf(0) }
        fun listen(from: Int=0) { narrationFrom=from; narrator.speakAll(pageSentences.drop(from).map { it.english }) }
        val readingIndex=narrator.spokenIndex?.let { narrationFrom+it }
        // Starts once per reader visit: a rotation or restore must not restart speech the learner paused.
        var autoListened by rememberSaveable(story.revisionId) { mutableStateOf(false) }
        LaunchedEffect(autoListen,pageStarts!=null) { if(autoListen && !autoListened && pageStarts!=null) { autoListened=true;listen() } }
        fun changePage(next: Int,report: Boolean=true) {
            val target=next.coerceIn(0,pageCount-1)
            if(target==page) return
            narrator.stop(); anchor=starts[target]
            if(report) reportProgress()
        }
        fun toggleTranslation(id: String) { if(id in translations) translations.remove(id) else translations.add(id) }
        val pageTranslated=pageSentences.isNotEmpty() && pageSentences.all {it.id in translations}
        // A sideways swipe turns the page, like a book; the threshold keeps a vertical scroll from flipping it.
        val swipeThreshold=with(androidx.compose.ui.platform.LocalDensity.current) {72.dp.toPx()}
        // Where the last touch on the text landed decides whether the word card opens above or below it, so it never hides the word.
        var touchY by remember { mutableFloatStateOf(0f) }
        var screenHeight by remember { mutableIntStateOf(0) }
        Box(Modifier.fillMaxSize().background(background).onSizeChanged {screenHeight=it.height}.statusBarsPadding().navigationBarsPadding()) {
            // On tablets and in landscape the page keeps a book-like line length instead of spanning the screen.
            Column(Modifier.fillMaxHeight().centeredWidth(ReadingWidth)) {
                Row(Modifier.fillMaxWidth().heightIn(min=52.dp).padding(horizontal=14.dp),verticalAlignment=Alignment.CenterVertically) {
                    ReferenceIconButton("back",stringResource(R.string.geri),{narrator.stop();onBack()},tint=accent)
                    // How much of the story is behind the reader, as a game's level bar; the slider below still turns pages.
                    val through=(starts.getOrNull(page+1)?:story.sentences.size).toFloat()/story.sentences.size.coerceAtLeast(1)
                    ReferenceProgress(through,Modifier.weight(1f).padding(horizontal=8.dp),TaleGreen,palette.line,12.dp)
                    TextButton(onClick={options=true},colors=ButtonDefaults.textButtonColors(contentColor=accent),modifier=Modifier.contentLabel(stringResource(R.string.okuma_gorunumu))) {
                        Text(stringResource(R.string.aa),fontSize=20.sp,fontFamily=FontFamily.Serif)
                    }
                    Row(Modifier.heightIn(min=48.dp).contentLabel(stringResource(R.string.kelimelerim_kayitli_kelime_2, snapshot.savedWordIds.size)).clickable(role=Role.Button) {narrator.stop();onOpenWords()}.padding(horizontal=6.dp),verticalAlignment=Alignment.CenterVertically) {
                        ReferenceIcon("cards",muted,Modifier.size(19.dp)); Spacer(Modifier.width(5.dp)); Text("${snapshot.savedWordIds.size}",color=muted,fontSize=14.sp)
                    }
                }
                Column(Modifier.weight(1f).onSizeChanged {viewport=it}.pointerInput(starts,page) {
                        var drag=0f
                        detectHorizontalDragGestures(onDragStart={drag=0f},onDragEnd={
                            if(drag<=-swipeThreshold) changePage(page+1) else if(drag>=swipeThreshold) changePage(page-1)
                        }) {change,amount -> drag+=amount; change.consume()}
                    }.verticalScroll(scroll).heightIn(min=with(density) {viewport.height.toDp()}).padding(start=PageStartPadding,end=PageEndPadding,top=12.dp,bottom=24.dp),
                    // The page's lines sit in the middle of the page, so a page that is not quite full still looks balanced.
                    verticalArrangement=Arrangement.spacedBy(RowGap,Alignment.CenterVertically)) {
                    if(!snapshot.readerHintSeen) {
                        Column(Modifier.fillMaxWidth().appearIn().background(accent.copy(alpha=0.08f),RoundedCornerShape(14.dp)).border(1.dp,accent.copy(alpha=0.25f),RoundedCornerShape(14.dp)).padding(14.dp)) {
                            Text(stringResource(R.string.okurken_ogren),fontWeight=FontWeight.Bold,fontSize=14.sp,color=accent)
                            Text(stringResource(R.string.reader_hint_word),fontSize=12.sp,color=foreground)
                            Text(stringResource(R.string.reader_hint_sentence),fontSize=12.sp,color=foreground)
                            Text(stringResource(R.string.reader_hint_swipe),fontSize=12.sp,color=foreground)
                            TextButton(onClick=onHintDismiss,colors=ButtonDefaults.textButtonColors(contentColor=accent)) { Text(stringResource(R.string.anladim)) }
                        }
                    }
                    if(pageStart==0) Text(story.title,color=foreground,style=headingStyle,modifier=Modifier.fillMaxWidth())
                    // Later pages carry the book's title quietly, as in a printed book's running head.
                    else Text(story.title,color=muted,style=titleStyle,modifier=Modifier.fillMaxWidth())
                    val listenLabel=stringResource(R.string.listen_from_sentence)
                    val translateLabel=stringResource(R.string.cumleyi_cevir)
                    val hideLabel=stringResource(R.string.ceviriyi_gizle)
                    // Only a story's own study words are underlined; with the general word list every line would be.
                    val curated=story.vocabulary!=null
                    val reading=readingIndex?.let {pageSentences.getOrNull(it)}?.id
                    // Each sentence has its own line with its translate button beside it; an open translation sits right under it.
                    pageSentences.forEachIndexed { index,sentence -> key(pageStart,sentence.id) {
                        val translated=sentence.id in translations
                        Column(Modifier.fillMaxWidth().appearIn(index)) {
                            Row(verticalAlignment=Alignment.CenterVertically) {
                                TappableParagraph(listOf(sentence),{if(curated) PhraseMatcher.Index(LearningContent.wordsForSentence(story,it)) else LearningContent.phraseIndex},
                                    fontSize,foreground,Modifier.weight(1f).semantics {customActions=listOf(CustomAccessibilityAction(listenLabel) { listen(index); true })},
                                    LearningContent.glossary,lineSpacing=appearance.spacing.multiplier,font=appearance.font,
                                    saved=snapshot.savedWordIds,underlineStudyWords=curated,savedTint=accent.copy(alpha=0.14f),
                                    reading=reading,readingTint=accent.copy(alpha=0.18f),selected=selectedLink.takeIf {selectedWord!=null},selectedTint=accent.copy(alpha=0.28f),
                                    // Long press translates the sentence; while the page is being read aloud it moves the reading there instead.
                                    onPress={touchY=it},onLongPress={if(narrator.speaking || narrator.preparing) listen(index) else toggleTranslation(sentence.id)}) { word,link ->
                                    selectedWord=word; selectedLink=link; selectedSentence=sentence; more=false; onLookup(word)
                                }
                                Spacer(Modifier.width(SentenceButtonGap))
                                Box(Modifier.size(SentenceButtonSize).clip(RoundedCornerShape(12.dp)).background(if(translated) accent.copy(alpha=0.14f) else Color.Transparent)
                                    .border(1.dp,if(translated) accent.copy(alpha=0.5f) else palette.line,RoundedCornerShape(12.dp))
                                    .contentLabel(if(translated) hideLabel else translateLabel).clickable(role=Role.Button) {toggleTranslation(sentence.id)},
                                    contentAlignment=Alignment.Center) { ReferenceIcon("translate",accent,Modifier.size(22.dp)) }
                            }
                            if(translated) {
                                val translationSize=(fontSize-3).coerceAtLeast(13)
                                // A quiet line under the sentence: the English stays the main text.
                                Text(sentence.translation,color=muted,fontSize=translationSize.sp,lineHeight=(translationSize*1.45f).sp,
                                    modifier=Modifier.padding(end=SentenceButtonSize+SentenceButtonGap).fillMaxWidth().appearIn().drawBehind {
                                        val bar=2.dp.toPx()
                                        val x=if(layoutDirection==androidx.compose.ui.unit.LayoutDirection.Rtl) size.width-bar else 0f
                                        drawRect(accent.copy(alpha=0.5f),topLeft=androidx.compose.ui.geometry.Offset(x,0f),size=androidx.compose.ui.geometry.Size(bar,size.height))
                                    }.padding(start=14.dp,top=6.dp,bottom=2.dp))
                            }
                        }
                    } }
                }
                narrator.error?.let { Text(it,color=muted,fontSize=12.sp,modifier=Modifier.padding(horizontal=16.dp)) }
                // One slim progress line beside the page actions, then the page turns: no stacked bars of controls.
                // The slider leads the row, so a drag that starts at its very edge lands on it and not on a button.
                Row(Modifier.fillMaxWidth().padding(start=16.dp,end=8.dp),verticalAlignment=Alignment.CenterVertically) {
                    Slider(value=page.toFloat(),onValueChange={changePage(it.toInt(),report=false)},onValueChangeFinished={reportProgress()},valueRange=0f..(pageCount-1).coerceAtLeast(1).toFloat(),steps=(pageCount-2).coerceAtLeast(0),modifier=Modifier.weight(1f),
                        thumb={ Box(Modifier.size(12.dp).background(accent,CircleShape)) },
                        track={ val shown=if(pageCount>1) page.toFloat()/(pageCount-1) else 1f
                            Box(Modifier.fillMaxWidth().height(3.dp).background(palette.line,RoundedCornerShape(2.dp))) { Box(Modifier.fillMaxWidth(shown).height(3.dp).background(accent.copy(alpha=0.7f),RoundedCornerShape(2.dp))) } })
                    Text("${page+1} / $pageCount",style=LocalTextStyle.current.copy(textDirection=androidx.compose.ui.text.style.TextDirection.Ltr),color=muted,fontSize=12.sp,modifier=Modifier.padding(start=6.dp,end=2.dp))
                    Box(Modifier.size(48.dp).contentLabel(stringResource(if(pageTranslated) R.string.page_translate_hide else R.string.page_translate)).clickable(role=Role.Button) {
                        if(pageTranslated) translations.removeAll(pageSentences.map {it.id}.toSet()) else pageSentences.forEach {if(it.id !in translations) translations.add(it.id)}
                    },contentAlignment=Alignment.Center) { ReferenceIcon("translate",if(pageTranslated) accent else muted,Modifier.size(24.dp).background(if(pageTranslated) accent.copy(alpha=0.14f) else Color.Transparent,RoundedCornerShape(6.dp))) }
                    Box(Modifier.size(48.dp).pulseWhile(narrator.speaking).contentLabel(if(narrator.speaking || narrator.preparing) stringResource(R.string.seslendirmeyi_durdur) else stringResource(R.string.sayfayi_dinle)).clickable(role=Role.Button) { if(narrator.speaking || narrator.preparing) { narrator.stop() } else { listen() } },contentAlignment=Alignment.Center) { if(narrator.speaking || narrator.preparing) Text("Ⅱ",color=accent,fontSize=25.sp) else ReferenceIcon("headphones",accent,Modifier.size(26.dp)) }
                }
                Row(Modifier.fillMaxWidth().padding(horizontal=8.dp),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically) {
                    TextButton(onClick={changePage(page-1)},enabled=page>0,modifier=Modifier.heightIn(min=48.dp),colors=ButtonDefaults.textButtonColors(contentColor=accent,disabledContentColor=muted.copy(alpha=0.5f))) { Text(stringResource(R.string.onceki),fontSize=15.sp) }
                    if(page==pageCount-1) ChunkyButton(stringResource(R.string.bitir),onClick={if(!completed) {completed=true;narrator.stop();onComplete(timer.pause())}},modifier=Modifier.padding(end=8.dp,bottom=4.dp))
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
                        .shadow(18.dp,RoundedCornerShape(26.dp)).border(1.dp,palette.line,RoundedCornerShape(26.dp)).background(palette.surface,RoundedCornerShape(26.dp)).padding(start=18.dp,end=18.dp,top=16.dp,bottom=16.dp),
                        verticalArrangement=Arrangement.spacedBy(12.dp)) {
                        val lookupOnly=Glossary.isLookupOnly(word)
                        val lemma=Glossary.lemmaOf(word)
                        val saved=word.id in snapshot.savedWordIds
                        // A big listen button, the word and its meaning, and the mascot looking on, like a game's word card.
                        Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)) {
                            ChunkyBox(accent,Modifier.size(56.dp).contentLabel(stringResource(R.string.kelimesini_dinle, word.word)),RoundedCornerShape(16.dp),depth=4.dp,
                                contentAlignment=Alignment.Center,onClick={narrator.speak(word.word)}) {ReferenceIcon("volume",background,Modifier.size(26.dp))}
                            Column(Modifier.weight(1f)) {
                                Text(word.word,fontSize=28.sp,lineHeight=32.sp,fontFamily=TaleDisplay,fontWeight=FontWeight.ExtraBold,color=foreground)
                                Text(word.translation,fontSize=17.sp,fontWeight=FontWeight.Bold,color=muted)
                            }
                            TalesMascot(if(saved) MascotMood.Proud else MascotMood.Reading,Modifier.size(58.dp,68.dp))
                        }
                        Text(if(lookupOnly && !saved) stringResource(R.string.glossary_label) else if(saved) stringResource(R.string.kayitli) else stringResource(R.string.kaydedilmedi),fontSize=12.sp,fontWeight=FontWeight.Bold,color=muted)
                        if(lookupOnly && !lemma.equals(word.word,ignoreCase=true)) Text(stringResource(R.string.glossary_lemma,lemma),fontSize=13.sp,color=muted)
                        selectedSentence?.translation?.takeIf {it.isNotBlank()}?.let {
                            Text(it,fontSize=14.sp,lineHeight=20.sp,color=foreground,modifier=Modifier.fillMaxWidth().background(accent.copy(alpha=0.08f),RoundedCornerShape(14.dp)).padding(horizontal=12.dp,vertical=10.dp))
                        }
                        if(word.pronunciation.isNotBlank() || word.example.isNotBlank()) TextButton(onClick={more=!more},colors=ButtonDefaults.textButtonColors(contentColor=accent)) { Text(if(more) word.pronunciation else stringResource(R.string.daha_fazla_goster)) }
                        if(more) Text(word.example,color=muted,fontSize=13.sp,fontFamily=appearance.font.body)
                        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(12.dp)) {
                            ChunkyBox(palette.surface,Modifier.weight(1f).heightIn(min=52.dp),RoundedCornerShape(16.dp),depth=4.dp,border=palette.line,contentAlignment=Alignment.Center,onClick={selectedWord=null}) {
                                Text(stringResource(R.string.kapat),Modifier.padding(12.dp),fontSize=15.sp,fontWeight=FontWeight.ExtraBold,color=foreground)
                            }
                            // A glossary word is saved in its dictionary form with its meaning (Q4.3a).
                            ChunkyButton(if(saved) stringResource(R.string.kaldir) else stringResource(R.string.ogren_2),onClick={
                                if(lookupOnly) onSaveGlossaryWord(WordInfo(word.id,lemma,word.translation,"","")) else onSaveWord(word.id); selectedWord=null
                                if(saved) alerts.show(removedText(word.word),TaleAlertKind.Info) else alerts.success(savedText(if(lookupOnly) lemma else word.word))
                            },modifier=Modifier.weight(1f),color=TalePurple,onColor=TaleOnPurple)
                        }
                    }
                }
            }
        }
    }
}

/** The first few words of a sentence, enough for a spoken action label to say which sentence it is. */

/**
 * A run of sentences set as one paragraph. Every known word or phrase is a link; a long press lands on the
 * sentence under the finger. [reading] and [selected] mark the sentence being read aloud and the tapped word.
 */
@Composable
private fun TappableParagraph(sentences: List<StorySentence>,phrasesFor: (StorySentence)->PhraseMatcher.Index,fontSize: Int,color: Color,modifier: Modifier=Modifier,
    glossary: Glossary?=null,lineSpacing: Float=1.65f,font: ReadingFont=ReadingFont.ROUNDED,saved: Set<String> = emptySet(),underlineStudyWords: Boolean=true,savedTint: Color=Color.Transparent,
    reading: String?=null,readingTint: Color=Color.Transparent,selected: String?=null,selectedTint: Color=Color.Transparent,
    onPress: (Float)->Unit={},onLongPress: (StorySentence)->Unit,onWord: (WordInfo,String)->Unit) {
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
    var top by remember { mutableFloatStateOf(0f) }
    val currentOnPress by rememberUpdatedState(onPress)
    // Almost every word is a link, so the long press is watched before the links see the touch; once it fires,
    // the rest of the touch is swallowed and the word under the finger does not open as well.
    Box(modifier.onGloballyPositioned {top=it.positionInRoot().y}.pointerInput(layout) { awaitEachGesture {
        val down=awaitFirstDown(requireUnconsumed=false,pass=PointerEventPass.Initial)
        currentOnPress(top+down.position.y)
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
        Text(text=annotated,onTextLayout={textLayout=it},style=readerTextStyle(fontSize,lineSpacing,font,color))
    }
}
