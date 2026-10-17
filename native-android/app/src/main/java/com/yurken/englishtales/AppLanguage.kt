package com.yurken.englishtales

import android.content.Context
import android.content.res.Configuration
import android.os.LocaleList
import java.util.Locale

/**
 * App UI language. Turkish is the unqualified resource set (res/resources.properties) and English
 * lives in values-en; the system per-app language picker lists both via generateLocaleConfig.
 * A device whose languages are all unsupported would otherwise fall back to Turkish, so it gets English.
 */
object AppLanguage {
    /** Languages with a res/values-* folder. Add a language here together with its folder. */
    val supported = listOf("tr", "en")
    val fallback: Locale = Locale.ENGLISH

    /** The first device/app language the app ships, or the English fallback. */
    fun resolve(preferred: List<Locale>): Locale = preferred.firstOrNull { it.language in supported } ?: fallback

    fun locale(context: Context): Locale = resolve(context.resources.configuration.locales.toList())

    /**
     * Resolve one UI locale before loading resources. Turkish lives in the unqualified set, so a
     * secondary English locale must not outrank it by matching the explicit values-en directory.
     */
    fun wrap(context: Context): Context {
        val locales = context.resources.configuration.locales.toList()
        val selected = resolve(locales)
        if (locales.size == 1 && locales.first() == selected) return context
        val config = Configuration(context.resources.configuration).apply { setLocales(LocaleList(selected)) }
        return context.createConfigurationContext(config)
    }

    private fun LocaleList.toList() = (0 until size()).map { get(it) }
}
