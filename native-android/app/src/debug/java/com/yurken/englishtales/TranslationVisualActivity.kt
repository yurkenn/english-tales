package com.yurken.englishtales

import android.content.Context
import android.content.res.Configuration
import androidx.activity.ComponentActivity
import java.util.Locale

/** Debug-only screenshot host. Configures the actual Activity and dialog resources before inflation. */
class TranslationVisualActivity : ComponentActivity() {
    override fun attachBaseContext(newBase: Context) {
        val configured = Configuration(newBase.resources.configuration).apply {
            setLocale(Locale.forLanguageTag(language))
            fontScale = textScale
        }
        super.attachBaseContext(newBase.createConfigurationContext(configured))
    }
    companion object {
        // The instrumentation test sets these before launching this isolated debug host.
        var language = "en"
        var textScale = 1f
    }
}
