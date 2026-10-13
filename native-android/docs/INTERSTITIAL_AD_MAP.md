# English Tales — seyrek tam ekran reklam etki haritası

13 Ekim 2026 · native master `58edfe3` · Tarihsel analiz: uygulama öncesi master kaynaklarına dayanır. Kullanıcı “Yapalım” diyerek haritayı onayladı. Son uygulama ve doğrulama: [uygulama kaydı](ADS_AND_ICON_UX_EXECUTION.md). Aşağıdaki plan ve satır bağlantıları analiz anını gösterir.

## Seçilen ürün modeli ve önerilen sınırlar

Kullanıcı seçimi: tamamlanan çalışmalardan sonra seyrek tam ekran reklam; genel kitle, çocuklara özel tasarlanmıyor. Önerilen ilk politika:

- Her 3 farklı, başarıyla kaydedilmiş okuma/alıştırma oturumundan sonra uygun bir geçişte reklam adayı.
- En az 10 dakika aralık; cihaz genelinde günde en fazla 3 gerçek fullscreen gösterimi. Bu rakamlar ürün önerisidir, Google zorunluluğu değildir.
- Sonuç ekranı önce gösterilir; Günlük planıma dön düğmesi kontrollü sınırdır. Açılış, onboarding, hesap, Reader, soru araları ve sistem geri tuşunda reklam yok.
- Reklam yoksa, çevrimdışıysa, izin uygun değilse, kayıt hatası varsa veya Activity foreground değilse normal eylem hemen sürer. Reklam yüklenmesini bekleten ekran ve sonradan kendiliğinden açılan reklam yok.
- Reklam karşılığı puan, seri, çeviri limiti veya öğrenme hakkı değişikliği bu kapsamda yok. Firebase Analytics/Crashlytics veya ödeme SDK eklenmez.

## Doğrulanan eski entegrasyon

Git snapshot `2c72901`: services/ads/adConfig.ts içinde eski AdMob App ID ve rewarded story-unlock ID var. Translation/streak IDleri XXXXXXXXXX placeholder. app/_layout.tsx:148 initialize çağırıyor; public/app-ads.txt publisher kaydı içeriyor. Kimliklerin bugün aktif/hesaba bağlı olması Gitten kanıtlanamaz. Ödüllü birim interstitial birimi yerine kullanılmayacak; mevcut veya yeni bir interstitial unit Console üzerinden doğrulanmalı. Eski React Native wrapper, çeviri kısıtı ve ödül storeları taşınmayacak.

## Kaynak ve bağımlılık haritası

