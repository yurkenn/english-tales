# Claude bağımsız inceleme — 27 Ekim 2026

Kaynak başlangıcı: `e89f038a`. Aşağıdaki metin Claude CLI çıktısıdır; bulgular uygulama ekibi tarafından ayrıca değerlendirildi.

Kararlar:
- Geri yüklemede bekleyen satın alma işaretinin erken silinmesi doğrulandı ve düzeltildi.
- Genel enerji bakiyesi artışının reklam doğrulaması sayılması doğrulandı; yalnız reklam kredisi artışı kullanılır. Süresi biten ticket tek başına doğrulama sayılmaz.
- Kelime olayı önerisindeki gün başına/toplu tek olay yerine, her yeni kalıcı kelime kaydı başına bir olay seçildi. Silip yeniden ekleme yeni kayıttır; mevcut kaydı tekrar kaydetme olay üretmez. Bu anlam PRODUCT_ANALYTICS.md içinde açıkça tanımlandı.
- Rıza kaydı başarısızlığı ve RevenueCat transfer politikası yeni değişikliklerin tamamlanma iddiasına dahil edilmedi; gerçek sağlayıcı/cihaz sınırları korunur.

## Ham inceleme sonucu

İnceleme tamamlandı; dosya düzenlemedim, komut çalıştırmadım. Plan modu açık olduğu halde bu oturumda plan dosyası yazma ya da ExitPlanMode aracı yok, bu yüzden sonuçları doğrudan burada veriyorum.

## 1) Çeviri dili tercihi: kaydetme ve yeniden yükleme

Somut bir hata bulamadım. Zincir doğru çalışıyor:
- `select()` değeri `commit()` ile yazıyor ve sonucu kontrol ediliyor (`TranslationLanguage.kt:23-26`).
- Kayıt başarısızsa yeniden yükleme yapılmıyor (`TranslationLanguageControls.kt:72-79`).
- `recreate()` sonrasında `LearningContent.initialize`, değişen dili görüp kataloğu yeniden ayrıştırıyor (`LearningContent.kt:226`).
- `TalesApp.kt:43,50` arayüzü ve içerik ViewModel'ini `SupportLanguage.code` anahtarıyla ayırıyor. Eski dile ait uzak içerik kurulumu `RemoteContent.kt:186,202` korumasıyla atlanıyor.

Küçük notlar:
- `remember { selection(context) }` ve `effective(context)` SharedPreferences'i kompozisyon sırasında ana iş parçacığından okuyor (`TranslationLanguageControls.kt:31,38`). StrictMode uyarısı riski var ama işlevsel hata değil.
- `translationActivity()` null dönerse (`:78`) etiket yeni dili gösterir ama içerik eski dilde kalır. Bugün tek çağıran yer `LearningJourney.kt:209` ve MainActivity içinde olduğu için pratikte sorun çıkmaz.

## 2) Monetizasyon

