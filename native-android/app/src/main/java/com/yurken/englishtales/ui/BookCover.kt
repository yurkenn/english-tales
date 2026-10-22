package com.yurken.englishtales.ui

import androidx.annotation.DrawableRes
import androidx.compose.ui.res.stringResource
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.produceState
import android.graphics.BitmapFactory
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asAndroidBitmap
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
import androidx.compose.ui.text.style.TextOverflow
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
    "cover_classic_tortoise_hare" -> R.drawable.cover_classic_tortoise_hare
    "cover_classic_lion_mouse" -> R.drawable.cover_classic_lion_mouse
    "cover_classic_fox_grapes" -> R.drawable.cover_classic_fox_grapes
    "cover_classic_ants_grasshopper" -> R.drawable.cover_classic_ants_grasshopper
    "cover_classic_red_riding_hood" -> R.drawable.cover_classic_red_riding_hood
    "cover_classic_cinderella" -> R.drawable.cover_classic_cinderella
    "cover_classic_bremen_musicians" -> R.drawable.cover_classic_bremen_musicians
    "cover_classic_hansel_gretel" -> R.drawable.cover_classic_hansel_gretel
    "cover_classic_happy_prince" -> R.drawable.cover_classic_happy_prince
    "cover_classic_selfish_giant" -> R.drawable.cover_classic_selfish_giant
    "cover_classic_gift_magi" -> R.drawable.cover_classic_gift_magi
    "cover_classic_after_twenty_years" -> R.drawable.cover_classic_after_twenty_years
    "cover_classic_crow_pitcher" -> R.drawable.cover_classic_crow_pitcher
    "cover_classic_boy_cried_wolf" -> R.drawable.cover_classic_boy_cried_wolf
    "cover_classic_town_country_mouse" -> R.drawable.cover_classic_town_country_mouse
    "cover_classic_north_wind_sun" -> R.drawable.cover_classic_north_wind_sun
    "cover_classic_golden_eggs" -> R.drawable.cover_classic_golden_eggs
    "cover_classic_dog_shadow" -> R.drawable.cover_classic_dog_shadow
    "cover_classic_fox_crow" -> R.drawable.cover_classic_fox_crow
    "cover_classic_ant_dove" -> R.drawable.cover_classic_ant_dove
    "cover_classic_bundle_sticks" -> R.drawable.cover_classic_bundle_sticks
    "cover_classic_milkmaid_pail" -> R.drawable.cover_classic_milkmaid_pail
    "cover_classic_dog_manger" -> R.drawable.cover_classic_dog_manger
    "cover_classic_ass_lion_skin" -> R.drawable.cover_classic_ass_lion_skin
    "cover_classic_snow_white" -> R.drawable.cover_classic_snow_white
    "cover_classic_rapunzel" -> R.drawable.cover_classic_rapunzel
    "cover_classic_sleeping_beauty" -> R.drawable.cover_classic_sleeping_beauty
    "cover_classic_frog_prince" -> R.drawable.cover_classic_frog_prince
    "cover_classic_rumpelstiltskin" -> R.drawable.cover_classic_rumpelstiltskin
    "cover_classic_golden_goose" -> R.drawable.cover_classic_golden_goose
    "cover_classic_elves_shoemaker" -> R.drawable.cover_classic_elves_shoemaker
    "cover_classic_tom_thumb" -> R.drawable.cover_classic_tom_thumb
    "cover_classic_wolf_seven_kids" -> R.drawable.cover_classic_wolf_seven_kids
    "cover_classic_twelve_dancing_princesses" -> R.drawable.cover_classic_twelve_dancing_princesses
    "cover_classic_brave_little_tailor" -> R.drawable.cover_classic_brave_little_tailor
    "cover_classic_goose_girl" -> R.drawable.cover_classic_goose_girl
    "cover_classic_ugly_duckling" -> R.drawable.cover_classic_ugly_duckling
    "cover_classic_emperors_clothes" -> R.drawable.cover_classic_emperors_clothes
    "cover_classic_thumbelina" -> R.drawable.cover_classic_thumbelina
    "cover_classic_little_mermaid" -> R.drawable.cover_classic_little_mermaid
    "cover_classic_snow_queen" -> R.drawable.cover_classic_snow_queen
    "cover_classic_little_match_girl" -> R.drawable.cover_classic_little_match_girl
    "cover_classic_steadfast_tin_soldier" -> R.drawable.cover_classic_steadfast_tin_soldier
    "cover_classic_wild_swans" -> R.drawable.cover_classic_wild_swans
    "cover_classic_hound_baskervilles" -> R.drawable.cover_classic_hound_baskervilles
    "cover_classic_pride_prejudice" -> R.drawable.cover_classic_pride_prejudice
    "cover_classic_romeo_juliet" -> R.drawable.cover_classic_romeo_juliet
    "cover_classic_jane_eyre" -> R.drawable.cover_classic_jane_eyre
    "cover_classic_dorian_gray" -> R.drawable.cover_classic_dorian_gray
    "cover_classic_little_women" -> R.drawable.cover_classic_little_women
    "cover_classic_scandal_bohemia" -> R.drawable.cover_classic_scandal_bohemia
    "cover_classic_goldilocks_three_bears" -> R.drawable.cover_classic_goldilocks_three_bears
    "cover_classic_three_little_pigs" -> R.drawable.cover_classic_three_little_pigs
    "cover_first_order" -> R.drawable.cover_first_order
    "cover_night_library" -> R.drawable.cover_night_library
    "cover_classic_invisible_man" -> R.drawable.cover_classic_invisible_man
    "cover_classic_woman_in_white" -> R.drawable.cover_classic_woman_in_white
    "cover_classic_phantom_opera" -> R.drawable.cover_classic_phantom_opera
    "cover_classic_moby_dick" -> R.drawable.cover_classic_moby_dick
    "cover_classic_great_gatsby" -> R.drawable.cover_classic_great_gatsby
    "cover_classic_financier" -> R.drawable.cover_classic_financier
    else -> R.drawable.cover_quiet_morning
}

