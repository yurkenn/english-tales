package com.yurken.englishtales.ui

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.produceState
import androidx.compose.ui.graphics.asImageBitmap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.R
import com.yurken.englishtales.data.Story

@DrawableRes
private fun coverResource(key: String) = when(key) {
    "cover_red_umbrella" -> R.drawable.cover_red_umbrella
    "cover_last_train" -> R.drawable.cover_last_train
    "cover_attic_letter" -> R.drawable.cover_attic_letter
    "cover_paper_boat" -> R.drawable.cover_paper_boat
    "cover_lost_map" -> R.drawable.cover_lost_map
    else -> R.drawable.cover_quiet_morning
}

@Composable
fun BookCover(story: Story, modifier: Modifier = Modifier) {
    BoxWithConstraints(modifier.clip(RoundedCornerShape(10.dp))) {
        val compact=maxWidth<80.dp
        // Cover lettering is part of the artwork; the adjacent title follows system text size.
        val artworkScale=LocalDensity.current.fontScale
        val bitmap=produceState<androidx.compose.ui.graphics.ImageBitmap?>(null,story.coverFile) {
            value=withContext(Dispatchers.IO) {story.coverFile?.let {path ->
                runCatching {android.graphics.BitmapFactory.decodeFile(path,android.graphics.BitmapFactory.Options().apply {inSampleSize=2})?.asImageBitmap()}.getOrNull()
            }}
        }.value
        if(bitmap!=null) Image(bitmap,"${story.title} kitabının kapağı",Modifier.fillMaxSize(),contentScale=ContentScale.Crop)
        else if(story.coverKey!="remote") Image(painterResource(coverResource(story.coverKey)),"${story.title} kitabının kapağı",Modifier.fillMaxSize(),contentScale=ContentScale.Crop)
        else Box(Modifier.fillMaxSize().background(TaleBlue))
        Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Black.copy(alpha=0.1f),Color.Transparent,Color.Black.copy(alpha=0.72f)))))
        if(!compact) Text("ENGLISH TALES",fontSize=(7/artworkScale).sp,letterSpacing=(1/artworkScale).sp,color=Color.White,modifier=Modifier.align(Alignment.TopStart).padding(8.dp))
        Text(story.level,color=TaleInk,fontWeight=FontWeight.ExtraBold,fontSize=((if(compact) 8 else 12)/artworkScale).sp,
            modifier=Modifier.align(Alignment.TopEnd).background(TaleYellow,RoundedCornerShape(bottomStart=5.dp)).padding(horizontal=if(compact) 4.dp else 7.dp,vertical=if(compact) 5.dp else 9.dp))
        Text(story.title,color=Color.White,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Bold,fontSize=((if(compact) 8 else 17)/artworkScale).sp,
            lineHeight=((if(compact) 10 else 19)/artworkScale).sp,textAlign=TextAlign.Center,modifier=Modifier.align(Alignment.BottomCenter).padding(horizontal=7.dp,vertical=if(compact) 6.dp else 18.dp))
    }
}
