package com.yurken.englishtales.ui

import android.content.Context
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.R
import com.yurken.englishtales.data.DailyQuest
import com.yurken.englishtales.data.GameRewards
import com.yurken.englishtales.data.LearningPolicy
import com.yurken.englishtales.data.LearningSnapshot
import kotlinx.coroutines.delay
import java.util.Locale

/** Right answers in a row within one practice session; any miss resets the run. */
@Stable
class ComboState(current: Int = 0, best: Int = 0) {
    var current by mutableIntStateOf(current); private set
    var best by mutableIntStateOf(best); private set
    fun record(correct: Boolean) { current = if (correct) current + 1 else 0; best = maxOf(best, current) }
    fun reset() { current = 0; best = 0 }
    companion object {
        val Saver = listSaver<ComboState, Int>({ listOf(it.current, it.best) }, { ComboState(it[0], it[1]) })
    }
}

/** The running session's combo; games record each checked answer here. */
internal val LocalCombo = staticCompositionLocalOf { ComboState() }

/** Small device-local game records: today's best combo, match times and the daily chest. Scoped per learning owner. */
internal object GameRecords {
    private fun prefs(context: Context) = context.getSharedPreferences("game_records", Context.MODE_PRIVATE)
    private fun today() = LearningPolicy.dayKey(System.currentTimeMillis())
    fun noteCombo(context: Context, owner: String, combo: Int) {
        val key = "$owner:combo:${today()}"
        if (combo > prefs(context).getInt(key, 0)) prefs(context).edit().putInt(key, combo).apply()
    }
    fun todayCombo(context: Context, owner: String) = prefs(context).getInt("$owner:combo:${today()}", 0)
    fun bestMatchMillis(context: Context, owner: String, pairs: Int) = prefs(context).getLong("$owner:match:$pairs", 0L).takeIf { it > 0 }
    /** Stores the time if it beats the record; true when it is a new record, including the first finished board. */
    fun recordMatch(context: Context, owner: String, pairs: Int, millis: Long): Boolean {
        val best = bestMatchMillis(context, owner, pairs)
        if (best != null && best <= millis) return false
        prefs(context).edit().putLong("$owner:match:$pairs", millis).apply()
        return true
    }
    fun chestOpened(context: Context, owner: String) = prefs(context).getBoolean("$owner:chest:${today()}", false)
    fun openChest(context: Context, owner: String): Int {
        val days = prefs(context).getInt("$owner:chest_days", 0) + 1
        prefs(context).edit().putBoolean("$owner:chest:${today()}", true).putInt("$owner:chest_days", days).apply()
        return days
    }
    fun chestDays(context: Context, owner: String) = prefs(context).getInt("$owner:chest_days", 0)
    fun seedStreak(context: Context, owner: String, streak: Int) {
        val key = "$owner:streak_celebrated"
        if (!prefs(context).contains(key)) prefs(context).edit().putInt(key, GameRewards.STREAK_MILESTONES.lastOrNull { it <= streak } ?: 0).apply()
    }
    fun celebratedStreak(context: Context, owner: String) = prefs(context).getInt("$owner:streak_celebrated", 0)
    fun celebrateStreak(context: Context, owner: String, milestone: Int) = prefs(context).edit().putInt("$owner:streak_celebrated", milestone).apply()
}

internal fun formatMatchTime(millis: Long): String {
    val tenths = millis / 100
    return String.format(Locale.US, "%d:%02d.%d", tenths / 600, (tenths / 10) % 60, tenths % 10)
}

/**
 * A flame chip that appears from two right answers in a row, pops on every new one and turns purple from five.
 * Milestones (3, 5, 8) float a short cheer above it.
 */
