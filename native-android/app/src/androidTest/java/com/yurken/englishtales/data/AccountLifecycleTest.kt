package com.yurken.englishtales.data

import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.util.UUID

class AccountLifecycleTest {
    private class Vault: SessionStorage {
        var session: AccountSession?=null
        var writes=0
        override fun read()=session
        override fun write(session: AccountSession) {this.session=session;writes++}
        override fun clear() {session=null}
    }
    private class Api: AuthHttp("https://example.invalid","sb_publishable_fixture") {
        val owner=UUID.randomUUID().toString()
        var email="reader@example.invalid"
        var verifiedType=""
        var verifyRejected=false
        var updateRejected=false
        var updateOwner=owner
        var logoutCount=0
        var signupAutomatic=false
        var deletionOwner=owner
        val paths=mutableListOf<String>()
        override fun request(path: String,method: String,body: JSONObject?,token: String?): JSONObject {
            paths+=path
            return when {
                path=="/auth/v1/signup" -> if(signupAutomatic) credentials() else JSONObject().put("id",owner)
                path=="/auth/v1/resend" || path=="/auth/v1/recover" -> JSONObject()
                path=="/auth/v1/verify" -> {
                    verifiedType=body!!.getString("type")
                    if(verifyRejected) throw AuthFailure("otp_expired",403)
                    credentials()
                }
                path=="/auth/v1/user" && method=="GET" -> JSONObject().put("id",owner).put("email",email)
                path=="/auth/v1/user" && method=="PUT" -> {
                    check(token=="ephemeral-access")
                    if(updateRejected) throw AuthFailure("weak_password",422)
                    JSONObject().put("id",updateOwner).put("email",email)
                }
                path.startsWith("/auth/v1/logout") -> {logoutCount++;JSONObject()}
                path=="/functions/v1/delete-account" -> JSONObject().put("code","account_deleted").put("userId",deletionOwner)
                else -> error("Unexpected endpoint")
            }
        }
        private fun credentials()=JSONObject().put("access_token","ephemeral-access").put("refresh_token","ephemeral-refresh").put("expires_in",3600)
    }
    private fun prior(vault: Vault): AccountSession = AccountSession(UUID.randomUUID().toString(),"previous@example.invalid","previous-access","previous-refresh",9_000_000).also {vault.session=it}

    @Test fun signupAndResendNeverReplaceAnExistingSessionEvenWithAutomaticConfirmation() {
        val api=Api();val vault=Vault();val previous=prior(vault);val auth=AccountService(api,vault){1_000_000};auth.restore()
        assertFalse(auth.signUp(api.email,"fixture-password"));auth.resendConfirmation(api.email)
        api.signupAutomatic=true;assertTrue(auth.signUp(api.email,"fixture-password"))
        assertEquals(previous,auth.current);assertEquals(previous,vault.session);assertEquals(0,vault.writes)
    }
    @Test fun signupVerificationPersistsOnlyVerifiedMatchingEmail() {
        val api=Api();val vault=Vault();val auth=AccountService(api,vault){1_000_000}
        val session=auth.confirmEmail(api.email,"123456")
        assertEquals("signup",api.verifiedType);assertEquals(api.owner,session.userId);assertEquals(session,vault.session)
        assertEquals(session,AccountService(api,vault){1_000_000}.restore())
    }
    @Test fun WrongEmailOrExpiredCodeCannotReplacePreviousSession() {
        val api=Api();val vault=Vault();val previous=prior(vault);val auth=AccountService(api,vault){1_000_000};auth.restore()
        assertTrue(runCatching {auth.confirmEmail("different@example.invalid","123456")}.isFailure)
        api.verifyRejected=true
        assertTrue(runCatching {auth.confirmEmail(api.email,"123456")}.isFailure)
        assertEquals(previous,auth.current);assertEquals(previous,vault.session);assertEquals(0,vault.writes)
    }
    @Test fun recoveryCredentialsNeverBecomeAnAccountSession() {
        val api=Api();val vault=Vault();val previous=prior(vault);val auth=AccountService(api,vault){1_000_000};auth.restore()
        auth.requestRecovery(api.email);auth.resetPassword(api.email,"123456","new-fixture-password")
        assertEquals("recovery",api.verifiedType);assertEquals(1,api.logoutCount)
        assertEquals(previous,auth.current);assertEquals(previous,vault.session);assertEquals(0,vault.writes)
    }
    @Test fun rejectedPasswordUpdateRevokesEphemeralRecoveryAndKeepsPriorAccount() {
        val api=Api().apply {updateRejected=true};val vault=Vault();val previous=prior(vault);val auth=AccountService(api,vault){1_000_000};auth.restore()
        assertTrue(runCatching {auth.resetPassword(api.email,"123456","new-fixture-password")}.isFailure)
        assertEquals(1,api.logoutCount);assertEquals(previous,auth.current);assertEquals(previous,vault.session)
        api.updateRejected=false;api.updateOwner=UUID.randomUUID().toString()
        assertTrue(runCatching {auth.resetPassword(api.email,"123456","new-fixture-password")}.isFailure)
        assertEquals(2,api.logoutCount);assertEquals(0,vault.writes)
    }
    @Test fun invalidInputsCannotSendCredentialsOrRequestEmail() {
        val api=Api();val auth=AccountService(api,Vault()){1_000_000}
        assertTrue(runCatching {auth.signUp(api.email,"short")}.isFailure)
        assertTrue(runCatching {auth.requestRecovery("invalid")}.isFailure)
        assertTrue(runCatching {auth.confirmEmail(api.email,"abcdef")}.isFailure)
        assertTrue(runCatching {auth.resetPassword(api.email,"123456","short")}.isFailure)
        assertTrue(api.paths.isEmpty())
    }
    @Test fun deletionWithWrongAcknowledgementNeverClearsSession() {
        val api=Api();val vault=Vault();val auth=AccountService(api,vault){1_000_000}
        val session=auth.confirmEmail(api.email,"123456")
        api.deletionOwner=UUID.randomUUID().toString()
        assertTrue(runCatching {auth.deleteAccount(session.userId)}.isFailure)
        assertEquals(session,vault.session);assertEquals(session,auth.current)
        api.deletionOwner=session.userId;auth.deleteAccount(session.userId)
        assertNull(vault.session);assertNull(auth.current)
    }
}
