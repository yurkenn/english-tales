package com.yurken.englishtales.data

import java.util.Locale

/** Q5.5: where the learner stands with a word (by dictionary form), from least to most familiar. */
enum class WordStage { SEEN, LOOKED_UP, SAVED, REVIEWING, KNOWN }

/**
 * The known-word model. A word counts as known when practice says so (a saved word reached "known"),
 * or when it was read in at least [IMPLICIT_STORIES] finished stories without the learner ever looking
 * it up. Looking a word up keeps it out of "known" until it is saved and practised. Proper names and
 * numbers are not excluded; the count is a progress signal, not a test score.
 */
object WordKnowledge {
    const val IMPLICIT_STORIES = 2

    private val ascii = Regex("[a-z0-9]{1,100}")
    /** Only plain ASCII forms travel to the account, so a server collation never rejects a whole event. */
    fun syncable(lemma: String) = ascii.matches(lemma)

    fun lemma(token: String): String = LearningContent.glossary.lookup(token)?.lemma ?: token.lowercase(Locale.ROOT)

    /** Dictionary forms of every word-like token in [text]; numbers alone are skipped. */
    fun lemmas(text: String): Set<String> = PhraseMatcher.tokens(text).filter { it.any(Char::isLetter) }.map(::lemma).toSet()

    /** The single dictionary form a saved word stands for, or null for a multi-word phrase. */
    fun lemmaOf(word: WordInfo): String? =
        if (Glossary.isLookupOnly(word)) Glossary.lemmaOf(word) else PhraseMatcher.tokens(word.word).singleOrNull()?.let(::lemma)

    /**
     * [reads] counts finished stories per lemma, [lookups] are lemmas the learner tapped, [saved] maps a
     * saved word's lemma to its practice state ("learning", "reviewing" or "known").
     */
    fun stages(reads: Map<String, Int>, lookups: Set<String>, saved: Map<String, String>): Map<String, WordStage> =
        (reads.keys + lookups + saved.keys).associateWith { lemma ->
            when (saved[lemma]) {
                "known" -> WordStage.KNOWN
                "reviewing" -> WordStage.REVIEWING
                null -> when {
                    lemma in lookups -> WordStage.LOOKED_UP
                    (reads[lemma] ?: 0) >= IMPLICIT_STORIES -> WordStage.KNOWN
                    else -> WordStage.SEEN
                }
                else -> WordStage.SAVED
            }
        }
}
