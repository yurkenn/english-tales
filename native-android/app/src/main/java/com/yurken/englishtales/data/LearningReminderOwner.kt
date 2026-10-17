package com.yurken.englishtales.data

import android.content.Context

/** Selected learning scope survives token expiry; it changes only with the UI owner. */
internal object LearningReminderOwner {
    private fun prefs(context: Context) = context.getSharedPreferences("reminders", Context.MODE_PRIVATE)

    @Synchronized fun select(context: Context, owner: LearningOwner) {
        prefs(context).edit().putString("learning_owner", owner.id).apply()
    }

    @Synchronized fun current(context: Context): LearningOwner? {
        val selected = prefs(context).getString("learning_owner", null)
        return if (selected == null) {
            // Existing installs have no owner preference until the first app launch.
            LearningSyncRuntime.ensureRestored(context).current?.userId?.let { LearningOwner.Account(it) }
                ?: LearningOwner.Guest
        } else if (selected == "guest") LearningOwner.Guest
        else runCatching { LearningOwner.Account(selected) }.getOrNull()
    }

    @Synchronized fun ifCurrent(context: Context, owner: LearningOwner, action: () -> Unit) {
        if (current(context)?.id == owner.id) action()
    }
}
