import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.devtools.ksp")
    id("androidx.room")
}

// Crashlytics needs the Firebase app config; without it (CI, forks) the SDK stays inactive.
val firebaseConfigured=file("google-services.json").isFile
if(firebaseConfigured) {
    apply(plugin="com.google.gms.google-services")
    apply(plugin="com.google.firebase.crashlytics")
}

val contentSettings = Properties().apply {
    rootProject.file("supabase.properties").takeIf { it.exists() }?.inputStream()?.use { load(it) }
}
fun contentSetting(name: String): String = contentSettings.getProperty(name, "")
    .replace("\\", "\\\\").replace("\"", "\\\"")
val productionSettings = Properties().apply {
    rootProject.file("config/production.properties").inputStream().use { load(it) }
}
fun productionSetting(name: String): String = productionSettings.getProperty(name, "")
    .replace("\\", "\\\\").replace("\"", "\\\"")
val releaseSigning = Properties().apply {
    rootProject.file("signing.properties").takeIf {it.exists()}?.inputStream()?.use {load(it)}
}
val releaseRequested=gradle.startParameter.taskNames.any {it.contains("Release",ignoreCase=true)}
val releaseDeviceProbe=providers.gradleProperty("releaseDeviceTest").orNull == "true"
val adDeviceProbe=providers.gradleProperty("adDeviceTest").orNull=="true"
val adsSettings=Properties().apply {rootProject.file("config/ads.properties").inputStream().use {load(it)}}
val adsEnabled=adsSettings.getProperty("ENABLED","false")=="true"
val adsAppId=adsSettings.getProperty("APP_ID","")
val adsUnitId=adsSettings.getProperty("INTERSTITIAL_UNIT_ID","")
if(adsEnabled) {
    require(adsAppId.matches(Regex("ca-app-pub-[0-9]{16}~[0-9]{10}"))) {"AdMob App ID is invalid"}
    require(adsUnitId.matches(Regex("ca-app-pub-6012481599277383/[0-9]{10}")) && adsUnitId!="ca-app-pub-6012481599277383/6069329647") {"Configure a verified interstitial unit, not the old rewarded unit"}
    require(adsSettings.getProperty("PUBLICATION_READY")=="true") {"Verify AdMob consent, publisher site and Play privacy declarations before enabling production ads"}
}
if(releaseRequested) {
    require(listOf("storeFile","storePassword","keyAlias","keyPassword").all {releaseSigning.getProperty(it).orEmpty().isNotBlank()}) {
        "Release signing is missing. Configure the private signing.properties file; debug signing is never used for release."
    }
    require(rootProject.file(releaseSigning.getProperty("storeFile")).isFile) {"Release keystore is missing"}
    require(firebaseConfigured) {"Store builds report crashes: add app/google-services.json from the Firebase project"}
    require(productionSettings.getProperty("SUPABASE_URL","") == "https://gtuangjukckpuerczfxd.supabase.co" && productionSettings.getProperty("SUPABASE_PUBLISHABLE_KEY","").startsWith("sb_publishable_") && productionSettings.getProperty("GOOGLE_WEB_CLIENT_ID","").endsWith(".apps.googleusercontent.com")) {
        "Release must use the verified production service settings"
    }
}

