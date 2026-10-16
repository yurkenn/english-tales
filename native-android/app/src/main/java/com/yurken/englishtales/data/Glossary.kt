package com.yurken.englishtales.data

import org.json.JSONObject
import java.util.Locale

/**
 * Q4.3a — tap any word: a lookup layer under the learning words. Learning words stay the underlined,
 * savable entries; the glossary answers every other token offline with a lemma and a short meaning.
 *
 * Sources, in priority order: the token itself, an explicit inflection ([forms], e.g. "went" → "go"),
 * then [Lemmatizer] candidates ("stories" → "story"). Meanings come from the bundled glossary file
 * (Q4.3b fills it) and from single-word learning words, whose translation also covers their forms.
 */
class Glossary(entries: Map<String, String>, private val forms: Map<String, String>, words: Collection<WordInfo>) {
    data class Entry(val lemma: String, val gloss: String)

    private val byLemma: Map<String, Entry> = buildMap<String, Entry> {
        entries.forEach { (lemma, gloss) -> if (gloss.isNotBlank()) put(lemma.lowercase(Locale.ROOT), Entry(lemma.lowercase(Locale.ROOT), gloss)) }
        // A reviewed learning word wins over a glossary draft for the same lemma.
        words.forEach { word -> PhraseMatcher.tokens(word.word).singleOrNull()?.let { put(it, Entry(it, word.translation)) } }
    }

    val size: Int get() = byLemma.size

    fun lookup(token: String): Entry? {
        val key = token.lowercase(Locale.ROOT)
        byLemma[key]?.let { return it }
        forms[key]?.let { lemma -> byLemma[lemma]?.let { return it } }
        return Lemmatizer.candidates(key).firstNotNullOfOrNull(byLemma::get)
    }

    data class Span(val start: Int, val end: Int, val word: WordInfo)

    /**
     * Tokens of [text] outside the learning-word [matches] that the glossary can explain, as lookup-only
     * words. Learning words keep their own links; a token is never linked twice.
     */
    fun spans(text: String, matches: List<PhraseMatcher.Match>): List<Span> = TOKEN.findAll(text)
        .filter { token -> matches.none { token.range.first < it.end && it.start <= token.range.last } }
        .mapNotNull { token -> lookup(token.value)?.let { Span(token.range.first, token.range.last + 1, asWord(token.value, it)) } }
        .toList()

    /** Lookup-only words share the popup with learning words; this id marks them as not savable. */
    fun asWord(token: String, entry: Entry) = WordInfo(ID_PREFIX + entry.lemma, token, entry.gloss, "", "")

    companion object {
        const val ID_PREFIX = "glossary:"
        private val TOKEN = Regex("[\\p{L}\\p{N}]+")
        fun isLookupOnly(word: WordInfo) = word.id.startsWith(ID_PREFIX)
        /** The dictionary form behind a lookup-only word ("walked" → "walk"). */
        fun lemmaOf(word: WordInfo) = word.id.removePrefix(ID_PREFIX)

        /** `glossary/<lang>.json`: `{"schemaVersion":1,"lang":"tr","entries":[{"lemma","gloss",…}],"forms":{"went":"go"}}`. */
        fun parse(json: String): Pair<Map<String, String>, Map<String, String>> {
            val root = JSONObject(json)
            require(root.getInt("schemaVersion") == 1) { "Unsupported glossary schema" }
            val array = root.optJSONArray("entries") ?: org.json.JSONArray()
            val entries = (0 until array.length()).associate { i -> array.getJSONObject(i).let { it.getString("lemma") to it.getString("gloss") } }
            val formObject = root.optJSONObject("forms") ?: JSONObject()
            val forms = formObject.keys().asSequence().associate { it.lowercase(Locale.ROOT) to formObject.getString(it).lowercase(Locale.ROOT) }
            return entries to forms
        }
    }
}

/**
 * Regular English inflections back to a dictionary form. Candidates are only guesses; a candidate is
 * used only when the glossary has it, so "news" never turns into "new" unless "news" itself is missing
 * and "new" exists — irregular and misleading forms belong in the glossary's explicit forms.
 */
object Lemmatizer {
    private const val MIN = 3
    private val vowels = "aeiou".toSet()

    fun candidates(token: String): List<String> {
        val t = token.lowercase(Locale.ROOT)
        val out = linkedSetOf(t)
        fun add(stem: String) { if (stem.length >= MIN) out += stem }
        fun undouble(stem: String) { if (stem.length >= 4 && stem.last() == stem[stem.length - 2] && stem.last() !in vowels && stem.last() !in "lsz") add(stem.dropLast(1)) }
        when {
            t.endsWith("ies") -> { add(t.dropLast(3) + "y"); add(t.dropLast(1)) }
            t.endsWith("es") -> { add(t.dropLast(2)); add(t.dropLast(1)) }
            t.endsWith("s") && !t.endsWith("ss") && !t.endsWith("us") && !t.endsWith("is") -> add(t.dropLast(1))
        }
        when {
            t.endsWith("ied") -> add(t.dropLast(3) + "y")
            t.endsWith("ed") -> t.dropLast(2).let { stem -> add(stem); add(stem + "e"); undouble(stem) }
        }
        if (t.endsWith("ing")) t.dropLast(3).let { stem -> add(stem); add(stem + "e"); undouble(stem); if (stem.endsWith("y")) add(stem.dropLast(1) + "ie") }
        when {
            t.endsWith("iest") -> add(t.dropLast(4) + "y")
            t.endsWith("est") -> t.dropLast(3).let { stem -> add(stem); add(stem + "e"); undouble(stem) }
            t.endsWith("ier") -> add(t.dropLast(3) + "y")
            t.endsWith("er") -> t.dropLast(2).let { stem -> add(stem); add(stem + "e"); undouble(stem) }
        }
        when {
            t.endsWith("ily") -> add(t.dropLast(3) + "y")
            t.endsWith("ly") -> add(t.dropLast(2))
        }
        return out.toList()
    }
}