| Alan | Mevcut kanıt | Planlanan dokunuş | Bağımlılık / ne bozulabilir |
|---|---|---|---|
| Gradle / Manifest | [build.gradle.kts:40](https://github.com/yurkenn/english-tales/blob/58edfe3/native-android/app/build.gradle.kts#L40); [AndroidManifest.xml:1](https://github.com/yurkenn/english-tales/blob/58edfe3/native-android/app/src/main/AndroidManifest.xml#L1) | Google Mobile Ads ve UMP bağımlılıkları; debug test kimliği, ayrı release yapılandırması ve App ID metadata. | Yeni dependency tree, manifest provider/izinleri, APK boyutu, başlangıç süresi ve R8 etkisi incelenecek. SDK seçimi/sürümü henüz sabitlenmedi; React Native eklenmeyecek. |
| Activity yaşam döngüsü | [MainActivity.kt:17](https://github.com/yurkenn/english-tales/blob/58edfe3/native-android/app/src/main/java/com/yurken/englishtales/MainActivity.kt#L17) | Consent akışı ve Activity sahibi reklam controller; foreground kontrolü, fullscreen kapatma/hata callbackleri. | Recreation/background/account değişiminde eski callback yeni ekranı yönlendirmemeli. UMP sonucu reklam istemeyi izinli kılmadan initialize/load yok. |
| Başarılı çalışma kaydı | [LearningViewModel.kt:91](https://github.com/yurkenn/english-tales/blob/58edfe3/native-android/app/src/main/java/com/yurken/englishtales/data/LearningViewModel.kt#L91); [LearningStore.kt:160](https://github.com/yurkenn/english-tales/blob/58edfe3/native-android/app/src/main/java/com/yurken/englishtales/data/LearningStore.kt#L160); [LearningDatabase.kt:89](https://github.com/yurkenn/english-tales/blob/58edfe3/native-android/app/src/main/java/com/yurken/englishtales/data/LearningDatabase.kt#L89) | Actor üzerinden aynı owner için session completed kanıtı; reklam adayı ancak yerel transaction tamamlanmışsa. | UI finished veya puan metni tek başına kayıt kanıtı değildir. Retry/recomposition/cloud replay bir session için ikinci aday üretmemeli. Room/cloud ödülleri reklamdan etkilenmemeli. |
| Okuma sonucu / navigation | [TalesApp.kt:81](https://github.com/yurkenn/english-tales/blob/58edfe3/native-android/app/src/main/java/com/yurken/englishtales/ui/TalesApp.kt#L81); [LearningJourney.kt:80](https://github.com/yurkenn/english-tales/blob/58edfe3/native-android/app/src/main/java/com/yurken/englishtales/ui/LearningJourney.kt#L80) | Sonuç ekranının session kimliği korunacak; Günlük planıma dön eylemi doğal reklam sınırı. | Sonuç önce görülür. Reader içinde veya sistem geri tuşunda sürpriz reklam yok. Reklam kapanınca özgün navigation tek kez; hazır değilse gecikmeden devam. |
| Dört alıştırma | [PracticeScreen.kt:30](https://github.com/yurkenn/english-tales/blob/58edfe3/native-android/app/src/main/java/com/yurken/englishtales/ui/PracticeScreen.kt#L30); [PracticeScreen.kt:58](https://github.com/yurkenn/english-tales/blob/58edfe3/native-android/app/src/main/java/com/yurken/englishtales/ui/PracticeScreen.kt#L58); [PracticeScreen.kt:120](https://github.com/yurkenn/english-tales/blob/58edfe3/native-android/app/src/main/java/com/yurken/englishtales/ui/PracticeScreen.kt#L120) | Tamamlanmış session için günlük plana dönüş ortak reklam sınırına bağlanır. Card/match ortak GameResult/onExit kullanır. | Yarım bırakma, sorular arası geçiş ve erken geri dönüş reklam adayı değildir. Session UUID ve timer korunur; reklam izleme öğrenme süresine/puanına yazılmaz. |
| Yerel reklam politikası / yeni ads modülü | Önerilen yeni Kotlin dosyaları: ads/AdPolicy.kt, ads/AdController.kt, ads/AdConsent.kt; henüz oluşturulmadı. | Cihaz genelinde sıklık ve gösterim sayacı; consent ve hazır reklam kontrolü; load/dismiss/failure soyutlaması. | Hesap değiştirerek günlük limit aşılmaz. Tekrar tıklama eşzamanlı iki fullscreen açmaz. Diskte sayaç kaydı başarısızsa reklam gösterilmez. Saat geri giderse cooldown aşılmış sayılmaz. |
| Gizlilik ayarları | [LearningJourney.kt:96](https://github.com/yurkenn/english-tales/blob/58edfe3/native-android/app/src/main/java/com/yurken/englishtales/ui/LearningJourney.kt#L96) | UMP gerektiriyorsa reklam gizlilik tercihlerine tekrar erişim. | Tercih güncellemesi sonrası canRequestAds yeniden kontrol edilir; eski izinle yüklenmiş reklam geçersizleştirilir. Çocuklara yönelik olmadığı seçildi; hedef kitle beyanı yayın aşamasında bununla eşleşmeli. |
| Destek sitesi / publisher doğrulaması | [privacy.html:1](https://github.com/yurkenn/english-tales/blob/58edfe3/native-android/web/privacy.html#L1); [build_hosting.py:21](https://github.com/yurkenn/english-tales/blob/58edfe3/tooling/build_hosting.py#L21) | Reklam veri akışını anlatan politika taslağı ve native-android/web/app-ads.txt; hosting paketine ekleme. | Mevcut politika reklam SDK yok diyor. Canlı site henüz değiştirilmez; yayın öncesi yeni beyan ve Play Data safety/Contains ads ile uyum doğrulanır. app-ads.txt alan adı Console developer website ile eşleşmeli. |
| Doğrulama / belgeler | [verify.yml:1](https://github.com/yurkenn/english-tales/blob/58edfe3/.github/workflows/verify.yml#L1); [verify_native_package.py:1](https://github.com/yurkenn/english-tales/blob/58edfe3/tooling/verify_native_package.py#L1) | Politika JVM testleri, fake controller ile UI/lifecycle cihaz testleri, test AdMob yükleme/göster/kapat; paket ve lint. | Mevcut 17 JVM/117 cihaz regresyonu korunur. Yeni SDK native library katarsa ELF/16 KiB tekrar incelenir; imzalı release/R8 ayrıca yayın kapısıdır. |

## Gizli yan etkiler ve doğrulanmamış noktalar

- Üçüncü taraf SDK cihaz/ağ/reklam verisi işler; bu veri akışı mevcut öğrenme sync akışından yenidir. App ID kamuya açık bir kimliktir, parola veya gizli sunucu anahtarı istenmez. Öğrenme metni, e-posta ve kullanıcı IDsi reklam isteğine özel hedefleme alanı olarak eklenmez.
- SDK başlatma/preload yan etkileri ve manifest birleştirmesi dependency tree indirilip incelenmeden kanıtlanmış sayılmaz. Google dokümanlarında Next-Gen ve Legacy ayrımı var; sürüm/API seçimi doğrulama işi olarak açık.
- Reader/Practice tamamlanma ekranı transaction onayından önce görünebilir; başarılı session kontrolü zorunludur. Mevcut pending-write hatası reklam yüzünden gizlenmemeli veya retry iptal olmamalı.
- Android fullscreen Activity, uygulama Activitysini pause edebilir; içerik yenileme/hesap doğrulama ON_RESUME yan etkileri, timer ve TTS cihaz testinde kontrol edilecek.
- Yeni Consent/Ad callbacks eski Activity veya hesap scope'una bağlı navigation taşıyabilir; tek seferlik devam ve scope/lifecycle guard zorunludur.
- Eski App ID/publisher kaydı bulundu; gerçek interstitial unit, AdMob hesap durumu, privacy message yapılandırması ve site publisher doğrulaması henüz kontrol edilmedi.
- Bu özellikten elde edilecek gelir, doluluk ve kullanıcı tutulumuna etkisi ölçülmedi; gelir garantisi veya sayı tahmini yok.

## Kabul senaryoları

1. İlk/ikinci tamamlanan çalışmada reklam yok; üçüncüde hazır reklam yalnız uygun sonuç çıkışında gösterilir.
2. Aynı sessionın tekrar tamamlanması, yeniden açılan sonuç, retry ve bulut replay sayacı artırmaz.
3. İlk gösterimden 10 dakika geçmediyse veya günlük 3 gösterim dolduysa uygun çalışma tamamlanmasına rağmen reklam yok.
4. Load/no-fill/show hatası, offline veya izin uygun olmaması normal navigationı engellemez; geç gelen load callback kendiliğinden fullscreen açmaz.
5. Aynı düğmeye tekrar basma; dismiss ve failure callbackleri; account change; recreation/background: en fazla bir gösterim ve tek geçerli devam.
6. Yerel kayıt başarısızken, onboardingde, Readerda, sorular arasında veya yarım bırakılan sessionda reklam yok.
7. UMP preference güncellemesi/revoke, yeniden başlatma, test coğrafyası ve eski consent durumu test edilir; reklam isteği canRequestAds koşuluna bağlıdır.
8. Debug sadece Google test unit kullanır. Gerçek interstitial ID doğrulanmadan production reklamı etkinleştirilmez. SDK paket/R8/native alignment sonucu ve veri beyanları yayın kapısına yazılır.

## Uygulama sırası

Manuel harita onayı → Kotlin policy/controller ve test reklam entegrasyonu → yaşam döngüsü/consent/başarılı session UI testleri → GitHub PR ve CI → AdMob interstitial unit + privacy message + publisher doğrulaması → imzalı yayın adayı, veri beyanı ve kontrollü etkinleştirme.

Platform kaynakları: [Interstitial yerleşimi](https://support.google.com/admob/answer/6066980), [Next-Gen interstitial](https://developers.google.com/admob/android/next-gen/interstitial), [UMP](https://developers.google.com/admob/android/privacy), [app-ads.txt](https://support.google.com/admob/answer/9363762). Yeni SDK sürümü/dependency tree ve gerçek yayın davranışı bu haritada varsayım olarak bırakılmıştır; uygulama ve test olmadan geçti denmez.
