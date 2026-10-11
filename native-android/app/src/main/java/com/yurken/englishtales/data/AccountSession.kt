package com.yurken.englishtales.data

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.AtomicFile
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.security.KeyStore
import java.security.MessageDigest
import java.util.UUID
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

data class AccountSession(val userId: String,val email: String,val accessToken: String,val refreshToken: String,val expiresAt: Long) {
    // Do not expose tokens through data-class diagnostics or logging.
    override fun toString()="AccountSession(redacted)"
    fun json()=JSONObject().put("userId",userId).put("email",email).put("accessToken",accessToken).put("refreshToken",refreshToken).put("expiresAt",expiresAt)
    companion object {
        fun decode(json: JSONObject)=AccountSession(UUID.fromString(json.getString("userId")).toString(),json.getString("email"),
            json.getString("accessToken"),json.getString("refreshToken"),json.getLong("expiresAt")).also {
                require(it.accessToken.isNotBlank() && it.refreshToken.isNotBlank())
            }
    }
}

class AuthFailure(val code: String,val status: Int=0): Exception("Authentication request failed")

/** Credentials stay in memory for the request; only session tokens are persisted, encrypted. */
open class AuthHttp(private val base: String,private val key: String) {
    init {require(URI(base).scheme=="https" && URI(base).host!=null && key.startsWith("sb_publishable_"))}
    open fun request(path: String,method: String,body: JSONObject?=null,token: String?=null): JSONObject {
        val connection=URL(base.trimEnd('/')+path).openConnection() as HttpURLConnection
        try {
            connection.requestMethod=method;connection.connectTimeout=15_000;connection.readTimeout=20_000
            connection.instanceFollowRedirects=false
            connection.setRequestProperty("apikey",key)
            connection.setRequestProperty("Content-Type","application/json")
            if(token!=null) connection.setRequestProperty("Authorization","Bearer $token")
            if(body!=null) {connection.doOutput=true;connection.outputStream.use {it.write(body.toString().toByteArray(Charsets.UTF_8))}}
            val status=connection.responseCode
            val input=if(status in 200..299) connection.inputStream else connection.errorStream
            val bytes=input?.use {stream ->
                val out=java.io.ByteArrayOutputStream();val buffer=ByteArray(4096)
                while(true) {val n=stream.read(buffer);if(n<0) break;if(out.size()+n>262_144) throw AuthFailure("response_too_large");out.write(buffer,0,n)}
                out.toByteArray()
            } ?: byteArrayOf()
            val json=runCatching {JSONObject(String(bytes,Charsets.UTF_8))}.getOrElse {JSONObject()}
            if(status !in 200..299) throw AuthFailure(json.optString("error_code",json.optString("code")).takeIf {it.matches(Regex("[a-z_]{1,80}"))} ?: "auth_rejected",status)
            return json
        } finally {connection.disconnect()}
    }
}

interface SessionStorage {fun read(): AccountSession?;fun write(session: AccountSession);fun clear()}

class EncryptedSessionStorage(context: Context,project: String): SessionStorage {
    private val namespace=MessageDigest.getInstance("SHA-256").digest(project.toByteArray()).take(12).joinToString("") {"%02x".format(it)}
    private val alias="english_tales_session_$namespace"
    private val file=AtomicFile(File(context.filesDir,"account-$namespace.enc"))
    private val aad=project.toByteArray(Charsets.UTF_8)
    private fun key(): SecretKey {
        val store=KeyStore.getInstance("AndroidKeyStore").apply {load(null)}
        (store.getKey(alias,null) as? SecretKey)?.let {return it}
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore").apply {
            init(KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
        }.generateKey()
    }
    @Synchronized override fun read(): AccountSession? = try {
        val encrypted=file.openRead().use {it.readBytes()}
        require(encrypted.size in 30..262_144 && encrypted[0]==1.toByte())
        val cipher=Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE,key(),GCMParameterSpec(128,encrypted.copyOfRange(1,13)));cipher.updateAAD(aad)
        AccountSession.decode(JSONObject(String(cipher.doFinal(encrypted.copyOfRange(13,encrypted.size)),Charsets.UTF_8)))
    } catch (_: Exception) {file.delete();null}
    @Synchronized override fun write(session: AccountSession) {
        val cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key());cipher.updateAAD(aad)
        val bytes=byteArrayOf(1)+cipher.iv+cipher.doFinal(session.json().toString().toByteArray(Charsets.UTF_8))
        val output=file.startWrite()
        try {output.write(bytes);file.finishWrite(output)} catch (failure: Exception) {file.failWrite(output);throw failure}
    }
    @Synchronized override fun clear() {file.delete()}
}

