import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.devtools.ksp")
    id("androidx.room")
}

val contentSettings = Properties().apply {
    rootProject.file("supabase.properties").takeIf { it.exists() }?.inputStream()?.use { load(it) }
}
fun contentSetting(name: String): String = contentSettings.getProperty(name, "")
    .replace("\\", "\\\\").replace("\"", "\\\"")
val releaseSigning = Properties().apply {
    rootProject.file("signing.properties").takeIf {it.exists()}?.inputStream()?.use {load(it)}
}
val releaseRequested=gradle.startParameter.taskNames.any {it.contains("Release",ignoreCase=true)}
if(releaseRequested) {
    require(listOf("storeFile","storePassword","keyAlias","keyPassword").all {releaseSigning.getProperty(it).orEmpty().isNotBlank()}) {
        "Release signing is missing. Configure the private signing.properties file; debug signing is never used for release."
    }
    require(rootProject.file(releaseSigning.getProperty("storeFile")).isFile) {"Release keystore is missing"}
    require(contentSettings.getProperty("SUPABASE_URL","").startsWith("https://") && contentSettings.getProperty("SUPABASE_PUBLISHABLE_KEY","").startsWith("sb_publishable_") && contentSettings.getProperty("GOOGLE_WEB_CLIENT_ID","").endsWith(".apps.googleusercontent.com")) {
        "Release service settings are missing or invalid"
    }
}

android {
    namespace = "com.yurken.englishtales"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.yurken.englishtales"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        minSdk = 24
        targetSdk = 36
        // Play Console latest uploaded/production code was 46 on 2026-10-11.
        // Recheck before upload if another release is produced in parallel.
        versionCode = 47
        versionName = "2.0.0"
        buildConfigField("String", "SUPABASE_URL", "\"${contentSetting("SUPABASE_URL")}\"")
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"${contentSetting("SUPABASE_PUBLISHABLE_KEY")}\"")
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"${contentSetting("GOOGLE_WEB_CLIENT_ID")}\"")
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
            signingConfig=signingConfigs.findByName("upload")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { compose = true; buildConfig = true }
}

room { schemaDirectory("$projectDir/schemas") }

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2025.05.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    // Current stable path implementation. RELRO verification remains a release gate.
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
    ksp("androidx.room:room-compiler:2.8.5")
    debugImplementation("androidx.compose.ui:ui-tooling")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test:runner:1.6.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
}