@Composable
internal fun ComboBadge(modifier: Modifier = Modifier) {
    val combo = LocalCombo.current.current
    val c = LocalTaleColors.current
    var shown by remember { mutableIntStateOf(combo) }
    var pops by remember { mutableIntStateOf(0) }
    LaunchedEffect(combo) { if (combo > shown && combo >= 2) pops++; shown = combo }
    val hot = combo >= 5
    val fill by animateColorAsState(if (hot) c.purple else c.tileYellow, tween(TaleMotion.standard), label = "comboFill")
    val ink by animateColorAsState(if (hot) c.onPurple else c.ink, tween(TaleMotion.standard), label = "comboInk")
    val label = stringResource(R.string.combo_label, combo)
    Box(modifier, contentAlignment = Alignment.Center) {
        AnimatedVisibility(combo >= 2, enter = scaleIn(spring(dampingRatio = 0.45f)) + fadeIn(), exit = scaleOut(tween(TaleMotion.quick)) + fadeOut(tween(TaleMotion.quick))) {
            Row(Modifier.popOn(pops).background(fill, RoundedCornerShape(20.dp)).padding(horizontal = 10.dp, vertical = 5.dp)
                .semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite }.contentLabel(label),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                ReferenceIcon("flame", if (hot) c.onPurple else TaleWarm, Modifier.size(18.dp).flicker(hot))
                Text("×${combo.coerceAtLeast(2)}", fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = ink)
            }
        }
        ComboCheer(combo)
    }
}

@Composable
private fun ComboCheer(combo: Int) {
    val cheer = when (combo) { 3 -> R.string.combo_cheer_3; 5 -> R.string.combo_cheer_5; 8 -> R.string.combo_cheer_8; else -> null }
    if (cheer == null || reduceMotion()) return
    val rise = remember(combo) { Animatable(0f) }
    LaunchedEffect(combo) { rise.animateTo(1f, tween(1100, easing = LinearOutSlowInEasing)) }
    if (rise.value >= 1f) return
    Text(stringResource(cheer), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TalePurple, maxLines = 1, softWrap = false,
        modifier = Modifier.wrapContentSize(unbounded = true).graphicsLayer {
            translationY = -(14f + rise.value * 26f) * density
            alpha = if (rise.value < 0.7f) 1f else (1f - rise.value) / 0.3f
            scaleX = 0.8f + rise.value * 0.3f; scaleY = scaleX
        })
}

