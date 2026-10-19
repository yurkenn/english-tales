package com.yurken.englishtales.data

import org.junit.Assert.*
import org.junit.Test

class PendingEmailCodeTest {
    private var stored: String?=null
    private var clock=1_000L
    private fun codes()=PendingEmailCode({stored},{stored=it},{clock})

    @Test fun signupStepSurvivesARestartWithoutThePassword() {
        codes().save("signup","reader@example.com")
        assertEquals(listOf("signup","reader@example.com","1000"),stored!!.split('\n'))
        clock+=59*60*1000L
        assertEquals("signup" to "reader@example.com",codes().restore())
    }
    @Test fun recoveryStepSurvivesARestart() {
        codes().save("recovery","reader@example.com")
        assertEquals("recovery" to "reader@example.com",codes().restore())
    }
    @Test fun expiredOrClearedStepIsGone() {
        codes().save("signup","reader@example.com");clock+=60*60*1000L
        assertNull(codes().restore());assertNull(stored)
        codes().save("recovery","reader@example.com");codes().clear()
        assertNull(codes().restore())
    }
    @Test fun malformedOrFutureEntryIsDropped() {
        stored="other\nreader@example.com\n1000";assertNull(codes().restore());assertNull(stored)
        stored="signup\nreader@example.com\n999999";assertNull(codes().restore());assertNull(stored)
        stored="signup";assertNull(codes().restore())
    }
}
