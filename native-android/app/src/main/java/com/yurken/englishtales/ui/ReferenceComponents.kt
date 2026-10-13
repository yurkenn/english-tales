package com.yurken.englishtales.ui

import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
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
            when(kind) {
                "study" -> { path(1f,7f,12f,3f,23f,7f,12f,11f,1f,7f,fill=true); path(5f,10f,5f,15f,12f,18f,19f,15f,19f,10f,12f,13f,fill=true); line(5f,21f,19f,21f) }
                "read" -> { path(2f,3f,10.5f,6f,10.5f,22f,2f,18f,fill=true); path(13.5f,6f,22f,3f,22f,18f,13.5f,22f,fill=true) }
                "play" -> { path(3f,2f,8f,3f,20f,16f,17f,19f,4f,7f,3f,2f,fill=true); path(21f,2f,16f,3f,4f,16f,7f,19f,20f,7f,21f,2f,fill=true); line(3f,18f,6f,21f); line(18f,21f,21f,18f) }
                "profile" -> { drawCircle(tint,4f,Offset(12f,6f)); val p=Path().apply { moveTo(3f,21f); cubicTo(3f,10f,21f,10f,21f,21f); close() }; drawPath(p,tint) }
                "search" -> { drawCircle(tint,7f,Offset(10f,10f),style=Stroke(1.8f)); line(15f,15f,22f,22f) }
                "review" -> { drawArc(tint,-70f,285f,false,Offset(3f,3f),Size(18f,18f),style=Stroke(1.8f)); path(18f,1f,22f,5f,17f,6f) }
                "back" -> { path(14f,4f,6f,12f,14f,20f); line(6f,12f,22f,12f) }
                "headphones" -> { drawArc(tint,180f,180f,false,Offset(3f,3f),Size(18f,20f),style=Stroke(2f)); drawRoundRect(tint,Offset(2f,12f),Size(4f,9f),CornerRadius(2f),style=Stroke(1.8f)); drawRoundRect(tint,Offset(18f,12f),Size(4f,9f),CornerRadius(2f),style=Stroke(1.8f)) }
                "volume" -> { path(2f,9f,7f,9f,13f,4f,13f,20f,7f,15f,2f,15f,fill=true); drawArc(tint,-65f,130f,false,Offset(10f,5f),Size(10f,14f),style=Stroke(1.8f)); drawArc(tint,-65f,130f,false,Offset(10f,1f),Size(16f,22f),style=Stroke(1.8f)) }
                "translate" -> { drawRoundRect(tint,Offset(1f,2f),Size(13f,15f),CornerRadius(1f),style=Stroke(1.5f)); drawRoundRect(tint,Offset(10f,9f),Size(13f,14f),CornerRadius(1f),style=Stroke(1.5f)); path(5f,13f,7f,6f,10f,13f); line(6f,11f,9f,11f); line(13f,13f,21f,13f); path(15f,13f,18f,19f,21f,16f) }
                "bookmark" -> { path(5f,3f,19f,3f,19f,22f,12f,17f,5f,22f,5f,3f) }
                "share" -> { line(6f,12f,18f,5f); line(6f,12f,18f,20f); drawCircle(tint,3f,Offset(5f,12f),style=Stroke(1.8f)); drawCircle(tint,3f,Offset(19f,4f),style=Stroke(1.8f)); drawCircle(tint,3f,Offset(19f,20f),style=Stroke(1.8f)) }
                "cards" -> { drawRoundRect(tint,Offset(3f,3f),Size(11f,17f),CornerRadius(2f),style=Stroke(1.8f)); drawRoundRect(tint,Offset(10f,6f),Size(11f,17f),CornerRadius(2f),style=Stroke(1.8f)) }
                "settings" -> { drawCircle(tint,7f,Offset(12f,12f),style=Stroke(2f)); drawCircle(tint,2.5f,Offset(12f,12f),style=Stroke(1.8f)); for(i in 0..7) { val a=i*Math.PI/4; line((12+8*kotlin.math.cos(a)).toFloat(),(12+8*kotlin.math.sin(a)).toFloat(),(12+11*kotlin.math.cos(a)).toFloat(),(12+11*kotlin.math.sin(a)).toFloat()) } }
                "bolt" -> path(14f,1f,3f,14f,11f,14f,9f,23f,22f,9f,14f,9f,14f,1f,fill=true)
                "fire" -> { val p=Path().apply { moveTo(12f,1f); cubicTo(10f,8f,2f,10f,4f,17f); cubicTo(6f,26f,23f,23f,21f,14f); lineTo(18f,7f); lineTo(16f,12f); close() }; drawPath(p,tint) }
                "diamond" -> { path(12f,1f,23f,12f,12f,23f,1f,12f,12f,1f,fill=true); drawCircle(Color(0xFFE2B5FF),5f,Offset(12f,12f)); drawCircle(TaleYellow,2f,Offset(12f,12f)) }
                else -> { line(5f,12f,10f,17f); line(10f,17f,20f,5f) }
            }
        }
    }
}

@Composable
fun ReferenceProgress(progress: Float, modifier: Modifier = Modifier, color: Color = TaleYellow) {
    Box(modifier.height(6.dp).background(TaleLine,RoundedCornerShape(4.dp))) {
        if(progress>0f) Box(Modifier.fillMaxWidth(progress.coerceIn(0f,1f)).height(6.dp).background(color,RoundedCornerShape(4.dp)))
    }
}

@Composable
fun TalesBottomBar(selected: Int, onSelect: (Int) -> Unit) {
    val tabs = listOf("Çalış" to "study", "Oku" to "read", "Oyna" to "play", "Profilim" to "profile")
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
        Box(Modifier.size(32.dp).clickable(onClick=onExit).semantics { contentDescription="Alıştırmadan çık" },contentAlignment=Alignment.Center) { Text("×",fontSize=25.sp,color=TaleMuted) }
        ReferenceProgress(progress,Modifier.weight(1f))
    }
}
