package com.yurken.englishtales

import android.app.Application
import android.content.Context
import android.content.res.Configuration
import android.os.LocaleList
import androidx.lifecycle.ViewModelStore
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.*
import org.junit.Assert.*
import org.junit.Test
import java.util.Locale

class AppLocalizationTest {
    private val instrumentation get() = InstrumentationRegistry.getInstrumentation()
    private fun context(language: String): Context {
        val target = instrumentation.targetContext
        return target.createConfigurationContext(Configuration(target.resources.configuration).apply {
            setLocales(LocaleList(Locale.forLanguageTag(language)))
        })
    }

    @Test fun statusMessagesAndFiltersFollowTheUiLocale() {
        val english = AppLanguage.wrap(context("en"))
        val turkish = AppLanguage.wrap(context("tr"))
        val fallback = AppLanguage.wrap(context("de-DE"))
        val samples = listOf(R.string.account_message_not_configured, R.string.sync_message_complete,
            R.string.content_message_download_failed, R.string.write_error_pending_changes, R.string.ad_message_privacy_unavailable,
            R.string.genre_daily_life, R.string.reading_status_finished)
        for (id in samples) {
            assertNotEquals(turkish.getString(id), english.getString(id))
            assertEquals(english.getString(id), fallback.getString(id))
        }
        assertEquals("Daily life", english.getString(R.string.genre_daily_life))
        assertEquals("Günlük yaşam", turkish.getString(R.string.genre_daily_life))
    }

    @Test fun secondaryEnglishDoesNotOverrideTurkishOrUnsupportedLanguageResolution() {
        val target = instrumentation.targetContext
        for (tags in listOf("tr,en-US", "de-DE,tr,en-US", "en-GB,tr")) {
            val configured = target.createConfigurationContext(Configuration(target.resources.configuration).apply {
                setLocales(LocaleList.forLanguageTags(tags))
            })
            val expected = if (tags.startsWith("en")) "Daily life" else "Günlük yaşam"
            assertEquals(expected, AppLanguage.wrap(configured).getString(R.string.genre_daily_life))
            assertEquals(expected, configured.getString(R.string.genre_daily_life))
        }
    }

    @Test fun legacyIndonesianLocaleKeepsUiAndContentInIndonesian() {
        for (tag in listOf("id", "in", "id-ID", "in-ID")) {
            val selected = Locale.forLanguageTag(tag)
            assertEquals("id", AppLanguage.languageCode(selected))
            assertEquals("id", SupportLanguage.resolve(listOf(selected, Locale.forLanguageTag("tr"))))
            val localized = AppLanguage.wrap(context(tag))
            assertEquals("Pengaturan", localized.getString(R.string.ayarlar))
        }
    }

    @Test fun accountFailureUsesTheApplicationLocaleWithoutChangingLearningData() {
        for (language in listOf("en", "tr", "es-MX")) {
            val localized = context(language)
            val application = object : Application() { init { attachBaseContext(localized) } }
            val isolated = LearningReliabilityTest().isolated()
            val storage = object : SessionStorage {
                override fun read(): AccountSession? = null
                override fun write(session: AccountSession) {}
                override fun clear() {}
            }
            val holder = ViewModelStore()
            val vm = LearningViewModel(application, AccountService(null, storage), { LearningStore(isolated, it) })
            holder.put("localized", vm)
            try {
                await { vm.ready.value }
                vm.signIn("reader@example.invalid", "fixture-password")
                val expected = AppLanguage.wrap(localized).getString(R.string.account_message_not_configured)
                await { !vm.account.value.busy && vm.account.value.message == expected }
                assertNull(vm.account.value.userId)
                assertEquals("Günlük yaşam", vm.state.value.preferredGenre)
            } finally { instrumentation.runOnMainSync { holder.clear() } }
        }
    }

    private fun await(predicate: () -> Boolean) {
        val deadline = System.nanoTime() + 5_000_000_000L
        while (!predicate() && System.nanoTime() < deadline) Thread.sleep(20)
        assertTrue("Expected localized state was not reached", predicate())
    }
}
