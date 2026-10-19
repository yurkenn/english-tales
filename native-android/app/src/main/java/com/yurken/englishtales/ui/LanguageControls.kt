package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.AppLanguage
import com.yurken.englishtales.R

/** Native language names stay recognizable before the learner has selected their language. */
internal val appLanguages = listOf("tr" to "Türkçe", "en" to "English", "es-419" to "Español (Latinoamérica)",
    "pt-BR" to "Português (Brasil)", "id" to "Bahasa Indonesia", "ar" to "العربية", "vi" to "Tiếng Việt",
    "hi" to "हिन्दी", "ru" to "Русский", "bn" to "বাংলা", "ur" to "اردو", "th" to "ไทย")

@Composable
internal fun LanguageControls(compact: Boolean = false) {
    val context = LocalContext.current
    var choosing by remember { mutableStateOf(false) }
    val system = stringResource(R.string.app_language_system)
    val rawSelection = AppLanguage.selection(context)
    val selection = appLanguages.firstOrNull {
        rawSelection.isNotEmpty() && java.util.Locale.forLanguageTag(it.first).language == java.util.Locale.forLanguageTag(rawSelection).language
    }?.first.orEmpty()
    val current = appLanguages.firstOrNull { it.first == selection }?.second ?: system
    val label = stringResource(R.string.app_language_current, current)
    OutlinedButton(onClick = { choosing = true }, modifier = (if (compact) Modifier else Modifier.fillMaxWidth())
        .heightIn(min = 48.dp).semantics { contentDescription = label }) {
        Text(if (compact) current else label, fontSize = if (compact) 13.sp else 14.sp)
    }
    if (choosing) androidx.compose.ui.window.Dialog(onDismissRequest = { choosing = false },
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)) {
        LanguageWelcomeScreen(initialTag = selection, allowSystem = true, onDismiss = { choosing = false }) { tag ->
            choosing = false
            AppLanguage.confirmChoice(context)
            if (tag != selection) AppLanguage.select(context, tag)
        }
    }
}
