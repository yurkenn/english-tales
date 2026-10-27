package com.yurken.englishtales.ui

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.R
import com.yurken.englishtales.data.SupportLanguage
import com.yurken.englishtales.data.TranslationLanguage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
internal fun TranslationLanguageControls(onChanged: (() -> Unit)? = null) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var selection by remember { mutableStateOf(TranslationLanguage.selection(context)) }
    var choosing by remember { mutableStateOf(false) }
    var draft by remember { mutableStateOf(selection) }
    var saving by remember { mutableStateOf(false) }
    var failed by remember { mutableStateOf(false) }
    val languages = appLanguages.filter { it.first in SupportLanguage.enabled }
    fun name(tag: String) = languages.first { it.first == tag }.second
    val current = name(TranslationLanguage.effective(context))
    val follow = stringResource(R.string.translation_language_follow,
        name(SupportLanguage.resolve(listOf(com.yurken.englishtales.AppLanguage.locale(context)))))
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        OutlinedButton(onClick = { draft = selection; failed = false; choosing = true },
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("translation_language")) {
            Text(stringResource(R.string.translation_language_current, current))
        }
        Text(stringResource(R.string.translation_language_description), style = MaterialTheme.typography.bodySmall)
    }
    if (choosing) AlertDialog(
        onDismissRequest = { if (!saving) choosing = false },
        title = { Text(stringResource(R.string.translation_language_title)) },
        text = {
            Column {
                LazyColumn(Modifier.heightIn(max = 340.dp).selectableGroup()) {
                    items(listOf("" to follow) + languages, key = { it.first }) { (tag, label) ->
                        Row(Modifier.fillMaxWidth().heightIn(min = 48.dp)
                            .testTag("translation_option_${tag.ifEmpty { "auto" }}")
                            .selectable(selected = draft == tag, enabled = !saving, role = Role.RadioButton,
                                onClick = { draft = tag; failed = false }), verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(selected = draft == tag, onClick = null, enabled = !saving)
                            Text(label, Modifier.padding(start = 8.dp))
                        }
                    }
                }
                if (failed) Text(stringResource(R.string.translation_language_save_failed), color = MaterialTheme.colorScheme.error)
            }
        },
        confirmButton = {
            TextButton(enabled = !saving, modifier = Modifier.testTag("translation_language_save"), onClick = {
                if (draft == selection) choosing = false
                else scope.launch {
                    saving = true
                    val saved = withContext(Dispatchers.IO) { runCatching { TranslationLanguage.select(context, draft) }.getOrDefault(false) }
                    saving = false
                    if (saved) {
                        selection = draft
                        choosing = false
                        // Reuse the existing language reload path; the account/write ViewModel survives recreation.
                        if (onChanged != null) onChanged() else context.translationActivity()?.recreate()
                    } else failed = true
                }
            }) { Text(stringResource(R.string.degisiklikleri_kaydet)) }
        },
        dismissButton = { TextButton(enabled = !saving, onClick = { choosing = false }) { Text(stringResource(R.string.kapat)) } }
    )
}

private tailrec fun Context.translationActivity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.translationActivity()
    else -> null
}
