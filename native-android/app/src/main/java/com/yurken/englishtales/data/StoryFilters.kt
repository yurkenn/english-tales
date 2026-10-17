package com.yurken.englishtales.data

/** Reading state shown in the library filters; progress is the snapshot percentage for the story. */
enum class ReadingStatus {
    Unread, InProgress, Finished;

    companion object {
        fun of(progress: Int): ReadingStatus = when {
            progress >= 100 -> Finished
            progress > 0 -> InProgress
            else -> Unread
        }
    }
}

/** Library filters combine with AND; a null value means "all". */
data class StoryFilters(val level: String? = null, val status: ReadingStatus? = null, val length: ReadingLength? = null, val offlineOnly: Boolean = false) {
    val active: Boolean get() = level != null || status != null || length != null || offlineOnly
    /** A story whose length is not known yet never matches a length filter. */
    fun matches(story: Story, progress: Int): Boolean =
        (level == null || story.level == level) && (status == null || ReadingStatus.of(progress) == status) &&
            (length == null || ReadingLength.of(ReadingTime.minutes(story)) == length) &&
            (!offlineOnly || readableOffline(story))

    companion object {
        val levels = listOf("A1", "A2", "B1")
        /** Text on the device: bundled, bundled-identical or downloaded. Remote stories carry no sentences until downloaded. */
        fun readableOffline(story: Story) = story.sentences.isNotEmpty()
    }
}
