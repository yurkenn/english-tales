package com.yurken.englishtales.ui

import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import android.os.LocaleList
import androidx.compose.foundation.border
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.*
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.AppLanguage
import com.yurken.englishtales.R
import java.util.Locale

internal fun languageChoiceTag(locale: Locale): String = appLanguages.firstOrNull {
    AppLanguage.languageCode(Locale.forLanguageTag(it.first)) == AppLanguage.languageCode(locale)
}?.first ?: "en"

/** Device-local first-run gate; an established learning profile never gets interrupted by it. */
@Composable
internal fun FirstLanguageGate(onboardingDone: Boolean, content: @Composable () -> Unit) {
    val context = LocalContext.current
    var confirmed by remember { mutableStateOf(AppLanguage.hasConfirmedChoice(context)) }
    LaunchedEffect(onboardingDone) {
        if (onboardingDone && !confirmed) {
            AppLanguage.confirmChoice(context)
            confirmed = true
        }
    }
    if (confirmed || onboardingDone) content()
    else LanguageWelcomeScreen(onContinue = { tag ->
        AppLanguage.confirmChoice(context)
        confirmed = true
        if (AppLanguage.selection(context) != tag) AppLanguage.select(context, tag)
    })
}

/** A live copy preview: tapping a row never changes app settings until Continue is pressed. */
@OptIn(androidx.compose.ui.ExperimentalComposeUiApi::class)
@Composable
internal fun LanguageWelcomeScreen(
    initialTag: String? = null,
    allowSystem: Boolean = false,
    onDismiss: (() -> Unit)? = null,
    onContinue: (String) -> Unit,
) {
    val context = LocalContext.current
    val recommended = remember(context) { languageChoiceTag(AppLanguage.locale(context)) }
    var selected by rememberSaveable { mutableStateOf(initialTag ?: recommended) }
    val locale = remember(selected) {
        if (selected.isEmpty()) {
            val system = Resources.getSystem().configuration.locales
            AppLanguage.resolve((0 until system.size()).map { system[it] })
        } else Locale.forLanguageTag(selected)
    }
    val configuration = LocalConfiguration.current
    val previewConfiguration = remember(configuration, locale) { Configuration(configuration).apply { setLocales(LocaleList(locale)) } }
    val localized = remember(context, previewConfiguration) { context.createConfigurationContext(previewConfiguration) }
    CompositionLocalProvider(LocalContext provides localized, LocalConfiguration provides previewConfiguration,
        LocalLayoutDirection provides if (previewConfiguration.layoutDirection == 1) LayoutDirection.Rtl else LayoutDirection.Ltr) {
        val systemName = stringResource(R.string.app_language_system)
        val name = appLanguages.firstOrNull { it.first == selected }?.second ?: systemName
        val choices = remember(recommended, allowSystem, systemName) {
            val ordered = appLanguages.sortedBy { if (it.first == recommended) 0 else 1 }
            if (allowSystem) listOf("" to systemName) + ordered else ordered
        }
        Surface(color = TaleBackground, modifier = Modifier.fillMaxSize().semantics { testTagsAsResourceId = true }) {
            Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding()) {
                LazyColumn(Modifier.weight(1f).fillMaxWidth().selectableGroup(), contentPadding = PaddingValues(24.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    item {
                        if (onDismiss != null) Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                            IconButton(onClick = onDismiss) { ReferenceIcon("close", TaleMuted, Modifier.size(22.dp).contentLabel(stringResource(R.string.kapat))) }
                        }
                        // The mascot asks the question in a speech bubble, like the rest of the first launch.
                        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            TalesMascot(MascotMood.Welcome, Modifier.size(92.dp, 108.dp), animate = false)
                            val bubble = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp, bottomEnd = 20.dp, bottomStart = 6.dp)
                            Text(stringResource(if (AppLanguage.languageCode(locale) == "en") R.string.first_language_english_note else R.string.first_language_description),
                                fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Bold, color = TaleInk,
                                modifier = Modifier.weight(1f).padding(bottom = 18.dp).background(TaleSurface, bubble).border(2.dp, TaleLine, bubble)
                                    .padding(horizontal = 14.dp, vertical = 12.dp))
                        }
                        Spacer(Modifier.height(16.dp))
                        Text(stringResource(R.string.first_language_title), fontFamily = TaleDisplay, fontSize = 28.sp, lineHeight = 32.sp,
                            fontWeight = FontWeight.ExtraBold, color = TaleInk, modifier = Modifier.semantics { heading() })
                        Spacer(Modifier.height(16.dp))
                    }
                    items(choices, key = { it.first }) { (tag, nativeName) ->
                        val active = tag == selected
                        // A picked language sits on a blue lip with a filled check; the rest are outlined chunky rows.
                        val shape = RoundedCornerShape(18.dp)
                        Box(Modifier.background(if (active) TaleBlue else TaleLine, shape).padding(bottom = 4.dp)
                            .background(if (active) TaleMint else TaleSurface, shape).border(2.dp, if (active) TaleBlue else TaleLine, shape)) {
                            Row(Modifier.fillMaxWidth().clip(shape).testTag("language_option_$tag")
                                .selectable(active, role = Role.RadioButton, onClick = { selected = tag })
                                .padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(nativeName, fontSize = 17.sp, fontWeight = if (active) FontWeight.ExtraBold else FontWeight.Bold, color = TaleInk)
                                    Text(if (tag.isEmpty()) languageChoiceTag(locale).let { code -> appLanguages.first { it.first == code }.second }
                                        else Locale.forLanguageTag(tag).getDisplayName(Locale.ENGLISH),
                                        fontSize = 12.sp, color = TaleMuted)
                                    if (tag == recommended) Text(stringResource(R.string.first_language_suggested), color = TaleBlue, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
                                }
                                Spacer(Modifier.width(12.dp))
                                Box(Modifier.size(28.dp).then(if (active) Modifier.background(TaleBlue, CircleShape) else Modifier.border(2.dp, TaleLine, CircleShape)),
                                    contentAlignment = Alignment.Center) {
                                    if (active) ReferenceIcon("check", TaleOnBlue, Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
                HorizontalDivider(color = TaleLine)
                Column(Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    ChunkyBox(TaleGreen, Modifier.fillMaxWidth().heightIn(min = 56.dp).testTag("language_continue"), RoundedCornerShape(16.dp),
                        depth = 4.dp, contentAlignment = Alignment.Center, onClick = { onContinue(selected) }) {
                        Row(Modifier.padding(horizontal = 20.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(stringResource(R.string.first_language_continue, androidx.core.text.BidiFormatter.getInstance(previewConfiguration.layoutDirection == 1).unicodeWrap(name)),
                                modifier = Modifier.weight(1f), color = TaleOnGreen, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
                            Spacer(Modifier.width(8.dp))
                            ReferenceIcon("forward", TaleOnGreen, Modifier.size(20.dp))
                        }
                    }
                    Text(stringResource(R.string.first_language_later), style = MaterialTheme.typography.bodySmall, color = TaleMuted)
                }
            }
        }
    }
}
