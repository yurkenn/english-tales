package com.yurken.englishtales

import android.app.LocaleManager
import android.os.Build
import android.os.LocaleList
import androidx.test.runner.AndroidJUnitRunner
import java.util.Locale

/** Existing journey assertions use Turkish. Locale-specific tests provide their own context. */
class TalesTestRunner : AndroidJUnitRunner() {
    override fun onStart() {
        if (Build.VERSION.SDK_INT >= 33) {
            targetContext.getSystemService(LocaleManager::class.java).applicationLocales =
                LocaleList.forLanguageTags("tr")
            // LocaleManager applies the configuration asynchronously, before any test Activity starts.
            val deadline = System.nanoTime() + 5_000_000_000L
            while (targetContext.resources.configuration.locales[0].language != "tr" &&
                System.nanoTime() < deadline) Thread.sleep(20)
            check(targetContext.resources.configuration.locales[0].language == "tr") {
                "Turkish test locale was not applied"
            }
        } else {
            val locale = Locale.forLanguageTag("tr")
            Locale.setDefault(locale)
            val resources = targetContext.resources
            val config = android.content.res.Configuration(resources.configuration).apply {
                setLocale(locale)
            }
            @Suppress("DEPRECATION")
            resources.updateConfiguration(config, resources.displayMetrics)
        }
        super.onStart()
    }
}
