package com.yurken.englishtales.data

import com.yurken.englishtales.R
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class LearningWriteError(val pendingCount: Int, @androidx.annotation.StringRes val messageRes: Int)

/**
 * Actor-confined: retain failed writes in order, separately from failed reads. A write rejected by
 * validation (IllegalArgumentException) fails the same way on every retry, so it is dropped and
 * reported through [rejected] instead of blocking every later write.
 */
internal class LearningWriteRecovery(private val rejected: (Exception) -> Unit = {}, private val read: () -> Unit) {
    private val pending = ArrayDeque<() -> Unit>()
    private var readFailed = false
    private val mutableError = MutableStateFlow<LearningWriteError?>(null)
    val error: StateFlow<LearningWriteError?> = mutableError

    fun submit(action: () -> Unit): Boolean {
        if (pending.isNotEmpty() || readFailed) {
            pending.addLast(action)
            publish()
            return false
        }
        return try {
            action()
            true
        } catch (failure: Exception) {
            if (failure is kotlinx.coroutines.CancellationException) throw failure
            if (failure is IllegalArgumentException) rejected(failure) else pending.addLast(action)
            publish()
            false
        }
    }

    fun refresh() {
        try {
            read()
            readFailed = false
        } catch (failure: Exception) {
            if (failure is kotlinx.coroutines.CancellationException) throw failure
            readFailed = true
        }
        publish()
    }

    fun retry() {
        if (readFailed) {
            refresh()
            if (readFailed) return
        }
        while (pending.isNotEmpty()) {
            try {
                pending.first().invoke()
            } catch (failure: Exception) {
                if (failure is kotlinx.coroutines.CancellationException) throw failure
                if (failure !is IllegalArgumentException) { publish(); return }
                pending.removeFirst()
                rejected(failure)
                continue
            }
            // A committed write must never be replayed because its snapshot failed.
            pending.removeFirst()
            refresh()
            if (readFailed) return
        }
        publish()
    }

    fun reset() {
        pending.clear()
        readFailed = false
        publish()
    }

    private fun publish() {
        mutableError.value = when {
            pending.isNotEmpty() -> LearningWriteError(pending.size,
                R.string.write_error_pending_changes)
            readFailed -> LearningWriteError(0,
                R.string.write_error_snapshot)
            else -> null
        }
    }
}
