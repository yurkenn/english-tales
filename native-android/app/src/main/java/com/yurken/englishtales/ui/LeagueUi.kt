package com.yurken.englishtales.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.content.Intent
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import com.yurken.englishtales.R
import com.yurken.englishtales.data.LeagueStanding
import com.yurken.englishtales.data.LeagueUi
import com.yurken.englishtales.data.LeagueZone

private val tierColors = listOf(Color(0xFFB87333), Color(0xFF8E9AA6), Color(0xFFE0A100), Color(0xFF2F6FD6), Color(0xFF13A8BC))
internal fun leagueColor(tier: Int) = tierColors[(tier - 1).coerceIn(0, tierColors.lastIndex)]

@Composable
internal fun leagueName(tier: Int) = stringResource(when (tier) {
    1 -> R.string.league_tier_1; 2 -> R.string.league_tier_2; 3 -> R.string.league_tier_3; 4 -> R.string.league_tier_4; else -> R.string.league_tier_5
})

/** A shield in the tier's color with a star; locked tiers are drawn faded. */
@Composable
internal fun LeagueBadge(tier: Int, size: Dp, modifier: Modifier = Modifier, faded: Boolean = false) {
    val color = leagueColor(tier).copy(alpha = if (faded) 0.28f else 1f)
    Box(modifier.size(size), contentAlignment = Alignment.Center) {
        Canvas(Modifier.matchParentSize()) {
            val w = this.size.width; val h = this.size.height
            drawPath(Path().apply {
                moveTo(w * 0.5f, 0f); lineTo(w * 0.94f, h * 0.16f); lineTo(w * 0.9f, h * 0.58f)
                quadraticTo(w * 0.82f, h * 0.84f, w * 0.5f, h); quadraticTo(w * 0.18f, h * 0.84f, w * 0.1f, h * 0.58f)
                lineTo(w * 0.06f, h * 0.16f); close()
            }, color)
        }
        ReferenceIcon("star", Color.White.copy(alpha = if (faded) 0.6f else 1f), Modifier.size(size * 0.5f), filled = true)
    }
}

@Composable
private fun timeLeft(endsAt: Long): String {
    val hours = ((endsAt - System.currentTimeMillis()) / 3_600_000L).coerceAtLeast(0)
    return if (hours >= 24) stringResource(R.string.league_days_left, ((hours + 23) / 24).toInt())
    else stringResource(R.string.league_hours_left, (hours + 1).toInt())
}

