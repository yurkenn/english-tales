package com.yurken.englishtales.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class LearningWriteError(val pendingCount: Int, val message: String)

/** Actor-confined: retain failed writes in order, separately from failed reads. */
internal class LearningWriteRecovery(private val read: () -> Unit) {
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
            pending.addLast(action)
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
                publish()
                return
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
                "Bazı değişiklikler henüz kaydedilemedi. Uygulamayı kapatmadan veya hesap değiştirmeden tekrar dene.")
            readFailed -> LearningWriteError(0,
                "Kayıtlar ekrana yüklenemedi. Görünümü yenilemek için tekrar dene.")
            else -> null
        }
    }
}
