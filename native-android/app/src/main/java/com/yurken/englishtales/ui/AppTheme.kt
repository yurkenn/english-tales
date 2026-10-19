package com.yurken.englishtales.ui

import android.content.Context
import android.content.ContextWrapper
import androidx.annotation.StringRes
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.R

/** The whole app's light/dark choice; the reader keeps its own setting in [ReadingPreferences]. */
enum class AppThemeMode(@StringRes val label: Int) { SYSTEM(R.string.theme_system), LIGHT(R.string.acik), DARK(R.string.koyu) }

/** Device appearance, like reading preferences: not part of the learner's account or synced data. */
object AppTheme {
    private const val FILE = "app_appearance"
    var mode by mutableStateOf(AppThemeMode.SYSTEM)
        private set
    private var loaded = false

    fun load(context: Context): AppThemeMode {
        if (!loaded) {
            mode = runCatching { AppThemeMode.valueOf(prefs(context).getString("mode", null).orEmpty()) }.getOrDefault(AppThemeMode.SYSTEM)
            loaded = true
        }
        return mode
    }

    fun select(context: Context, next: AppThemeMode) {
        mode = next
        prefs(context).edit().putString("mode", next.name).apply()
        generateSequence(context) { (it as? ContextWrapper)?.baseContext }.filterIsInstance<ComponentActivity>().firstOrNull()?.let(::applySystemBars)
    }

    /** Status and navigation bar icons follow the chosen theme, not only the phone's night mode. */
    fun applySystemBars(activity: ComponentActivity) {
        val dark = { resources: android.content.res.Resources -> when (mode) {
            AppThemeMode.SYSTEM -> (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES
            AppThemeMode.LIGHT -> false
            AppThemeMode.DARK -> true
        } }
        activity.enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.auto(android.graphics.Color.TRANSPARENT, android.graphics.Color.TRANSPARENT, dark),
            navigationBarStyle = SystemBarStyle.auto(LightScrim, DarkScrim, dark))
    }

    private fun prefs(context: Context) = context.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE)
    // androidx.activity's default navigation bar scrims for three-button navigation.
    private val LightScrim = android.graphics.Color.argb(0xe6, 0xFF, 0xFF, 0xFF)
    private val DarkScrim = android.graphics.Color.argb(0x80, 0x1b, 0x1b, 0x1b)
}

@Composable
internal fun ThemeControls() {
    val context = LocalContext.current
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(stringResource(R.string.tema), fontWeight = FontWeight.Bold)
        Row(Modifier.selectableGroup(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            AppThemeMode.entries.forEach { option ->
                FilterChip(selected = AppTheme.mode == option, onClick = { AppTheme.select(context, option) },
                    label = { Text(stringResource(option.label)) },
                    modifier = Modifier.heightIn(min = 48.dp))
            }
        }
    }
}
