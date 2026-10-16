package com.yurken.englishtales.ui

import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
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
                Text(stringResource(R.string.satir_araligi),style=MaterialTheme.typography.titleMedium)
                FlowRow(horizontalArrangement=Arrangement.spacedBy(8.dp),verticalArrangement=Arrangement.spacedBy(4.dp)) {
                    ReadingSpacing.entries.forEach {value -> FilterChip(selected=settings.spacing==value,
                        onClick={onChange {it.copy(spacing=value)}},label={Text(stringResource(value.label))},leadingIcon={if(settings.spacing==value) Text("✓")})}
                }
                Text(stringResource(R.string.tema),style=MaterialTheme.typography.titleMedium)
                FlowRow(horizontalArrangement=Arrangement.spacedBy(8.dp),verticalArrangement=Arrangement.spacedBy(4.dp)) {
                    FilterChip(selected=!settings.dark,onClick={onChange {it.copy(dark=false)}},label={Text(stringResource(R.string.acik))},leadingIcon={if(!settings.dark) Text("✓")})
                    FilterChip(selected=settings.dark,onClick={onChange {it.copy(dark=true)}},label={Text(stringResource(R.string.koyu))},leadingIcon={if(settings.dark) Text("✓")})
                }
                Text(stringResource(R.string.a_little_reading_every_day),fontFamily=FontFamily.Serif,fontSize=settings.fontSize.sp,
                    lineHeight=(settings.fontSize*settings.spacing.multiplier).sp,
                    color=if(settings.dark) Color(0xFFF1F5F9) else TaleInk,
                    modifier=Modifier.fillMaxWidth().background(if(settings.dark) Color(0xFF17212B) else TaleLine,
                        MaterialTheme.shapes.medium).padding(20.dp))
                error?.let {Text(it,color=MaterialTheme.colorScheme.error,style=MaterialTheme.typography.bodyMedium)}
            }
            Button(onClick=onDismiss,modifier=Modifier.fillMaxWidth().padding(top=16.dp).heightIn(min=48.dp)) {Text(stringResource(R.string.okumaya_don))}
            Spacer(Modifier.height(16.dp))
        }}
    }
}
