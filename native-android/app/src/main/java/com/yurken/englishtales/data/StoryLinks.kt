package com.yurken.englishtales.data

import java.net.URI

/** Q6 App Links: a shared story is `https://englishtales-app.web.app/story/{id}` and opens in the app when installed. */
object StoryLinks {
    const val HOST = "englishtales-app.web.app"
    private val storyId = Regex("[a-z0-9][a-z0-9_-]{0,79}")

    fun url(storyId: String): String = "https://$HOST/story/$storyId"

    /** The story ID of a shared link, or null for any other address. A trailing slash is accepted. */
    fun storyId(link: String?): String? {
        val uri = try { URI(link ?: return null) } catch (_: Exception) { return null }
        if (uri.scheme != "https" || !HOST.equals(uri.host, ignoreCase = true) || uri.port != -1) return null
        val segments = uri.rawPath.orEmpty().trim('/').split('/')
        if (segments.size != 2 || segments[0] != "story") return null
        return segments[1].takeIf(storyId::matches)
    }
}
