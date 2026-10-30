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
import androidx.compose.ui.graphics.compositeOver
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
import com.yurken.englishtales.data.LeagueMember
import com.yurken.englishtales.data.FriendList
import com.yurken.englishtales.data.FriendsUi
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.items
import androidx.compose.ui.text.font.FontFamily

private val tierColors = listOf(Color(0xFFB87333), Color(0xFF8E9AA6), Color(0xFFE0A100), Color(0xFF2F6FD6), Color(0xFF13A8BC))
internal fun leagueColor(tier: Int) = tierColors[(tier - 1).coerceIn(0, tierColors.lastIndex)]

@Composable
internal fun leagueName(tier: Int) = stringResource(when (tier) {
    1 -> R.string.league_tier_1; 2 -> R.string.league_tier_2; 3 -> R.string.league_tier_3; 4 -> R.string.league_tier_4; else -> R.string.league_tier_5
})

/** The tier's crest; locked tiers are drawn grey and faded. */
@Composable
internal fun LeagueBadge(tier: Int, size: Dp, modifier: Modifier = Modifier, faded: Boolean = false) {
    TaleArt(leagueArt(tier), modifier.size(size), locked = faded)
}

@Composable
private fun timeLeft(endsAt: Long): String {
    val hours = ((endsAt - System.currentTimeMillis()) / 3_600_000L).coerceAtLeast(0)
    return if (hours >= 24) stringResource(R.string.league_days_left, ((hours + 23) / 24).toInt())
    else stringResource(R.string.league_hours_left, (hours + 1).toInt())
}