/** The home screen's league line: rank, the gap to the next place and the time left bring learners back each day. */
@Composable
internal fun LeagueCard(state: LeagueUi, onOpen: () -> Unit, onAccount: () -> Unit, modifier: Modifier = Modifier) {
    if (state == LeagueUi.Unavailable) return
    val standing = (state as? LeagueUi.Ready)?.standing
    val tier = standing?.tier ?: 1
    Row(modifier.fillMaxWidth().background(TaleSurface, RoundedCornerShape(18.dp)).border(1.dp, TaleLine, RoundedCornerShape(18.dp))
        .pressScale(onClick = if (state == LeagueUi.Guest) onAccount else onOpen).padding(16.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        LeagueBadge(tier, 48.dp)
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(if (standing != null) leagueName(tier) else stringResource(R.string.league_title), style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (standing?.joined == true) Text(timeLeft(standing.endsAt), color = TaleMuted, style = MaterialTheme.typography.labelMedium)
            }
            val me = standing?.me
            when {
                state == LeagueUi.Guest -> Text(stringResource(R.string.league_guest), color = TaleMuted, style = MaterialTheme.typography.bodyMedium)
                state == LeagueUi.Loading -> Text(stringResource(R.string.league_loading), color = TaleMuted, style = MaterialTheme.typography.bodyMedium)
                state == LeagueUi.Failed -> Text(stringResource(R.string.league_failed), color = TaleMuted, style = MaterialTheme.typography.bodyMedium)
                standing == null -> {}
                standing.optedOut -> Text(stringResource(R.string.league_opted_out), color = TaleMuted, style = MaterialTheme.typography.bodyMedium)
                me == null -> Text(stringResource(R.string.league_join_hint), color = TaleMuted, style = MaterialTheme.typography.bodyMedium)
                else -> {
                    Text(stringResource(R.string.league_rank, me.rank, me.xp), fontWeight = FontWeight.SemiBold, color = TaleInk)
                    val zone = standing.zone(me.rank)
                    val gap = standing.xpToNext
                    Text(when {
                        zone == LeagueZone.Relegation -> stringResource(R.string.league_relegation)
                        gap != null -> stringResource(R.string.league_to_next, gap)
                        else -> stringResource(R.string.league_leading)
                    }, color = when (zone) { LeagueZone.Promotion -> TaleSuccess; LeagueZone.Relegation -> TaleError; else -> TaleMuted },
                        style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
        ReferenceIcon("next", TaleMuted, Modifier.size(18.dp))
    }
}

@Composable
internal fun LeagueScreen(state: LeagueUi, displayName: String, onBack: () -> Unit, onRefresh: () -> Unit, onOptOut: (Boolean) -> Unit, onSettings: () -> Unit, onSaveName: (String) -> Unit = {}) {
    LaunchedEffect(Unit) { onRefresh() }
    Column(Modifier.fillMaxSize().background(TaleBackground).statusBarsPadding().navigationBarsPadding()) {
        SimpleTopBar(stringResource(R.string.league_title), onBack)
        val standing = (state as? LeagueUi.Ready)?.standing
        if (standing == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                if (state == LeagueUi.Failed) Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(stringResource(R.string.league_failed_short), color = TaleMuted)
                    TextButton(onClick = onRefresh) { Text(stringResource(R.string.league_retry)) }
                } else TaleLoading()
            }
            return@Column
        }
        LazyColumn(Modifier.fillMaxSize().centeredWidth(ContentWidth), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item { LeagueHeader(standing) }
            // Everyone starts as the default reader name; a nickname makes the table feel like real rivals.
            if (displayName == DEFAULT_NAME && !standing.optedOut) item { NicknameCard(onSaveName) }
            standing.lastWeek?.let { last -> item { LastWeekBanner(last.outcome, last.rank, standing.tier) } }
            if (standing.optedOut || standing.me == null) item {
                Text(stringResource(if (standing.optedOut) R.string.league_opted_out_screen else R.string.league_join_hint),
                    color = TaleMuted, modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp))
            }
            itemsIndexed(standing.members, key = { _, m -> m.rank }) { i, member ->
                if (i > 0 && standing.zone(member.rank) != standing.zone(member.rank - 1)) {
                    val down = standing.zone(member.rank) == LeagueZone.Relegation
                    ZoneDivider(stringResource(if (down) R.string.league_zone_down else R.string.league_zone_up_end), if (down) TaleError else TaleSuccess)
                }
                MemberRow(member.rank, member.name, member.xp, member.me, standing.zone(member.rank), Modifier.appearIn(minOf(i, 8)))
            }
            item {
                Column(Modifier.fillMaxWidth().padding(top = 16.dp).background(TaleSurface, RoundedCornerShape(16.dp)).border(1.dp, TaleLine, RoundedCornerShape(16.dp)).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(stringResource(R.string.league_how_title), fontWeight = FontWeight.Bold)
                    Text(stringResource(R.string.league_how), color = TaleMuted, style = MaterialTheme.typography.bodyMedium)
                    Text(stringResource(R.string.league_name_hint, displayName), color = TaleMuted, style = MaterialTheme.typography.bodyMedium)
                    TextButton(onClick = onSettings, contentPadding = PaddingValues(0.dp)) { Text(stringResource(R.string.league_change_name)) }
                    HorizontalDivider(color = TaleLine)
                    val shown = !standing.optedOut
                    val label = stringResource(R.string.league_show_me)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(label, fontWeight = FontWeight.SemiBold)
                            Text(stringResource(R.string.league_show_me_text), color = TaleMuted, style = MaterialTheme.typography.bodySmall)
                        }
                        Switch(checked = shown, enabled = (state as? LeagueUi.Ready)?.busy != true, onCheckedChange = { onOptOut(!it) }, modifier = Modifier.contentLabel(label))
                    }
                }
            }
        }
    }
}

