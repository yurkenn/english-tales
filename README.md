# English Tales

Android uygulaması tamamen Kotlin ve Jetpack Compose ile geliştirilir. Aktif kaynak ağacında React Native, Expo veya JavaScript mobil çalışma zamanı bulunmaz.

- [Android kurulumu ve doğrulama](native-android/README.md)
- [Native geçişin kapsamı ve veri sınırları](native-android/docs/NATIVE_MIGRATION.md)
- [Yeni özellikler ve kullanıcı deneyimi planı](native-android/docs/PRODUCT_ROADMAP.md)
- [Aşamalı teknik geliştirme haritası](native-android/docs/DEVELOPMENT_ROADMAP.md)
- [Geliştirme iş listesi](native-android/docs/DEVELOPMENT_BACKLOG.md)
- [Yayın yol haritası](native-android/docs/STORE_RELEASE_ROADMAP.md)
- [İçerik servisi ve panel](native-android/backend/README.md)
- [Geri dönüş ve kontrol noktaları](native-android/docs/RELEASE_EXECUTION.md)

## Proje yapısı

`native-android/` uygulama, içerik varlıkları, panel ve Supabase migration dosyalarını içerir. `tooling/` depo kontrollerini içerir. Eski React Native/Sanity sürümü Git geçmişinde korunur; aktif derlemeye katılmaz.

Yeni sürüm henüz üretime yayımlanmadı. GitHub kontrol noktaları kaynak kodunu geri getirir; kullanıcı verisi veya canlı veritabanı değişikliklerini geri almaz.

## Geliştirme

Android Studio'da `native-android/` klasörünü açın. JDK 17 ve Android SDK 36 ile:

```sh
cd native-android
bash gradlew :app:assembleDebug :app:testDebugUnitTest :app:lintDebug
```

JavaScript yalnızca `native-android/backend/` içindeki içerik paneli ve servis araçlarında kullanılır; APK'nın kullanıcı arayüzü Compose'dur. GitHub Actions native Android ve backend kontrollerini çalıştırır; depo denetimi eski mobil kaynakların yeniden eklenmesini reddeder.
