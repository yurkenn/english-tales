package com.yurken.englishtales.ui

import androidx.compose.foundation.Canvas
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp

@Composable
fun ReferenceIcon(kind: String, tint: Color = TaleBlue, modifier: Modifier = Modifier.size(23.dp)) {
    Canvas(modifier) {
        scale(size.width / 24f, size.height / 24f, pivot = Offset.Zero) {
            fun line(x1: Float, y1: Float, x2: Float, y2: Float) = drawLine(tint, Offset(x1,y1), Offset(x2,y2), 1.8f, StrokeCap.Round)
            fun path(vararg points: Float, fill: Boolean = false) {
                val p = Path().apply { moveTo(points[0], points[1]); for(i in 2 until points.size step 2) lineTo(points[i],points[i+1]); if(fill) close() }
                drawPath(p,tint,style=if(fill) androidx.compose.ui.graphics.drawscope.Fill else Stroke(1.8f,cap=StrokeCap.Round))
            }
            // Keep white/disabled/night-mode icons monochrome; accent only the brand-blue variant.
            val accent = if(tint == TaleBlue) TalePurple else tint
            fun outline(p: Path, color: Color = tint) = drawPath(p,color,style=Stroke(1.8f,cap=StrokeCap.Round))
            when(kind) {
                "study" -> {
                    val notebook=Path().apply {
                        fillType=PathFillType.EvenOdd
                        addRoundRect(RoundRect(5f,2f,21f,22f,CornerRadius(2.5f)))
                        moveTo(8f,12f);lineTo(10f,14f);lineTo(16f,7.5f);lineTo(18f,9.2f)
                        lineTo(10f,18f);lineTo(6.5f,14f);close()
                    }
                    drawPath(notebook,tint)
                    line(2f,7f,5.5f,7f);line(2f,17f,5.5f,17f)
                }
                "read" -> {
                    outline(Path().apply {
                        moveTo(12f,6f);cubicTo(9f,3f,5f,3f,2f,4f);lineTo(2f,19f)
                        cubicTo(6f,18f,9f,19f,12f,21f);cubicTo(15f,19f,19f,18f,22f,19f)
                        lineTo(22f,4f);cubicTo(21f,3.7f,20f,3.5f,19f,3.5f)
                        moveTo(15f,4f);lineTo(12f,6f);lineTo(12f,21f)
                    })
                    drawPath(Path().apply {
                        moveTo(15.5f,2.5f);lineTo(19f,2.5f);lineTo(19f,10f)
                        lineTo(17.25f,8.5f);lineTo(15.5f,10f);close()
                    },accent)
                }
                "play", "letters" -> {
                    outline(Path().apply {
                        moveTo(10f,6f);lineTo(10f,4f);quadraticTo(10f,2f,12f,2f)
                        lineTo(20f,2f);quadraticTo(22f,2f,22f,4f);lineTo(22f,13f)
                        quadraticTo(22f,15f,20f,15f);lineTo(17f,15f)
                    })
                    drawRoundRect(tint,Offset(2f,8f),Size(12f,14f),CornerRadius(2f),style=Stroke(1.8f))
                    path(5f,18f,8f,12f,11f,18f);line(6f,16f,10f,16f)
                    outline(Path().apply {
                        moveTo(15f,5f);lineTo(15f,12f);lineTo(17f,12f)
                        cubicTo(20f,12f,20f,8.5f,17f,8.5f);lineTo(15f,8.5f)
                        moveTo(17f,8.5f);cubicTo(20f,8.5f,20f,5f,17f,5f);lineTo(15f,5f)
                    })
                }
                "profile" -> { drawCircle(tint,4f,Offset(12f,6f)); val p=Path().apply { moveTo(3f,21f); cubicTo(3f,10f,21f,10f,21f,21f); close() }; drawPath(p,tint) }
                "search" -> { drawCircle(tint,7f,Offset(10f,10f),style=Stroke(1.8f)); line(15f,15f,22f,22f) }
                "review" -> { drawArc(tint,-70f,285f,false,Offset(3f,3f),Size(18f,18f),style=Stroke(1.8f)); path(18f,1f,22f,5f,17f,6f) }
                "back" -> { path(14f,4f,6f,12f,14f,20f); line(6f,12f,22f,12f) }
                "headphones" -> { drawArc(tint,180f,180f,false,Offset(3f,3f),Size(18f,20f),style=Stroke(2f)); drawRoundRect(tint,Offset(2f,12f),Size(4f,9f),CornerRadius(2f),style=Stroke(1.8f)); drawRoundRect(tint,Offset(18f,12f),Size(4f,9f),CornerRadius(2f),style=Stroke(1.8f)) }
                "volume" -> { path(2f,9f,7f,9f,13f,4f,13f,20f,7f,15f,2f,15f,fill=true); drawArc(tint,-65f,130f,false,Offset(10f,5f),Size(10f,14f),style=Stroke(1.8f)); drawArc(tint,-65f,130f,false,Offset(10f,1f),Size(16f,22f),style=Stroke(1.8f)) }
                "translate" -> {
                    outline(Path().apply {
                        moveTo(5f,3f);lineTo(19f,3f);quadraticTo(22f,3f,22f,6f)
                        lineTo(22f,16f);quadraticTo(22f,19f,19f,19f);lineTo(9f,19f)
                        lineTo(4f,22f);lineTo(4f,18.8f);quadraticTo(2f,18f,2f,16f)
                        lineTo(2f,6f);quadraticTo(2f,3f,5f,3f);close()
                    })
                    path(5f,14f,8f,7f,11f,14f);line(6f,12f,10f,12f)
                    outline(Path().apply {
                        moveTo(19f,8f);lineTo(14f,8f);lineTo(16f,6f)
                        moveTo(14f,13f);lineTo(19f,13f);lineTo(17f,15f)
                    },accent)
                }
                "bookmark" -> { path(5f,3f,19f,3f,19f,22f,12f,17f,5f,22f,5f,3f) }
                "share" -> { line(6f,12f,18f,5f); line(6f,12f,18f,20f); drawCircle(tint,3f,Offset(5f,12f),style=Stroke(1.8f)); drawCircle(tint,3f,Offset(19f,4f),style=Stroke(1.8f)); drawCircle(tint,3f,Offset(19f,20f),style=Stroke(1.8f)) }
                "cards" -> { drawRoundRect(tint,Offset(3f,3f),Size(11f,17f),CornerRadius(2f),style=Stroke(1.8f)); drawRoundRect(tint,Offset(10f,6f),Size(11f,17f),CornerRadius(2f),style=Stroke(1.8f)) }
                "settings" -> { drawCircle(tint,7f,Offset(12f,12f),style=Stroke(2f)); drawCircle(tint,2.5f,Offset(12f,12f),style=Stroke(1.8f)); for(i in 0..7) { val a=i*Math.PI/4; line((12+8*kotlin.math.cos(a)).toFloat(),(12+8*kotlin.math.sin(a)).toFloat(),(12+11*kotlin.math.cos(a)).toFloat(),(12+11*kotlin.math.sin(a)).toFloat()) } }
                "bolt" -> path(14f,1f,3f,14f,11f,14f,9f,23f,22f,9f,14f,9f,14f,1f,fill=true)
                "streak" -> {
                    drawRoundRect(tint,Offset(3f,5f),Size(18f,17f),CornerRadius(2.5f),style=Stroke(1.8f))
                    line(7f,2f,7f,7f);line(17f,2f,17f,7f);line(3f,10f,21f,10f)
                    outline(Path().apply {moveTo(7f,16f);lineTo(10f,19f);lineTo(17f,13f)},accent)
                }
                "points" -> {
                    val bookmark=Path().apply {
                        fillType=PathFillType.EvenOdd
                        moveTo(6f,2f);lineTo(18f,2f);quadraticTo(20f,2f,20f,4f)
                        lineTo(20f,22f);lineTo(12f,18f);lineTo(4f,22f);lineTo(4f,4f)
                        quadraticTo(4f,2f,6f,2f);close()
                        moveTo(12f,5f);lineTo(13.5f,8.2f);lineTo(17f,8.7f)
                        lineTo(14.5f,11.1f);lineTo(15.1f,14.5f);lineTo(12f,12.9f)
                        lineTo(8.9f,14.5f);lineTo(9.5f,11.1f);lineTo(7f,8.7f)
                        lineTo(10.5f,8.2f);close()
                    }
                    drawPath(bookmark,tint)
                }
                else -> { line(5f,12f,10f,17f); line(10f,17f,20f,5f) }
            }
        }
    }
}

