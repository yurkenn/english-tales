package com.yurken.englishtales.benchmark

import androidx.benchmark.macro.junit4.BaselineProfileRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import java.util.regex.Pattern
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@LargeTest
@RunWith(AndroidJUnit4::class)
class BaselineProfileGenerator {
    @get:Rule val profile = BaselineProfileRule()

    @Test fun startup() = profile.collect(
        packageName = TARGET,
        includeInStartupProfile = true,
        profileBlock = {
            startActivityAndWait()
            check(device.wait(Until.hasObject(By.text(Pattern.compile("Misafir olarak başla|Çalış"))), 15_000))
        },
    )

    @Test fun returningGuestTabs() = profile.collect(
        packageName = TARGET,
        includeInStartupProfile = false,
        profileBlock = { prepareReturningGuest(); browseTabs() },
    )
}
