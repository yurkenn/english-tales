# Çökme raporlama — Firebase Crashlytics

15 Ekim 2026 · Kalite yol haritası Q2.1.

## Karar

Firebase Crashlytics seçildi:

- Ücretsiz ve yönetilen; çökme ve ANR raporları, R8 gizlemesinin otomatik çözülmesi ve e-posta uyarıları.
- Google Play hizmetleri uygulamada zaten var (Google girişi, reklam); reklam kimliği gerektirmez.
- Yalnız Play vitals bu kurulum sayısında veri üretmiyor. Sentry ayrı hesap, Supabase üzerinde kendi çözümümüz ~2–3 gün ek iş ve bakım gerektirirdi.

Firebase Analytics eklenmedi; ürün olayları (Q2.2) ayrı karardır.

## Davranış

- Raporlar yalnız `google-services.json` ile derlenen **release** paketlerinden gider (`firebase_crashlytics_collection_enabled` manifest yer tutucusu). Debug/test derlemeleri hiçbir zaman göndermez; `CrashReportingConfigTest` bunu doğrular.
- `firebase_analytics_collection_deactivated=true`.
- Release derlemesi `app/google-services.json` yoksa durur; mağaza paketleri çökme raporsuz çıkmaz. CI ve fork'lar dosya olmadan debug derlemeye devam eder.
- Yeni izin yok. İşlenen veri: hata izi, uygulama sürümü, cihaz modeli, Android sürümü, rastgele Firebase kurulum kimliği, oturum zamanları. E-posta, hikâye metni ve öğrenme geçmişi eklenmez.

## Kurulum

Firebase projesi `english-tales-77d32`; Android uygulaması `com.yurken.englishtales` zaten kayıtlı (App ID `1:28104909219:android:d260e093436283f95a7a16`), Crashlytics etkin.

`google-services.json` Git'e girmez (`.gitignore`): içindeki Android API anahtarı şu an uygulama kısıtlamasız ve PR'larda GitGuardian taraması var. Release derleyen makinede bir kez:

```bash
firebase apps:sdkconfig ANDROID 1:28104909219:android:d260e093436283f95a7a16 --project english-tales-77d32 -o native-android/app/google-services.json
```

Release derlemesi mapping dosyasını Crashlytics'e yükler (`uploadCrashlyticsMappingFileRelease`); hata izleri panelde çözülmüş görünür.

**Önerilen güvenlik adımı:** Google Cloud → Credentials → “Android key (auto created by Firebase)” anahtarını `com.yurken.englishtales` paketi ve Play imza SHA-1'leriyle sınırla.

## Yayın öncesi yapılacaklar

- Canlı gizlilik sayfasını güncelle (`web/privacy.html` bu dalda güncellendi; hosting dağıtımı ayrı adım).
- Play veri güvenliği formu: “Crash logs” ve “Diagnostics” toplanır, paylaşılmaz, isteğe bağlı değildir; amaç “App functionality”/“Analytics”. “Device or other IDs” (Firebase kurulum kimliği).
