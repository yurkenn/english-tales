# English Tales Android

Android uygulamasının aktif kaynağı Kotlin ve Jetpack Compose'dur. React Native/Expo kaynakları Git geçmişinde korunur; bu klasör Android Studio projesidir. [Native geçiş sınırları](docs/NATIVE_MIGRATION.md) · [Ürün ve UX planı](docs/PRODUCT_ROADMAP.md) · [Güncel teknik harita](docs/DEVELOPMENT_ROADMAP.md).

Ekran görüntülerinden çıkarılan deneyim için [ürün taslağına](PRODUCT_SPEC.md), [ekran referanslarına](UI_REFERENCE.md), [içerik kararına](CONTENT_GUIDE.md) ve yayın öncesi işler için [mimari notlarına](ARCHITECTURE.md) bakın.

## Çalışan akışlar

- Sohbet biçiminde seviye, hikâye türü ve günlük hedef seçimi; ilk hikâyeye doğrudan geçiş
- Hikâye kataloğu, arama, tür filtresi ve okuma ilerlemesi
- Sayfalı okuyucu, cümle çevirisi, kelime kartı ve cihazın metin okuma motoruyla seslendirme
- Üç aşamalı kelime defteri; kart, çeviri, eşleştirme ve kelime oluşturma alıştırmaları
- Kişisel günlük plan, zamanı gelen kelime tekrarları, haftalık etkinlik, puan ve gerçek çalışma serisi
- Okuma sonrası hikâyenin kelimelerine geçiş; başarılar, düzenlenebilir öğrenme ayarları ve isteğe bağlı günlük hatırlatıcı
- Room üzerinden çevrimdışı kayıt; sürüm/cümleyle okuma konumu ve değişmez işlem kuyruğu
- Tamamlanan çalışmalarda tür, soru sayısı ve ön plandaki aktif süre kaydı
- Mevcut hesapla giriş/çıkış, şifreli oturum saklama ve hesap başına ayrı yerel öğrenme verisi
- İlk açılışta misafir/Google/e-posta seçimi; native Google hesap seçicisi ve Supabase ID token bağlantısı
- Hesap ekranından tek seferlik yerel misafir aktarımı; kesinti sonrası devam ve tekrar puan koruması

Altı hikâye ve 39 kelime bu prototip için özgün olarak yazılmış örnek içeriktir. EWA ekranlarındaki metinler veya görseller kullanılmadı.

[İlk açılış ve düzenli öğrenme planı](docs/LEARNING_JOURNEY.md) · [Günlük plan ekranı](docs/preview-daily-plan.png) · [Okuma sonrası akış](docs/preview-reading-result.png)

## Emülatör görüntüleri

| Başlangıç | Kitaplık | Okuyucu |
| --- | --- | --- |
| ![Başlangıç](docs/preview-onboarding.png) | ![Kitaplık](docs/preview-catalog.png) | ![Okuyucu](docs/preview-reader.png) |

Diğer ekranlar: [Katalog](docs/preview-catalog.png) · [Hikâye](docs/preview-detail.png) · [Alıştırmalar](docs/preview-practice.png) · [Profil](docs/preview-profile.png) · [Kelime kutusu](docs/preview-word-popup.png) · [Kelimeler](docs/preview-words.png).

[Güncel kitaplık ve okuyucu](docs/content-update-overview.jpg) · [Referansla yan yana karşılaştırma](docs/reference-comparison.jpg) · [Dört alıştırma ekranı](docs/practice-overview.jpg) · [Kontrol sonuçları](docs/VERIFICATION.md) · [Rehber görselinin üretim kaydı](docs/ASSET_NOTES.md) · [Yeni kapaklar ve üretim istemleri](docs/NEW_COVER_ASSETS.md)

## Derleme

Android Studio'da `native-android` klasörünü açın. JDK 17 ve Android SDK 36 gerekir. Komut satırında:

```powershell
.\gradlew.bat :app:assembleDebug :app:testDebugUnitTest :app:lintDebug
```