/** A gentle flame wobble while the combo is hot; still otherwise. */
private fun Modifier.flicker(active: Boolean): Modifier = composed {
    val still = reduceMotion()
    val angle = if (active && !still) rememberInfiniteTransition(label = "flicker")
        .animateFloat(-8f, 8f, infiniteRepeatable(tween(260, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "flickerAngle")
        else rememberUpdatedState(0f)
    graphicsLayer { rotationZ = angle.value }
}

/** One to three stars that land one after another with a springy spin; unearned ones stay as outlines. */
@Composable
internal fun ResultStars(stars: Int, modifier: Modifier = Modifier) {
    val label = stringResource(R.string.result_stars, stars)
    Row(modifier.contentLabel(label), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Bottom) {
        repeat(3) { i ->
            val earned = i < stars
            val still = reduceMotion()
            val land = remember { Animatable(if (still || !earned) 1f else 0f) }
            LaunchedEffect(earned) {
                if (earned && !still) { delay(350L + i * 260L); land.animateTo(1f, spring(dampingRatio = 0.42f, stiffness = Spring.StiffnessMediumLow)) }
            }
            val starSize = if (i == 1) 64.dp else 50.dp
            Box(Modifier.size(starSize).graphicsLayer {
                scaleX = land.value; scaleY = land.value; rotationZ = (1f - land.value) * -120f
                translationY = if (i == 1) 0f else 6f * density
            }, contentAlignment = Alignment.Center) {
                val gold = TaleYellow; val edge = TaleGold; val line = TaleLine
                Canvas(Modifier.fillMaxSize()) {
                    val star = starPath(size.minDimension)
                    if (earned) { drawPath(star, gold); drawPath(star, edge, style = androidx.compose.ui.graphics.drawscope.Stroke(size.minDimension * 0.06f, join = androidx.compose.ui.graphics.StrokeJoin.Round)) }
                    else drawPath(star, line, style = androidx.compose.ui.graphics.drawscope.Stroke(size.minDimension * 0.07f, join = androidx.compose.ui.graphics.StrokeJoin.Round))
                }
            }
        }
    }
}

/** A rounded five-point star filling a square of [side]. */
private fun starPath(side: Float) = androidx.compose.ui.graphics.Path().apply {
    val c = side / 2f; val outer = side * 0.46f; val inner = outer * 0.48f
    for (i in 0 until 10) {
        val r = if (i % 2 == 0) outer else inner
        val a = Math.toRadians(-90.0 + i * 36.0)
        val x = c + (r * kotlin.math.cos(a)).toFloat(); val y = c + side * 0.03f + (r * kotlin.math.sin(a)).toFloat()
        if (i == 0) moveTo(x, y) else lineTo(x, y)
    }
    close()
}

/** A labelled number on the result screen. */
@Composable
internal fun ResultStat(value: String, label: String, modifier: Modifier = Modifier) {
    Column(modifier.background(TaleSurface, RoundedCornerShape(14.dp)).border(1.dp, TaleLine, RoundedCornerShape(14.dp)).padding(vertical = 10.dp, horizontal = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TaleInk, maxLines = 1)
        Text(label, fontSize = 11.sp, color = TaleMuted, maxLines = 2, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
    }
}

/**
 * Today's three quests on the home screen. When all are done the chest wiggles; a tap opens it with confetti,
 * once per day.
 */
@Composable
internal fun DailyQuestsCard(snapshot: LearningSnapshot, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val owner = snapshot.ownerId
    // Re-read on every snapshot: a finished session changes the stored combo and today's counts together.
    val combo = remember(snapshot, owner) { GameRecords.todayCombo(context, owner) }
    val quests = GameRewards.quests(snapshot.todaySessions, snapshot.dailyGoal, snapshot.todayReadings, combo)
    val allDone = quests.all { it.done }
    var opened by remember(owner) { mutableStateOf(GameRecords.chestOpened(context, owner)) }
    var reward by remember { mutableStateOf<Int?>(null) }
    Column(modifier.fillMaxWidth().background(TaleSurface, RoundedCornerShape(18.dp)).border(1.dp, TaleLine, RoundedCornerShape(18.dp)).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(stringResource(R.string.quests_title), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            Text(stringResource(R.string.quest_progress, quests.count { it.done }, quests.size), color = TaleMuted, style = MaterialTheme.typography.labelLarge)
        }
        quests.forEachIndexed { i, quest -> QuestRow(quest, Modifier.appearIn(i)) }
        val chestLabel = stringResource(when { opened -> R.string.quests_chest_opened; allDone -> R.string.quests_chest_ready; else -> R.string.quests_chest_locked })
        Row(Modifier.fillMaxWidth().background(if (allDone && !opened) LocalTaleColors.current.tileYellow else TaleBackground, RoundedCornerShape(14.dp))
            .then(if (allDone && !opened) Modifier.pressScale { reward = GameRecords.openChest(context, owner); opened = true } else Modifier)
            .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            QuestChest(ready = allDone && !opened, open = opened, modifier = Modifier.size(48.dp))
            Text(chestLabel, style = MaterialTheme.typography.bodyMedium, fontWeight = if (allDone && !opened) FontWeight.SemiBold else FontWeight.Normal,
                color = if (allDone || opened) TaleInk else TaleMuted, modifier = Modifier.weight(1f))
        }
    }
    reward?.let { days ->
        TaleDialog(stringResource(R.string.quests_reward_title), stringResource(R.string.quests_reward_text, days), stringResource(R.string.anladim),
            onConfirm = { reward = null }, onDismissRequest = { reward = null }) {
            Box(Modifier.fillMaxWidth().height(150.dp), contentAlignment = Alignment.Center) {
                QuestChest(ready = false, open = true, modifier = Modifier.size(120.dp).appearIn(0))
                ConfettiBurst(Modifier.matchParentSize(), "chest$days")
            }
        }
    }
}

@Composable
private fun QuestRow(quest: DailyQuest, modifier: Modifier = Modifier) {
    val title = when (quest.id) {
        "goal" -> stringResource(R.string.quest_goal)
        "story" -> stringResource(R.string.quest_story)
        else -> stringResource(R.string.quest_combo, quest.target)
    }
    val icon = when (quest.id) { "goal" -> "bolt"; "story" -> "read"; else -> "flame" }
    val progress by animateFloatAsState(quest.progress.toFloat() / quest.target, tween(TaleMotion.emphasized, easing = FastOutSlowInEasing), label = "quest")
    var pops by remember { mutableIntStateOf(0) }
    var wasDone by remember { mutableStateOf(quest.done) }
    LaunchedEffect(quest.done) { if (quest.done && !wasDone) pops++; wasDone = quest.done }
    val c = LocalTaleColors.current
    Row(modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(Modifier.size(36.dp).popOn(pops).background(if (quest.done) c.success else c.tileBlue, CircleShape), contentAlignment = Alignment.Center) {
            if (quest.done) ReferenceIcon("check", c.surface, Modifier.size(18.dp)) else ReferenceIcon(icon, TaleBlue, Modifier.size(20.dp))
        }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = TaleInk, modifier = Modifier.weight(1f))
                Text(stringResource(R.string.quest_progress, quest.progress, quest.target), style = MaterialTheme.typography.labelMedium, color = TaleMuted)
            }
            ReferenceProgress(progress, Modifier.fillMaxWidth(), if (quest.done) c.success else TaleBlue)
        }
    }
}

