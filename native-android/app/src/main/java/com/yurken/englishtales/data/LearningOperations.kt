package com.yurken.englishtales.data

import android.content.Context
import org.json.JSONObject
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.UUID

/** Must remain identical to the backend catalog exporter for bundled revision 1. */
object ContentRevisionIds {
    fun stable(value: String): String {
        val h=MessageDigest.getInstance("SHA-256").digest("english-tales:$value".toByteArray(Charsets.UTF_8)).joinToString("") {"%02x".format(it)}
        return "${h.substring(0,8)}-${h.substring(8,12)}-5${h.substring(13,16)}-a${h.substring(17,20)}-${h.substring(20,32)}"
    }
    fun bundled(storyId: String) = stable("$storyId:revision:1")
}

internal object InstallationIdentity {
    @Synchronized fun get(context: Context): String {
        val prefs=context.getSharedPreferences("installation_identity",Context.MODE_PRIVATE)
        prefs.getString("id",null)?.let {return UUID.fromString(it).toString()}
        val id=UUID.randomUUID().toString()
        check(prefs.edit().putString("id",id).commit()) {"Installation identity could not be saved"}
        return id
    }
}

internal class LearningOperations(private val installationId: String) {
    fun word(id: String,revisionId: String?,wordId: String,action: String,correct: Boolean?,now: Long) = base(id)
        .put("storyRevisionId",revisionId?:JSONObject.NULL).put("wordId",wordId).put("action",action)
        .put("correct",correct?:JSONObject.NULL).put("occurredAt",iso(now)).put("studyTimezone",TimeZone.getDefault().id)
    fun progress(id: String,story: Story,sentenceId: String,percent: Int,now: Long) = base(id)
        .put("storyRevisionId",story.revisionId).put("sentenceId",sentenceId).put("percent",percent).put("occurredAt",iso(now))
    fun session(draft: SessionDraftRow,correct: Int,now: Long) = base(draft.id)
        .put("kind",draft.kind).put("storyRevisionId",draft.revisionId?:JSONObject.NULL)
        .put("startedAt",iso(draft.startedAt)).put("finishedAt",iso(now))
        .put("activeSeconds",(draft.activeMillis/1000).coerceAtMost(86400)).put("correctAnswers",correct)
        .put("questionCount",draft.questionCount).put("studyTimezone",TimeZone.getDefault().id)
    private fun base(id: String) = JSONObject().put("id",id).put("installationId",installationId)
    private fun iso(now: Long) = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",Locale.US).apply {timeZone=TimeZone.getTimeZone("UTC")}.format(Date(now))
}

data class ReadingPosition(val revisionId: String,val sentenceId: String)
