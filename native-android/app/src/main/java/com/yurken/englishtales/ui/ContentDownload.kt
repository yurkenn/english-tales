package com.yurken.englishtales.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.text.font.FontWeight
import com.yurken.englishtales.R
import androidx.compose.ui.res.stringResource
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.data.ContentViewModel
import com.yurken.englishtales.data.Story

/** Shown only while a story downloads or a content action failed; an up-to-date library needs no status line. */
@Composable
fun ContentConnectionBar(content: ContentViewModel) {
    val status by content.status.collectAsState()
    // Background refreshes stay silent here; the library's pull-to-refresh shows its own indicator.
    AnimatedVisibility(status.downloading!=null || status.failed) {
        Row(Modifier.fillMaxWidth().padding(horizontal=16.dp),verticalAlignment=Alignment.CenterVertically) {
            if(status.busy) CircularProgressIndicator(Modifier.size(14.dp),strokeWidth=2.dp)
            else if(status.failed) TaleArt(R.drawable.mascot_offline,Modifier.padding(end=8.dp).size(36.dp))
            Text(status.message, fontSize=12.sp, color=TaleMuted, modifier=Modifier.weight(1f).padding(start=if(status.busy) 8.dp else 0.dp))
            if(status.failed) TextButton(onClick={content.refresh(userInitiated=true)},enabled=!status.busy) { Text(stringResource(R.string.yenile)) }
        }
    }
}

@Composable
fun ContentDownloadsScreen(content: ContentViewModel,onBack: ()->Unit) {
    val status by content.status.collectAsState()
    val downloads=content.repository.downloads()
    Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding()) {
        SimpleTopBar(stringResource(R.string.indirilen_hikayeler),onBack)
        Text(stringResource(R.string.hikaye_indirmeyi_kaldirmak_okuma_ilerlemeni, downloads.size),modifier=Modifier.padding(16.dp),fontSize=14.sp,color=TaleMuted)
        androidx.compose.foundation.lazy.LazyColumn(Modifier.weight(1f)) {
            if(downloads.isEmpty()) item {TaleEmptyState(stringResource(R.string.henuz_indirilen_hikaye_yok),actionLabel=stringResource(R.string.empty_browse_stories),onAction=onBack)}
            items(downloads.size) {index ->
                val story=downloads[index]
                val shape=RoundedCornerShape(18.dp)
                Row(Modifier.fillMaxWidth().appearIn(index).padding(horizontal=16.dp,vertical=5.dp).background(TaleLine,shape).padding(bottom=4.dp)
                    .background(TaleSurface,shape).border(2.dp,TaleLine,shape).padding(start=16.dp,end=4.dp,top=4.dp,bottom=4.dp),verticalAlignment=Alignment.CenterVertically) {
                    Text(story.title,fontWeight=FontWeight.ExtraBold,modifier=Modifier.weight(1f))
                    TextButton(onClick={content.removeDownload(story)},enabled=!status.busy) {Text(stringResource(R.string.kaldir))}
                }
            }
        }
        Text(status.message,modifier=Modifier.padding(16.dp),fontSize=12.sp,color=TaleMuted)
    }
}

@Composable
fun ContentDownloadAction(content: ContentViewModel, story: Story) {
    val status by content.status.collectAsState()
    Column(Modifier.fillMaxWidth().padding(horizontal=24.dp,vertical=12.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
        if(content.repository.isDownloaded(story)) {
            Text(stringResource(R.string.cevrimdisi_okumaya_hazir),color=TaleBlue,fontSize=14.sp)
            TextButton(onClick={content.removeDownload(story)},enabled=!status.busy) {Text(stringResource(R.string.indirmeyi_kaldir))}
        } else {
            Text(if(story.sentences.isNotEmpty()) stringResource(R.string.metin_cihazinda_hazir_kapagi_da) else stringResource(R.string.okumadan_once_hikaye_ve_kapak),color=TaleMuted,fontSize=12.sp)
            OutlinedButton(onClick={content.download(story)},enabled=!status.busy,modifier=Modifier.fillMaxWidth()) {
                Text(if(status.downloading==story.id) stringResource(R.string.indiriliyor) else stringResource(R.string.cevrimdisi_indir))
            }
        }
        if(status.message.isNotBlank() && !content.repository.isDownloaded(story)) Text(status.message,color=TaleMuted,fontSize=12.sp)
    }
}

@Composable
fun ContentDownloadScreen(content: ContentViewModel,story: Story?,onBack: ()->Unit,onReady: (Story)->Unit) {
    val status by content.status.collectAsState()
    Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding()) {
        SimpleTopBar(story?.title ?: stringResource(R.string.hikaye),onBack)
        Column(Modifier.fillMaxWidth().weight(1f).padding(24.dp),verticalArrangement=Arrangement.Center,horizontalAlignment=Alignment.CenterHorizontally) {
            if(status.busy) TaleLoading(mascotSize=96)
            Spacer(Modifier.height(20.dp))
            Text(status.message.ifBlank { stringResource(R.string.hikayeyi_indirerek_okumaya_baslayabilirsin) })
            Spacer(Modifier.height(16.dp))
            Button(onClick={story?.let {content.download(it,onReady)}},enabled=!status.busy && story!=null) { Text(stringResource(R.string.yeniden_dene)) }
        }
    }
}
