package com.yurken.englishtales.ui

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

enum class ReadingSpacing(val label: String,val multiplier: Float) {
    COMPACT("Sıkı",1.4f),COMFORTABLE("Rahat",1.65f),SPACIOUS("Geniş",1.9f)
}

data class ReadingPreferences(val dark: Boolean=false,val fontSize: Int=17,
    val spacing: ReadingSpacing=ReadingSpacing.COMFORTABLE)

/** Device appearance preferences; independent of account and learning databases. */
class ReadingPreferencesStore(context: Context,name: String="reading_appearance") {
    private val prefs=context.applicationContext.getSharedPreferences(name,Context.MODE_PRIVATE)
    fun read(): ReadingPreferences = ReadingPreferences(
        runCatching {prefs.getBoolean("dark",false)}.getOrDefault(false),
        runCatching {prefs.getInt("fontSize",17).coerceIn(14,28)}.getOrDefault(17),
        runCatching {ReadingSpacing.valueOf(prefs.getString("spacing",null).orEmpty())}.getOrDefault(ReadingSpacing.COMFORTABLE))

    suspend fun update(change: (ReadingPreferences)->ReadingPreferences): ReadingPreferences = lock.withLock {
        withContext(Dispatchers.IO) {
            val next=change(read()).let {it.copy(fontSize=it.fontSize.coerceIn(14,28))}
            check(prefs.edit().putBoolean("dark",next.dark).putInt("fontSize",next.fontSize)
                .putString("spacing",next.spacing.name).commit()) {"Okuma ayarı kaydedilemedi"}
            next
        }
    }
    companion object {private val lock=Mutex()}
}
