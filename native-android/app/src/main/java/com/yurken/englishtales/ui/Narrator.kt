package com.yurken.englishtales.ui

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import com.yurken.englishtales.R
import java.util.Locale

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
