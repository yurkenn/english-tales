package com.yurken.englishtales.benchmark

import androidx.benchmark.macro.junit4.BaselineProfileRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
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
            device.requireReadyEntry()
        },
    )

    @Test fun returningGuestTabs() = profile.collect(
        packageName = TARGET,
        includeInStartupProfile = false,
        profileBlock = { prepareReturningGuest(); browseTabs() },
    )
}
