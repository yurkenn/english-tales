# English Tales

Android uygulaması Kotlin ve Jetpack Compose ile geliştirilir. Mobil uygulamanın kaynak ve derleme ayarları `native-android/` altındadır.

- [Hesap ve yayın adımlarının güncel durumu](senin-adimlarin.md)
- [Android kurulumu ve doğrulama](native-android/README.md)
- [Son çalışmalar ve güncel yayın durumu](README_SON_DURUM.md)
- [Native geçişin kapsamı ve veri sınırları](native-android/docs/NATIVE_MIGRATION.md)
- [Aktif 90 günlük yol haritası](native-android/docs/ROADMAP_2026_Q4.md)
- [Kalite yol haritası](native-android/docs/QUALITY_ROADMAP.md)
- [2.0 sonrası geliştirme haritası](native-android/docs/NEXT_PHASE_ROADMAP.md)
- [Derin eksik haritası](native-android/docs/GAP_ANALYSIS.md)
- [Yeni özellikler ve kullanıcı deneyimi planı](native-android/docs/PRODUCT_ROADMAP.md)
- [Aşamalı teknik geliştirme haritası](native-android/docs/DEVELOPMENT_ROADMAP.md)
- [Geliştirme iş listesi](native-android/docs/DEVELOPMENT_BACKLOG.md)
- [Yayın yol haritası](native-android/docs/STORE_RELEASE_ROADMAP.md)
- [İçerik servisi ve panel](native-android/backend/README.md)
- [Geri dönüş ve kontrol noktaları](native-android/docs/RELEASE_EXECUTION.md)

## Proje yapısı

`native-android/` uygulama, içerik varlıkları, panel ve Supabase migration dosyalarını içerir. `tooling/` depo kontrollerini içerir.

Güncel mağaza sürümü ve kabul adımları [yayın kaydında](native-android/docs/RELEASE_50_STATUS.md) tutulur. GitHub kontrol noktaları kaynak kodunu geri getirir; kullanıcı verisi veya canlı veritabanı değişikliklerini geri almaz.

## Geliştirme

Android Studio'da `native-android/` klasörünü açın. JDK 17 ve Android SDK 36 ile:

```sh
cd native-android
bash gradlew :app:assembleDebug :app:testDebugUnitTest :app:lintDebug
```

JavaScript yalnızca `native-android/backend/` içindeki içerik paneli ve servis araçlarında kullanılır; APK'nın kullanıcı arayüzü Compose'dur. GitHub Actions native Android ve backend kontrollerini çalıştırır; depo denetimi eski mobil kaynakların yeniden eklenmesini reddeder.
