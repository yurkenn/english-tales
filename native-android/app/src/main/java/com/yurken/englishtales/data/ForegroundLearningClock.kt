package com.yurken.englishtales.data

/** Counts only resumed time; a monotonic clock makes wall-clock adjustments irrelevant. */
class ForegroundLearningClock(initialMillis: Long=0,private val elapsed: () -> Long) {
    private var accumulated=initialMillis.coerceAtLeast(0)
    private var resumedAt: Long?=null
    fun resume() {if(resumedAt==null) resumedAt=elapsed()}
    fun pause(): Long {accumulated=totalMillis();resumedAt=null;return accumulated}
    fun totalMillis(): Long = accumulated+(resumedAt?.let {(elapsed()-it).coerceAtLeast(0)}?:0)
}
