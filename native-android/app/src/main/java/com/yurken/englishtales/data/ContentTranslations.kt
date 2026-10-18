package com.yurken.englishtales.data

import org.json.JSONObject

/**
 * Offline translations for the shipped English edition. Server translations take precedence.
 * Exact source matching prevents a cached/edited revision from borrowing a stale translation.
 * Cached documents retain their source text, so they are re-localized on every restore.
 */
internal object ContentTranslations {
    private data class Text(val source: String, val translation: String)
    private data class Pack(val lang: String, val sentences: Map<String, Text>, val words: Map<String, Text>,
                            val descriptions: Map<String, Text>, val tags: Map<String, String>)
    @Volatile private var pack: Pack? = null
    @Volatile var descriptionFallback: String = "Read this English story and practice its vocabulary."
        private set

    fun install(root: JSONObject, lang: String, fallback: String) {
        fun JSONObject.translation(map: String) = getJSONObject(map).getString(lang)
        descriptionFallback = fallback
        if (lang == SupportLanguage.DEFAULT) { pack = null; return }
        val sentences = mutableMapOf<String, Text>()
        val descriptions = mutableMapOf<String, Text>()
        val stories = root.getJSONArray("stories")
        for (i in 0 until stories.length()) {
            val story = stories.getJSONObject(i)
            descriptions[story.getString("id")] = Text(story.getString("description"), story.translation("descriptions"))
            val rows = story.getJSONArray("sentences")
            for (j in 0 until rows.length()) {
                val sentence = rows.getJSONObject(j)
                sentences[sentence.getString("id")] = Text(sentence.getString("english"), sentence.translation("translations"))
            }
        }
        val words = root.getJSONArray("words")
        val wordMap = (0 until words.length()).associate { i -> words.getJSONObject(i).let {
            it.getString("id") to Text(it.getString("word") + "\n" + it.getString("translation"), it.translation("translations"))
        } }
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
        val (entry, source) = when {
            map == "descriptions" -> selected.descriptions[item.optString("story_id", id)] to item.optString(legacy)
            legacy == "turkish" -> selected.sentences[id] to item.optString("english")
            legacy == "translation" -> selected.words[id] to (item.optString("word") + "\n" + item.optString(legacy))
            else -> return null
        }
        return entry?.takeIf { it.source == source }?.translation
    }
}
