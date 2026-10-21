package com.yurken.englishtales.ui

import android.content.Context
import com.yurken.englishtales.R
import androidx.annotation.StringRes
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

enum class ReadingSpacing(@StringRes val label: Int,val multiplier: Float) {
    COMPACT(R.string.siki,1.4f),COMFORTABLE(R.string.rahat,1.65f),SPACIOUS(R.string.genis,1.9f)
}

/** The reader's page colours, like a book app's themes: white paper, warm sepia paper, or a soft dark page. */
enum class ReadingTheme(@StringRes val label: Int) { LIGHT(R.string.acik), SEPIA(R.string.reader_theme_sepia), DARK(R.string.koyu) }

data class ReadingPreferences(val theme: ReadingTheme=ReadingTheme.LIGHT,val fontSize: Int=17,
    val spacing: ReadingSpacing=ReadingSpacing.COMFORTABLE) {
    val dark get()=theme==ReadingTheme.DARK
}

/** Device appearance preferences; independent of account and learning databases. */
class ReadingPreferencesStore(context: Context,name: String="reading_appearance") {
    private val prefs=context.applicationContext.getSharedPreferences(name,Context.MODE_PRIVATE)
    fun read(): ReadingPreferences = ReadingPreferences(
        // Older installs saved only a light/dark switch; it still decides the theme until a theme is chosen.
        runCatching {ReadingTheme.valueOf(prefs.getString("theme",null).orEmpty())}.getOrNull()
            ?: if(runCatching {prefs.getBoolean("dark",false)}.getOrDefault(false)) ReadingTheme.DARK else ReadingTheme.LIGHT,
        runCatching {prefs.getInt("fontSize",17).coerceIn(14,28)}.getOrDefault(17),
        runCatching {ReadingSpacing.valueOf(prefs.getString("spacing",null).orEmpty())}.getOrDefault(ReadingSpacing.COMFORTABLE))

    suspend fun update(change: (ReadingPreferences)->ReadingPreferences): ReadingPreferences = lock.withLock {
        withContext(Dispatchers.IO) {
            val next=change(read()).let {it.copy(fontSize=it.fontSize.coerceIn(14,28))}
            check(prefs.edit().putString("theme",next.theme.name).putBoolean("dark",next.dark).putInt("fontSize",next.fontSize)
                .putString("spacing",next.spacing.name).commit()) {"Okuma ayarı kaydedilemedi"}
            next
        }
    }
    companion object {
        private val lock=Mutex()
        /** Loads the preferences file off the main thread, so the reader's first [read] is served from memory. */
        suspend fun warm(context: Context,name: String="reading_appearance") {withContext(Dispatchers.IO) {ReadingPreferencesStore(context,name).read()}}
    }
}

/** Page colours for one [ReadingTheme]; the reader and the appearance preview draw from the same set. */
internal data class ReaderPalette(val background: Color,val foreground: Color,val muted: Color,val accent: Color,val surface: Color,val line: Color)

internal fun readerPalette(theme: ReadingTheme)=when(theme) {
    ReadingTheme.LIGHT -> LightTaleColors.let {ReaderPalette(Color.White,it.ink,it.muted,it.blue,Color.White,it.line)}
    // Warm paper with brown ink, as in book apps' sepia themes; muted text and the accent stay at 4.5:1 or more.
    ReadingTheme.SEPIA -> ReaderPalette(Color(0xFFF4ECD8),Color(0xFF3A2E22),Color(0xFF6B5A47),Color(0xFF8C4A17),Color(0xFFFBF6EA),Color(0xFFE2D5B9))
    // A soft near-black page with off-white ink: pure white on pure black glares in a dark room.
    ReadingTheme.DARK -> ReaderPalette(Color(0xFF121212),Color(0xFFE6E1D9),Color(0xFFB0B8C2),Color(0xFF7DD3FC),Color(0xFF1E1E1E),Color(0xFF2C2C2C))
}
