package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yurken.englishtales.data.ContentViewModel
import com.yurken.englishtales.data.Story

@Composable
fun ContentConnectionBar(content: ContentViewModel,onDownloads: ()->Unit) {
    val status by content.status.collectAsState()
    Row(Modifier.fillMaxWidth().statusBarsPadding().padding(horizontal=16.dp),verticalAlignment=Alignment.CenterVertically) {
        Text(status.message, fontSize=12.sp, color=TaleMuted, modifier=Modifier.weight(1f))
        TextButton(onClick=onDownloads) {Text("İndirilenler")}
        TextButton(onClick=content::refresh,enabled=!status.busy) { Text("Yenile") }
    }
}

@Composable
fun ContentDownloadsScreen(content: ContentViewModel,onBack: ()->Unit) {
    val status by content.status.collectAsState()
    val downloads=content.repository.downloads()
    Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding()) {
        SimpleTopBar("İndirilen hikâyeler",onBack)
        Text("${downloads.size} hikâye · İndirmeyi kaldırmak okuma ilerlemeni ve öğrendiğin kelimeleri silmez.",modifier=Modifier.padding(16.dp),fontSize=14.sp,color=TaleMuted)
        androidx.compose.foundation.lazy.LazyColumn(Modifier.weight(1f)) {
            items(downloads.size) {index ->
                val story=downloads[index]
                Row(Modifier.fillMaxWidth().padding(horizontal=16.dp,vertical=8.dp),verticalAlignment=Alignment.CenterVertically) {
                    Text(story.title,modifier=Modifier.weight(1f))
                    TextButton(onClick={content.removeDownload(story)},enabled=!status.busy) {Text("Kaldır")}
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
            Text("Çevrimdışı okumaya hazır ✓",color=TaleBlue,fontSize=14.sp)
            TextButton(onClick={content.removeDownload(story)},enabled=!status.busy) {Text("İndirmeyi kaldır")}
        } else {
            Text(if(story.sentences.isNotEmpty()) "Metin cihazında hazır. Kapağı da indirerek saklayabilirsin." else "Okumadan önce hikâye ve kapak indirilecek.",color=TaleMuted,fontSize=12.sp)
            OutlinedButton(onClick={content.download(story)},enabled=!status.busy,modifier=Modifier.fillMaxWidth()) {
                Text(if(status.downloading==story.id) "İndiriliyor…" else "Çevrimdışı indir")
            }
        }
        if(status.message.isNotBlank() && !content.repository.isDownloaded(story)) Text(status.message,color=TaleMuted,fontSize=12.sp)
    }
}

@Composable
fun ContentDownloadScreen(content: ContentViewModel,story: Story?,onBack: ()->Unit,onReady: (Story)->Unit) {
    val status by content.status.collectAsState()
    Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding()) {
        SimpleTopBar(story?.title ?: "Hikâye",onBack)
        Column(Modifier.fillMaxWidth().weight(1f).padding(24.dp),verticalArrangement=Arrangement.Center,horizontalAlignment=Alignment.CenterHorizontally) {
            if(status.busy) CircularProgressIndicator()
            Spacer(Modifier.height(20.dp))
            Text(status.message.ifBlank { "Hikâyeyi indirerek okumaya başlayabilirsin." })
            Spacer(Modifier.height(16.dp))
            Button(onClick={story?.let {content.download(it,onReady)}},enabled=!status.busy && story!=null) { Text("Yeniden dene") }
        }
    }
}
