package com.yurken.englishtales.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import org.junit.Assert.assertTrue
import org.junit.Test

/** WCAG AA: every text color the screens use stays at least 4.5:1 against its background, in both themes (Q3.3). */
class TaleColorsContrastTest {
    private fun ratio(a: Color, b: Color): Double {
        val (light, dark) = listOf(a.luminance() + 0.05, b.luminance() + 0.05).sortedDescending()
        return light / dark
    }

    private fun textPairs(c: TaleColors) = buildList {
        val grounds = mapOf("background" to c.background, "surface" to c.surface, "panel" to c.panel)
        for ((name, ground) in grounds) {
            for ((text, color) in mapOf("ink" to c.ink, "muted" to c.muted, "blue" to c.blue, "purple" to c.purple,
                "success" to c.success, "error" to c.error, "warm" to c.warm)) add(Triple("$text/$name", color, ground))
        }
        for ((name, tile) in mapOf("line" to c.line, "mint" to c.mint, "tileBlue" to c.tileBlue, "tileYellow" to c.tileYellow,
            "tilePurple" to c.tilePurple, "tileGreen" to c.tileGreen)) {
            add(Triple("ink/$name", c.ink, tile)); add(Triple("muted/$name", c.muted, tile))
        }
        add(Triple("blue/mint", c.blue, c.mint)); add(Triple("blue/line", c.blue, c.line))
        add(Triple("onBlue/blue", c.onBlue, c.blue)); add(Triple("onPurple/purple", c.onPurple, c.purple))
        add(Triple("gold/tileYellow", c.gold, c.tileYellow))
    }

    @Test fun lightAndDarkTextMeetsAA() {
        val failures = listOf("light" to LightTaleColors, "dark" to DarkTaleColors).flatMap { (theme, colors) ->
            textPairs(colors).filter { ratio(it.second, it.third) < 4.5 }
                .map { "$theme ${it.first} %.2f".format(ratio(it.second, it.third)) }
        }
        assertTrue(failures.joinToString(), failures.isEmpty())
    }
}
