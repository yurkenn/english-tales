# İlk kullanım CI araştırması — 20 Ekim 2026

Ana dal `01defbe` için [39386537157](https://github.com/yurkenn/english-tales/actions/runs/39386537157) ilk denemede dil seçiminin `language_continue` düğmesini beklerken 20 saniyede zaman aşımına uğradı. Derleme/backend/repository işleri geçmişti. Aynı ana dalın ikinci denemesi ve ilk tanılama PR koşusu daha sonra geçti: her birinde 339 testin 336'sı başarılı, 3 yapılandırmaya bağlı atlama, 0 hata; başlangıç ölçümleri 3/3. İlk zaman aşımının nedeni yine kanıtlanmış değildir.

## Tekrarlama ve sınırlar

Ayrı `English_Tales_CI_36` (API 36) emülatöründe ilk kullanım testi tek başına 1/1; CI'da önünde çalışan AppLocalizationTest ve CrashReportingConfigTest ile birlikte 6/6 geçti. Test değişikliğinden sonra aynı sıra yeniden 6/6 geçti. Hiçbir test atlanmadı. Test ilk dil seçimi, misafir onboarding, önerilen hikâye, kelime kaydı, Activity yeniden oluşturma ve ilk tekrarı doğrulamayı sürdürüyor.

339 testlik geniş yerel deneme, ilk kullanım testi geçtikten sonra 39. testte instrumentation sürecinin kapanmasıyla durdu. AccountSwitchTest.stoppedAppCancelsTheForegroundSyncTimerAndStartingSyncsAgain başarısız olarak raporlandı; uygulama istisnasına dayalı kök neden saptanmadı. Aynı aralıkta başka sistem süreçleri de kapandı. Bu koşul bütün cihaz paketine başarı kabulü vermez ve yalnız logdan altyapı hatası ilan edilmez.

İlk açık emülatör Android 17 idi. Espresso'nun InputManager.getInstance çağrısına ilişkin uyumsuzluk test başlamadan hata verdi; Android 16 için ayrı emülatöre geçildi. Bu Android 17 sonucu uygulamanın ilk kullanım hatası gibi raporlanmaz.

## Eklenen dar değişiklik

FirstLaunchJourneyTest zaman aşımında artık beklediği eşleşmeyi, içerik yüklenme durumunu, dil onayını, onboarding bayrağını ve Compose ekran ağacını hata raporuna ekler. Temiz kurulum hazırlığının dil kapısını gerçekten sıfırladığı da başlangıçta doğrulanır. **20 saniyelik süre ve kullanıcı yolculuğunun tüm kontrolleri korunur.** Üretim uygulaması veya servis davranışı değişmez.

Bu bir kök neden düzeltmesi iddiası değildir. Orijinal zaman aşımı yerelde tekrarlanmadı. Yeni hata kaydı, aynı sorun tekrar olursa hangi ekranda ve başlangıç durumunda kalındığını göstermeyi amaçlar. İlk kullanımın CI kapısı tekrar koşuda geçti; orijinal zaman aşımının nedeni açık araştırma olarak kalır.

[Makine okunabilir sonuç](release-evidence/2026-10-20-first-launch-investigation.json).

## Ayrı bulgu: kayıt hatası testi ve IO devamları

Sözlük dalının aynı `050db6b` sürümünde push CI [39398362194](https://github.com/yurkenn/english-tales/actions/runs/39398362194) tüm cihaz testlerini geçti. PR CI [39398368677](https://github.com/yurkenn/english-tales/actions/runs/39398368677) ise `LearningWriteUiTest` sırasında 280/339 testte durdu. `FirstLaunchJourneyTest` geçmişti. Bu ayrı hata sözlük verisinin sebep olduğu kanıtlanmış bir hata gibi yorumlanmaz.

Çökme `SnapshotStateObserver` üzerinde önce thread 157, sonra main thread erişimini bildiriyor. Thread dökümünde IO çalışanındaki `LearningWriteRecovery.publish` → `StateFlow` → testin `FrameDeferringContinuationInterceptor` / `ApplyingContinuationInterceptor` zinciri görülüyor. Compose 1.8.1 kaynak kodu varsayılan `UnconfinedTestDispatcher` ve test saatindeki ölçüm geçişini doğruluyor. Bu bulgular test zamanlayıcısının IO devamını aynı iş parçacığında çalıştırması hipotezini destekliyor; üretimde aynı çökme gösterilmedi.

Dar düzeltme yalnız `LearningWriteUiTest` içindir: desteklenen `StandardTestDispatcher` test saatine bağlanır. IO kaydının hata üretmesi ile hata çubuğunun çizilmesi ayrı kilometre taşları olduğundan, mevcut 5 saniyelik sınıra uygun olarak görünür düğme beklenir. SQLite hata tetikleyicisi, başarısız yeniden deneme, okuyucu/alıştırma geçişi, başarılı kayıt ve hata çubuğunun kalkması kontrolleri korunur. İlk kullanım tanılamasının 20 saniyelik süresi değişmez.

İlk yerel koşuda yalnız zamanlayıcı değişikliği sonrası görünürlük kontrolü erken kaldı. Görünür düğme beklemesi eklendikten sonra API 36 koşusu 1/1 geçti. Aynı APK ile beş ayrı instrumentation sürecinde test 5/5 geçti; atlama yok. Yeni tam CI sonucu ayrıca kaydedilir; bu ilk geçiş tek başına aralıklı hatanın tamamen ortadan kalktığını kanıtlamaz.

Kaynak: [Compose 1.8.1 test altyapısı kaynak paketi](https://dl.google.com/dl/android/maven2/androidx/compose/ui/ui-test-android/1.8.1/ui-test-android-1.8.1-sources.jar), `ComposeUiTest.android.kt` test dispatcher seçimi ve `onPerformTraversals`.