android {
    testBuildType = if (releaseDeviceProbe) "release" else "debug"
    if (releaseDeviceProbe) sourceSets.getByName("androidTest").java.setSrcDirs(listOf("src/releaseProbe/java"))
    if(adDeviceProbe) sourceSets.getByName("androidTest").java.srcDir("src/adProbe/java")
    namespace = "com.yurken.englishtales"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.yurken.englishtales"
        testInstrumentationRunner = if (releaseDeviceProbe)
            "com.yurken.englishtales.data.NativeAlignmentInstrumentation"
        else "androidx.test.runner.AndroidJUnitRunner"
        minSdk = 24
        targetSdk = 36
        // Play Console: production 46, internal preview 47 verified on 2026-10-14.
        // Recheck before upload if another release is produced in parallel.
        versionCode = 48
        versionName = "2.0.0"
        buildConfigField("String", "SUPABASE_URL", "\"${contentSetting("SUPABASE_URL")}\"")
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"${contentSetting("SUPABASE_PUBLISHABLE_KEY")}\"")
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"${contentSetting("GOOGLE_WEB_CLIENT_ID")}\"")
        buildConfigField("boolean","ADS_ENABLED","true")
        buildConfigField("String","ADMOB_APP_ID","\"ca-app-pub-3940256099942544~3347511713\"")
        buildConfigField("String","ADMOB_INTERSTITIAL_ID","\"ca-app-pub-3940256099942544/1033173712\"")
        manifestPlaceholders["admobAppId"]="ca-app-pub-3940256099942544~3347511713"
        // Debug and test builds never send crash reports.
        manifestPlaceholders["crashReportsEnabled"]="false"
    }

    signingConfigs {
        if(releaseSigning.getProperty("storeFile")!=null) create("upload") {
            storeFile=rootProject.file(releaseSigning.getProperty("storeFile"))
            storePassword=releaseSigning.getProperty("storePassword")
            keyAlias=releaseSigning.getProperty("keyAlias")
            keyPassword=releaseSigning.getProperty("keyPassword")
        }
    }
    buildTypes {
        release {
            buildConfigField("boolean","ADS_ENABLED",adsEnabled.toString())
            buildConfigField("String","ADMOB_APP_ID","\"$adsAppId\"")
            buildConfigField("String","ADMOB_INTERSTITIAL_ID","\"$adsUnitId\"")
            manifestPlaceholders["admobAppId"]=adsAppId
            manifestPlaceholders["crashReportsEnabled"]=firebaseConfigured.toString()
            // A local debug/test configuration must never leak into a store package.
            buildConfigField("String", "SUPABASE_URL", "\"${productionSetting("SUPABASE_URL")}\"")
            buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"${productionSetting("SUPABASE_PUBLISHABLE_KEY")}\"")
            buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"${productionSetting("GOOGLE_WEB_CLIENT_ID")}\"")
            signingConfig=signingConfigs.findByName("upload")
            isMinifyEnabled = true
            isShrinkResources = true
            // Bundles symbol tables for unstripped native code. The only current .so
            // (AndroidX graphics-path) ships stripped, so Play's missing-symbols warning remains.
            ndk { debugSymbolLevel = "SYMBOL_TABLE" }
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        // java.time parsing must also work on the supported Android 7 devices.
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { compose = true; buildConfig = true }
}

room { schemaDirectory("$projectDir/schemas") }

dependencies {
    implementation("com.google.android.libraries.ads.mobile.sdk:ads-mobile-sdk:1.5.0")
    implementation("com.google.android.ump:user-messaging-platform:4.0.0")
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
    implementation(platform("com.google.firebase:firebase-bom:33.5.1"))
    implementation("com.google.firebase:firebase-crashlytics")
    val composeBom = platform("androidx.compose:compose-bom:2025.05.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    // Stable implementation; native ELF alignment is checked before publication.
    implementation("androidx.graphics:graphics-path:1.1.0")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.activity:activity-compose:1.10.1")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.9.0")
    implementation("androidx.navigation:navigation-compose:2.9.0")
    implementation("androidx.credentials:credentials:1.6.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.6.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
    implementation("androidx.room:room-runtime:2.8.5")
    implementation("androidx.work:work-runtime:2.10.1")
    ksp("androidx.room:room-compiler:2.8.5")
    debugImplementation("androidx.compose.ui:ui-tooling")
    testImplementation("junit:junit:4.13.2")
    if (!releaseDeviceProbe) {
        androidTestImplementation("androidx.test:runner:1.6.2")
        androidTestImplementation("androidx.test.ext:junit:1.2.1")
        androidTestImplementation("androidx.work:work-testing:2.10.1")
        androidTestImplementation(composeBom)
        androidTestImplementation("androidx.compose.ui:ui-test-junit4")
        debugImplementation("androidx.compose.ui:ui-test-manifest")
    }
}
