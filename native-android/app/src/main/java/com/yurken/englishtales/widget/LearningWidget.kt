package com.yurken.englishtales.widget

import com.yurken.englishtales.AppLanguage
import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.updateAll
import androidx.glance.background
import androidx.glance.layout.Column
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.semantics.contentDescription
import androidx.glance.semantics.semantics
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.yurken.englishtales.MainActivity
import com.yurken.englishtales.R
import com.yurken.englishtales.data.LearningReminderOwner
import com.yurken.englishtales.data.LearningSnapshot
import com.yurken.englishtales.data.LearningStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** What the widget shows; null fields mean "nothing to say" rather than zero. */
data class WidgetSummary(val streak: Int, val todaySessions: Int, val dailyGoal: Int, val goalReached: Boolean, val dueWords: Int) {
    companion object {
        fun from(snapshot: LearningSnapshot) = WidgetSummary(snapshot.streak, snapshot.todaySessions,
            snapshot.dailyGoal, snapshot.dailyGoalReached, snapshot.dueWordIds.size)

        /** Reads the learner the app last showed (guest or account); never signs in or syncs. */
        fun load(context: Context): WidgetSummary? = runCatching {
            val owner = LearningReminderOwner.current(context) ?: return null
            LearningStore(context, owner).use { from(it.snapshot()) }
        }.getOrNull()
    }
}

/** Home screen summary (Q6): streak, today's goal and due reviews; a tap opens the daily plan. */
class LearningWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val summary = withContext(Dispatchers.IO) { WidgetSummary.load(context) }
        provideContent { GlanceTheme { WidgetContent(summary) } }
    }

    companion object {
        /** Called when the learner leaves the app, so the widget shows the latest progress. */
        suspend fun refresh(context: Context) = runCatching { LearningWidget().updateAll(context) }
    }
}

class LearningWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = LearningWidget()
}

@Composable
internal fun WidgetContent(summary: WidgetSummary?) {
    val context = AppLanguage.wrap(LocalContext.current)
    // Same entry as the daily reminder: the app opens on today's plan.
    val open = Intent(context, MainActivity::class.java)
        .putExtra("daily_plan_request", System.currentTimeMillis())
        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    val label = context.getString(R.string.widget_open)
    Column(GlanceModifier.fillMaxSize().background(GlanceTheme.colors.widgetBackground).cornerRadius(16.dp).padding(14.dp)
        .clickable(actionStartActivity(open)).semantics { contentDescription = label }) {
        Text(context.getString(R.string.app_name), style = TextStyle(color = GlanceTheme.colors.primary, fontSize = 13.sp, fontWeight = FontWeight.Bold))
        Spacer(GlanceModifier.height(6.dp))
        if (summary == null) {
            Text(context.getString(R.string.widget_empty), style = TextStyle(color = GlanceTheme.colors.onSurface, fontSize = 15.sp))
        } else {
            Text(context.getString(R.string.widget_streak, summary.streak), style = TextStyle(color = GlanceTheme.colors.onSurface, fontSize = 17.sp, fontWeight = FontWeight.Bold))
            Text(if (summary.goalReached) context.getString(R.string.widget_goal_done)
                else context.getString(R.string.widget_goal, summary.todaySessions, summary.dailyGoal),
                style = TextStyle(color = GlanceTheme.colors.onSurface, fontSize = 14.sp))
            if (summary.dueWords > 0) Text(context.getString(R.string.widget_due, summary.dueWords),
                style = TextStyle(color = GlanceTheme.colors.onSurfaceVariant, fontSize = 13.sp))
        }
        Spacer(GlanceModifier.height(6.dp))
        Text(label, style = TextStyle(color = GlanceTheme.colors.primary, fontSize = 13.sp, fontWeight = FontWeight.Medium))
    }
}
