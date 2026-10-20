package com.yurken.englishtales.data

/** One of today's three small goals; [progress] never passes [target]. */
data class DailyQuest(val id: String, val progress: Int, val target: Int) {
    val done get() = progress >= target
}

/** Pure rules behind the game rewards: result stars, daily quests and streak milestones. */
object GameRewards {
    /** Answers in a row that complete the combo quest; one flawless five-question session reaches it. */
    const val COMBO_QUEST = 5
    /** Streak lengths that get a full celebration instead of the usual toast. */
    val STREAK_MILESTONES = listOf(3, 7, 14, 30, 50, 100, 200, 365)

    /** Finishing earns one star; most answers right earn two; a flawless session earns three. */
    fun stars(correct: Int, total: Int) = when {
        total <= 0 -> 1
        correct >= total -> 3
        correct * 10 >= total * 6 -> 2
        else -> 1
    }

    /** Today's quests: the learner's own daily goal, one finished story, and a run of right answers. */
    fun quests(sessions: Int, goal: Int, readings: Int, bestCombo: Int): List<DailyQuest> {
        val steps = goal.coerceAtLeast(1)
        return listOf(
            DailyQuest("goal", sessions.coerceIn(0, steps), steps),
            DailyQuest("story", readings.coerceIn(0, 1), 1),
            DailyQuest("combo", bestCombo.coerceIn(0, COMBO_QUEST), COMBO_QUEST),
        )
    }

    /** The milestone to celebrate when the streak grows from [previous] to [current], unless it was already shown. */
    fun milestoneReached(previous: Int, current: Int, celebrated: Int): Int? =
        STREAK_MILESTONES.lastOrNull { it in (previous + 1)..current && it > celebrated }
}
