package com.yurken.englishtales.data

import org.json.JSONObject

/**
 * Offline translations for the shipped English edition. Server translations take precedence.
 * Exact source matching prevents a cached/edited revision from borrowing a stale translation.
 * Cached documents retain their source text, so they are re-localized on every restore.
 */
internal object ContentTranslations {
    private data class Pack(val lang: String, val sentences: Map<Pair<String, String>, String>, val words: Map<Pair<String, String>, String>,
                            val descriptions: Map<Pair<String, String>, String>, val tags: Map<String, String>)
    @Volatile private var pack: Pack? = null
    @Volatile var descriptionFallback: String = "Read this English story and practice its vocabulary."
        private set

    fun install(root: JSONObject, lang: String, fallback: String) {
        fun JSONObject.translation(map: String) = getJSONObject(map).getString(lang)
        descriptionFallback = fallback
        if (lang == SupportLanguage.DEFAULT) { pack = null; return }
        fun rows(array: org.json.JSONArray?) = (0 until (array?.length() ?: 0)).map {array!!.getJSONObject(it)}
        // A cache without translation maps may not identify which of two translations it used.
        // Ambiguous source pairs fall back to English, rather than borrowing another revision's wording.
        fun unique(entries: List<Pair<Pair<String, String>, String>>) = entries.groupBy({it.first}, {it.second})
            .mapNotNull { (key, values) -> values.distinct().singleOrNull()?.let {key to it} }.toMap()
        val stories = rows(root.getJSONArray("stories")) + rows(root.optJSONObject("legacyCatalog")?.optJSONArray("stories"))
        val descriptions = unique(stories.map { story ->
            (story.getString("id") to story.getString("description")) to story.translation("descriptions")
        })
        val sentences = unique(stories.flatMap { story -> rows(story.getJSONArray("sentences")).map { sentence ->
            (sentence.getString("id") to (sentence.getString("english") + "\n" + sentence.getString("turkish"))) to sentence.translation("translations")
        } })
        val words = rows(root.getJSONArray("words")) + stories.flatMap {rows(it.optJSONArray("vocabulary"))}
        val wordMap = unique(words.map {
            (it.getString("id") to (it.getString("word") + "\n" + it.getString("translation"))) to it.translation("translations")
        })
        val tags = root.getJSONArray("tags")
        val names = (0 until tags.length()).associate { i -> tags.getJSONObject(i).let {
            it.getString("id") to it.getJSONObject("names").getString(lang)
        } }
        pack = Pack(lang, sentences, wordMap, descriptions, names)
    }

    fun tag(id: String, fallback: String): String = pack?.tags?.get(id) ?: fallback

    fun pick(item: JSONObject, map: String, legacy: String, lang: String): String? {
        val selected = pack?.takeIf { it.lang == lang } ?: return null
        val id = item.optString("id")
        return when {
            map == "descriptions" -> selected.descriptions[item.optString("story_id", id) to item.optString(legacy)]
            legacy == "turkish" -> selected.sentences[id to (item.optString("english") + "\n" + item.optString(legacy))]
            legacy == "translation" -> selected.words[id to (item.optString("word") + "\n" + item.optString(legacy))]
            else -> null
        }
    }
}