@Composable
fun ReferenceProgress(progress: Float, modifier: Modifier = Modifier, color: Color = TaleYellow) {
    Box(modifier.semantics {progressBarRangeInfo=ProgressBarRangeInfo(progress.coerceIn(0f,1f),0f..1f)}.height(6.dp).background(TaleLine,RoundedCornerShape(4.dp))) {
        if(progress>0f) Box(Modifier.fillMaxWidth(progress.coerceIn(0f,1f)).height(6.dp).background(color,RoundedCornerShape(4.dp)))
    }
}

@Composable
fun TalesBottomBar(selected: Int, onSelect: (Int) -> Unit) {
    val tabs = listOf(stringResource(R.string.calis) to "study", stringResource(R.string.oku_2) to "read", stringResource(R.string.oyna) to "play", stringResource(R.string.profilim) to "profile")
    val barHeight=56.dp+18.dp*(LocalDensity.current.fontScale-1f).coerceAtLeast(0f)
    Row(Modifier.fillMaxWidth().background(Color.White).navigationBarsPadding().height(barHeight)) {
        tabs.forEachIndexed { index,(label,kind) ->
            Column(Modifier.weight(1f).fillMaxHeight().semantics { this.selected=selected==index }.clickable(role=Role.Tab) { onSelect(index) }.padding(top=7.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(3.dp)) {
                ReferenceIcon(kind,if(selected==index) TaleBlue else TaleMuted,Modifier.size(22.dp))
                Text(label,color=if(selected==index) TaleBlue else TaleMuted,fontSize=11.sp,fontWeight=if(selected==index) FontWeight.SemiBold else FontWeight.Normal)
            }
        }
    }
}

@Composable
fun ReferenceIconButton(kind: String, label: String, onClick: () -> Unit, tint: Color = TaleBlue) {
    Box(Modifier.size(48.dp).semantics { contentDescription=label }.clickable(role=Role.Button,onClick=onClick),contentAlignment=Alignment.Center) {
        ReferenceIcon(kind,tint,Modifier.size(24.dp))
    }
}

/** Keeps the reference layout on tall screens and makes short/large-text screens scrollable. */
@Composable
fun GameViewport(padding: PaddingValues, minimumHeight: Dp = 450.dp, content: @Composable ColumnScope.() -> Unit) {
    val textAllowance=150.dp*(LocalDensity.current.fontScale-1f).coerceAtLeast(0f)
    BoxWithConstraints(Modifier.fillMaxSize().padding(padding)) {
        val contentHeight=maxOf(maxHeight,minimumHeight+textAllowance)
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            Column(Modifier.fillMaxWidth().height(contentHeight).padding(horizontal=16.dp,vertical=6.dp),
                horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(12.dp),content=content)
        }
    }
}

@Composable
fun GameHeader(progress: Float, onExit: () -> Unit) {
    Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(14.dp)) {
        Box(Modifier.size(48.dp).clickable(role=Role.Button,onClick=onExit).contentLabel(stringResource(R.string.alistirmadan_cik)),contentAlignment=Alignment.Center) { Text("×",fontSize=25.sp,color=TaleMuted) }
        ReferenceProgress(progress,Modifier.weight(1f))
    }
}

/** Screen reader label; the text is resolved in the calling composable. */
internal fun Modifier.contentLabel(label: String) = semantics { contentDescription = label }
