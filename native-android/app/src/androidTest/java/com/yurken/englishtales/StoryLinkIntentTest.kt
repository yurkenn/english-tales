package com.yurken.englishtales

import android.content.Intent
import android.net.Uri
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.data.StoryLinks
import org.junit.Assert.*
import org.junit.Test

/** Q6: the manifest routes shared story links to MainActivity, and only those. */
class StoryLinkIntentTest {
    private val context = InstrumentationRegistry.getInstrumentation().targetContext
    private fun handlers(url: String) = context.packageManager
        .queryIntentActivities(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE).setPackage(context.packageName), 0)
        .map { it.activityInfo.name }

    @Test fun sharedStoryLinkOpensMainActivity() {
        assertEquals(listOf(MainActivity::class.java.name), handlers(StoryLinks.url("quiet-morning")))
    }

    @Test fun otherSitePagesStayInTheBrowser() {
        assertTrue(handlers("https://${StoryLinks.HOST}/privacy").isEmpty())
        assertTrue(handlers("http://${StoryLinks.HOST}/story/quiet-morning").isEmpty())
    }
}
