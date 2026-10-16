package com.yurken.englishtales.data

/**
 * Q5.9 dictation: the learner types a sentence they heard. Case, punctuation and spacing do not count;
 * every word must be right and in order. Uses the same short sentences as sentence ordering.
 */
object Dictation {
    const val SESSION_KIND = "choice"

    data class Check(val correct: Boolean, val wrongWords: Int)

    fun check(expected: String, typed: String): Check {
        val want = PhraseMatcher.tokens(expected)
        val got = PhraseMatcher.tokens(typed.replace('’', '\''))
        val wrong = want.indices.count { it >= got.size || got[it] != want[it] } + (got.size - want.size).coerceAtLeast(0)
        return Check(wrong == 0, wrong)
    }
}