- **Hata (orta) – geri yükleme bekleyen satın almayı siliyor.** `MonetizationViewModel.kt:109-111`'de `pending = selected != null` olduğu için geri yükleme, daha önce kaydedilmiş bekleyen satın almayı (örneğin yavaş ödeme) `false` yapıyor. Hemen ardından gelen `syncPremium` ağ hatası verirse `refresh()` artık premium doğrulamasını tekrar denemiyor.
  - **En küçük düzeltme:** geri yüklemede `purchasePending` hiç yazılmasın; yalnızca premium doğrulandıktan sonra `false` yapılsın (zaten `:117`'de yapılıyor).
- **Risk – hesap değişimi ve geri yükleme.** A hesabıyla yapılan Play aboneliği aynı cihazda B hesabıyla geri yüklenirse, RevenueCat'in varsayılan "transfer" davranışı yetkiyi B'ye taşıyabilir ve A premium'u kaybedebilir (`PremiumBilling.kt:55-60`). Kod tarafındaki kimlik sırası doğru (mutex, `logIn`/`logOut`, nesil kontrolü). Karar RevenueCat panelindeki transfer ayarında; gerçek sağlayıcı testi gerekiyor.
- **SSV.** `NativeCompletionAds.kt:141` Supabase kullanıcı UUID'sini AdMob'a `userId` olarak gönderiyor. Sunucu nonce'u zaten kullanıcıya bağlıyor (`begin_ad_reward`); bu yüzden yalnızca nonce göndermek daha gizlilik dostu olur. Bu değişiklik sunucu callback'inde de değişiklik ister. Sunucu kodunu ve imza doğrulamasını incelemedim.
- **Metrik hatası (düşük).** `pollReward` enerji bakiyesi artınca da `REWARD_VERIFY` gönderiyor (`MonetizationViewModel.kt:180`). Günlük enerji yenilenmesi yanlış "doğrulandı" sayılabilir. Yalnızca `adCredits` artışı ya da `pendingAdRewards` azalması baz alınmalı.
- **Rıza riski (düşük olasılık, gizlilik açısından önemli).** Rıza geri çekilirken depolama yazımı başarısız olursa bellek kapalı kalıyor. Ama uygulama yeniden başlayınca `init` eski `enabled=true` değerini okuyup `setEnabled(true)` çağırıyor (`ProductMetrics.kt:60,66-69`). Ayarlar ekranının kayıt hatasını gösterip tekrar denettiği doğrulanmalı.

## 3) WORD_SAVED ve SEVENTH_DAY_RETURN (mevcut açık katılım düzeni içinde)

**`ProductMetrics.kt`:**
- `WORD_SAVED("word_saved")` ve `SEVENTH_DAY_RETURN("seventh_day_return")` olayları eklenir.
- `LearningSignal.WordSaved` (data object) eklenir.
- `MetricsState`'e `seventhDayReported` alanı eklenir.
- `onForeground` içinde, `nextDay` ile aynı mantıkla: `day == first + 7 && !seventhDayReported` ise önce kaydedilir, sonra olay gönderilir. Kesin 7. gün tanımı, mevcut D1 tanımıyla tutarlı.

**`ProductAnalytics.kt:19-25`:**
- `write()` önce `clear()` çağırıyor. Yeni `seventh_day_reported` anahtarı hem `read` hem `write` içine eklenmezse her yazmada bayrak sıfırlanır ve olay tekrar gönderilir.
- `log()` değişmeden kalır; yeni olaylara parametre eklenmez.

**`LearningStore.kt`:**
- Özel `setWordSaved(db, …)` (`:178`) `recordEvent(...)` sonucunu Boolean olarak döndürsün.
- `saveWords`, `toggleWord`, genel `setWordSaved` ve `savePersonalWord` bu sonucu bir değişkende toplasın.
- Diğer sinyallerde olduğu gibi, transaction commit edildikten **sonra** en fazla bir `productSignal(LearningSignal.WordSaved)` gönderilsin.
- Tekilleştirme mevcut `save:$id:$day` anahtarıyla kelime ve yerel gün başına olur; aynı gün aç-kapa yapmak ikinci olay üretmez.
- Toplu kaydetme tek olay gönderir.
- Payload'a kelime kimliği, metin, sayı veya kişisel/sözlük bilgisi eklenmez.
- Hesap eşitleme ve misafir aktarımı (`LearningReconciliation`) sinyal üretmemeli.

**Testler:**
- `ProductMetricsTest`:
  - İzinli olay listesi 7'den 9'a çıkar.
  - D7 yalnızca kesin 7. günde; 6. ve 8. günde değil.
  - Uygulama yeniden başlayınca D7 tekrar gönderilmez.
  - Rıza kapatıldığında D7 bayrağı sıfırlanır.
  - Yeni olaylarda parametre null olur.
- Cihaz testleri:
  - Sinyal commit'ten sonra gelir; rollback olursa olay yok.
  - Aynı gün aç-kapa ikinci olay üretmez.
  - Toplu kaydetme tek olay üretir.
  - Hesap eşitleme olay üretmez.

**Belgeler:** `PRODUCT_ANALYTICS.md` güncellenmeli:
- "yedi" ifadeleri (`:10`, `:43`) ve olay tablosu (`:18-26`).
- D7 raporu tanımı.
- Gizlilik sayfasında olay listesi varsa o da güncellenmeli.

## Kod tarafında doğrulanabilenler ve canlı kabul gerektirenler

**Kod içinde doğrulanabilir (JVM ve cihaz testleriyle):**
- Yukarıdaki hata düzeltmeleri.
- Yeni olay sözleşmesi.
- Tekilleştirme.
- Rıza kapalıyken hiç olay gitmemesi.

**Ayrıca gerçek sağlayıcı ve cihaz kabulü gerekir; kod testleri bunun yerine geçmez:**
- Firebase DebugView/Realtime'da yeni olayların görünmesi; rıza kapatıldıktan sonra olay gelmemesi.
- GA'da D7 cohort raporunun kurulması.
- Gizlilik sayfasının ve Play Data Safety formunun yeniden kontrol edilmesi.
- RevenueCat sandbox'ta aynı Play hesabıyla iki uygulama hesabında geri yükleme ve transfer davranışı.
- AdMob test reklam birimiyle gerçek SSV callback'i.
- Fiziksel cihazda: dil değiştir, süreci kapat, yeniden aç ve içeriğin seçilen dilde olduğunu doğrula.

Çeviri metinlerinin doğruluğu hakkında bir şey söylemiyorum; ana dil konuşanı incelemesi bu çalışmanın kapsamında değildi.

## İkinci salt okunur inceleme

Salt okunur inceleme tamamlandı. Hiçbir dosyayı değiştirmedim, komut çalıştırmadım. Test çalıştırmadığım için aşağıdakiler yalnızca kod okumasına dayanıyor.

## Önceki iki bulgu: ikisi de düzeltilmiş

- **Geri yükleme bekleyen satın almayı silmiyor.** `purchasePending` artık yalnızca `selected != null` olduğunda, yani satın almada `true` yapılıyor (`MonetizationViewModel.kt:110-113`). Geri yükleme bu bayrağa hiç dokunmuyor. Bayrak yalnızca premium doğrulanınca `false` oluyor (`:65`, `:119`, `:133`).
- **Ödül doğrulama.** `pollReward`, `REWARD_VERIFY` olayını artık genel bakiye artışına göre değil, `hasNewAdCreditSince(before)` ile gönderiyor (`MonetizationViewModel.kt:182`). Bu kontrol yalnızca `adCredits` artışına bakıyor (`EnergyRepository.kt:18-19`). Gece yarısı bakiye yenilenmesi artık doğrulama sayılmıyor.

## Analitik: somut regresyon yok

- **`ProductMetrics.kt`:** D7 yalnızca `day == first + 7` olduğunda ve olay daha önce raporlanmamışsa gönderiliyor. Bayrak olay gönderilmeden önce kaydediliyor. Rıza geri çekilince `MetricsState()` ile sıfırlanıyor. `WORD_SAVED` parametresiz.
- **`ProductAnalytics.kt`:** `seventh_day_reported` hem `read` hem `write` içinde var, yani `clear()` bu bayrağı silmiyor.
- **`LearningStore.kt`:**
  - Sinyal transaction dışında gönderiliyor.
  - `saveWords` her yeni kelime için bir olay üretiyor (`repeat(added)`).
  - Kaldırma işleminde `setWordSaved` `false` döndürüyor, olay üretilmiyor.
  - Rollback olursa istisna sinyal satırına ulaşmadan yükseliyor, olay gitmiyor.
  - Bu davranış sizin ürün kararınızla ve `PRODUCT_ANALYTICS.md:22-23,41-42` ile tutarlı.
- **Testler:** `ProductMetricsTest` ve `ProductLearningSignalsTest`'teki beklenen sayıları elle izledim, tutuyor (örneğin toplam 5 `WordSaved`). Tek kozmetik not: `consentingFlowProducesExactlyTheSevenAllowlistedEvents` test adı artık eskimiş ama test geçer.

## `TranslationLanguageVisualTest`: bir somut hata, bir olası hata

1. **Somut hata, `:50`.** Seçenekler bir `LazyColumn` içinde (`TranslationLanguageControls.kt:53`, en fazla 340dp yükseklik). Toplam 12 satır var ve her biri en az 48dp. `th` son satır olduğu için ekran dışında kalıyor ve hiç oluşturulmuyor. Bu yüzden `onNodeWithTag("translation_option_th")` düğümü bulamaz ve `performScrollTo()`'ya hiç ulaşılmaz.
   - **Düzeltme:** `compose.onNode(hasScrollToKeyAction()).performScrollToKey("th")` ile kaydırın (liste anahtarı `it.first`), sonra düğümü bulup tıklayın.

2. **Olası hata, `:41-47`.** Bu kısım Compose iç davranışına dayanıyor, emülatörde doğrulanmalı. `AlertDialog` ayrı bir pencerede açılıyor. Bildiğim kadarıyla bu pencere `LocalContext` ve `LocalConfiguration` değerlerini ana aktivitenin bağlamından yeniden sağlıyor. Öyleyse dışarıdan verilen `ar` dili ve 1.5 font ölçeği dialog içine geçmez.
   - **Sonuç 1:** `arabicPicker` testi `:47`'de Arapça başlığı ararken host dilindeki başlığı bulur ve başarısız olur (emülator Arapça değilse).
   - **Sonuç 2:** `largeEnglishPicker` testi büyük fontu dialog içinde aslında hiç test etmez. Ekran görüntüleri yanıltıcı olur.
   - Son commit (`e89f038a`) başka bir testte host dilindeki dialog kaynaklarına geçmişti; bu sorun orada çözülmüş olabilir. Burada da aynı yaklaşım ya da cihaz dilini değiştirme gerekebilir.

**Temizlik:** `finally` bloğu, önekli `app_language` tercih dosyasını wrapper üzerinden doğru şekilde temizliyor. Arkada yalnızca boş bir prefs dosyası ve `filesDir/translation-visual` altındaki PNG'ler kalıyor; PNG'ler zaten kanıt olarak bilerek bırakılıyor. Seçenek tıklandıktan sonra kayıt yapılmadığı için kalıcı bir yan etki yok.

Uygulama notu: Görsel testte bildirilen son satır kaydırma hatası `performScrollToKey` ile düzeltildi. Dil/yazı ölçeği için gerçek debug-only Activity kaynakları yapılandırıldı; sahte CompositionLocal kaynaklarına dayanılmaz. Son cihaz kabulü test raporuyla ayrıca kaydedilir.
