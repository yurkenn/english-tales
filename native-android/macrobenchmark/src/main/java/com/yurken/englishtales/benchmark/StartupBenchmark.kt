package com.yurken.englishtales.benchmark

import androidx.benchmark.macro.BaselineProfileMode
import androidx.benchmark.macro.CompilationMode
import androidx.benchmark.macro.FrameTimingMetric
import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.StartupTimingMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@LargeTest
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
    @get:Rule val benchmark = MacrobenchmarkRule()
    private val iterations = (InstrumentationRegistry.getArguments()
        .getString("performanceIterations")?.toInt() ?: 5).also { require(it in 1..50) }

    @Test fun coldStartupWithoutProfile() = startup(CompilationMode.None())
    @Test fun coldStartupWithProfile() = startup(CompilationMode.Partial(
        baselineProfileMode = BaselineProfileMode.Require))

    private fun startup(compilation: CompilationMode) = benchmark.measureRepeated(
        packageName = TARGET,
        metrics = listOf(StartupTimingMetric()),
        compilationMode = compilation,
        startupMode = StartupMode.COLD,
        iterations = iterations,
        setupBlock = { prepareReturningGuest(); pressHome() },
        measureBlock = { startActivityAndWait(); device.requireText("Çalış"); device.waitForIdle() },
    )

    @Test fun tabNavigation() = benchmark.measureRepeated(
        packageName = TARGET,
        metrics = listOf(FrameTimingMetric()),
        compilationMode = CompilationMode.Partial(baselineProfileMode = BaselineProfileMode.Require),
        iterations = iterations,
        setupBlock = { prepareReturningGuest() },
        measureBlock = { browseTabs() },
    )
}
