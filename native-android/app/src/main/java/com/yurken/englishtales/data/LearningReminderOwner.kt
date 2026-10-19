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

    /** The selected account whose local data still exists and is not being deleted: a launch without a session reopens it. */
    @Synchronized fun account(context: Context): LearningOwner.Account? = (current(context) as? LearningOwner.Account)
        ?.takeIf { it.id !in DeletedAccountCleanup.pending(context) && context.getDatabasePath(it.databaseName).exists() }

    @Synchronized fun ifCurrent(context: Context, owner: LearningOwner, action: () -> Unit) {
        if (current(context)?.id == owner.id) action()
    }
}
