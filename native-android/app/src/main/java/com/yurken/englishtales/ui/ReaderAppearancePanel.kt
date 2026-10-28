package com.yurken.englishtales.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class,ExperimentalLayoutApi::class)
@Composable
internal fun ReaderAppearancePanel(settings: ReadingPreferences,error: String?,onDismiss: ()->Unit,
    onChange: ((ReadingPreferences)->ReadingPreferences)->Unit) {
    val density=LocalDensity.current
    ModalBottomSheet(onDismissRequest=onDismiss,sheetState=rememberModalBottomSheetState(skipPartiallyExpanded=true)) {
        CompositionLocalProvider(LocalDensity provides density) {Column(Modifier.fillMaxWidth().padding(horizontal=24.dp)) {
            Column(Modifier.weight(1f,fill=false).verticalScroll(rememberScrollState()),
                verticalArrangement=Arrangement.spacedBy(16.dp)) {
                Text(stringResource(R.string.okuma_gorunumu),style=MaterialTheme.typography.titleLarge)
                Text(stringResource(R.string.secimlerin_bu_cihazda_korunur),style=MaterialTheme.typography.bodyMedium,color=TaleMuted)
                Text(stringResource(R.string.yazi_boyutu),style=MaterialTheme.typography.titleMedium)
                FlowRow(horizontalArrangement=Arrangement.spacedBy(12.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(enabled=settings.fontSize>14,onClick={onChange {it.copy(fontSize=it.fontSize-1)}},
                        modifier=Modifier.contentLabel(stringResource(R.string.yaziyi_kucult))) {Text("A−")}
                    Text(stringResource(R.string.punto, settings.fontSize),modifier=Modifier.padding(vertical=14.dp))
                    OutlinedButton(enabled=settings.fontSize<28,onClick={onChange {it.copy(fontSize=it.fontSize+1)}},
                        modifier=Modifier.contentLabel(stringResource(R.string.yaziyi_buyut))) {Text("A+")}
                }
                Text(stringResource(R.string.reader_font),style=MaterialTheme.typography.titleMedium)
                FlowRow(horizontalArrangement=Arrangement.spacedBy(8.dp),verticalArrangement=Arrangement.spacedBy(4.dp)) {
                    ReadingFont.entries.forEach {value -> FilterChip(selected=settings.font==value,
                        onClick={onChange {it.copy(font=value)}},label={Text(stringResource(value.label),fontFamily=value.body)},leadingIcon={if(settings.font==value) Text("✓")})}
                }
                Text(stringResource(R.string.satir_araligi),style=MaterialTheme.typography.titleMedium)
                FlowRow(horizontalArrangement=Arrangement.spacedBy(8.dp),verticalArrangement=Arrangement.spacedBy(4.dp)) {
                    ReadingSpacing.entries.forEach {value -> FilterChip(selected=settings.spacing==value,
                        onClick={onChange {it.copy(spacing=value)}},label={Text(stringResource(value.label))},leadingIcon={if(settings.spacing==value) Text("✓")})}
                }
                Text(stringResource(R.string.tema),style=MaterialTheme.typography.titleMedium)
                FlowRow(horizontalArrangement=Arrangement.spacedBy(8.dp),verticalArrangement=Arrangement.spacedBy(4.dp)) {
                    ReadingTheme.entries.forEach {value -> FilterChip(selected=settings.theme==value,
                        onClick={onChange {it.copy(theme=value)}},label={Text(stringResource(value.label))},leadingIcon={if(settings.theme==value) Text("✓")})}
                }
                val palette=readerPalette(settings.theme)
                Text(stringResource(R.string.a_little_reading_every_day),fontFamily=settings.font.body,fontSize=settings.fontSize.sp,
                    lineHeight=(settings.fontSize*settings.spacing.multiplier).sp,color=palette.foreground,
                    modifier=Modifier.fillMaxWidth().background(palette.background,MaterialTheme.shapes.medium)
                        .border(1.dp,palette.line,MaterialTheme.shapes.medium).padding(20.dp))
                error?.let {Text(it,color=MaterialTheme.colorScheme.error,style=MaterialTheme.typography.bodyMedium)}
            }
            Button(onClick=onDismiss,modifier=Modifier.fillMaxWidth().padding(top=16.dp).heightIn(min=48.dp)) {Text(stringResource(R.string.okumaya_don))}
            Spacer(Modifier.height(16.dp))
        }}
    }
}