private const val COVER_FALLBACK_PX=1024

/**
 * Largest power-of-two [BitmapFactory.Options.inSampleSize] that still leaves the decoded image at least
 * as large as a [ContentScale.Fit] rendering into a dstW x dstH slot (covering either side is enough).
 */
internal fun sampleSizeFor(srcW: Int, srcH: Int, dstW: Int, dstH: Int): Int {
    if(srcW<=0||srcH<=0||dstW<=0||dstH<=0) return 1
    var sample=1
    while(srcW/(sample*2)>=dstW||srcH/(sample*2)>=dstH) sample*=2
    return sample
}

/** Process-wide decoded covers so list items that scroll back in do not decode again. */
private object CoverBitmaps {
    private val cache=object : android.util.LruCache<String,ImageBitmap>((Runtime.getRuntime().maxMemory()/16).coerceIn(1L,Int.MAX_VALUE.toLong()).toInt()) {
        override fun sizeOf(key: String, value: ImageBitmap)=value.asAndroidBitmap().allocationByteCount
    }
    private fun key(path: String, width: Int, height: Int)="$path@${width}x$height"
    fun get(path: String, width: Int, height: Int): ImageBitmap?=cache.get(key(path,width,height))
    fun load(path: String, width: Int, height: Int): ImageBitmap?=if(width<=0||height<=0) null else get(path,width,height) ?: runCatching {
        val bounds=BitmapFactory.Options().apply {inJustDecodeBounds=true}
        BitmapFactory.decodeFile(path,bounds)
        if(bounds.outWidth<=0||bounds.outHeight<=0) return@runCatching null
        val options=BitmapFactory.Options().apply {inSampleSize=sampleSizeFor(bounds.outWidth,bounds.outHeight,width,height)}
        BitmapFactory.decodeFile(path,options)?.asImageBitmap()
    }.getOrNull()?.also {cache.put(key(path,width,height),it)}
}

@Composable
fun BookCover(story: Story, modifier: Modifier = Modifier) {
    BoxWithConstraints(modifier.clip(RoundedCornerShape(10.dp)).background(Color(0xFFF6F0E3))) {
        val compact=maxWidth<80.dp
        // Cover lettering is part of the artwork; the adjacent title follows system text size.
        val artworkScale=LocalDensity.current.fontScale
        // Decode for the slot's pixel size; unbounded slots fall back to a sane ceiling.
        val targetWidth=if(constraints.hasBoundedWidth) constraints.maxWidth else COVER_FALLBACK_PX
        val targetHeight=if(constraints.hasBoundedHeight) constraints.maxHeight else COVER_FALLBACK_PX
        val bitmap=produceState(story.coverFile?.let {CoverBitmaps.get(it,targetWidth,targetHeight)},story.coverFile,targetWidth,targetHeight) {
            // produceState keeps its holder across key changes, so always replace the value for the new key.
            value=story.coverFile?.let {path -> CoverBitmaps.get(path,targetWidth,targetHeight) ?: withContext(Dispatchers.IO) {CoverBitmaps.load(path,targetWidth,targetHeight)}}
        }.value
        if(bitmap!=null) Image(bitmap,stringResource(R.string.kitabinin_kapagi, story.title),Modifier.fillMaxSize(),contentScale=ContentScale.Fit)
        else if(story.coverKey!="remote") Image(painterResource(coverResource(story.coverKey)),stringResource(R.string.kitabinin_kapagi, story.title),Modifier.fillMaxSize(),contentScale=ContentScale.Fit)
        else Box(Modifier.fillMaxSize().background(TaleBlue))
        // Every screen shows the title next to the cover, so artwork only carries it when there is no image to show.
        val artwork=bitmap!=null || story.coverKey!="remote"
        if(!compact) Box(Modifier.fillMaxSize().background(Brush.verticalGradient(if(artwork) listOf(Color.Black.copy(alpha=0.45f),Color.Transparent,Color.Transparent)
            else listOf(Color.Black.copy(alpha=0.5f),Color.Transparent,Color.Black.copy(alpha=0.72f)))))
        if(!compact) Text(stringResource(R.string.english_tales),fontSize=(7/artworkScale).sp,letterSpacing=(1/artworkScale).sp,color=Color.White,modifier=Modifier.align(Alignment.TopStart).padding(8.dp))
        Text(story.level,color=TaleInk,fontWeight=FontWeight.ExtraBold,fontSize=((if(compact) 8 else 12)/artworkScale).sp,
            modifier=Modifier.align(Alignment.TopEnd).background(TaleYellow,RoundedCornerShape(bottomStart=5.dp)).padding(horizontal=if(compact) 4.dp else 7.dp,vertical=if(compact) 5.dp else 9.dp))
        // Small list thumbnails have an adjacent, accessible title; avoid splitting tiny words on the artwork.
        if(!compact && !artwork) Text(story.title,color=Color.White,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Bold,fontSize=(17/artworkScale).sp,
            lineHeight=(19/artworkScale).sp,textAlign=TextAlign.Center,maxLines=4,overflow=TextOverflow.Ellipsis,
            modifier=Modifier.align(Alignment.BottomCenter).padding(horizontal=7.dp,vertical=18.dp))
    }
}
