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

/** The daily chest being opened. [Syncing] waits for today's sessions to reach the server, which checks the quests. */
sealed interface ChestUi {
    data object Idle : ChestUi
    data object Opening : ChestUi
    data object Syncing : ChestUi
    data class Opened(val points: Int, val league: Boolean) : ChestUi
    data object Failed : ChestUi
}

class LeagueViewModel internal constructor(application: Application, private val service: LeagueService?, private val chests: QuestChestService? = null) : AndroidViewModel(application) {
    constructor(application: Application) : this(application, LearningSyncRuntime.configured(), application)
    private constructor(application: Application, configured: Boolean, app: Application) : this(application,
        if (configured) LeagueService(http(), LearningSyncRuntime.accounts(app)) else null,
        if (configured) QuestChestService(http(), LearningSyncRuntime.accounts(app)) else null)
    private val mutableState = MutableStateFlow<LeagueUi>(if (service == null) LeagueUi.Unavailable else LeagueUi.Guest)
    val state: StateFlow<LeagueUi> = mutableState
    private var user: String? = null
    private var accountGeneration = 0L

    /** Invalidates every account-bound request before another owner can see or change its state. */
    @Synchronized private fun selectAccount(userId: String?): Long {
        if (user != userId) {
            user = userId
            accountGeneration++
            generation++
            changingChoice = false
            friendRequest++
            chestRequest++
            pendingChest = null
            chestSyncAfter = null
            mutableState.value = if (service == null) LeagueUi.Unavailable else if (userId == null) LeagueUi.Guest else LeagueUi.Loading
            mutableFriends.value = if (service == null || userId == null) FriendsUi.Unavailable else FriendsUi.Loading
            mutableChest.value = ChestUi.Idle
        }
        return accountGeneration
    }
    // Requests are blocking HTTP calls; only the latest one may publish its result.
    @Volatile private var generation = 0L
    private var changingChoice = false

    fun accountChanged(userId: String?) { selectAccount(userId) }

    /** Reloads for [userId]; the last standing stays on screen while a refresh runs, and a failed refresh keeps it. */
    fun refresh(userId: String?) = run(userId) { service, id -> service.load(id) }

    fun setOptedOut(userId: String?, optedOut: Boolean) = run(userId, choice = true) { service, id -> service.setOptedOut(id, optedOut) }

