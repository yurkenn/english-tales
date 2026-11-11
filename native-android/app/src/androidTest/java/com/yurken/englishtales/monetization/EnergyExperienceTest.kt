package com.yurken.englishtales.monetization

import android.app.Application
import androidx.activity.compose.setContent
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import com.yurken.englishtales.MainActivity
import com.yurken.englishtales.R
import com.yurken.englishtales.ui.*
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import java.io.File

/** Real rendered screens, isolated from production accounts and ad traffic. */
class EnergyExperienceTest {
    @get:Rule val compose=createEmptyComposeRule()
    @Test fun readerRespectsConfiguredEnergyPolicy() {
        val instrumentation=InstrumentationRegistry.getInstrumentation()
        val context=instrumentation.targetContext
        if(!com.yurken.englishtales.BuildConfig.MONETIZATION_ENABLED) {
            val disabledScenario=ActivityScenario.launch(MainActivity::class.java)
            var opened=false
            try {
                disabledScenario.onActivity { activity ->
                    val model=MonetizationViewModel(context.applicationContext as Application)
                    activity.setContent {EnglishTalesTheme {ReaderEnergyAccess(model,"fixture-new",true,{}, {}) {opened=true}}}
                }
                compose.waitForIdle()
                assertTrue(opened)
                compose.onNodeWithText(context.getString(R.string.energy_empty)).assertDoesNotExist()
            } finally {disabledScenario.close()}
            return
        }
        val file=File(context.filesDir,"energy-guest.json")
        val previous=if(file.exists()) file.readBytes() else null
        val now=System.currentTimeMillis()
        EnergyDisk(context,"guest").write(JSONObject().put("legacySeeded",true).put("day",EnergyPolicy.day(now))
            .put("spent",3).put("lastClock",now).put("unlocked",JSONArray()))
        val scenario=ActivityScenario.launch(MainActivity::class.java)
        var opened=false
        try {
            scenario.onActivity {activity ->
                val model=MonetizationViewModel(context.applicationContext as Application)
                model.bind("guest",123,emptySet())
                activity.setContent {EnglishTalesTheme {ReaderEnergyAccess(model,"fixture-new",true,{}, {}) {opened=true}}}
            }
            compose.waitUntil(20000) {compose.onAllNodesWithText(context.getString(R.string.energy_empty)).fetchSemanticsNodes().isNotEmpty()}
            assertFalse(opened)
            compose.onNodeWithText(context.getString(R.string.energy_sign_in)).assertExists()
            compose.onNodeWithText(context.getString(R.string.energy_retry_read)).assertIsNotEnabled()
            compose.waitForIdle();assertFalse(opened)
            val bitmap=instrumentation.uiAutomation.takeScreenshot()
            val output=File(context.getExternalFilesDir(null),"energy-exhausted.png")
            output.outputStream().use {bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG,100,it)}
            bitmap.recycle()
        } finally {
            scenario.close()
            if(previous==null) EnergyDisk(context,"guest").delete() else file.writeBytes(previous)
        }
    }
}
