package com.yurken.englishtales.data

import java.util.concurrent.ConcurrentHashMap

/**
 * Q5.6: how hard a story is for this learner. Coverage is the share of the story's running words the
 * learner already knows (Q5.5); new words are its distinct dictionary forms they do not know yet.
 */
object StoryDifficulty {
    data class Estimate(val newWords: Int, val coveragePercent: Int)

    // Per revision: the dictionary form of every running word. Revisions are immutable, so this never goes stale.
    private val lemmas = ConcurrentHashMap<String, List<String>>()

    private fun lemmas(story: Story): List<String> = lemmas.getOrPut(story.revisionId) {
        story.sentences.flatMap { s -> PhraseMatcher.tokens(s.english).filter { t -> t.any(Char::isLetter) }.map(WordKnowledge::lemma) }
    }

    /** Null while the story text is not on the device. */
    fun estimate(story: Story, stages: Map<String, WordStage>): Estimate? =
        if (story.sentences.isEmpty()) null else estimate(lemmas(story), stages)

    fun estimate(running: List<String>, stages: Map<String, WordStage>): Estimate? {
        if (running.isEmpty()) return null
        val known = running.count { stages[it] == WordStage.KNOWN }
        return Estimate(running.toSet().count { stages[it] != WordStage.KNOWN }, known * 100 / running.size)
    }

    /**
     * "For you" order: unfinished before finished, the learner's level first, then the stories they can
     * read most comfortably. Before the learner knows any words, coverage ties and catalog order stays.
     */
    fun recommended(stories: List<Story>, snapshot: LearningSnapshot): List<Story> {
        val coverage = if (snapshot.knownWordCount == 0) emptyMap() else stories.associate { it.id to (estimate(it, snapshot.wordStages)?.coveragePercent ?: -1) }
        return stories.sortedWith(compareBy<Story> { snapshot.progressFor(it) == 100 }.thenBy { it.level != snapshot.level }.thenByDescending { coverage[it.id] ?: 0 })
    }
}