Hata ayıklama APK'sı `app/build/outputs/apk/debug/app-debug.apk` konumunda oluşur. Uygulama kimliği yayınlanmış uygulamayla aynıdır: `com.yurken.englishtales`. Farklı imzalı eski bir geliştirme sürümü aynı cihazdaysa önce o sürüm kaldırılmalıdır; bu işlem yerel verilerini siler.

macOS/Linux: `bash gradlew :app:assembleDebug :app:testDebugUnitTest :app:lintDebug`. Cihaz/emülatör bağlıyken `bash gradlew :app:connectedDebugAndroidTest`.

Kaynakta 23 JVM ve 124 cihaz testi tanımı bulunur. Yapılandırılmış uzak içerik testi gerçek ağdan okuma yapabilir; Auth testleri kontrollü yanıtlar kullanır. Test tanımı sayısı, çalıştırılan/geçen test sayısı değildir. CI cihaz APK'sını derler fakat bağlı cihaz testini çalıştırmaz. Entegrasyon testleri için kişisel verisi olmayan ayrı emülatör kullanın; Gradle uygulama APK'sını kurup kaldırabilir. Gerçek Google/e-posta, ikinci cihaz ve Play güncelleme kabulü ayrıca doğrulanmalıdır.

Test kimliğiyle native reklam ve ikon iyileştirmeleri: [uygulama ve yayın kapıları](docs/ADS_AND_ICON_UX_EXECUTION.md). Ağ gerektiren Google test reklamı ayrı çalıştırılır: `bash gradlew connectedDebugAndroidTest -PadDeviceTest=true -Pandroid.testInstrumentationRunnerArguments.class=com.yurken.englishtales.ads.GoogleTestAdProbe`. Üretim reklamları `config/ads.properties` içinde kapalıdır.

Ana ekran odağı ve cihazda korunan okuma görünümü: [UX uygulama kaydı](docs/READING_HOME_UX_EXECUTION.md).

## Mimari ve sonraki işler

Aktif hesaba uygun hatırlatıcı ve kalıcı kayıt hatası/yeniden deneme: [D03/D04 uygulama kaydı](docs/LEARNING_RELIABILITY_EXECUTION.md).

Google/Play/imza ve önceki emülatör sonuçlarını anlatan aşağıdaki kayıtlar tarihsel kanıttır. Bu Mac'te release imzası hazır değildir. Güncel görevler [geliştirme haritasında](docs/DEVELOPMENT_ROADMAP.md), yeni özellikler [ürün planındadır](docs/PRODUCT_ROADMAP.md).

Mağaza yayını için öncelikler, aşamalar ve tamamlanma ölçütleri: [Google Play yayın yol haritası](docs/STORE_RELEASE_ROADMAP.md).

