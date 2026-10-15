package com.yurken.englishtales.ui

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build

/** Audio focus for narration: other audio ducks while we speak, and losing focus stops narration. */
internal interface NarrationFocus {
    var onLoss: () -> Unit
    fun request(): Boolean
    fun abandon()

    companion object {
        val attributes: AudioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()
    }
}

internal class SystemNarrationFocus(context: Context) : NarrationFocus {
    private val audio = context.getSystemService(AudioManager::class.java)
    override var onLoss: () -> Unit = {}
    private var held = false
    private val listener = AudioManager.OnAudioFocusChangeListener { change ->
        if (change == AudioManager.AUDIOFOCUS_LOSS || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) onLoss()
    }
    private val focusRequest = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
        AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
            .setAudioAttributes(NarrationFocus.attributes)
            .setOnAudioFocusChangeListener(listener)
            .build() else null

    override fun request(): Boolean {
        if (held) return true
        val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) audio.requestAudioFocus(focusRequest!!)
            else @Suppress("DEPRECATION") audio.requestAudioFocus(listener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
        held = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        return held
    }

    override fun abandon() {
        if (!held) return
        held = false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) audio.abandonAudioFocusRequest(focusRequest!!)
        else @Suppress("DEPRECATION") audio.abandonAudioFocus(listener)
    }
}
