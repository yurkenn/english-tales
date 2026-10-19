package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.yurken.englishtales.data.*
import com.yurken.englishtales.BuildConfig
import kotlinx.coroutines.launch
import androidx.compose.ui.res.stringResource
import com.yurken.englishtales.R

/** Q6: a shared story link to open; [at] tells two taps on the same link apart. */
data class StoryLinkRequest(val storyId: String,val at: Long) {
    /** A link waiting for onboarding must survive rotation and process death, or the shared story is lost. */
    fun save(state: android.os.Bundle) {state.putString(KEY_ID,storyId);state.putLong(KEY_AT,at)}
    companion object {
        private const val KEY_ID="story_link_id"
        private const val KEY_AT="story_link_at"
        fun restore(state: android.os.Bundle?): StoryLinkRequest?=
            state?.getString(KEY_ID)?.takeIf {com.yurken.englishtales.data.StoryLinks.storyId(com.yurken.englishtales.data.StoryLinks.url(it))==it}
                ?.let {StoryLinkRequest(it,state.getLong(KEY_AT))}
    }
}

@Composable
fun TalesApp(viewModel: LearningViewModel = viewModel(),dailyPlanRequest: Long=0L,storyLinkRequest: StoryLinkRequest?=null,onStoryLinkHandled: (StoryLinkRequest)->Unit={}) {
    val account by viewModel.account.collectAsState()
    // Saved quiz options contain translated text; never restore a previous language's unfinished quiz.
    // The account ViewModel and its pending learning writes remain outside this UI key.
    val snapshot by viewModel.state.collectAsState()
    val ready by viewModel.ready.collectAsState()
    if (!ready || snapshot.ownerId != (account.userId ?: "guest")) { Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { TaleLoading() }; return }
    FirstLanguageGate(snapshot.onboardingDone) {
        key(account.scope, SupportLanguage.code) {TalesAccountApp(viewModel,dailyPlanRequest,storyLinkRequest,onStoryLinkHandled)}
    }
}

