package com.yurken.englishtales.ui

import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import android.os.LocaleList
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
                        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.size(52.dp).background(TaleMint, RoundedCornerShape(16.dp)), contentAlignment = Alignment.Center) {
                                TalesMascot(MascotMood.Welcome, Modifier.size(48.dp), animate = false)
                            }
                            Spacer(Modifier.width(12.dp))
                            Text(stringResource(R.string.english_tales), color = TaleBlue, fontSize = 13.sp,
                                fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp, modifier = Modifier.weight(1f))
                            if (onDismiss != null) IconButton(onClick = onDismiss) {
                                Icon(Icons.Default.Close, stringResource(R.string.kapat))
                            }
                        }
                        Spacer(Modifier.height(24.dp))
                        Text(stringResource(R.string.first_language_title), style = MaterialTheme.typography.headlineMedium,
                            color = TaleInk, modifier = Modifier.semantics { heading() })
                        Spacer(Modifier.height(10.dp))
                        Text(stringResource(if (AppLanguage.languageCode(locale) == "en") R.string.first_language_english_note else R.string.first_language_description),
                            style = MaterialTheme.typography.bodyMedium, color = TaleMuted)
                        Spacer(Modifier.height(20.dp))
                    }
                    items(choices, key = { it.first }) { (tag, nativeName) ->
                        val active = tag == selected
                        Surface(shape = RoundedCornerShape(16.dp), color = if (active) TaleMint else TaleSurface,
                            border = BorderStroke(if (active) 1.5.dp else 1.dp, if (active) TaleBlue else TaleLine)) {
                            Row(Modifier.fillMaxWidth().testTag("language_option_$tag")
                                .selectable(active, role = Role.RadioButton, onClick = { selected = tag })
                                .padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(nativeName, fontSize = 17.sp, fontWeight = if (active) FontWeight.SemiBold else FontWeight.Medium, color = TaleInk)
                                    Text(if (tag.isEmpty()) languageChoiceTag(locale).let { code -> appLanguages.first { it.first == code }.second }
                                        else Locale.forLanguageTag(tag).getDisplayName(Locale.ENGLISH),
                                        fontSize = 12.sp, color = TaleMuted)
                                    if (tag == recommended) Text(stringResource(R.string.first_language_suggested), color = TaleBlue, fontSize = 11.sp)
                                }
                                Spacer(Modifier.width(12.dp))
                                RadioButton(selected = active, onClick = null)
                            }
                        }
                    }
                }
                HorizontalDivider(color = TaleLine)
                Column(Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = { onContinue(selected) }, shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth().heightIn(min = 56.dp).testTag("language_continue")) {
                        Text(stringResource(R.string.first_language_continue, androidx.core.text.BidiFormatter.getInstance(previewConfiguration.layoutDirection == 1).unicodeWrap(name)),
                            modifier = Modifier.weight(1f), fontWeight = FontWeight.SemiBold)
                        Spacer(Modifier.width(8.dp))
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, null, Modifier.size(20.dp))
                    }
                    Text(stringResource(R.string.first_language_later), style = MaterialTheme.typography.bodySmall, color = TaleMuted)
                }
            }
        }
    }
}
