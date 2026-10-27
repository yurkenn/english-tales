package com.yurken.englishtales.data

import android.content.Context
import android.annotation.SuppressLint
import com.yurken.englishtales.AppLanguage
import java.util.Locale

/** Device preference: learning records and the Android per-app UI locale are never changed. */
object TranslationLanguage {
    private fun prefs(context: Context) = context.getSharedPreferences("app_language", Context.MODE_PRIVATE)

    /** Empty means follow the UI, preserving the behavior of installations predating this setting. */
    fun selection(context: Context): String = prefs(context).getString("translation_tag", "").orEmpty()
        .takeIf { it in SupportLanguage.enabled }.orEmpty()

    internal fun resolve(selection: String, uiLocale: Locale): String =
        selection.takeIf { it in SupportLanguage.enabled } ?: SupportLanguage.resolve(listOf(uiLocale))

    fun effective(context: Context): String = resolve(selection(context), AppLanguage.locale(context))

    /** Call off the UI thread. False means the choice could not be saved; do not reload the catalog. */
    @SuppressLint("UseKtx") // commit() must return its Boolean; the KTX edit helper discards it.
    fun select(context: Context, tag: String): Boolean {
        require(tag.isEmpty() || tag in SupportLanguage.enabled)
        return prefs(context).edit().putString("translation_tag", tag).commit()
    }
}
