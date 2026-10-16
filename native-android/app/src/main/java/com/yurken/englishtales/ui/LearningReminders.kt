package com.yurken.englishtales.ui

import android.Manifest
import androidx.compose.ui.res.stringResource
import android.app.*
import android.content.*
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import com.yurken.englishtales.MainActivity
import com.yurken.englishtales.R
import com.yurken.englishtales.data.LearningStore
import com.yurken.englishtales.data.LearningOwner
import com.yurken.englishtales.data.LearningReminderOwner
import java.util.Calendar
import java.util.Locale

/** A user-selected, inexact daily reminder. No exact-alarm or network permission. */
object LearningReminders {
    internal fun deliver(context: Context, storeFactory: (LearningOwner)->LearningStore={LearningStore(context,it)},
        show: (Int)->Unit={show(context,it)}) {
        val owner=LearningReminderOwner.current(context) ?: return
        storeFactory(owner).use { store ->
            val snapshot=store.snapshot()
            // Q5.10: the reminder names the reviews that are actually waiting.
            if(!snapshot.dailyGoalReached) LearningReminderOwner.ifCurrent(context,owner) {show(snapshot.dueWordIds.size)}
        }
    }
    private fun prefs(context: Context) = context.getSharedPreferences("reminders",Context.MODE_PRIVATE)
    fun enabled(context: Context) = prefs(context).getBoolean("enabled",false)
    fun hour(context: Context) = prefs(context).getInt("hour",19)
    fun minute(context: Context) = prefs(context).getInt("minute",0)
    fun allowed(context: Context): Boolean = context.getSystemService(NotificationManager::class.java).areNotificationsEnabled() &&
        (Build.VERSION.SDK_INT<33 || context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED)
    fun configure(context: Context, enabled: Boolean, hour: Int=hour(context), minute: Int=minute(context)) {
        prefs(context).edit().putBoolean("enabled",enabled).putInt("hour",hour).putInt("minute",minute).apply()
        schedule(context)
    }
    private fun pending(context: Context) = PendingIntent.getBroadcast(context,71,Intent(context,LearningReminderReceiver::class.java).setAction("com.yurken.englishtales.REMIND"),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    fun schedule(context: Context) {
        val manager=context.getSystemService(AlarmManager::class.java)
        manager.cancel(pending(context))
        if(!enabled(context) || !allowed(context)) return
        val next=Calendar.getInstance().apply {set(Calendar.HOUR_OF_DAY,hour(context));set(Calendar.MINUTE,minute(context));set(Calendar.SECOND,0);set(Calendar.MILLISECOND,0);if(timeInMillis<=System.currentTimeMillis()) add(Calendar.DAY_OF_YEAR,1)}
        manager.set(AlarmManager.RTC_WAKEUP,next.timeInMillis,pending(context))
    }
    fun show(context: Context,dueWords: Int=0) {
        if(!enabled(context) || !allowed(context)) return
        val manager=context.getSystemService(NotificationManager::class.java)
        if(Build.VERSION.SDK_INT>=26) manager.createNotificationChannel(NotificationChannel("daily_learning",context.getString(R.string.gunluk_ogrenme_hatirlaticisi),NotificationManager.IMPORTANCE_DEFAULT))
        val open=PendingIntent.getActivity(context,72,Intent(context,MainActivity::class.java).putExtra("daily_plan_request",System.currentTimeMillis()).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        @Suppress("DEPRECATION")
        val builder=if(Build.VERSION.SDK_INT>=26) Notification.Builder(context,"daily_learning") else Notification.Builder(context)
        manager.notify(71,builder.setSmallIcon(R.drawable.ic_notification).setContentTitle(context.getString(R.string.bugunku_hikayen_seni_bekliyor))
            .setContentText(if(dueWords>0) context.resources.getQuantityString(R.plurals.reminder_due_words,dueWords,dueWords) else context.getString(R.string.kisa_bir_okuma_veya_kelime)).setContentIntent(open).setAutoCancel(true).build())
    }
}

class LearningReminderReceiver: BroadcastReceiver() {
    override fun onReceive(context: Context,intent: Intent) {
        if(intent.action!="com.yurken.englishtales.REMIND") {LearningReminders.schedule(context);return}
        val result=goAsync()
        Thread {
            try {
                LearningReminders.deliver(context)
            } catch (_: Exception) {
                // An unreadable account must not fall back to another owner's goal.
            } finally {
                try {LearningReminders.schedule(context)} catch (_: Exception) {
                    // Scheduling failure must still release the broadcast without crashing.
                } finally {result.finish()}
            }
        }.start()
    }
}

@Composable
fun ReminderControls() {
    val context=LocalContext.current
    var enabled by remember {mutableStateOf(LearningReminders.enabled(context))}
    var hour by remember {mutableIntStateOf(LearningReminders.hour(context))}
    var minute by remember {mutableIntStateOf(LearningReminders.minute(context))}
    var denied by remember {mutableStateOf(false)}
    val permission=rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {granted ->
        enabled=granted && LearningReminders.allowed(context);denied=!enabled;LearningReminders.configure(context,enabled,hour,minute)
    }
    Column(Modifier.fillMaxWidth().padding(vertical=12.dp)) {
        Text(stringResource(R.string.kendi_saatinde_hatirlat),fontSize=16.sp)
        Text(stringResource(R.string.istege_baglidir_gunluk_hedefini_tamamladiysan),fontSize=12.sp,color=TaleMuted)
        Row(Modifier.fillMaxWidth(),verticalAlignment=androidx.compose.ui.Alignment.CenterVertically) {
            TextButton(onClick={TimePickerDialog(context,{_,h,m ->hour=h;minute=m;LearningReminders.configure(context,enabled,h,m)},hour,minute,true).show()},modifier=Modifier.weight(1f)) {Text(String.format(Locale.getDefault(),"%02d:%02d",hour,minute))}
            Switch(checked=enabled,modifier=Modifier.contentLabel(stringResource(R.string.gunluk_hatirlatici)),onCheckedChange={value ->
                denied=false
                if(!value) {enabled=false;LearningReminders.configure(context,false)}
                else if(Build.VERSION.SDK_INT>=33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED) permission.launch(Manifest.permission.POST_NOTIFICATIONS)
                else {enabled=LearningReminders.allowed(context);denied=!enabled;LearningReminders.configure(context,enabled,hour,minute)}
            })
        }
        if(denied || (enabled && !LearningReminders.allowed(context))) {
            Text(stringResource(R.string.bildirim_izni_kapali_dilersen_cihaz),fontSize=12.sp,color=TaleMuted)
            TextButton(onClick={val intent=if(android.os.Build.VERSION.SDK_INT>=26) Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(android.provider.Settings.EXTRA_APP_PACKAGE,context.packageName) else Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,android.net.Uri.parse("package:${context.packageName}"));context.startActivity(intent)}) {Text(stringResource(R.string.bildirim_ayarlarini_ac))}
        }
    }
}