@Composable
private fun TalesAccountApp(viewModel: LearningViewModel,dailyPlanRequest: Long,storyLinkRequest: StoryLinkRequest?,onStoryLinkHandled: (StoryLinkRequest)->Unit) {
    val account by viewModel.account.collectAsState()
    val content: ContentViewModel = viewModel(key = "content-${SupportLanguage.code}")
    LaunchedEffect(content) { if (content.ready.value) content.restoreLanguage() }
    val contentReady by content.ready.collectAsState()
    val snapshot by viewModel.state.collectAsState()
    val ready by viewModel.ready.collectAsState()
    val writeError by viewModel.writeError.collectAsState()
    val completions by viewModel.completedSessions.collectAsState()
    val ads=com.yurken.englishtales.ads.LocalCompletionAds.current
    LaunchedEffect(completions) {completions.forEach(ads::recordCompletion)}
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    var launchId by rememberSaveable {mutableStateOf<String?>(null)}
    var launchWords by rememberSaveable {mutableStateOf(emptyList<String>())}
    val lifecycle=androidx.lifecycle.compose.LocalLifecycleOwner.current.lifecycle
    val context=androidx.compose.ui.platform.LocalContext.current
    val uiScope=rememberCoroutineScope()
    fun google() {uiScope.launch {viewModel.signInGoogle {GoogleSignIn.acquire(context,BuildConfig.GOOGLE_WEB_CLIENT_ID)}}}
    DisposableEffect(lifecycle) {
        val observer=androidx.lifecycle.LifecycleEventObserver {_,event -> when(event) {
            androidx.lifecycle.Lifecycle.Event.ON_START -> viewModel.setForeground(true)
            androidx.lifecycle.Lifecycle.Event.ON_STOP -> viewModel.setForeground(false)
            androidx.lifecycle.Lifecycle.Event.ON_RESUME -> {viewModel.refresh();viewModel.verifyAccount();LearningReminders.schedule(context);if(content.ready.value) content.refreshIfStale()}
            else -> {}
        }}
        lifecycle.addObserver(observer)
        onDispose {lifecycle.removeObserver(observer)}
    }
    if(!ready || !contentReady || snapshot.ownerId!=(account.userId?:"guest")) { Box(Modifier.fillMaxSize(),contentAlignment=Alignment.Center) { TaleLoading() }; return }
    val startDestination=rememberSaveable {if(snapshot.onboardingDone) "main" else if(account.userId==null) "welcome" else "onboarding"}
    val nav=rememberNavController()
    fun completedExit(id: String, active: ()->Boolean, next: ()->Unit) {
        val expected=account.scope
        val entry=nav.currentBackStackEntry?.id
        if(!active() || viewModel.account.value.scope!=expected) return
        if(id !in viewModel.completedSessions.value || viewModel.writeError.value!=null) next()
        else ads.afterCompletion(id,{active() && viewModel.account.value.scope==expected && viewModel.writeError.value==null && nav.currentBackStackEntry?.id==entry},next)
    }
    fun dailyPlan() {selectedTab=0;nav.popBackStack("main",false)}
    fun practice(ids: List<String>) {launchWords=ids;launchId=java.util.UUID.randomUUID().toString();selectedTab=2;nav.popBackStack("main",false)}
    var handledRequest by rememberSaveable {mutableLongStateOf(0L)}
    LaunchedEffect(dailyPlanRequest) {
        if(dailyPlanRequest>0 && dailyPlanRequest!=handledRequest && snapshot.onboardingDone) {dailyPlan();handledRequest=dailyPlanRequest}
    }
    // A returning account opens on onboarding before its first cloud pull; once the pulled profile marks it onboarded, leave without rewriting its preferences.
    LaunchedEffect(snapshot.onboardingDone) {
        if(snapshot.onboardingDone && nav.currentDestination?.route=="onboarding") nav.navigate("main") {popUpTo("onboarding") {inclusive=true}}
    }
    // Q6: a shared link opens its story page; a story this catalog does not have opens the library instead.
    // An unknown story waits for one catalog refresh first, since a cached catalog may predate a newly published story.
    // A learner still in onboarding sees the link once onboarding is done.
    // The request is cleared once handled, so switching accounts does not open it again.
    LaunchedEffect(storyLinkRequest,snapshot.onboardingDone) {
        val request=storyLinkRequest?:return@LaunchedEffect
        if(!snapshot.onboardingDone) return@LaunchedEffect
        val found=StoryLinks.resolve(request.storyId,{it in LearningContent.storyById}) {content.awaitRefresh()}
        onStoryLinkHandled(request)
        nav.popBackStack("main",false)
        if(found) nav.navigate("story/${request.storyId}") else selectedTab=1
    }
    val alerts=remember {TaleAlerts()}
    val writeRecovered=stringResource(R.string.alert_write_recovered)
    // A failed write stays in the error bar with its retry; recovering from it is confirmed, so the learner knows nothing was lost.
    var hadWriteError by remember {mutableStateOf(false)}
    LaunchedEffect(writeError) {
        if(writeError!=null) hadWriteError=true
        else if(hadWriteError) {alerts.success(writeRecovered);hadWriteError=false}
    }
    LaunchedEffect(content) {content.events.collect {event -> if(event.success) alerts.success(event.message) else alerts.error(event.message)}}
    // Celebrate the moments that keep a learner coming back: the daily goal and a growing streak.
    val goalText=stringResource(R.string.alert_daily_goal)
    val streakText=stringResource(R.string.alert_streak,snapshot.streak)
    var seenGoal by rememberSaveable {mutableStateOf(snapshot.dailyGoalReached)}
    var seenStreak by rememberSaveable {mutableIntStateOf(snapshot.streak)}
    LaunchedEffect(snapshot.dailyGoalReached,snapshot.streak) {
        if(snapshot.dailyGoalReached && !seenGoal) alerts.reward(goalText)
        else if(snapshot.streak>seenStreak && snapshot.streak>=2) alerts.reward(streakText)
        seenGoal=snapshot.dailyGoalReached;seenStreak=snapshot.streak
    }
    TaleAlertHost(alerts) {
    LearningWriteHost(writeError,viewModel::retryLearningWrites) {
        NavHost(navController=nav,startDestination=startDestination,enterTransition={taleEnter},exitTransition={taleExit},popEnterTransition={talepopEnter},popExitTransition={talePopExit}) {
            composable("welcome") {WelcomeScreen(account,onGuest={nav.navigate("onboarding") {popUpTo("welcome") {inclusive=true}}},onEmail={nav.navigate("account")},onGoogle=::google)}
            composable("onboarding") { OnboardingScreen { level,genre,goal -> viewModel.completeOnboarding(level,genre,goal); nav.navigate("main") { popUpTo("onboarding") { inclusive=true } };LearningContent.recommendedStory(level,genre)?.let {nav.navigate("reader/${it.id}")} } }
            composable("main") {
                Column(Modifier.fillMaxSize()) {
                    if(selectedTab==1) ContentConnectionBar(content,onDownloads={nav.navigate("downloads")})
                    Box(Modifier.weight(1f)) {
                        MainTabs(snapshot,selectedTab,{selectedTab=it},onOpenStory={nav.navigate("story/$it")},onOpenWords={nav.navigate("words")},onLessonComplete=viewModel::completeLesson,onWordReviewed={id,correct -> viewModel.reviewWord(id,correct)},onRead={id -> val revision=snapshot.resumeRevision(id); nav.navigate("reader/$id"+(revision?.let {"?revision=$it"}?:""))},onPractice=::practice,onSettings={nav.navigate("settings")},onAccount={nav.navigate("account")},launchId=launchId,launchWords=launchWords,onLaunchConsumed={launchId=null},onDailyPlan=::dailyPlan,onSessionStart={id,kind,count ->viewModel.beginSession(id,kind,count,null)},onCheckpoint=viewModel::checkpointSession,onSessionAbandoned=viewModel::abandonSession,onCompletedExit=::completedExit)
                    }
                }
            }
            composable("story/{storyId}",arguments=listOf(navArgument("storyId") { type=NavType.StringType })) { entry ->
                LearningContent.storyById[entry.arguments?.getString("storyId")]?.let { story ->
                    StoryDetailScreen(story,snapshot.progressFor(story),onBack={nav.popBackStack()},onRead={nav.navigate("reader/${story.id}")},onListen={nav.navigate("reader/${story.id}?listen=true")},onTabSelected={selectedTab=it; nav.popBackStack("main",false)},content=content,
                        favorite=story.id in snapshot.favoriteStoryIds,onToggleFavorite={viewModel.toggleFavorite(story.id)},
                        newWords=if(snapshot.knownWordCount>0) remember(story.revisionId,snapshot.wordStages) {StoryDifficulty.estimate(story,snapshot.wordStages)}?.newWords else null)
                }
            }
            composable("reader/{storyId}?listen={listen}&revision={revision}",arguments=listOf(navArgument("storyId") {type=NavType.StringType},navArgument("listen") {type=NavType.BoolType;defaultValue=false},navArgument("revision") {type=NavType.StringType;defaultValue=""})) { entry ->
                val storyId = entry.arguments?.getString("storyId")
                val retainedRevision = entry.savedStateHandle.get<String>("reader_revision") ?: entry.arguments?.getString("revision")?.takeIf {it.isNotBlank()}
                val initial = retainedRevision?.let(LearningContent::revision) ?: LearningContent.storyById[storyId]
                var selectedStory by remember(entry) { mutableStateOf(initial?.takeIf { it.sentences.isNotEmpty() }) }
                LaunchedEffect(entry) { if (selectedStory == null && initial != null) content.download(initial) { selectedStory = it } }
                if (selectedStory == null) {
                    ContentDownloadScreen(content,initial,onBack={nav.popBackStack()},onReady={selectedStory=it})
                }
                selectedStory?.let { story ->
                    LaunchedEffect(story.revisionId) {entry.savedStateHandle["reader_revision"]=story.revisionId}
                    DisposableEffect(story) { LearningContent.pin(story); onDispose { LearningContent.unpin(story) } }
                    val sessionId=rememberSaveable(story.revisionId) {java.util.UUID.randomUUID().toString()}
                    LaunchedEffect(sessionId) {viewModel.startReading(story.id);viewModel.beginSession(sessionId,"reading",0,story.id)}
                    fun exit() {viewModel.abandonSession(sessionId);nav.popBackStack()}
                    androidx.activity.compose.BackHandler {exit()}
                    ReaderScreen(story,snapshot,onBack={exit()},onSaveWord=viewModel::toggleWord,onProgress={percent,sentence ->viewModel.updateProgress(story.id,percent,sentence)},autoListen=entry.arguments?.getBoolean("listen")==true && entry.savedStateHandle.get<Boolean>("reader_listen_handled")!=true,onComplete={millis ->viewModel.completeReading(story.id,sessionId,millis);nav.navigate("reading-result/${story.id}?revision=${story.revisionId}&session=$sessionId") {popUpTo(entry.destination.id) {inclusive=true}}},onHintDismiss={viewModel.dismissReaderHint()},sessionId=sessionId,onCheckpoint=viewModel::checkpointSession,onOpenWords={entry.savedStateHandle["reader_listen_handled"]=true;nav.navigate("words")},onSaveGlossaryWord=viewModel::toggleGlossaryWord,onLookup=viewModel::recordLookup)
                }
            }
            composable("reading-result/{storyId}?revision={revision}&session={session}",arguments=listOf(navArgument("session") {type=NavType.StringType;defaultValue=""},navArgument("storyId") {type=NavType.StringType},navArgument("revision") {type=NavType.StringType;defaultValue=""})) {entry ->
                androidx.activity.compose.BackHandler {dailyPlan()}
                val play=com.yurken.englishtales.play.LocalPlayStoreFeatures.current
                val finished=snapshot.storyProgress.values.count {it>=100}
                LaunchedEffect(finished) {play?.onStoryFinished(finished)}
                (entry.arguments?.getString("revision")?.let(LearningContent::revision) ?: LearningContent.storyById[entry.arguments?.getString("storyId")])?.let {story -> ReadingResultScreen(story,snapshot,onPractice={ids -> viewModel.saveWords(ids);practice(ids)},onDailyPlan={completedExit(entry.arguments?.getString("session").orEmpty(),{true},::dailyPlan)},onBack=::dailyPlan) }
            }
            composable("settings") {LearningSettingsScreen(snapshot,onBack={nav.popBackStack()},onSave={level,genre,goal,name ->viewModel.updatePreferences(level,genre,goal,name);nav.popBackStack()})}
            composable("downloads") {ContentDownloadsScreen(content,onBack={nav.popBackStack()})}
            composable("account") {AccountScreen(account,onBack={nav.popBackStack()},onSignIn=viewModel::signIn,onSignOut=viewModel::signOut,onGoogle=::google,onTransfer=viewModel::transferGuestProgress,onSync=viewModel::syncNow,onResolvePreferences=viewModel::resolvePreferences,onSignUp=viewModel::signUp,onRecovery=viewModel::requestRecovery,onCompleteCode=viewModel::completeEmailCode,onResendCode=viewModel::resendEmailCode,onCancelCode=viewModel::cancelEmailCode,onDeleteAccount=viewModel::deleteAccount,onGuest={
                if(snapshot.onboardingDone) nav.popBackStack() else nav.navigate("onboarding") {popUpTo("welcome") {inclusive=true}}
            })}
            composable("words") { SavedWordsScreen(snapshot,onBack={nav.popBackStack()},onRemoveWord=viewModel::removeWord) }
        }
    }
    }
}

