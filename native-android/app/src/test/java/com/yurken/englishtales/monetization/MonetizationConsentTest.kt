package com.yurken.englishtales.monetization

import com.yurken.englishtales.analytics.*
import org.junit.Assert.*
import org.junit.Test

class MonetizationConsentTest {
    @Test fun `purchase and energy measurements respect opt in and withdrawal`() {
        val sent=mutableListOf<ProductEvent>()
        val transport=object: MetricsTransport {
            override fun setEnabled(enabled: Boolean) {}
            override fun reset() {}
            override fun log(event: ProductEvent,mode: PracticeMode?) {sent+=event}
        }
        val storage=object: MetricsStorage {
            var state=MetricsState()
            override fun read()=state
            override fun write(state: MetricsState): Boolean {this.state=state;return true}
        }
        val metrics=ProductMetrics(storage,transport)
        metrics.monetization(MonetizationEvent.PAYWALL);assertTrue(sent.isEmpty())
        metrics.setConsent(true);sent.clear()
        metrics.monetization(MonetizationEvent.REWARD_VERIFY)
        assertEquals(listOf(ProductEvent.REWARD_VERIFIED),sent)
        metrics.setConsent(false);sent.clear()
        metrics.monetization(MonetizationEvent.PURCHASE);assertTrue(sent.isEmpty())
    }
}
