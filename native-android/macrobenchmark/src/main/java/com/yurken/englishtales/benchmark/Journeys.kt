package com.yurken.englishtales.benchmark

import androidx.benchmark.macro.MacrobenchmarkScope
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until

internal const val TARGET = "com.yurken.englishtales.benchmark"

// Both shipped UI languages use the same journey; unsupported device languages fall back to English.
private val english = mapOf(
    "Çalış" to "Practice", "Oku" to "READ", "Arama" to "Search", "Kitap ara" to "Search books",
    "Oyna" to "Play", "Kelimelerle oyna" to "Play with words", "Profilim" to "My profile",
    "Kelimelerim" to "My words", "Başlayalım" to "Let's start", "Yeni başlıyorum" to "I'm just starting",
    "Günlük yaşam" to "Daily life", "Günde 1 adım · Rahat başlangıç" to "1 step a day · Easy start",
    "İlk hikâyeme başla" to "Start my first story"
)
private fun textSelector(text: String) = By.text(java.util.regex.Pattern.compile(
    (listOf(text) + listOfNotNull(english[text])).joinToString("|") {java.util.regex.Pattern.quote(it)}))

internal fun UiDevice.requireText(text: String) =
    checkNotNull(wait(Until.findObject(textSelector(text)), 15_000)) { "Missing UI text: $text" }

private fun UiDevice.deviceIdle() = waitForIdle(2_000)

private fun UiDevice.choose(text: String) {
    val selector = textSelector(text).clickable(true)
    repeat(12) {
        deviceIdle()
        val item = wait(Until.findObject(selector), 700)
        val bounds = item?.visibleBounds
        if (item != null && bounds != null && bounds.height() > 0 &&
            bounds.centerY() in (displayHeight / 20)..(displayHeight * 39 / 40)) {
            item.click()
            // Reply bubbles retain the same text; require the actionable choice to disappear.
            if (wait(Until.gone(selector), 2_000)) return
        } else {
            swipe(displayWidth / 2, displayHeight * 3 / 4, displayWidth / 2, displayHeight / 3, 20)
        }
    }
    error("Onboarding choice did not advance: $text; visible=" +
        findObjects(By.text(java.util.regex.Pattern.compile(".+"))).map { it.text })
}

/** Only the isolated benchmark package is installed/cleared by this module. */
internal fun MacrobenchmarkScope.prepareReturningGuest() {
    startActivityAndWait()
    val entry = checkNotNull(device.wait(Until.findObject(By.text(
        java.util.regex.Pattern.compile("Misafir olarak başla|Çalış|Start as guest|Practice"))), 15_000)) { "App did not become ready" }
    if (entry.text in listOf("Misafir olarak başla", "Start as guest")) {
        entry.click()
        device.choose("Başlayalım")
        device.choose("Yeni başlıyorum")
        device.choose("Günlük yaşam")
        device.choose("Günde 1 adım · Rahat başlangıç")
        device.choose("İlk hikâyeme başla")
        check(device.wait(Until.hasObject(By.desc(java.util.regex.Pattern.compile("Okuma görünümü|Reading view"))), 15_000)) { "Reader did not open" }
        device.pressBack()
    }
    device.requireText("Çalış")
    device.waitForIdle()
}

/** Shared between profile generation and frame measurement; real UI navigation. */
internal fun MacrobenchmarkScope.browseTabs() {
    device.requireText("Oku").click()
    device.requireText("Arama").click()
    device.requireText("Kitap ara")
    device.swipe(device.displayWidth / 2, device.displayHeight * 3 / 4,
        device.displayWidth / 2, device.displayHeight / 3, 20)
    device.pressBack()
    device.requireText("Oyna").click()
    device.requireText("Kelimelerle oyna")
    device.requireText("Profilim").click()
    device.requireText("Kelimelerim")
    device.requireText("Çalış").click()
    device.waitForIdle()
}
