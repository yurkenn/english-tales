package com.yurken.englishtales.data

import android.content.ContextWrapper
import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.security.KeyStoreException
import java.util.UUID
import java.util.concurrent.Executors
import javax.crypto.KeyGenerator

class AccountSessionTest {
    private class MemoryStorage: SessionStorage {
        var value: AccountSession?=null
        override fun read()=value
        override fun write(session: AccountSession) {value=session}
        override fun clear() {value=null}
    }
    private class Fixture: AuthHttp("https://example.invalid","sb_publishable_fixture") {
        val user=UUID.randomUUID().toString()
        var actualUser=user
        var refreshCount=0
        var failRefresh=false
        var rejectRefresh=false
        var failLogout=false
        var rejectGoogle=false
        var googleBody: JSONObject?=null
        override fun request(path: String,method: String,body: JSONObject?,token: String?): JSONObject = when {
            path=="/auth/v1/user" -> JSONObject().put("id",actualUser).put("email","fixture@example.invalid")
            path.contains("grant_type=id_token") -> {
                googleBody=body
                if(rejectGoogle) throw AuthFailure("invalid_credentials",400)
                JSONObject().put("access_token","google-access").put("refresh_token","google-refresh").put("expires_in",3600)
            }
            path.contains("refresh_token") -> {
                refreshCount++
                if(failRefresh) throw java.io.IOException("Simulated offline")
                if(rejectRefresh) throw AuthFailure("refresh_token_not_found",400)
                JSONObject().put("access_token","renewed-access").put("refresh_token","rotated-refresh").put("expires_in",3600).put("expires_at",4600)
            }
            path.contains("grant_type=password") -> JSONObject().put("access_token","initial-access").put("refresh_token","initial-refresh").put("expires_in",3600).put("expires_at",4600)
            path.startsWith("/auth/v1/logout") -> {if(failLogout) throw java.io.IOException("Simulated offline");JSONObject()}
            else -> error("Unexpected request")
        }
    }
    @Test fun encryptedStorageRoundTripAndCorruptionRecovery() {
        val target=InstrumentationRegistry.getInstrumentation().targetContext
        val directory=File(target.cacheDir,"auth-test-${UUID.randomUUID()}").apply {mkdirs()}
        val context=object: ContextWrapper(target) {override fun getFilesDir()=directory}
        val storage=EncryptedSessionStorage(context,"https://vault-${UUID.randomUUID()}.invalid")
        try {
            val session=AccountSession(UUID.randomUUID().toString(),"fixture@example.invalid","private-access-token","private-refresh-token",123_456)
            storage.write(session)
            val file=directory.listFiles()!!.single()
            val ciphertext=String(file.readBytes(),Charsets.ISO_8859_1)
            assertFalse(ciphertext.contains(session.accessToken));assertFalse(ciphertext.contains(session.refreshToken));assertFalse(ciphertext.contains(session.email))
            assertEquals(session,storage.read())
            file.writeBytes(byteArrayOf(1,2,3))
            assertNull(storage.read());assertFalse(file.exists())
            storage.write(session);storage.clear();assertNull(storage.read())
            assertFalse(session.toString().contains(session.accessToken))
        } finally {storage.clear();directory.deleteRecursively()}
    }
    @Test fun transientKeystoreFailureKeepsSessionButCorruptionDeletesIt() {
        val target=InstrumentationRegistry.getInstrumentation().targetContext
        val directory=File(target.cacheDir,"auth-test-${UUID.randomUUID()}").apply {mkdirs()}
        val context=object: ContextWrapper(target) {override fun getFilesDir()=directory}
        val key=KeyGenerator.getInstance("AES").apply {init(256)}.generateKey();var failures=0
        val storage=EncryptedSessionStorage(context,"https://vault-${UUID.randomUUID()}.invalid") {
            if(failures>0) {failures--;throw KeyStoreException("Simulated locked keystore")};key
        }
        try {
            val session=AccountSession(UUID.randomUUID().toString(),"fixture@example.invalid","private-access-token","private-refresh-token",123_456)
            storage.write(session);val file=directory.listFiles()!!.single();failures=1
            val service=AccountService(null,storage) {1_000_000}
            assertTrue(runCatching {service.restore()}.exceptionOrNull() is KeyStoreException)
            assertTrue(file.exists());assertNull(service.current)
            assertEquals(session,service.restore())
            val bytes=file.readBytes();bytes[bytes.size-1]=(bytes[bytes.size-1].toInt() xor 1).toByte();file.writeBytes(bytes)
            assertNull(service.restore());assertFalse(file.exists())
        } finally {storage.clear();directory.deleteRecursively()}
    }
    @Test fun syncRuntimeRetriesRestoreInsteadOfSigningOutAfterTransientFailure() {
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        val session=AccountSession(UUID.randomUUID().toString(),"fixture@example.invalid","fixture-access","fixture-refresh",Long.MAX_VALUE)
        var failures=1
        val storage=object: SessionStorage {
            var value: AccountSession?=session
            override fun read(): AccountSession? {if(failures>0) {failures--;throw KeyStoreException("Simulated locked keystore")};return value}
            override fun write(session: AccountSession) {value=session}
            override fun clear() {value=null}
        }
        LearningSyncRuntime.resetForTest {storage}
        try {
            assertNull(LearningSyncRuntime.ensureRestored(context).current)
            assertFalse(LearningSyncRuntime.restored);assertEquals(session,storage.value)
            assertEquals(session,LearningSyncRuntime.ensureRestored(context).current);assertTrue(LearningSyncRuntime.restored)
        } finally {LearningSyncRuntime.resetForTest()}
    }
    @Test fun verifiedSignInRestoresSameOwner() {
        val fixture=Fixture();val storage=MemoryStorage()
        val service=AccountService(fixture,storage) {1_000_000}
        val session=service.signIn("fixture@example.invalid","fixture-password")
        assertEquals(fixture.user,session.userId)
        assertEquals(session,AccountService(fixture,storage) {1_000_000}.restore())
    }
    @Test fun concurrentRefreshRotatesOnlyOnce() {
        val fixture=Fixture();val storage=MemoryStorage().apply {value=AccountSession(fixture.user,"fixture@example.invalid","old","old-refresh",1_000_000)}
        val service=AccountService(fixture,storage) {1_000_000};service.restore()
        val pool=Executors.newFixedThreadPool(4)
        try {
            val futures=(1..4).map {pool.submit<String> {service.accessToken(fixture.user)}}
            futures.forEach {assertEquals("renewed-access",it.get())}
            assertEquals(1,fixture.refreshCount);assertEquals("rotated-refresh",storage.value!!.refreshToken)
        } finally {pool.shutdownNow()}
    }
    @Test fun offlineRefreshPreservesSessionButRejectedRefreshClearsIt() {
        val fixture=Fixture();val storage=MemoryStorage().apply {value=AccountSession(fixture.user,"fixture@example.invalid","old","old-refresh",1_000_000)}
        val service=AccountService(fixture,storage) {1_000_000};service.restore();fixture.failRefresh=true
        assertTrue(runCatching {service.accessToken(fixture.user)}.isFailure);assertNotNull(storage.value)
        fixture.failRefresh=false;fixture.rejectRefresh=true
        assertTrue(runCatching {service.accessToken(fixture.user)}.isFailure);assertNull(storage.value);assertNull(service.current)
    }
    @Test fun refreshCannotChangeAccountIdentity() {
        val fixture=Fixture();val storage=MemoryStorage().apply {value=AccountSession(fixture.user,"fixture@example.invalid","old","old-refresh",1_000_000)}
        val service=AccountService(fixture,storage) {1_000_000};service.restore();fixture.actualUser=UUID.randomUUID().toString()
        assertTrue(runCatching {service.accessToken(fixture.user)}.isFailure);assertNull(storage.value)
    }
    @Test fun offlineSignOutClearsLocalSession() {
        val fixture=Fixture();val storage=MemoryStorage();val service=AccountService(fixture,storage) {1_000_000}
        service.signIn("fixture@example.invalid","fixture-password");fixture.failLogout=true
        assertFalse(service.signOut());assertNull(storage.value);assertNull(service.current)
    }
    @Test fun googleExchangeSendsRawNonceAndPersistsVerifiedSession() {
        val fixture=Fixture();val storage=MemoryStorage();val service=AccountService(fixture,storage) {1_000_000}
        val identity=GoogleIdentity("fixture-id-token",GoogleSignIn.nonce())
        val session=service.signInGoogle(identity)
        assertEquals("google",fixture.googleBody!!.getString("provider"))
        assertEquals(identity.nonce,fixture.googleBody!!.getString("nonce"))
        assertEquals(identity.idToken,fixture.googleBody!!.getString("id_token"))
        assertEquals(fixture.user,session.userId);assertEquals(session,storage.value)
        assertEquals("GoogleIdentity(redacted)",identity.toString())
    }
    @Test fun rejectedGoogleExchangePreservesPreviousAccount() {
        val fixture=Fixture();val storage=MemoryStorage();val service=AccountService(fixture,storage) {1_000_000}
        val previous=service.signIn("fixture@example.invalid","fixture-password")
        fixture.rejectGoogle=true
        assertTrue(runCatching {service.signInGoogle(GoogleIdentity("fixture-id-token",GoogleSignIn.nonce()))}.isFailure)
        assertEquals(previous,storage.value);assertEquals(previous,service.current)
    }
    @Test fun googleNonceIsFreshAndHasCorrectSha256() {
        val values=(1..100).map {GoogleSignIn.nonce()}
        assertEquals(100,values.toSet().size);assertTrue(values.all {it.matches(Regex("[A-Za-z0-9_-]{43}"))})
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",GoogleSignIn.hashedNonce("abc"))
    }
}
