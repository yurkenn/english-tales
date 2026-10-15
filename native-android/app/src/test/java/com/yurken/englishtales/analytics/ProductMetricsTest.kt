package com.yurken.englishtales.analytics

import org.junit.Assert.*
import org.junit.Test

class ProductMetricsTest {
    private class Memory : MetricsStorage {
        var state = MetricsState()
        var fail = false
        override fun read() = state
        override fun write(state: MetricsState): Boolean { if (fail) return false; this.state = state; return true }
    }
    private class Sink : MetricsTransport {
        val events = mutableListOf<Pair<ProductEvent, PracticeMode?>>()
        val consent = mutableListOf<Boolean>()
        var resets = 0
        var fail = false
        override fun setEnabled(enabled: Boolean) { consent += enabled }
        override fun reset() { resets++ }
        override fun log(event: ProductEvent, mode: PracticeMode?) { if (fail) error("offline"); events += event to mode }
        fun count(event: ProductEvent) = events.count { it.first == event }
    }
    private val storage = Memory()
    private val sink = Sink()
    private var now = 100 * ProductMetrics.DAY_MS
    private fun metrics() = ProductMetrics(storage, sink) { now }

    @Test fun noConsentMeansNoEventsOrCohortHistory() {
        val metrics = metrics()
        metrics.onForeground(); metrics.record(LearningSignal.StoryCompleted(true))
        assertFalse(metrics.enabled); assertTrue(sink.events.isEmpty())
        assertEquals(MetricsState(), storage.state); assertEquals(listOf(false), sink.consent)
    }
    @Test fun consentingFlowProducesExactlyTheSevenAllowlistedEvents() {
        val metrics = metrics(); assertTrue(metrics.setConsent(true))
        metrics.record(LearningSignal.OnboardingCompleted)
        metrics.record(LearningSignal.StoryStarted)
        metrics.record(LearningSignal.StoryCompleted(true))
        metrics.record(LearningSignal.PracticeCompleted(PracticeMode.CHOICE))
        now += ProductMetrics.DAY_MS; metrics.onForeground()
        assertEquals(ProductEvent.entries.toSet(), sink.events.map { it.first }.toSet())
        assertEquals(listOf(PracticeMode.CHOICE), sink.events.mapNotNull { it.second })
        assertTrue(sink.events.filter { it.first != ProductEvent.PRACTICE_COMPLETED }.all { it.second == null })
    }
    @Test fun returnIsOnceOnTheNextUtcCalendarDayAndSurvivesRestart() {
        now += ProductMetrics.DAY_MS - 1
        val first = metrics(); first.setConsent(true)
        first.onForeground(); metrics().onForeground()
        assertEquals(1, sink.count(ProductEvent.VISIT))
        now++
        metrics().onForeground(); metrics().onForeground()
        assertEquals(2, sink.count(ProductEvent.VISIT)); assertEquals(1, sink.count(ProductEvent.NEXT_DAY_RETURN))
        now += ProductMetrics.DAY_MS; metrics().onForeground()
        assertEquals(1, sink.count(ProductEvent.NEXT_DAY_RETURN))
    }
    @Test fun laterReturnIsNotMisreportedAsNextDayRetention() {
        val metrics = metrics(); metrics.setConsent(true)
        now += 2 * ProductMetrics.DAY_MS; metrics.onForeground()
        assertEquals(2, sink.count(ProductEvent.VISIT)); assertEquals(0, sink.count(ProductEvent.NEXT_DAY_RETURN))
    }
    @Test fun clockRollbackDoesNotDuplicateVisitsOrInventReturn() {
        val metrics = metrics(); metrics.setConsent(true)
        now -= ProductMetrics.DAY_MS; metrics.onForeground()
        now += ProductMetrics.DAY_MS; metrics.onForeground()
        assertEquals(1, sink.count(ProductEvent.VISIT)); assertEquals(0, sink.count(ProductEvent.NEXT_DAY_RETURN))
    }
    @Test fun firstStoryIsOncePerConsentingDeviceEvenAcrossAccountChanges() {
        val metrics = metrics(); metrics.setConsent(true)
        metrics.record(LearningSignal.StoryCompleted(false))
        assertEquals(0, sink.count(ProductEvent.FIRST_STORY_COMPLETED))
        metrics.record(LearningSignal.StoryCompleted(true))
        metrics().record(LearningSignal.StoryCompleted(true))
        assertEquals(3, sink.count(ProductEvent.STORY_COMPLETED)); assertEquals(1, sink.count(ProductEvent.FIRST_STORY_COMPLETED))
    }
    @Test fun withdrawalStopsCollectionClearsMarkersAndDoesNotReplayHistory() {
        val metrics = metrics(); metrics.setConsent(true)
        metrics.record(LearningSignal.StoryCompleted(true))
        assertTrue(metrics.setConsent(false)); val sent = sink.events.size
        now += ProductMetrics.DAY_MS; metrics.onForeground(); metrics.record(LearningSignal.OnboardingCompleted)
        assertEquals(sent, sink.events.size); assertEquals(MetricsState(), storage.state)
        assertEquals(1, sink.resets); assertEquals(false, sink.consent.last())
        metrics.setConsent(true)
        assertEquals(sent + 1, sink.events.size); assertEquals(0, sink.count(ProductEvent.NEXT_DAY_RETURN))
        assertEquals(1, sink.count(ProductEvent.FIRST_STORY_COMPLETED))
    }
    @Test fun failedConsentPersistenceNeverEnablesCollection() {
        val metrics = metrics(); storage.fail = true
        assertFalse(metrics.setConsent(true)); assertFalse(metrics.enabled)
        assertTrue(sink.events.isEmpty()); assertFalse(sink.consent.contains(true))
    }
    @Test fun failedVisitPersistenceCanRetryWithoutDuplicateEvents() {
        val metrics = metrics(); metrics.setConsent(true)
        now += ProductMetrics.DAY_MS; storage.fail = true; metrics.onForeground()
        assertEquals(1, sink.count(ProductEvent.VISIT))
        storage.fail = false; metrics.onForeground(); metrics.onForeground()
        assertEquals(2, sink.count(ProductEvent.VISIT)); assertEquals(1, sink.count(ProductEvent.NEXT_DAY_RETURN))
    }
    @Test fun failedWithdrawalCanBeRetriedAndStaysDisabledAfterRestart() {
        val metrics = metrics(); metrics.setConsent(true)
        storage.fail = true
        assertFalse(metrics.setConsent(false)); assertFalse(metrics.enabled)
        assertEquals(false, sink.consent.last())
        storage.fail = false
        assertTrue(metrics.setConsent(false)); assertFalse(storage.state.enabled)
        val sent = sink.events.size
        metrics().onForeground()
        assertEquals(sent, sink.events.size); assertEquals(false, sink.consent.last())
    }
    @Test fun brokenTransportNeverBlocksLearningOrConsentWithdrawal() {
        val metrics = metrics(); sink.fail = true
        assertTrue(metrics.setConsent(true))
        metrics.record(LearningSignal.StoryCompleted(true))
        assertTrue(metrics.setConsent(false)); assertFalse(metrics.enabled)
    }
    @Test fun unreadableConsentFailsClosed() {
        val broken = object : MetricsStorage {
            override fun read(): MetricsState = error("corrupt preferences")
            override fun write(state: MetricsState) = true
        }
        val metrics = ProductMetrics(broken, sink) { now }
        metrics.onForeground(); assertFalse(metrics.enabled); assertTrue(sink.events.isEmpty())
    }
}