@Composable
private fun LeagueHeader(standing: LeagueStanding) {
    Column(Modifier.fillMaxWidth().padding(bottom = 8.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            for (tier in 1..LeagueStanding.TIERS) LeagueBadge(tier, if (tier == standing.tier) 64.dp else 34.dp, Modifier.appearIn(tier - 1), faded = tier > standing.tier)
        }
        Text(leagueName(standing.tier), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = TaleInk)
        if (standing.joined) Text(timeLeft(standing.endsAt), color = TaleMuted)
        val rules = buildList {
            if (standing.promote > 0) add(stringResource(R.string.league_rule_up, standing.promote))
            if (standing.relegate > 0) add(stringResource(R.string.league_rule_down, standing.relegate))
        }
        if (rules.isNotEmpty()) Text(rules.joinToString(" · "), color = TaleMuted, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun LastWeekBanner(outcome: String, rank: Int, tier: Int) {
    val (text, color) = when (outcome) {
        "promoted" -> stringResource(R.string.league_last_promoted, rank, leagueName(tier)) to TaleSuccess
        "relegated" -> stringResource(R.string.league_last_relegated, rank, leagueName(tier)) to TaleError
        else -> stringResource(R.string.league_last_stayed, rank) to TaleBlue
    }
    Text(text, color = TaleInk, fontWeight = FontWeight.SemiBold, modifier = Modifier.fillMaxWidth()
        .background(color.copy(alpha = 0.12f), RoundedCornerShape(14.dp)).border(1.dp, color.copy(alpha = 0.4f), RoundedCornerShape(14.dp)).padding(14.dp))
}

@Composable
private fun ZoneDivider(label: String, color: Color) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        HorizontalDivider(Modifier.weight(1f), color = color.copy(alpha = 0.5f))
        Text(label, color = color, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
        HorizontalDivider(Modifier.weight(1f), color = color.copy(alpha = 0.5f))
    }
}

@Composable
private fun MemberRow(rank: Int, name: String, xp: Int, me: Boolean, zone: LeagueZone, modifier: Modifier = Modifier) {
    val accent = when (zone) { LeagueZone.Promotion -> TaleSuccess; LeagueZone.Relegation -> TaleError; else -> TaleMuted }
    val you = stringResource(R.string.league_you)
    val xpText = stringResource(R.string.league_xp, xp)
    Row(modifier.fillMaxWidth().background(if (me) LocalTaleColors.current.tileBlue else TaleSurface, RoundedCornerShape(14.dp))
        .border(if (me) 2.dp else 1.dp, if (me) TaleBlue else TaleLine, RoundedCornerShape(14.dp)).padding(horizontal = 12.dp, vertical = 10.dp)
        .semantics(mergeDescendants = true) {},
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("$rank", color = accent, fontWeight = FontWeight.Bold, modifier = Modifier.widthIn(min = 24.dp))
        Box(Modifier.size(36.dp).background(leagueColor((name.firstOrNull()?.code ?: 0) % 5 + 1).copy(alpha = 0.2f), CircleShape), contentAlignment = Alignment.Center) {
            Text(name.firstOrNull()?.uppercase() ?: "?", fontWeight = FontWeight.Bold, color = TaleInk)
        }
        Text(if (me) "$name $you" else name, Modifier.weight(1f), fontWeight = if (me) FontWeight.Bold else FontWeight.Normal,
            maxLines = 1, overflow = TextOverflow.Ellipsis, color = TaleInk)
        Text(xpText, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, color = TaleInk)
    }
}

private const val DEFAULT_NAME = "Okuyucu"

@Composable
private fun NicknameCard(onSave: (String) -> Unit) {
    var name by rememberSaveable { mutableStateOf("") }
    val trimmed = name.trim()
    val valid = trimmed.length in 2..20 && trimmed != DEFAULT_NAME
    Column(Modifier.fillMaxWidth().background(LocalTaleColors.current.tileYellow, RoundedCornerShape(16.dp)).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(stringResource(R.string.league_nickname_title), fontWeight = FontWeight.Bold, color = TaleInk)
        Text(stringResource(R.string.league_nickname_text), color = TaleInk, style = MaterialTheme.typography.bodyMedium)
        OutlinedTextField(name, { name = it.take(20) }, Modifier.fillMaxWidth(), singleLine = true,
            label = { Text(stringResource(R.string.league_nickname_field)) },
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words, imeAction = ImeAction.Done))
        Button(onClick = { onSave(trimmed) }, enabled = valid, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp), shape = RoundedCornerShape(14.dp)) {
            Text(stringResource(R.string.league_nickname_save))
        }
    }
}

/** The finished week's result, shown once: a promotion celebrates and can be shared, a drop encourages a comeback. */
@Composable
internal fun LeagueResultDialog(outcome: String, rank: Int, tier: Int, onDismiss: () -> Unit) {
    val context = LocalContext.current
    val league = leagueName(tier)
    val title = stringResource(when (outcome) { "promoted" -> R.string.league_result_up; "relegated" -> R.string.league_result_down; else -> R.string.league_result_stay })
    val text = when (outcome) {
        "promoted" -> stringResource(R.string.league_last_promoted, rank, league)
        "relegated" -> stringResource(R.string.league_last_relegated, rank, league)
        else -> stringResource(R.string.league_last_stayed, rank)
    }
    val share = stringResource(R.string.league_share)
    val shareText = stringResource(R.string.league_share_text, league, "https://play.google.com/store/apps/details?id=com.yurken.englishtales")
    TaleDialog(title, text, if (outcome == "promoted") share else stringResource(R.string.anladim),
        onConfirm = {
            if (outcome == "promoted") SafeIntents.startFirst(context, Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, shareText), share))
            onDismiss()
        }, onDismissRequest = onDismiss, dismissLabel = if (outcome == "promoted") stringResource(R.string.anladim) else null) {
        Box(Modifier.fillMaxWidth().height(130.dp), contentAlignment = Alignment.Center) {
            LeagueBadge(tier, 96.dp, Modifier.appearIn(0))
            if (outcome == "promoted") ConfettiBurst(Modifier.matchParentSize(), "league$tier")
        }
    }
}
