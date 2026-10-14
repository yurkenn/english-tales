package com.yurken.englishtales.data

import java.util.Locale

/**
 * Finds learning words and multi-word phrases in a sentence with the same contract as the
 * content panel (`admin/workflow.js` `occurs`) and the publish check (`check_learning_links`):
 * case-insensitive, any run of non-alphanumeric characters separates tokens, whole tokens only.
 * So "picked up" matches "picked-up", "lion" matches "lion's", and "cat" never matches "category".
 *
 * Overlaps are resolved left to right; at each position the entry with the most tokens wins and
 * its tokens are not matched again. Entries with identical tokens keep their input order.
 */
object PhraseMatcher {
    private val token = Regex("[\\p{L}\\p{N}]+")

    data class Match(val word: WordInfo, val start: Int, val end: Int)

    class Index(words: Collection<WordInfo>) {
        internal val byFirstToken: Map<String, List<Pair<WordInfo, List<String>>>> = words
            .mapNotNull { word -> tokens(word.word).takeIf { it.isNotEmpty() }?.let { word to it } }
            .sortedByDescending { it.second.size }
            .groupBy { it.second.first() }
    }

    fun tokens(text: String): List<String> = token.findAll(text).map { it.value.lowercase(Locale.ROOT) }.toList()

    fun find(sentence: String, index: Index): List<Match> {
        val spans = token.findAll(sentence).toList()
        val keys = spans.map { it.value.lowercase(Locale.ROOT) }
        val matches = mutableListOf<Match>()
        var i = 0
        while (i < keys.size) {
            val hit = index.byFirstToken[keys[i]]?.firstOrNull { (_, parts) ->
                i + parts.size <= keys.size && parts.indices.all { keys[i + it] == parts[it] }
            }
            if (hit == null) { i++; continue }
            val length = hit.second.size
            matches += Match(hit.first, spans[i].range.first, spans[i + length - 1].range.last + 1)
            i += length
        }
        return matches
    }

    fun find(sentence: String, words: Collection<WordInfo>): List<Match> = find(sentence, Index(words))
}
