package com.yurken.englishtales.data

import android.content.Context
import androidx.core.content.edit

data class QuizScore(val correct: Int, val total: Int)

/** Local comprehension results per story (Q5.3); device-only, never synced or sent anywhere. */
class ComprehensionResults(context: Context, name: String = "comprehension") {
    private val prefs = context.applicationContext.getSharedPreferences(name, Context.MODE_PRIVATE)

    fun best(storyId: String): QuizScore? = prefs.getString(storyId, null)?.split('/')?.let { parts ->
        runCatching { QuizScore(parts[0].toInt(), parts[1].toInt()) }.getOrNull()
    }

    /** Keeps the best ratio; a retry never lowers it. */
    fun record(storyId: String, score: QuizScore): QuizScore {
        require(score.total > 0 && score.correct in 0..score.total)
        val previous = best(storyId)
        val kept = if (previous == null || score.correct * previous.total > previous.correct * score.total) score else previous
        prefs.edit { putString(storyId, "${kept.correct}/${kept.total}") }
        return kept
    }
}
