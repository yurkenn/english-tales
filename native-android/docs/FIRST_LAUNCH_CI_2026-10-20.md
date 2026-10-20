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

## Birleşme ve son doğrulama

#153 (`a70ab0e`) ve #152 (`2e64334`) dört tam CI koşusunda geçti: her birinde 336 başarılı cihaz testi, 3 yapılandırmalı atlama, 0 hata; 3/3 açılış ölçümü. Son sözlük/test kaynağının yerel tam API36 paketi de aynı 336/339 sonucunu verdi. #153 `83d2725`, #152 `b2a8c09` ile ana dala alındı. Birleşik ana dalın CI sonucu ayrıca doğrulanır. [Kesin kaynaklar ve rapor özetleri](release-evidence/2026-10-20-write-ui-scheduler.json).

## Yükleme animasyonu ve IO hazır bildirimi düzeltmesi

#154'ün `9e3ab7e` kaynağında [39463943711](https://github.com/yurkenn/english-tales/actions/runs/39463943711) yeniden zaman aşımına uğradı. Yeni ekran ağacı, dil seçiminden önce `TalesApp` yükleme kapısında kalındığını gösterdi. İçerik hazırdı; eski raporda ViewModel `ready` / hesap sahibi bulunmadığından bu tek kayıt modelin mi yoksa çizimin mi geciktiğini ayırmaz. Logcat'te uygulama istisnası yoktu. CI animatör ölçeği 0 olduğundan aşağıdaki animasyon bulgusu bu eski CI olayının kesin nedeni olarak sunulmaz.

Gecikmiş oturum okumasıyla ayrı bir tekrar testi eklendi: gerçek `MainActivity` açılır; IO oturum okuması tutulurken yükleme ekranı görünür ve model henüz hazır değildir. Okuma serbest bırakılınca modelin hazır olması ve onay verilmeden dil seçiminin görünmesi gerekir. Sistem animatör ölçeği hem 0 hem 1 ile sınanır; ayar `finally` içinde önceki değerine döner. `startupRepetitions` instrumentation argümanı her ölçek için tekrar sayısını belirler (varsayılan 1).

Bu testte animasyon açıkken eski `pulseWhile` hem varsayılan hem `StandardTestDispatcher` ile `ComposeNotIdleException` üretti. Elle yazılmış `while(true)` / `Animatable.animateTo` döngüsü Compose'un sonsuz animasyon politikasına katılmıyordu. Sonsuz geçiş artık `rememberInfiniteTransition` / `infiniteRepeatable` kullanıyor; aynı 1–1.06 ölçeği ve 520 ms yön süresi korunuyor. Sistem hareket azaltma tercihi korunur. Tekrarlı hareket artık Compose'un sonsuz animasyon politikası tarafından yönetilir.

İlk kullanım testinin IO'dan gelen StateFlow bildirimleri `StandardTestDispatcher` ile test saatinde kuyruğa alınır; önceki kayıt hatası testiyle aynı iş parçacığı sınırı korunur. Ekran bekleme ve marka geçişinde bütün istisnaları yutan `runCatching` kaldırıldı: bir eşleşmenin bulunmaması boş koleksiyondur, çizim hatası doğrudan başarısızlık olmalıdır. Zaman aşımı tanılamasına ViewModel hazır durumu, hesap ve snapshot sahibi eklendi. **20 saniyelik kullanıcı yolculuğu sınırı ve mevcut öğrenme/veritabanı kontrolleri korunur.**

Yerel API36 karşılaştırması: eski animasyon + ölçek 1 iki zamanlayıcıda da başarısız; ölçek 0 iki zamanlayıcıda da 20 tekrar geçti. Yeni animasyon + kuyruğa alınan zamanlayıcı, ölçek 1 altında 20 tekrar ve tam ilk kullanım/lokalizasyon/crash-config grubunda 7/7 geçti. Bu karşılaştırma yükleme animasyonundaki somut takılmayı doğrular; geçmiş CI olayının birebir nedenini ispatlamaz. Son birleşik kaynak ve tam CI kabulü PR sonuçlarında ayrıca kaydedilir.

Kaynak: [Compose 1.8.1 kaynak paketi](https://dl.google.com/dl/android/maven2/androidx/compose/ui/ui-test-android/1.8.1/ui-test-android-1.8.1-sources.jar); `ComposeUiTest.android.kt` varsayılan `UnconfinedTestDispatcher` ve sonsuz animasyon politikası.
