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

/** The friends tab; [error] is a SQLSTATE from the last add (P0002 unknown code, 22023 own code, 54000 limit). */
sealed interface FriendsUi {
    data object Unavailable : FriendsUi
    data object Loading : FriendsUi
    data class Ready(val list: FriendList, val busy: Boolean = false, val error: String? = null) : FriendsUi
    data object Failed : FriendsUi
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

    private val mutableFriends = MutableStateFlow<FriendsUi>(if (service == null) FriendsUi.Unavailable else FriendsUi.Loading)
    val friends: StateFlow<FriendsUi> = mutableFriends
    @Volatile private var friendRequest = 0L

    fun refreshFriends(userId: String?) = friendsRun(userId) { service, id -> service.friends(id) }
    fun createCode(userId: String?) = friendsRun(userId) { service, id -> service.createCode(id) }
    fun addFriend(userId: String?, code: String) = friendsRun(userId) { service, id -> service.addFriend(id, FriendList.normalizeCode(code)) }
    fun removeFriend(userId: String?, member: String) = friendsRun(userId) { service, id -> service.removeFriend(id, member) }

    /** Reports a name, then reloads both lists so it disappears for this learner at once. */
    fun reportName(userId: String?, member: String) {
        val service = service ?: return
        if (userId == null || member.isEmpty()) return
        viewModelScope.launch(Dispatchers.IO) {
            if (runCatching { service.reportName(userId, member) }.isSuccess) { refresh(userId); refreshFriends(userId) }
        }
    }

    private fun friendsRun(userId: String?, action: (LeagueService, String) -> FriendList) {
        val service = service ?: return
        val request = ++friendRequest
        if (userId == null) { mutableFriends.value = FriendsUi.Unavailable; return }
        val previous = mutableFriends.value as? FriendsUi.Ready
        mutableFriends.value = previous?.copy(busy = true, error = null) ?: FriendsUi.Loading
        viewModelScope.launch(Dispatchers.IO) {
            val result = runCatching { action(service, userId) }
            if (friendRequest != request) return@launch
            mutableFriends.value = result.fold({ FriendsUi.Ready(it) }, {
                val failure = it as? LearningSyncFailure
                when {
                    failure?.status == 404 -> FriendsUi.Unavailable
                    previous != null -> previous.copy(busy = false, error = failure?.code ?: "network")
                    else -> FriendsUi.Failed
                }
            })
        }
    }
}