/** A drawn treasure chest: wiggles while a reward waits, and its lid swings open once claimed. */
@Composable
private fun QuestChest(ready: Boolean, open: Boolean, modifier: Modifier = Modifier) {
    val still = reduceMotion()
    val wiggle = if (ready && !still) rememberInfiniteTransition(label = "chest")
        .animateFloat(-7f, 7f, infiniteRepeatable(tween(180, easing = LinearEasing), RepeatMode.Reverse), label = "chestWiggle")
        else rememberUpdatedState(0f)
    val lid by animateFloatAsState(if (open) 1f else 0f, spring(dampingRatio = 0.5f, stiffness = Spring.StiffnessLow), label = "lid")
    val wood = Color(0xFFB86B2B); val dark = Color(0xFF7A4318); val gold = TaleYellow
    val active = ready || open
    Canvas(modifier.graphicsLayer { rotationZ = wiggle.value }) {
        val w = size.width; val h = size.height
        // A locked chest is the same chest, faded, so it still reads as a reward to work towards.
        val fade = if (active) 1f else 0.38f
        val body = wood.copy(alpha = fade)
        val trim = gold.copy(alpha = if (active) 1f else 0.5f)
        val bodyTop = h * 0.45f
        // The glow behind an open chest.
        if (open) drawCircle(gold.copy(alpha = 0.35f), radius = w * 0.42f, center = Offset(w / 2f, bodyTop))
        drawRoundRect(body, Offset(w * 0.1f, bodyTop), Size(w * 0.8f, h * 0.45f), CornerRadius(w * 0.06f))
        drawRect(dark.copy(alpha = fade), Offset(w * 0.1f, bodyTop + h * 0.12f), Size(w * 0.8f, h * 0.05f))
        drawRect(trim, Offset(w * 0.44f, bodyTop + h * 0.04f), Size(w * 0.12f, h * 0.16f))
        // The lid hinges at its back edge.
        rotate(-lid * 35f, Offset(w * 0.1f, bodyTop)) {
            drawRoundRect(wood.copy(red = (wood.red * 1.1f).coerceAtMost(1f), alpha = fade), Offset(w * 0.08f, h * 0.24f), Size(w * 0.84f, h * 0.23f), CornerRadius(w * 0.1f))
            drawRect(trim, Offset(w * 0.08f, h * 0.38f), Size(w * 0.84f, h * 0.04f))
        }
    }
}

/** Full celebration for streak milestones (3, 7, 14, 30 …): a big flame that pulses and the day count rising. */
@Composable
internal fun StreakMilestoneDialog(days: Int, onDismiss: () -> Unit) {
    TaleDialog(stringResource(R.string.streak_milestone_title, days), stringResource(R.string.streak_milestone_text), stringResource(R.string.anladim),
        onConfirm = onDismiss, onDismissRequest = onDismiss) {
        Box(Modifier.fillMaxWidth().height(150.dp), contentAlignment = Alignment.Center) {
            Box(Modifier.size(130.dp).pulseWhile(true).background(LocalTaleColors.current.tileYellow, CircleShape))
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                ReferenceIcon("flame", TaleWarm, Modifier.size(72.dp).appearIn(0).flicker(true))
                AnimatedCounter(days, style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold), color = TaleInk)
            }
            ConfettiBurst(Modifier.matchParentSize(), "streak$days", pieces = 90)
        }
    }
}