@Composable
private fun MainTabs(snapshot: LearningSnapshot, selectedTab: Int, onTabSelected: (Int)->Unit, onOpenStory: (String)->Unit,onOpenWords: ()->Unit,onLessonComplete: (Int,String,String,Int,Long)->Unit,onWordReviewed: (String,Boolean)->Unit,onRead: (String)->Unit,onPractice: (List<String>)->Unit,onSettings: ()->Unit,onAccount: ()->Unit,launchId: String?,launchWords: List<String>,onLaunchConsumed: ()->Unit,onDailyPlan: ()->Unit,onSessionStart: (String,String,Int)->Unit,onCheckpoint: (String,Long)->Unit,onSessionAbandoned: (String)->Unit,onCompletedExit: (String,()->Boolean,()->Unit)->Unit) {
    var practicing by remember { mutableStateOf(false) }
    Scaffold(containerColor=TaleBackground,bottomBar={ if(!practicing) TalesBottomBar(selectedTab,onTabSelected) }) { padding ->
        // Tabs cross-fade instead of cutting; the practice tab keeps its running session state.
        TaleSwitch(selectedTab) { tab -> when(tab) {
            0 -> StudyScreen(snapshot,onOpenStory,onOpenWords,padding,onRead,onPractice)
            1 -> CatalogScreen(snapshot,onOpenStory,padding)
            2 -> PracticeScreen(snapshot,onLessonComplete,onWordReviewed,padding,onSessionStart,onCheckpoint,onSessionAbandoned,onSessionActive={practicing=it},launchId=launchId,launchWordIds=launchWords,onLaunchConsumed=onLaunchConsumed,onDailyPlan=onDailyPlan,onCompletedExit=onCompletedExit)
            else -> ProfileScreen(snapshot,onOpenWords,padding,onSettings,onAccount)
        } }
    }
}