- `assets/catalog/v1.json`: Sürümlü, paket içi örnek katalog. `LearningContent.kt` dosyayı açılışta doğrular ve okur. İlk açılış için paket içi içerik korunur. Android yerel build yapılandırmasındaki kataloğa bağlanır; seçilen metin/kelime/kapak indirilir, doğrulanır ve çevrimdışı saklanır. [Bağlantı analizi ve sonuçları](docs/REMOTE_CONTENT_PLAN.md).
- `data/LearningStore.kt` / `LearningDatabase.kt`: Room v6 üzerinden ilerleme, tercihler, oturumlar ve kalıcı işlem kuyruğu. Eski native veriler korunur. Misafir ve her hesap için ayrı veritabanı açılır.
- `data/GuestTransfer.kt`: Açıkça seçilen hesaba yerel misafir aktarımı; kalıcı günlük ve makbuzla kesinti/tekrar koruması. Eski ölçülmemiş toplamlar ayrıca saklanır. Öğrenme eşitlemesi foreground ve WorkManager üzerinden uygulanmıştır; iki gerçek cihazdaki kabul ayrı doğrulama işidir. [Analiz ve doğrulama](docs/GUEST_TRANSFER_PLAN.md).
- `data/AccountSession.kt`: Mevcut hesapla giriş, sunucudan kullanıcı doğrulama, Keystore AES-GCM ile kalıcı oturum, token yenileme ve çıkış. Hesap değişince ekranlar yeniden kurulur; eski ekran eylemleri yeni hesaba uygulanmaz. [Analiz ve kalan aşamalar](docs/ACCOUNT_SYNC_PLAN.md) · [Giriş ekranı](docs/preview-account-login.png).
- `data/GoogleIdentity.kt` / `ui/WelcomeScreen.kt`: Hesap açmadan yerel misafir kullanımı; Credential Manager ile Google girişi. Test projesinde Google sağlayıcı ve debug Android imzası kayıtlı. Gerçek Google girişi, sunucudan oturum doğrulama ve kapatıp açınca aynı hesap/profilin korunması doğrulandı. `supabase.properties.example` içindeki genel ayarları yerel `supabase.properties` dosyasına yazın. Google secret Android'e girmez. [Karar ve doğrulama](docs/GUEST_GOOGLE_PLAN.md) · [Yeni başlangıç](docs/preview-welcome-guest-google.png).
- `backend/`: Supabase Database/Storage/Auth veri modeli ve işlem uçları. Paket içi katalog altı hikâye içerir. Production genel yapılandırması `config/production.properties` içindedir; özel yerel ayarlar Git dışıdır. Backend test paketi 33 SQL + 8 panel istemci + 9 hesap silme testi içerir. İçerik, hesap, misafir aktarımı, öğrenme eşitlemesi ve hesap yaşam döngüsü kaynakta uygulanmıştır; gerçek hizmet kabulü teknik haritada ayrı kapıdır. [Kurulum ve aşama durumu](backend/README.md) · [Eşitleme sözleşmesi](backend/SYNC_CONTRACT.md).
- `backend/admin/`: Hikâye, çeviri, kelime, kapak/ses, telefon önizlemesi ve yayın/arşiv paneli. `backend` içinde `npm run admin` ile açılır. [Panel kullanımı](backend/admin/README.md) · [Aşama analizi](docs/CONTENT_ADMIN_PLAN.md).
- `ui/`: Compose ekranları. Mevcut emülatörde akış çalışıyor; farklı boyutlarda ve gerçek cihazda erişilebilirlik, ses ve performans denemeleri yapılmalı.
- Yayın öncesinde içerik hacmi, çizimler/kapaklar, ses kalitesi, tekrar algoritması, gizlilik metni ve mağaza materyalleri tamamlanmalı.

Play Console'da en yüksek kod 46 doğrulandı; native aday 47 / 2.0.0. Mevcut EAS yükleme anahtarı Play sertifikasıyla eşleşti ve özel yerel ayarlarla release imzası kuruldu. `signing.properties.example` yalnızca ayar biçimini gösterir; gerçek dosya ve anahtar Git'e girmez. İmzalı AAB/APK derlendi; `tooling/verify_release.py` imza ve 16 KB paket/kütüphane kontrolünü yapar. Statik kontroller ve 16 KB x86_64 emülatöründe doğrudan native yükleme testi geçti. [16 KB analiz ve kanıt](docs/PAGE_SIZE_VERIFICATION.md). **Diğer yayın kapıları açık; bu teknik aday henüz yayınlanamaz.** [Güncel kapılar ve sonuçlar](docs/RELEASE_EXECUTION.md) · [Play kontrolü](docs/PLAY_CONSOLE_AUDIT.md). Eski React Native verisi için taşıma kodu eklenmedi; native SQLite/Room 1–5 → Room 6 geçişi mevcut native ilerlemeyi korur. Mevcut paket kimliği korundu.

[Çevrimdışı veri geçişi ve kontrol sonuçları](docs/OFFLINE_DATA_PLAN.md) · [Kapatıp açınca devam eden okuyucu](docs/preview-reader-resume.png)
