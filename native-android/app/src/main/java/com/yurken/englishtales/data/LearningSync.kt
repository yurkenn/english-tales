package com.yurken.englishtales.data

import org.json.JSONObject
import org.json.JSONTokener
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL

/** Only safe codes are exposed; response bodies and credentials never enter diagnostics. */
class LearningSyncFailure(val code: String, val status: Int = 0) : Exception("Learning request failed")

fun interface LearningSyncTransport {
    fun call(rpc: String, body: JSONObject, token: String): JSONObject
}

class LearningSyncHttp(private val base: String, private val key: String) : LearningSyncTransport {
    init {
        val uri = URI(base)
        require(uri.scheme == "https" && uri.host != null && uri.userInfo == null && uri.query == null && uri.fragment == null)
        require(uri.path.isNullOrEmpty() || uri.path == "/")
        require(key.startsWith("sb_publishable_"))
    }
    override fun call(rpc: String, body: JSONObject, token: String): JSONObject {
        require(rpc in allowedRpcs && token.isNotBlank())
        val connection = URL(base.trimEnd('/') + "/rest/v1/rpc/$rpc").openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.instanceFollowRedirects = false
            connection.connectTimeout = 15_000
            connection.readTimeout = 20_000
            connection.setRequestProperty("apikey", key)
            connection.setRequestProperty("Authorization", "Bearer $token")
            connection.setRequestProperty("Content-Type", "application/json")
            if(rpc=="save_learning_preferences") connection.setRequestProperty("Accept","application/vnd.pgrst.object+json")
            connection.doOutput = true
            connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            val status = connection.responseCode
            val input = if (status in 200..299) connection.inputStream else connection.errorStream
            val bytes = input?.use { stream ->
                val output = ByteArrayOutputStream()
                val buffer = ByteArray(4096)
                while (true) {
                    val count = stream.read(buffer)
                    if (count < 0) break
                    if (output.size() + count > MAX_RESPONSE_BYTES) throw LearningSyncFailure("response_too_large", status)
                    output.write(buffer, 0, count)
                }
                output.toByteArray()
            } ?: byteArrayOf()
            return decode(status, String(bytes, Charsets.UTF_8))
        } finally { connection.disconnect() }
    }
    companion object {
        const val MAX_RESPONSE_BYTES = 4 * 1024 * 1024
        val eventRpcs = setOf("submit_learning_session", "apply_word_event", "apply_progress_event", "apply_favorite_event", "apply_lemma_event")
        private val allowedRpcs = eventRpcs + setOf("get_learning_snapshot", "save_learning_preferences", "get_my_league", "set_league_opt_out", "get_my_friends", "get_friend_code", "add_friend", "remove_friend", "report_name", "open_quest_chest", "get_quest_chests", "get_energy_state", "unlock_story", "begin_ad_reward", "cancel_ad_reward", "get_energy_policy")
        internal fun decode(status: Int, text: String): JSONObject {
            val json = try {
                val parser = JSONTokener(text)
                val value = parser.nextValue()
                if (value !is JSONObject || parser.nextClean() != '\u0000') throw IllegalArgumentException()
                value
            } catch (_: Exception) {
                throw LearningSyncFailure(if (status in 200..299) "invalid_response" else "http_rejected", status)
            }
            if (status !in 200..299) {
                val energyCode=json.optString("message").takeIf {it in setOf("pending_reward","ad_limit_reached","energy_disabled","premium_active")}
                val code = energyCode ?: json.optString("code").takeIf { it.matches(Regex("[A-Za-z0-9_]{1,80}")) } ?: "http_rejected"
                throw LearningSyncFailure(code, status)
            }
            return json
        }
    }
}

data class LearningUploadResult(val delivered: Int, val blocked: Int, val stopped: Boolean, val verifySession: Boolean=false)

/** Run on the store's serial IO actor. Scope guard must capture the caller's account generation. */
class LearningQueueSync(private val transport: LearningSyncTransport, private val accounts: AccountService) {
    fun upload(store: LearningStore, expectedUser: String, isCurrentScope: () -> Boolean, limit: Int = 50): LearningUploadResult {
        var delivered = 0
        var blocked = 0
        fun current() = isCurrentScope() && accounts.current?.userId == expectedUser &&
            store.owner is LearningOwner.Account && store.owner.id == expectedUser
        if (!current()) return LearningUploadResult(0, 0, true)
        for (operation in store.pendingUploads(expectedUser, limit)) {
            if (!current()) return LearningUploadResult(delivered, blocked, true)
            try {
                if (operation.rpc !in LearningSyncHttp.eventRpcs) throw LearningSyncFailure("invalid_local_operation", 400)
                val payload = try { JSONObject(operation.payload) } catch (_: Exception) {
                    throw LearningSyncFailure("invalid_local_operation", 400)
                }
                if (payload.optString("id") != operation.id || operation.ownerId != expectedUser)
                    throw LearningSyncFailure("invalid_local_operation", 400)
                val token = accounts.accessToken(expectedUser)
                if (!current()) return LearningUploadResult(delivered, blocked, true)
                val response = transport.call(operation.rpc, JSONObject().put("p_event", payload), token)
                // An accepted duplicate is an acknowledgement, not another local reward.
                if (response.opt("applied") !is Boolean) throw LearningSyncFailure("invalid_response")
                if (!current()) return LearningUploadResult(delivered, blocked, true)
                if (store.markDelivered(operation.id, expectedUser)) delivered++
            } catch (failure: LearningSyncFailure) {
                if (!current()) return LearningUploadResult(delivered, blocked, true)
                val permanent = failure.code in setOf("23505", "22023", "23503", "invalid_local_operation")
                store.markUploadFailed(operation.id, expectedUser, failure.code, !permanent)
                if (permanent) blocked++ else return LearningUploadResult(delivered, blocked, true, failure.status==401)
            } catch (failure: AuthFailure) {
                if (current()) store.markUploadFailed(operation.id, expectedUser, failure.code, true)
                return LearningUploadResult(delivered, blocked, true)
            } catch (_: IOException) {
                if (current()) store.markUploadOffline(operation.id, expectedUser)
                return LearningUploadResult(delivered, blocked, true)
            }
        }
        return LearningUploadResult(delivered, blocked, false)
    }
}
