package com.yurken.englishtales.data

import kotlinx.coroutines.CancellationException
import org.junit.Assert.*
import org.junit.Test

class LearningWriteRecoveryTest {
    @Test fun failedWriteKeepsLaterActionsInOrderUntilRetry() {
        var unavailable=true
        val recorded=mutableListOf<Int>()
        val recovery=LearningWriteRecovery {}
        assertFalse(recovery.submit {check(!unavailable);recorded+=1})
        assertFalse(recovery.submit {recorded+=2})
        recovery.refresh()
        assertEquals(2,recovery.error.value?.pendingCount)
        assertTrue(recorded.isEmpty())
        recovery.retry()
        assertTrue(recorded.isEmpty())
        unavailable=false
        recovery.retry();recovery.retry()
        assertEquals(listOf(1,2),recorded)
        assertNull(recovery.error.value)
    }

    @Test fun failedSnapshotNeverReplaysACommittedWrite() {
        var unavailable=true
        var writes=0
        val recovery=LearningWriteRecovery {check(!unavailable)}
        assertTrue(recovery.submit {writes++})
        recovery.refresh()
        assertEquals(0,recovery.error.value?.pendingCount)
        recovery.retry()
        assertEquals(1,writes)
        unavailable=false
        recovery.retry();recovery.retry()
        assertEquals(1,writes)
        assertNull(recovery.error.value)
    }

    @Test fun readFailureDuringRetryDoesNotReplayTheSuccessfulHead() {
        var failWrite=true
        var failRead=false
        val recorded=mutableListOf<Int>()
        val recovery=LearningWriteRecovery {check(!failRead)}
        recovery.submit {check(!failWrite);recorded+=1;failRead=true}
        recovery.submit {recorded+=2}
        failWrite=false
        recovery.retry()
        assertEquals(listOf(1),recorded)
        assertEquals(1,recovery.error.value?.pendingCount)
        failRead=false
        recovery.retry()
        assertEquals(listOf(1,2),recorded)
    }

    @Test fun ownerResetDiscardsOldOwnerActions() {
        var recorded=false
        val recovery=LearningWriteRecovery {}
        recovery.submit {error("unavailable")}
        recovery.submit {recorded=true}
        recovery.reset();recovery.retry()
        assertFalse(recorded)
        assertNull(recovery.error.value)
    }

    @Test fun newWritesWaitForTheSnapshotToRecover() {
        var unavailable=true
        var recorded=false
        val recovery=LearningWriteRecovery {check(!unavailable)}
        recovery.refresh()
        assertFalse(recovery.submit {recorded=true})
        assertFalse(recorded)
        unavailable=false
        recovery.retry()
        assertTrue(recorded)
        assertNull(recovery.error.value)
    }

    @Test fun cancellationIsNotAnErrorThatCanBeRetried() {
        val recovery=LearningWriteRecovery {}
        try {
            recovery.submit {throw CancellationException()}
            fail("Cancellation must propagate")
        } catch (_: CancellationException) {
            assertNull(recovery.error.value)
        }
    }
}
