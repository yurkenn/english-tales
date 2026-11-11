import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.devtools.ksp")
    id("androidx.room")
    id("androidx.baselineprofile")
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
val sandboxRequested=gradle.startParameter.taskNames.any {it.contains("Sandbox",ignoreCase=true)}
val sandboxDeviceProbe=providers.gradleProperty("sandboxDeviceTest").orNull == "true"
val releaseDeviceProbe=providers.gradleProperty("releaseDeviceTest").orNull == "true"
val adDeviceProbe=providers.gradleProperty("adDeviceTest").orNull=="true"
// Explicit, anonymous service checks use only the already-public mobile settings.
// Keep the normal fixture suite independent of the live service.
val serviceDeviceProbe=providers.gradleProperty("serviceDeviceTest").orNull=="true"
require(!serviceDeviceProbe || (!releaseDeviceProbe && !adDeviceProbe)) { "Run the service device probe separately" }
if(serviceDeviceProbe) {
    require(productionSettings.getProperty("SUPABASE_URL","").startsWith("https://") &&
        productionSettings.getProperty("SUPABASE_PUBLISHABLE_KEY","").startsWith("sb_publishable_")) {
        "Service device tests require public mobile service settings"
    }
}
fun debugServiceSetting(name: String)=if(serviceDeviceProbe) productionSetting(name) else contentSetting(name)
val adsSettings=Properties().apply {rootProject.file("config/ads.properties").inputStream().use {load(it)}}
val adsEnabled=adsSettings.getProperty("ENABLED","false")=="true"
val adsAppId=adsSettings.getProperty("APP_ID","")
val adsUnitId=adsSettings.getProperty("INTERSTITIAL_UNIT_ID","")
if(adsEnabled) {
    require(adsAppId.matches(Regex("ca-app-pub-[0-9]{16}~[0-9]{10}"))) {"AdMob App ID is invalid"}
    require(adsUnitId.matches(Regex("ca-app-pub-6012481599277383/[0-9]{10}")) && adsUnitId!="ca-app-pub-6012481599277383/6069329647") {"Configure a verified interstitial unit, not the old rewarded unit"}
    require(adsSettings.getProperty("PUBLICATION_READY")=="true") {"Verify AdMob consent, publisher site and Play privacy declarations before enabling production ads"}
}
val monetizationSettings=Properties().apply {rootProject.file("config/monetization.properties").inputStream().use {load(it)}}
val legacyCutoff=monetizationSettings.getProperty("LEGACY_CUTOFF_EPOCH_MILLIS","0").toLong()
val monetizationEnabled=monetizationSettings.getProperty("ENABLED","false")=="true"
val monetizationPreview=providers.gradleProperty("monetizationPreview").orNull=="true"
val revenueCatKey=monetizationSettings.getProperty("REVENUECAT_ANDROID_PUBLIC_KEY","")
val rewardedUnit=monetizationSettings.getProperty("REWARDED_UNIT_ID","")
require(revenueCatKey.isEmpty() || revenueCatKey.matches(Regex("(goog|test)_[A-Za-z0-9]+"))) {"Only a RevenueCat public Android SDK key is allowed"}
if(monetizationEnabled) {
    require(revenueCatKey.startsWith("goog_") && rewardedUnit.matches(Regex("ca-app-pub-[0-9]{16}/[0-9]{10}"))) {"Configure RevenueCat Android and a rewarded ad unit"}
    require(legacyCutoff>0) {"Set the legacy progress cutoff before activation"}
    require(adsEnabled && monetizationSettings.getProperty("PUBLICATION_READY")=="true") {"Monetization needs verified consent, SSV, Play products and sandbox acceptance"}
}
if(releaseRequested || sandboxRequested) {
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
    require(!sandboxDeviceProbe || !releaseDeviceProbe) {"Run sandbox and release probes separately"}
    testBuildType = if(sandboxDeviceProbe) "sandbox" else if (releaseDeviceProbe) "release" else "debug"
    if (releaseDeviceProbe) sourceSets.getByName("androidTest").java.setSrcDirs(listOf("src/releaseProbe/java"))
    if (serviceDeviceProbe) sourceSets.getByName("androidTest").java.setSrcDirs(listOf("src/serviceProbe/java"))
    if(adDeviceProbe) sourceSets.getByName("androidTest").java.srcDir("src/adProbe/java")
    namespace = "com.yurken.englishtales"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.yurken.englishtales"
        testInstrumentationRunner = if (releaseDeviceProbe)
            "com.yurken.englishtales.data.NativeAlignmentInstrumentation"
        else if (serviceDeviceProbe) "androidx.test.runner.AndroidJUnitRunner"
        else "com.yurken.englishtales.TalesTestRunner"
        minSdk = 24
        targetSdk = 36
        // Play Console checked 2026-10-19: production 48, internal 49.
        // Recheck before upload if another release is produced in parallel.
        // The release workflow passes -PreleaseVersionCode/-PreleaseVersionName.
        versionCode = providers.gradleProperty("releaseVersionCode").orNull?.toInt() ?: 52
        versionName = providers.gradleProperty("releaseVersionName").orNull ?: "2.3.1"
        buildConfigField("String", "SUPABASE_URL", "\"${debugServiceSetting("SUPABASE_URL")}\"")
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"${debugServiceSetting("SUPABASE_PUBLISHABLE_KEY")}\"")
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"${contentSetting("GOOGLE_WEB_CLIENT_ID")}\"")
        buildConfigField("long","MONETIZATION_LEGACY_CUTOFF_MS","${legacyCutoff}L")
        buildConfigField("boolean","MONETIZATION_ENABLED",monetizationPreview.toString())
        buildConfigField("boolean","MONETIZATION_SANDBOX","false")
        buildConfigField("String","REVENUECAT_PUBLIC_KEY","\"${if(monetizationPreview) revenueCatKey else ""}\"")
        buildConfigField("String","ADMOB_REWARDED_ID","\"ca-app-pub-3940256099942544/5224354917\"")
        buildConfigField("boolean","ADS_ENABLED","true")
        buildConfigField("String","ADMOB_APP_ID","\"ca-app-pub-3940256099942544~3347511713\"")
        buildConfigField("String","ADMOB_INTERSTITIAL_ID","\"ca-app-pub-3940256099942544/1033173712\"")
        manifestPlaceholders["admobAppId"]="ca-app-pub-3940256099942544~3347511713"
        // Debug and test builds never send crash reports.
        manifestPlaceholders["crashReportsEnabled"]="false"
        manifestPlaceholders["analyticsDeactivated"]="true"
        buildConfigField("boolean","PRODUCT_ANALYTICS_AVAILABLE","false")
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
            buildConfigField("boolean","MONETIZATION_ENABLED",monetizationEnabled.toString())
            buildConfigField("String","REVENUECAT_PUBLIC_KEY","\"$revenueCatKey\"")
            buildConfigField("String","ADMOB_REWARDED_ID","\"$rewardedUnit\"")
            buildConfigField("boolean","ADS_ENABLED",adsEnabled.toString())
            buildConfigField("String","ADMOB_APP_ID","\"$adsAppId\"")
            buildConfigField("String","ADMOB_INTERSTITIAL_ID","\"$adsUnitId\"")
            manifestPlaceholders["admobAppId"]=adsAppId
            manifestPlaceholders["crashReportsEnabled"]=firebaseConfigured.toString()
            manifestPlaceholders["analyticsDeactivated"]=(!firebaseConfigured).toString()
            buildConfigField("boolean","PRODUCT_ANALYTICS_AVAILABLE",firebaseConfigured.toString())
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

    // Explicit signed internal QA variant. Production release guards remain unchanged.
    buildTypes.create("sandbox") {
        initWith(buildTypes.getByName("release"))
        matchingFallbacks += listOf("release")
        isMinifyEnabled = false
        isShrinkResources = false
        isDebuggable = false
        versionNameSuffix = "-sandbox"
        buildConfigField("boolean", "MONETIZATION_ENABLED", "true")
        buildConfigField("boolean", "MONETIZATION_SANDBOX", "true")
        buildConfigField("long", "MONETIZATION_LEGACY_CUTOFF_MS", "0L")
        buildConfigField("String", "SUPABASE_URL", "\"https://jukyylozahikjhtokayw.supabase.co\"")
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"sb_publishable_adEuVGN_gzyL78UpD76DyQ_Tw2e7snm\"")
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"${productionSetting("GOOGLE_WEB_CLIENT_ID")}\"")
        buildConfigField("String", "ADMOB_REWARDED_ID", "\"ca-app-pub-3940256099942544/5224354917\"")
        buildConfigField("String", "ADMOB_INTERSTITIAL_ID", "\"ca-app-pub-3940256099942544/1033173712\"")
        buildConfigField("String", "ADMOB_APP_ID", "\"ca-app-pub-3940256099942544~3347511713\"")
        buildConfigField("boolean", "ADS_ENABLED", "true")
        buildConfigField("boolean", "PRODUCT_ANALYTICS_AVAILABLE", "false")
        manifestPlaceholders["admobAppId"] = "ca-app-pub-3940256099942544~3347511713"
        manifestPlaceholders["crashReportsEnabled"] = "false"
        manifestPlaceholders["analyticsDeactivated"] = "true"
    }

    buildTypes.create("performance") {
        initWith(buildTypes.getByName("release"))
        applicationIdSuffix = ".benchmark"
        versionNameSuffix = "-benchmark"
        signingConfig = signingConfigs.getByName("debug")
        matchingFallbacks += listOf("release")
        isDebuggable = false
        // Release optimization, isolated data, no production content traffic or telemetry.
        buildConfigField("boolean", "MONETIZATION_ENABLED", "false")
        buildConfigField("String", "REVENUECAT_PUBLIC_KEY", "\"\"")
        buildConfigField("boolean", "ADS_ENABLED", "false")
        buildConfigField("boolean", "PRODUCT_ANALYTICS_AVAILABLE", "false")
        listOf("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "GOOGLE_WEB_CLIENT_ID").forEach {
            buildConfigField("String", it, "\"\"")
        }
        manifestPlaceholders["crashReportsEnabled"] = "false"
        manifestPlaceholders["analyticsDeactivated"] = "true"
        manifestPlaceholders["admobAppId"] = "ca-app-pub-3940256099942544~3347511713"
    }

    compileOptions {
        // java.time parsing must also work on the supported Android 7 devices.
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { compose = true; buildConfig = true }
    // Lists the res/values-* languages in the system per-app language picker (Android 13+).
    androidResources { generateLocaleConfig = true }
    // Every language remains available offline when selected inside a Play-installed app.
    bundle { language { enableSplit = false } }
    // New strings can land in Turkish first; translations follow per language without breaking the build.
    lint { warning += "MissingTranslation" }
}

