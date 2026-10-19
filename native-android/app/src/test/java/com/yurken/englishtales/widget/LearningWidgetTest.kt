package com.yurken.englishtales.widget

import com.yurken.englishtales.data.LearningSnapshot
import java.io.File
import java.util.Calendar
import java.util.GregorianCalendar
import java.util.TimeZone
import javax.xml.parsers.DocumentBuilderFactory
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LearningWidgetTest {
    @Test fun summaryComesFromTheLearningSnapshot() {
        val summary=WidgetSummary.from(LearningSnapshot(streak=4,dailyGoal=2,todaySessions=1,dueWordIds=listOf("a","b","c")))
        assertEquals(WidgetSummary(4,1,2,false,3),summary)
    }

    // Periodic widget updates wake the device and cold-start the app every 30 minutes.
    @Test fun widgetHasNoPeriodicUpdates() {
        val file=listOf("src/main/res/xml/learning_widget_info.xml","app/src/main/res/xml/learning_widget_info.xml").map(::File).first {it.exists()}
        val factory=DocumentBuilderFactory.newInstance().apply {isNamespaceAware=true}
        val root=factory.newDocumentBuilder().parse(file).documentElement
        assertEquals("0",root.getAttributeNS("http://schemas.android.com/apk/res/android","updatePeriodMillis"))
    }

    @Test fun dayRolloverRefreshIsJustAfterTheNextLocalMidnight() {
        val zone=TimeZone.getTimeZone("Europe/Istanbul")
        fun at(y: Int,m: Int,d: Int,h: Int,min: Int)=GregorianCalendar(zone).apply {clear();set(y,m,d,h,min)}.timeInMillis
        assertEquals(at(2026,Calendar.OCTOBER,20,0,1),LearningWidgetDay.nextDayStart(at(2026,Calendar.OCTOBER,19,23,59),GregorianCalendar(zone)))
        assertEquals(at(2026,Calendar.OCTOBER,20,0,1),LearningWidgetDay.nextDayStart(at(2026,Calendar.OCTOBER,19,0,0),GregorianCalendar(zone)))
        // Year end, and a DST change elsewhere still lands on local 00:01.
        assertEquals(at(2027,Calendar.JANUARY,1,0,1),LearningWidgetDay.nextDayStart(at(2026,Calendar.DECEMBER,31,12,0),GregorianCalendar(zone)))
        val berlin=TimeZone.getTimeZone("Europe/Berlin")
        val next=GregorianCalendar(berlin).apply {timeInMillis=LearningWidgetDay.nextDayStart(GregorianCalendar(berlin).apply {clear();set(2026,Calendar.OCTOBER,24,22,0)}.timeInMillis,GregorianCalendar(berlin))}
        assertTrue(next.get(Calendar.DAY_OF_MONTH)==25 && next.get(Calendar.HOUR_OF_DAY)==0 && next.get(Calendar.MINUTE)==1)
    }

    @Test fun dayRefreshListensForItsAlarmAndClockChanges() {
        assertEquals(setOf("com.yurken.englishtales.WIDGET_NEW_DAY","android.intent.action.TIME_SET","android.intent.action.TIMEZONE_CHANGED"),LearningWidgetDay.actions)
    }
}
