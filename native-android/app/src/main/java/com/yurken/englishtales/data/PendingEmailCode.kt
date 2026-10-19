package com.yurken.englishtales.data

import android.content.Context

/** The open email-code step (action and address, never the password or code), kept across process death until the code expires. */
class PendingEmailCode(private val read: ()->String?,private val write: (String?)->Unit,private val now: ()->Long=System::currentTimeMillis,private val lifetimeMillis: Long=60*60*1000L) {
    fun save(action: String,email: String)=write("$action\n$email\n${now()}")
    fun clear()=write(null)
    fun restore(): Pair<String,String>? {
        val parts=read()?.split('\n') ?: return null
        val at=parts.getOrNull(2)?.toLongOrNull()
        if(parts.size!=3 || parts[0] !in setOf("signup","recovery") || parts[1].isBlank() || at==null || now()-at !in 0 until lifetimeMillis) {clear();return null}
        return parts[0] to parts[1]
    }
    companion object {
        fun memory(): PendingEmailCode {var value: String?=null;return PendingEmailCode({value},{value=it})}
        fun prefs(context: Context): PendingEmailCode {
            val prefs=context.getSharedPreferences("pending_email_code",Context.MODE_PRIVATE)
            return PendingEmailCode({prefs.getString("entry",null)},{prefs.edit().apply {if(it==null) remove("entry") else putString("entry",it)}.apply()})
        }
    }
}
