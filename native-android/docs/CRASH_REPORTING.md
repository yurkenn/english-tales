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

## Kurulum (bir kez)

1. Firebase konsolunda proje oluştur (Google Analytics kapalı).
2. Android uygulaması ekle: `com.yurken.englishtales`.
3. `google-services.json` dosyasını `native-android/app/` altına koy ve commit et (gizli değildir; anahtar paket adıyla sınırlıdır).
4. Crashlytics sayfasında “Enable”.
5. Release derlemesinden sonra test için cihazda bir çökme üret ve panelde gör.

## Yayın öncesi yapılacaklar

- Canlı gizlilik sayfasını güncelle (`web/privacy.html` bu dalda güncellendi; hosting dağıtımı ayrı adım).
- Play veri güvenliği formu: “Crash logs” ve “Diagnostics” toplanır, paylaşılmaz, isteğe bağlı değildir; amaç “App functionality”/“Analytics”. “Device or other IDs” (Firebase kurulum kimliği).
