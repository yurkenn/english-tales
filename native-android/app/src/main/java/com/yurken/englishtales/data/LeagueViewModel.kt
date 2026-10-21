package com.yurken.englishtales.data

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import com.yurken.englishtales.BuildConfig

/** What the league card and screen show; a guest is invited to sign in, since leagues need an account. */
sealed interface LeagueUi {
    data object Unavailable : LeagueUi
    data object Guest : LeagueUi
    data object Loading : LeagueUi
    data class Ready(val standing: LeagueStanding, val busy: Boolean = false) : LeagueUi
    data object Failed : LeagueUi
}

class LeagueViewModel internal constructor(application: Application, private val service: LeagueService?) : AndroidViewModel(application) {
    constructor(application: Application) : this(application,
        if (LearningSyncRuntime.configured()) LeagueService(LearningSyncHttp(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_PUBLISHABLE_KEY), LearningSyncRuntime.accounts(application)) else null)
    private val mutableState = MutableStateFlow<LeagueUi>(if (service == null) LeagueUi.Unavailable else LeagueUi.Guest)
    val state: StateFlow<LeagueUi> = mutableState
    private var user: String? = null
    // Requests are blocking HTTP calls; only the latest one may publish its result.
    @Volatile private var generation = 0L

    /** Reloads for [userId]; the last standing stays on screen while a refresh runs, and a failed refresh keeps it. */
    fun refresh(userId: String?) = run(userId) { service, id -> service.load(id) }

    fun setOptedOut(userId: String?, optedOut: Boolean) = run(userId) { service, id -> service.setOptedOut(id, optedOut) }

    private fun run(userId: String?, action: (LeagueService, String) -> LeagueStanding) {
        val service = service ?: return
        val request = ++generation
        if (userId == null) { user = null; mutableState.value = LeagueUi.Guest; return }
        val previous = (mutableState.value as? LeagueUi.Ready)?.takeIf { user == userId }
        user = userId
        mutableState.value = previous?.copy(busy = true) ?: LeagueUi.Loading
        viewModelScope.launch(Dispatchers.IO) {
            val result = runCatching { action(service, userId) }
            if (generation != request) return@launch
            // A server without the league functions yet (404) hides the card instead of showing an error.
            mutableState.value = result.fold({ LeagueUi.Ready(it) }, {
                if ((it as? LearningSyncFailure)?.status == 404) LeagueUi.Unavailable else previous?.copy(busy = false) ?: LeagueUi.Failed
            })
        }
    }
}