class AccountService(private val http: AuthHttp?,private val storage: SessionStorage,private val clock: ()->Long=System::currentTimeMillis) {
    @Volatile var current: AccountSession?=null;private set
    @Synchronized fun restore(): AccountSession? {current=storage.read();return current}
    @Synchronized fun clearLocal() {storage.clear();current=null}
    private fun transport()=http ?: throw AuthFailure("not_configured")
    private fun validated(response: JSONObject,expectedUser: String?=null): AccountSession {
        val access=response.getString("access_token")
        val user=transport().request("/auth/v1/user","GET",token=access)
        val id=UUID.fromString(user.getString("id")).toString()
        if(expectedUser!=null && expectedUser!=id) throw AuthFailure("account_mismatch")
        val expires=response.optLong("expires_at",clock()/1000+response.getLong("expires_in"))*1000
        require(expires>clock())
        return AccountSession(id,user.optString("email"),access,response.getString("refresh_token"),expires)
    }
    @Synchronized fun signIn(email: String,password: String): AccountSession {
        if(!android.util.Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches() || password.isEmpty()) throw AuthFailure("invalid_input")
        val response=transport().request("/auth/v1/token?grant_type=password","POST",JSONObject().put("email",email.trim()).put("password",password))
        val session=validated(response);storage.write(session);current=session;return session
    }
    @Synchronized fun signInGoogle(identity: GoogleIdentity): AccountSession {
        if(identity.idToken.isBlank() || !identity.nonce.matches(Regex("[A-Za-z0-9_-]{43}"))) throw AuthFailure("invalid_input")
        val response=transport().request("/auth/v1/token?grant_type=id_token","POST",
            JSONObject().put("provider","google").put("id_token",identity.idToken).put("nonce",identity.nonce))
        val session=validated(response);storage.write(session);current=session;return session
    }
    @Synchronized fun accessToken(expectedUser: String): String {
        val session=current ?: throw AuthFailure("sign_in_required")
        if(session.userId!=expectedUser) throw AuthFailure("account_mismatch")
        if(session.expiresAt>clock()+60_000) return session.accessToken
        try {
            val response=transport().request("/auth/v1/token?grant_type=refresh_token","POST",JSONObject().put("refresh_token",session.refreshToken))
            val updated=validated(response,expectedUser);storage.write(updated);current=updated;return updated.accessToken
        } catch (failure: AuthFailure) {
            if(failure.status in listOf(400,401,403) || failure.code=="account_mismatch") {storage.clear();current=null}
            throw failure
        }
    }
    @Synchronized fun verifyCurrent(): AccountSession? {
        val expected=current ?: return null
        val token=accessToken(expected.userId)
        try {
            val user=transport().request("/auth/v1/user","GET",token=token)
            if(UUID.fromString(user.getString("id")).toString()!=expected.userId) throw AuthFailure("account_mismatch",401)
        } catch (failure: AuthFailure) {
            if(failure.status in listOf(401,403)) {storage.clear();current=null}
            throw failure
        }
        return current
    }
    @Synchronized fun signOut(): Boolean {
        val previous=current
        storage.clear();current=null
        return if(previous==null) true else runCatching {transport().request("/auth/v1/logout?scope=local","POST",token=previous.accessToken);true}.getOrDefault(false)
    }
}

data class AccountState(val userId: String?=null,val email: String="",val busy: Boolean=false,val message: String="",val needsSignIn: Boolean=false,val scope: Long=0,
    val guestTransfer: GuestTransferPreview?=null)
