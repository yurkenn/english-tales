package com.yurken.englishtales.data

/** Reading state shown in the library filters; progress is the snapshot percentage for the story. */
enum class ReadingStatus(val label: String) {
    Unread("Okunmamış"), InProgress("Devam eden"), Finished("Bitti");

    companion object {
        fun of(progress: Int): ReadingStatus = when {
            progress >= 100 -> Finished
            progress > 0 -> InProgress
            else -> Unread
        }
    }
}

/** Library filters combine with AND; a null value means "all". */
data class StoryFilters(val level: String? = null, val status: ReadingStatus? = null) {
    val active: Boolean get() = level != null || status != null
    fun matches(story: Story, progress: Int): Boolean =
        (level == null || story.level == level) && (status == null || ReadingStatus.of(progress) == status)

    companion object {
        val levels = listOf("A1", "A2", "B1")
    }
}