    @Synchronized private fun run(userId: String?, choice: Boolean = false, action: (LeagueService, String) -> LeagueStanding) {
        val account = selectAccount(userId)
        val service = service ?: return
        if (changingChoice && !choice) return
        val request = ++generation
        changingChoice = choice && userId != null
        if (userId == null) { user = null; mutableState.value = LeagueUi.Guest; return }
        val previous = (mutableState.value as? LeagueUi.Ready)?.takeIf { user == userId }
        mutableState.value = previous?.copy(busy = true) ?: LeagueUi.Loading
        viewModelScope.launch(Dispatchers.IO) {
            val result = runCatching { action(service, userId) }
            synchronized(this@LeagueViewModel) {
            if (accountGeneration != account || generation != request) return@launch
            changingChoice = false
            // A server without the league functions yet (404) hides the card instead of showing an error.
            mutableState.value = result.fold({ LeagueUi.Ready(it) }, {
                if ((it as? LearningSyncFailure)?.status == 404) LeagueUi.Unavailable else previous?.copy(busy = false) ?: LeagueUi.Failed
            })
            }
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
    @Synchronized fun reportName(userId: String?, member: String) {
        val service = service ?: return
        if (userId == null || userId != user || member.isEmpty()) return
        val account = accountGeneration
        viewModelScope.launch(Dispatchers.IO) {
            val success = runCatching { service.reportName(userId, member) }.isSuccess
            synchronized(this@LeagueViewModel) {
                if (success && accountGeneration == account) { refresh(userId); refreshFriends(userId) }
            }
        }
    }

    @Synchronized private fun friendsRun(userId: String?, action: (LeagueService, String) -> FriendList) {
        val account = selectAccount(userId)
        val service = service ?: return
        val request = ++friendRequest
        if (userId == null) { mutableFriends.value = FriendsUi.Unavailable; return }
        val previous = mutableFriends.value as? FriendsUi.Ready
        mutableFriends.value = previous?.copy(busy = true, error = null) ?: FriendsUi.Loading
        viewModelScope.launch(Dispatchers.IO) {
            val result = runCatching { action(service, userId) }
            synchronized(this@LeagueViewModel) {
            if (accountGeneration != account || friendRequest != request) return@launch
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

    private val mutableChest = MutableStateFlow<ChestUi>(ChestUi.Idle)
    val chest: StateFlow<ChestUi> = mutableChest
    /** Bumped whenever the device copy of the chests changes, so the learning snapshot re-reads its points. */
    private val mutableChestVersion = MutableStateFlow(0)
    val chestVersion: StateFlow<Int> = mutableChestVersion
    private data class PendingChest(val owner: String, val user: String, val day: String, val account: Long)
    private var pendingChest: PendingChest? = null
    private var chestSyncAfter: Long? = null
    private var chestRequest = 0L
    private var chestRefreshRequest = 0L

    /**
     * Opens [day]'s chest. A guest's chest is rolled on the device; an account asks the server, which checks the
     * quests itself. When the server has not seen today's sessions yet the chest waits in [ChestUi.Syncing] and
     * [onSyncNeeded] uploads them; [retryChest] then tries once more.
     */
    @Synchronized fun openChest(owner: String, userId: String?, day: String, onSyncNeeded: (() -> Unit)?) {
        val account = selectAccount(userId)
        val chests = chests
        if (mutableChest.value == ChestUi.Opening) return
        if (userId == null) {
            if (owner != LearningOwner.Guest.id) return
            mutableChest.value = ChestUi.Opened(QuestChests.openLocally(getApplication(), owner, day), league = false)
            mutableChestVersion.value++
            return
        }
        if (chests == null || owner != userId) { mutableChest.value = ChestUi.Failed; return }
        val pending = PendingChest(owner, userId, day, account)
        pendingChest = pending
        chestSyncAfter = null
        val request = ++chestRequest
        chestRefreshRequest++
        mutableChest.value = ChestUi.Opening
        viewModelScope.launch(Dispatchers.IO) {
            val result = runCatching { chests.open(userId, day) }
            synchronized(this@LeagueViewModel) {
            if (pendingChest != pending || accountGeneration != account || chestRequest != request) return@launch
            result.onSuccess { state ->
                chestRefreshRequest++
                QuestChests.mirror(getApplication(), userId, state)
                pendingChest = null
                mutableChest.value = ChestUi.Opened(state.recent.firstOrNull { it.day == day }?.points ?: 0, league = true)
                mutableChestVersion.value++
                refresh(userId)
            }.onFailure {
                // The quests are not done on the server yet: upload once and retry; a retry that still misses them gives up.
                if ((it as? LearningSyncFailure)?.code == "55000" && onSyncNeeded != null) { mutableChest.value = ChestUi.Syncing; launch(Dispatchers.Main) {
                    synchronized(this@LeagueViewModel) {
                        if (pendingChest == pending && accountGeneration == account && chestRequest == request) onSyncNeeded()
                    }
                } }
                else { pendingChest = null; mutableChest.value = ChestUi.Failed }
            }
            }
        }
    }

    /** Stamps the current completion before requesting the upload, excluding an earlier completion already queued in Compose. */
    @Synchronized fun waitForChestSync(completed: Long) {
        if (mutableChest.value == ChestUi.Syncing && pendingChest != null) chestSyncAfter = completed
    }

    /** Null completion is an explicit immediate retry when an upload cannot be requested. */
    @Synchronized fun retryChest(owner: String, userId: String?, completed: Long? = null) {
        selectAccount(userId)
        val pending = pendingChest ?: return
        if (pending.owner != owner || pending.user != userId || pending.account != accountGeneration) return
        if (completed != null && (chestSyncAfter == null || completed <= chestSyncAfter!!)) return
        if (mutableChest.value == ChestUi.Syncing) openChest(owner, userId, pending.day, null)
    }

    @Synchronized fun failChestSync() {
        if (mutableChest.value == ChestUi.Syncing) { pendingChest = null; chestRequest++; mutableChest.value = ChestUi.Failed }
    }

    @Synchronized fun dismissChest() {
        if (mutableChest.value != ChestUi.Opening) { pendingChest = null; chestRequest++; mutableChest.value = ChestUi.Idle }
    }

    /** Mirrors the account's chests from the server, so a chest opened on another device shows here too. */
    @Synchronized fun refreshChests(userId: String?) {
        val account = selectAccount(userId)
        val chests = chests ?: return
        if (userId == null || pendingChest != null) return
        val request = ++chestRefreshRequest
        viewModelScope.launch(Dispatchers.IO) {
            runCatching { chests.load(userId) }.onSuccess {
                synchronized(this@LeagueViewModel) {
                if (accountGeneration != account || chestRefreshRequest != request) return@onSuccess
                val before = QuestChests.total(getApplication(), userId)
                QuestChests.mirror(getApplication(), userId, it)
                if (it.total != before) mutableChestVersion.value++
                }
            }
        }
    }

    private companion object {
        fun http() = LearningSyncHttp(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_PUBLISHABLE_KEY)
    }
}
