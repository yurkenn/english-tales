package com.yurken.englishtales

import android.content.Context
import android.content.res.Configuration
import android.os.LocaleList
import java.util.Locale
import android.os.Build

/**
 * App UI language. Turkish is the unqualified resource set (res/resources.properties); the other
 * eleven resource sets are listed by the system picker via generateLocaleConfig.
 * A device whose languages are all unsupported would otherwise fall back to Turkish, so it gets English.
 */
object AppLanguage {
    /** Languages with a res/values-* folder. Add a language here together with its folder. */
    val supported = listOf("tr", "en", "es", "pt", "id", "ar", "vi", "hi", "ru", "bn", "ur", "th")
    val fallback: Locale = Locale.ENGLISH

    /** The first device/app language the app ships, or the English fallback. */
    fun resolve(preferred: List<Locale>): Locale {
        val selected = preferred.firstOrNull { it.language in supported } ?: return fallback
        return when (selected.language) {
            "es" -> Locale.forLanguageTag("es-419")
            "pt" -> Locale.forLanguageTag("pt-BR")
            else -> selected
        }
    }

    fun locale(context: Context): Locale {
        val legacy = if (Build.VERSION.SDK_INT < 33) context.getSharedPreferences("app_language", Context.MODE_PRIVATE).getString("tag", "").orEmpty() else ""
        return if (legacy.isNotEmpty()) resolve(listOf(Locale.forLanguageTag(legacy))) else resolve(context.resources.configuration.locales.toList())
    }

    fun selection(context: Context): String = if (Build.VERSION.SDK_INT >= 33)
        context.getSystemService(android.app.LocaleManager::class.java).applicationLocales.toLanguageTags()
    else context.getSharedPreferences("app_language", Context.MODE_PRIVATE).getString("tag", "").orEmpty()

    /** Android 13 owns the per-app setting; older Android versions keep only a device-local preference. */
    fun select(context: Context, tag: String) {
        require(tag.isEmpty() || Locale.forLanguageTag(tag).language in supported)
        if (Build.VERSION.SDK_INT >= 33) {
            context.getSystemService(android.app.LocaleManager::class.java).applicationLocales = LocaleList.forLanguageTags(tag)
        } else {
            check(context.getSharedPreferences("app_language", Context.MODE_PRIVATE).edit().putString("tag", tag).commit())
            // Keep the ViewModel/write queue alive while rebuilding localized resources.
            var host = context
            while (host is android.content.ContextWrapper && host !is android.app.Activity) host = host.baseContext
            check(host is android.app.Activity) { "Language selection needs an Activity" }
            host.recreate()
        }
    }

    /**
     * Resolve one UI locale before loading resources. Turkish lives in the unqualified set, so a
     * secondary English locale must not outrank it by matching the explicit values-en directory.
     */
    fun wrap(context: Context): Context {
        val locales = context.resources.configuration.locales.toList()
        val selected = locale(context)
        if (locales.size == 1 && locales.first() == selected) return context
        val config = Configuration(context.resources.configuration).apply { setLocales(LocaleList(selected)) }
        return context.createConfigurationContext(config)
    }

    private fun LocaleList.toList() = (0 until size()).map { get(it) }
}
