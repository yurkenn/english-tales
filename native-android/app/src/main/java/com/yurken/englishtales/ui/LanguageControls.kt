package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
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
internal fun LanguageControls() {
    val context = LocalContext.current
    var choosing by remember { mutableStateOf(false) }
    val system = stringResource(R.string.app_language_system)
    val rawSelection = AppLanguage.selection(context)
    val selection = appLanguages.firstOrNull {
        rawSelection.isNotEmpty() && java.util.Locale.forLanguageTag(it.first).language == java.util.Locale.forLanguageTag(rawSelection).language
    }?.first.orEmpty()
    val current = appLanguages.firstOrNull { it.first == selection }?.second ?: system
    OutlinedButton(onClick = { choosing = true }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) {
        Text(stringResource(R.string.app_language_current, current))
    }
    if (choosing) AlertDialog(onDismissRequest = { choosing = false }, title = { Text(stringResource(R.string.app_language_title)) },
        text = { Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(stringResource(R.string.app_language_description))
            LazyColumn(Modifier.heightIn(max = 360.dp)) {
                items(listOf("" to system) + appLanguages, key = { it.first }) { (tag, name) ->
                    TextButton(onClick = { choosing = false; if (tag != selection) AppLanguage.select(context, tag) }, modifier = Modifier.fillMaxWidth()) {
                        Text(name, modifier = Modifier.weight(1f)); if (tag == selection) Text("✓")
                    }
                }
            }
        } }, confirmButton = { TextButton(onClick = { choosing = false }) { Text(stringResource(R.string.kapat)) } })
}
