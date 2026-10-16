package com.yurken.englishtales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.yurken.englishtales.data.Story

/** Comfortable line length for running text; wider screens centre the column instead of stretching it. */
internal val ReadingWidth = 720.dp
/** Forms, profile and detail pages stay legible on tablets and in landscape. */
internal val ContentWidth = 840.dp

/** Centres the content and caps its width; on phones narrower than [max] it changes nothing. */
internal fun Modifier.centeredWidth(max: Dp): Modifier = fillMaxWidth().wrapContentWidth(Alignment.CenterHorizontally).widthIn(max=max)

/**
 * Story lists: one column on phones, more columns as soon as the screen fits two cards (tablets, landscape),
 * so a single layout serves every width without device breakpoints.
 */
@Composable
internal fun StoryList(stories: List<Story>, card: @Composable (Story) -> Unit, empty: (@Composable () -> Unit)? = null) {
    LazyVerticalGrid(GridCells.Adaptive(StoryCardMinWidth),contentPadding=PaddingValues(16.dp),
        verticalArrangement=Arrangement.spacedBy(18.dp),horizontalArrangement=Arrangement.spacedBy(24.dp)) {
        items(stories,key={it.id}) { card(it) }
        if(stories.isEmpty() && empty!=null) item(span={GridItemSpan(maxLineSpan)}) { empty() }
    }
}

internal val StoryCardMinWidth = 320.dp
