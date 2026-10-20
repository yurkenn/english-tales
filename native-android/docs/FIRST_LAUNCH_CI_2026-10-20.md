# İlk kullanım CI araştırması — 20 Ekim 2026

Ana dal `01defbe` için [39386537157](https://github.com/yurkenn/english-tales/actions/runs/39386537157) ilk denemede dil seçiminin `language_continue` düğmesini beklerken 20 saniyede zaman aşımına uğradı. Derleme/backend/repository işleri geçmişti. Bu kaydın hazırlandığı anda aynı ana dal cihaz işinin ikinci denemesi çalışıyor.

## Tekrarlama ve sınırlar

Ayrı `English_Tales_CI_36` (API 36) emülatöründe ilk kullanım testi tek başına 1/1; CI'da önünde çalışan AppLocalizationTest ve CrashReportingConfigTest ile birlikte 6/6 geçti. Test değişikliğinden sonra aynı sıra yeniden 6/6 geçti. Hiçbir test atlanmadı. Test ilk dil seçimi, misafir onboarding, önerilen hikâye, kelime kaydı, Activity yeniden oluşturma ve ilk tekrarı doğrulamayı sürdürüyor.

339 testlik geniş yerel deneme, ilk kullanım testi geçtikten sonra 39. testte instrumentation sürecinin kapanmasıyla durdu. AccountSwitchTest.stoppedAppCancelsTheForegroundSyncTimerAndStartingSyncsAgain başarısız olarak raporlandı; uygulama istisnasına dayalı kök neden saptanmadı. Aynı aralıkta başka sistem süreçleri de kapandı. Bu koşul bütün cihaz paketine başarı kabulü vermez ve yalnız logdan altyapı hatası ilan edilmez.

İlk açık emülatör Android 17 idi. Espresso'nun InputManager.getInstance çağrısına ilişkin uyumsuzluk test başlamadan hata verdi; Android 16 için ayrı emülatöre geçildi. Bu Android 17 sonucu uygulamanın ilk kullanım hatası gibi raporlanmaz.

## Eklenen dar değişiklik

FirstLaunchJourneyTest zaman aşımında artık beklediği eşleşmeyi, içerik yüklenme durumunu, dil onayını, onboarding bayrağını ve Compose ekran ağacını hata raporuna ekler. Temiz kurulum hazırlığının dil kapısını gerçekten sıfırladığı da başlangıçta doğrulanır. **20 saniyelik süre ve kullanıcı yolculuğunun tüm kontrolleri korunur.** Üretim uygulaması veya servis davranışı değişmez.

Bu bir kök neden düzeltmesi iddiası değildir. Orijinal zaman aşımı yerelde tekrarlanmadı. Yeni hata kaydı, aynı sorun tekrar olursa hangi ekranda ve başlangıç durumunda kalındığını göstermeyi amaçlar. R00 açık kalır; CI sonucu ve gerekirse yeni ayrıntılı hata ile sonraki karar verilir.

[Makine okunabilir sonuç](release-evidence/2026-10-20-first-launch-investigation.json).