/** The home screen's league line: rank, the gap to the next place and the time left bring learners back each day. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun LeagueCard(state: LeagueUi, onOpen: () -> Unit, onAccount: () -> Unit, modifier: Modifier = Modifier) {
    if (state == LeagueUi.Unavailable) return
    val standing = (state as? LeagueUi.Ready)?.standing
    val tier = standing?.tier ?: 1
    Row(modifier.fillMaxWidth().pressScale(onClick = if (state == LeagueUi.Guest) onAccount else onOpen)
        .background(TaleLine, RoundedCornerShape(20.dp)).padding(bottom = 5.dp)
        .background(TaleSurface, RoundedCornerShape(20.dp)).border(2.dp, TaleLine, RoundedCornerShape(20.dp)).padding(16.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        LeagueBadge(tier, 48.dp)
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            FlowRow(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(4.dp), maxItemsInEachRow = sideBySide(2)) {
                Text(if (standing != null) leagueName(tier) else stringResource(R.string.league_title), fontFamily = TaleDisplay, fontSize = 19.sp, lineHeight = 23.sp,
                    fontWeight = FontWeight.ExtraBold, modifier = Modifier.weight(1f), maxLines = if (sideBySide(2) == 1) Int.MAX_VALUE else 1, overflow = TextOverflow.Ellipsis)
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
internal fun LeagueScreen(state: LeagueUi, displayName: String, onBack: () -> Unit, onRefresh: () -> Unit, onOptOut: (Boolean) -> Unit, onSettings: () -> Unit, onSaveName: (String) -> Unit = {},
    friends: FriendsUi = FriendsUi.Unavailable, friendActions: FriendActions? = null) {
    LaunchedEffect(Unit) { onRefresh(); friendActions?.refresh?.invoke() }
    var tab by rememberSaveable { mutableIntStateOf(0) }
    // A tapped row offers its actions: reporting the name, and on the friends tab removing the friend.
    var acting by remember { mutableStateOf<Pair<LeagueMember, Boolean>?>(null) }
    acting?.let { (member, friend) -> MemberActionsDialog(member, friend, friendActions, onDismiss = { acting = null }) }
    Column(Modifier.fillMaxSize().background(TaleBackground).statusBarsPadding().navigationBarsPadding()) {
        SimpleTopBar(stringResource(R.string.league_title), onBack)
        if (friends != FriendsUi.Unavailable && friendActions != null) {
            TabRow(tab, containerColor = TaleBackground) {
                Tab(tab == 0, { tab = 0 }, text = { Text(stringResource(R.string.league_tab_league)) })
                Tab(tab == 1, { tab = 1 }, text = { Text(stringResource(R.string.friends_tab)) })
            }
            if (tab == 1) { FriendsPane(friends, friendActions) { acting = it to true }; return@Column }
        }
        val standing = (state as? LeagueUi.Ready)?.standing
        if (standing == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                if (state == LeagueUi.Failed) Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    TaleArt(R.drawable.mascot_offline, Modifier.size(150.dp).appearIn(0))
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
                MemberRow(member.rank, member.name, member.xp, member.me, standing.zone(member.rank), Modifier.appearIn(minOf(i, 8)),
                    onClick = if (!member.me && member.id.isNotEmpty() && friendActions != null) ({ acting = member to false }) else null)
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
    // The design's purple league card: this week's crest beside its name, the time left and the move-up rule.
    ChunkyBox(TalePurple, Modifier.fillMaxWidth().padding(bottom = 8.dp).appearIn(0), RoundedCornerShape(22.dp), depth = 5.dp) {
        Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            LeagueBadge(standing.tier, 64.dp)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(leagueName(standing.tier), fontFamily = TaleDisplay, fontSize = 22.sp, lineHeight = 26.sp, fontWeight = FontWeight.ExtraBold, color = TaleOnPurple)
                if (standing.joined) Text(timeLeft(standing.endsAt), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TaleOnPurple)
                val rules = buildList {
                    if (standing.promote > 0) add(stringResource(R.string.league_rule_up, standing.promote))
                    if (standing.relegate > 0) add(stringResource(R.string.league_rule_down, standing.relegate))
                }
                if (rules.isNotEmpty()) Text(rules.joinToString(" · "), fontSize = 12.sp, lineHeight = 16.sp, fontWeight = FontWeight.SemiBold, color = TaleOnPurple)
            }
        }
    }
    // The other leagues stay as a small ladder under the card, so the next step up is in sight.
    Row(Modifier.fillMaxWidth().padding(bottom = 4.dp), horizontalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterHorizontally), verticalAlignment = Alignment.CenterVertically) {
        for (tier in 1..LeagueStanding.TIERS) LeagueBadge(tier, if (tier == standing.tier) 40.dp else 30.dp, Modifier.appearIn(tier), faded = tier > standing.tier)
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
        Text(label, color = color, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.ExtraBold)
        HorizontalDivider(Modifier.weight(1f), color = color.copy(alpha = 0.5f))
    }
}

@Composable
private fun MemberRow(rank: Int, name: String, xp: Int, me: Boolean, zone: LeagueZone, modifier: Modifier = Modifier, onClick: (() -> Unit)? = null) {
    val accent = when (zone) { LeagueZone.Promotion -> TaleSuccess; LeagueZone.Relegation -> TaleError; else -> TaleMuted }
    val you = stringResource(R.string.league_you)
    val xpText = stringResource(R.string.league_xp, xp)
    val edge = if (me) TaleBlue else TaleLine
    Row(modifier.fillMaxWidth().then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
        // Each row sits on a lip; yours is outlined and lipped in blue.
        .background(edge, RoundedCornerShape(16.dp)).padding(bottom = 3.dp)
        // Rows in the drop zone are tinted red, as in the design.
        .background(if (me) LocalTaleColors.current.tileBlue else if (zone == LeagueZone.Relegation) TaleError.copy(alpha = 0.1f).compositeOver(TaleSurface) else TaleSurface, RoundedCornerShape(16.dp))
        .border(2.dp, edge, RoundedCornerShape(16.dp)).padding(horizontal = 12.dp, vertical = 10.dp)
        .semantics(mergeDescendants = true) {},
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        // The top three wear gold, silver and bronze.
        val medal = when (rank) { 1 -> TaleYellow; 2 -> Color(0xFFC7D6E2); 3 -> Color(0xFFE8A86B); else -> null }
        if (medal != null) Box(Modifier.size(30.dp).background(medal, CircleShape), contentAlignment = Alignment.Center) {
            Text("$rank", color = LightTaleColors.ink, fontFamily = TaleDisplay, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
        } else Text("$rank", color = accent, fontWeight = FontWeight.ExtraBold, textAlign = androidx.compose.ui.text.style.TextAlign.Center, modifier = Modifier.widthIn(min = 30.dp))
        Box(Modifier.size(36.dp).background(leagueColor((name.firstOrNull()?.code ?: 0) % 5 + 1).copy(alpha = 0.2f), CircleShape), contentAlignment = Alignment.Center) {
            Text(name.firstOrNull()?.uppercase() ?: "?", fontWeight = FontWeight.Bold, color = TaleInk)
        }
        Text(if (me) "$name $you" else name, Modifier.weight(1f), fontWeight = if (me) FontWeight.Bold else FontWeight.Normal,
            maxLines = 1, overflow = TextOverflow.Ellipsis, color = TaleInk)
        Text(xpText, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = TaleInk)
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

/** What the friends tab can do; each action reloads the list from the server. */
class FriendActions(val refresh: () -> Unit, val createCode: () -> Unit, val add: (String) -> Unit, val remove: (String) -> Unit, val report: (String) -> Unit)

