package com.yurken.englishtales.analytics

/** Only these seven names and four mode values can reach the analytics adapter. */
internal enum class ProductEvent(val wireName: String) {
    VISIT("learning_visit"), NEXT_DAY_RETURN("next_day_return"),
    ONBOARDING_COMPLETED("learning_onboarding_completed"), STORY_STARTED("story_started"),
    STORY_COMPLETED("story_completed"), FIRST_STORY_COMPLETED("first_story_completed"),
    PRACTICE_COMPLETED("practice_completed")
}

internal enum class PracticeMode(val wireName: String) {
    CHOICE("choice"), CARD("card"), MATCH("match"), SPELL("spell");
    companion object { fun fromStorage(value: String) = entries.first { it.wireName == value } }
}

internal sealed interface LearningSignal {
    data object OnboardingCompleted : LearningSignal
    data object StoryStarted : LearningSignal
    data class StoryCompleted(val firstForLearner: Boolean) : LearningSignal
    data class PracticeCompleted(val mode: PracticeMode) : LearningSignal
}

internal data class MetricsState(
    val enabled: Boolean = false,
    val firstDay: Long? = null,
    val lastVisitDay: Long? = null,
    val nextDayReported: Boolean = false,
    val firstStoryReported: Boolean = false
)

internal interface MetricsStorage {
    fun read(): MetricsState
    fun write(state: MetricsState): Boolean
}

internal interface MetricsTransport {
    fun setEnabled(enabled: Boolean)
    fun reset()
    fun log(event: ProductEvent, mode: PracticeMode? = null)
}

/** Device cohort starts at opt-in, not at installation. Days use UTC to avoid timezone shifts. */
internal class ProductMetrics(
    private val storage: MetricsStorage,
    private val transport: MetricsTransport,
    private val now: () -> Long = System::currentTimeMillis
) {
    private var state = runCatching { storage.read() }.getOrDefault(MetricsState())
    val enabled: Boolean @Synchronized get() = state.enabled

    init { runCatching { transport.setEnabled(state.enabled) } }

    @Synchronized fun setConsent(enabled: Boolean): Boolean {
        if (state.enabled == enabled) return true
        if (!enabled) {
            // Stop collection before clearing local cohort markers. Never replay them on re-enabling.
            runCatching { transport.setEnabled(false) }
            runCatching { transport.reset() }
            state = MetricsState()
            return runCatching { storage.write(state) }.getOrDefault(false)
        }
        val next = MetricsState(enabled = true)
        if (!save(next)) return false
        runCatching { transport.setEnabled(true) }
        onForeground()
        return true
    }

    @Synchronized fun onForeground() {
        if (!state.enabled) return
        val day = Math.floorDiv(now(), DAY_MS)
        if (state.lastVisitDay != null && day <= state.lastVisitDay!!) return
        val first = state.firstDay ?: day
        val nextDay = day == first + 1 && !state.nextDayReported
        if (!save(state.copy(firstDay = first, lastVisitDay = day, nextDayReported = state.nextDayReported || nextDay))) return
        emit(ProductEvent.VISIT)
        if (nextDay) emit(ProductEvent.NEXT_DAY_RETURN)
    }

    @Synchronized fun record(signal: LearningSignal) {
        if (!state.enabled) return
        when (signal) {
            LearningSignal.OnboardingCompleted -> emit(ProductEvent.ONBOARDING_COMPLETED)
            LearningSignal.StoryStarted -> emit(ProductEvent.STORY_STARTED)
            is LearningSignal.PracticeCompleted -> emit(ProductEvent.PRACTICE_COMPLETED, signal.mode)
            is LearningSignal.StoryCompleted -> {
                emit(ProductEvent.STORY_COMPLETED)
                if (signal.firstForLearner && !state.firstStoryReported && save(state.copy(firstStoryReported = true)))
                    emit(ProductEvent.FIRST_STORY_COMPLETED)
            }
        }
    }

    private fun save(next: MetricsState): Boolean {
        if (!runCatching { storage.write(next) }.getOrDefault(false)) return false
        state = next
        return true
    }
    private fun emit(event: ProductEvent, mode: PracticeMode? = null) {
        runCatching { transport.log(event, mode) } // Measurement never makes a committed learning write fail.
    }
    companion object { const val DAY_MS = 86_400_000L }
}
