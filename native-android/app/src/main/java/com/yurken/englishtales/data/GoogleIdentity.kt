package com.yurken.englishtales.data

import android.content.Context
import android.content.MutableContextWrapper
import android.util.Base64
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.CustomCredential
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import java.security.SecureRandom
import java.security.MessageDigest

class GoogleIdentity(val idToken: String,val nonce: String) {
    override fun toString()="GoogleIdentity(redacted)"
}

object GoogleSignIn {
    fun nonce(): String=Base64.encodeToString(ByteArray(32).also {SecureRandom().nextBytes(it)},Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
    fun hashedNonce(nonce: String): String=MessageDigest.getInstance("SHA-256").digest(nonce.toByteArray(Charsets.UTF_8)).joinToString("") {"%02x".format(it)}
    suspend fun acquire(context: Context,webClientId: String): GoogleIdentity {
        if(!webClientId.matches(Regex("[0-9]+-[a-zA-Z0-9_-]+\\.apps\\.googleusercontent\\.com"))) throw AuthFailure("google_not_configured")
        val rawNonce=nonce()
        val option=GetSignInWithGoogleOption.Builder(webClientId).setNonce(hashedNonce(rawNonce)).build()
        val request=GetCredentialRequest.Builder().addCredentialOption(option).build()
        val result=try {
            CredentialManager.create(context.applicationContext).getCredential(MutableContextWrapper(context),request)
        } catch (_: GetCredentialCancellationException) {throw AuthFailure("google_cancelled")}
          catch (_: NoCredentialException) {throw AuthFailure("google_no_account")}
        val credential=result.credential
        if(credential !is CustomCredential || credential.type!=GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) throw AuthFailure("google_invalid_credential")
        return GoogleIdentity(GoogleIdTokenCredential.createFrom(credential.data).idToken,rawNonce)
    }
    suspend fun clear(context: Context) {
        CredentialManager.create(context.applicationContext).clearCredentialState(ClearCredentialStateRequest())
    }
}