@Composable
private fun FriendsPane(state: FriendsUi, actions: FriendActions, onMember: (LeagueMember) -> Unit) {
    val ready = state as? FriendsUi.Ready
    if (ready == null) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            if (state == FriendsUi.Failed) Column(horizontalAlignment = Alignment.CenterHorizontally) {
                TaleArt(R.drawable.mascot_offline, Modifier.size(150.dp).appearIn(0))
                Text(stringResource(R.string.friends_failed), color = TaleMuted)
                TextButton(onClick = actions.refresh) { Text(stringResource(R.string.league_retry)) }
            } else TaleLoading()
        }
        return
    }
    val context = LocalContext.current
    var code by rememberSaveable { mutableStateOf("") }
    LazyColumn(Modifier.fillMaxSize().centeredWidth(ContentWidth), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item {
            Column(Modifier.fillMaxWidth().background(TaleSurface, RoundedCornerShape(16.dp)).border(1.dp, TaleLine, RoundedCornerShape(16.dp)).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(stringResource(R.string.friends_code_title), fontWeight = FontWeight.Bold)
                        Text(stringResource(R.string.friends_code_text), color = TaleMuted, style = MaterialTheme.typography.bodyMedium)
                    }
                    TaleArt(R.drawable.mascot_wave_friends, Modifier.size(96.dp))
                }
                val mine = ready.list.code
                if (mine == null) Button(onClick = actions.createCode, enabled = !ready.busy, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp), shape = RoundedCornerShape(14.dp)) {
                    Text(stringResource(R.string.friends_code_create))
                } else {
                    val share = stringResource(R.string.friends_share)
                    val shareText = stringResource(R.string.friends_share_text, mine, "https://play.google.com/store/apps/details?id=com.yurken.englishtales")
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(mine, Modifier.weight(1f), fontSize = 28.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, letterSpacing = 4.sp, color = TaleBlue)
                        Button(onClick = { SafeIntents.startFirst(context, Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, shareText), share)) },
                            shape = RoundedCornerShape(14.dp)) { Text(share) }
                    }
                }
                HorizontalDivider(color = TaleLine)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(code, { code = FriendList.normalizeCode(it) }, Modifier.weight(1f), singleLine = true,
                        label = { Text(stringResource(R.string.friends_add_field)) },
                        keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters, imeAction = ImeAction.Done))
                    Button(onClick = { actions.add(code); code = "" }, enabled = code.length == 6 && !ready.busy, shape = RoundedCornerShape(14.dp)) {
                        Text(stringResource(R.string.friends_add))
                    }
                }
                ready.error?.let { error ->
                    Text(stringResource(when (error) { "P0002" -> R.string.friends_error_unknown; "22023" -> R.string.friends_error_self; "54000" -> R.string.friends_error_limit; else -> R.string.friends_error_generic }),
                        color = TaleError, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
        if (ready.list.members.size <= 1) item {
            Text(stringResource(R.string.friends_empty), color = TaleMuted, modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp))
        }
        items(ready.list.members, key = { it.rank }) { member ->
            MemberRow(member.rank, member.name, member.xp, member.me, LeagueZone.Safe,
                onClick = if (!member.me && member.id.isNotEmpty()) ({ onMember(member) }) else null)
        }
        item { Text(stringResource(R.string.friends_week_note), color = TaleMuted, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 8.dp)) }
    }
}

@Composable
private fun MemberActionsDialog(member: LeagueMember, friend: Boolean, actions: FriendActions?, onDismiss: () -> Unit) {
    var confirmReport by remember { mutableStateOf(false) }
    if (confirmReport) {
        TaleDialog(stringResource(R.string.report_name_title), stringResource(R.string.report_name_text, member.name), stringResource(R.string.report_name_confirm),
            onConfirm = { actions?.report?.invoke(member.id); onDismiss() }, onDismissRequest = onDismiss,
            dismissLabel = stringResource(R.string.vazgec), destructive = true)
        return
    }
    TaleDialog(member.name, null, stringResource(R.string.report_name_action), onConfirm = { confirmReport = true }, onDismissRequest = onDismiss,
        dismissLabel = if (friend) stringResource(R.string.friends_remove) else stringResource(R.string.vazgec),
        onDismiss = { if (friend) actions?.remove?.invoke(member.id); onDismiss() })
}