// Normal builds never require a device; generated profiles are reviewed separately.
baselineProfile {
    automaticGenerationDuringBuild = false
    mergeIntoMain = true
}
tasks.matching { it.name.contains("Performance", ignoreCase = true) &&
    (it.name.endsWith("GoogleServices") || it.name.startsWith("uploadCrashlytics")) }
    .configureEach { enabled = false }

room { schemaDirectory("$projectDir/schemas") }

dependencies {
    add(configurations.maybeCreate("performanceBaselineProfile").name, project(":macrobenchmark"))
    implementation("com.revenuecat.purchases:purchases:10.15.1")
    implementation("androidx.profileinstaller:profileinstaller:1.4.1")
    implementation("com.google.android.libraries.ads.mobile.sdk:ads-mobile-sdk:1.5.0")
    implementation("com.google.android.ump:user-messaging-platform:4.0.0")
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
    implementation(platform("com.google.firebase:firebase-bom:33.5.1"))
    implementation("com.google.firebase:firebase-crashlytics")
    implementation("com.google.firebase:firebase-analytics")
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
    implementation("androidx.glance:glance-appwidget:1.2.0")
    implementation("androidx.glance:glance-material3:1.2.0")
    implementation("com.google.android.play:app-update-ktx:2.1.0")
    implementation("com.google.android.play:review-ktx:2.0.2")
    ksp("androidx.room:room-compiler:2.8.5")
    debugImplementation("androidx.compose.ui:ui-tooling")
    testImplementation("junit:junit:4.13.2")
    if (!releaseDeviceProbe) {
        androidTestImplementation("androidx.test:runner:1.6.2")
        androidTestImplementation("androidx.test.ext:junit:1.2.1")
        androidTestImplementation("androidx.work:work-testing:2.10.1")
        androidTestImplementation("androidx.glance:glance-appwidget-testing:1.2.0")
        androidTestImplementation(composeBom)
        androidTestImplementation("androidx.compose.ui:ui-test-junit4")
        debugImplementation("androidx.compose.ui:ui-test-manifest")
    }
}
