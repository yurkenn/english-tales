# Native reklam ve ikon UX uygulama kaydı

13 Ekim 2026 · Başlangıç `58edfe3` · Kullanıcı [reklam etki haritasını](INTERSTITIAL_AD_MAP.md) ve [ikon analizinin](ICON_AUDIT.md) önceliklerini “Yapalım” diyerek onayladı. Kullanıcı yeni interstitial birimi olmadığını bildirdi.

## Uygulanan davranış

- Sonuç ekranından **Günlük planıma dön** seçilince, başarıyla Room'a kaydedilmiş üç farklı çalışma sonrası hazır reklam değerlendiriliyor. Okuma ve dört alıştırmanın ortak çıkış sınırı aynı sözleşmeyi kullanır. Başlatma, yarım bırakma, soru araları ve sistem geri tuşu reklam tetiklemez.
- Cihaz genelinde en az 10 dakika aralık ve kayan 24 saatte en fazla üç rezervasyon. Hesap değiştirmek kotayı sıfırlamaz. Son 256 oturum kimliği tekrar sayımı önler. Sayaç kalıcı kaydı gösterimden önce yapılır; disk hatası veya bozuk kayıt reklamı kapatır. Süreç rezervasyondan sonra ölürse hak tüketilmiş kalır: yeniden açılışta fazla reklam göstermektense muhafazakâr sınır korunur. SDK gösterim hatası son rezervasyonu iade eder.
- Kayıt işlemi hatalıysa reklam adayı oluşmaz; yeniden denemeden sonra tek tamamlanma bildirimi üretilir. Yeni hesap, farklı navigation kaydı veya devam eden yazma hatası eski reklam callback'inin yönlendirme yapmasını engeller.
- Hazır reklam yoksa hemen devam edilir. Ağ bekleme ekranı veya sonradan otomatik gösterim yok. Reklam kapanması/hatası sonrası devam callback'i tek kez işlenir; arka plandaysa dönüş ön plana kadar bekler.
- Google GMA Next-Gen 1.5.0 + UMP 4.0.0. UMP izinli reklam isteği durumu oluşmadan SDK initialize/load çağrılmaz. Genel kitle yapılandırması çocuklara özel uygulama bayrağı FALSE kullanır; kullanıcının yaşını varsayan özel hedefleme eklenmez. Bu bayrak SDK'da deprecated; mevcut 1.5.0 API'sinde derleniyor ve Google kurulum belgesinde destekleniyor. Sonraki SDK yükseltmesinde yeniden değerlendirilmeli.
- Ayarlar → Reklam gizlilik tercihleri: gerekli form yeniden açılabilir; UNKNOWN durumunda bilgi yenilenir, ağ/form hatası açıklanır. Tercih değişimi önbellekteki reklamı geçersizleştirir. Reklam için e-posta, hikâye/kelime veya öğrenme geçmişi özel hedefleme verisi gönderilmez.

## Kaynak bağımlılıkları ve sınırlar

| Kaynak | Bağımlılık ve değişen davranış |
|---|---|
| `app/build.gradle.kts`, Manifest, `config/ads.properties` | SDK + UMP, test/release ayrımı, uygulama kimliği metadata. SDK manifest birleştirme kanıtı ACCESS_NETWORK_STATE, READ_BASIC_PHONE_STATE ve AD_ID izinlerini içerir. Runtime hassas konum/mikrofon/kamera izni eklenmedi. |
| `ads/AdPolicy.kt`, `AdLedgerPreferences.kt` | SharedPreferences üzerinden cihaz kotası. Room şeması, bulut sözleşmesi ve ödül kuralları değişmedi. Sayaç temizlenmesi/uygulamanın yeniden kurulması yerel kotayı siler. |
| `ads/NativeCompletionAds.kt`, `MainActivity.kt` | Activity yaşam döngüsü, consent, 55 dakika reklam önbelleği, callback ve FIFO disk komutları. SDK yükleme/izin başarısızlığı öğrenmeyi engellemez. |
| `LearningStore.kt`, `LearningViewModel.kt` | SessionDraft completed kanıtı, tek tamamlanma bildirimi, hesap değişiminde temizleme. Kullanıcının eşitlenen eski çalışmaları reklam sayacı olarak tekrar oynatılmaz. |
| `TalesApp.kt`, `PracticeScreen.kt` | Session ID ve hesap/navigation kontrolü; sonuçtan günlük plana geçiş. Reklam süresi çalışma süresine eklenmez. |
| `ReaderScreen.kt`, `FlashcardGame.kt` | Kelime defteri kısayolu, TTS durdurma ve dönüşte otomatik yeniden oynatmayı engelleme; ses hazırlanıyor/oynat/durdur/hata bildirimi. |
| `LearningIndicators.kt`, `CatalogScreens.kt`, `OnboardingScreen.kt` | Seri/puan/seviye açıklamaları, puana bağlı rütbe, düğme etiketleri, 48dp hedefler ve ilk adımda gizli geri oku. |
| `web/privacy.html`, `web/app-ads.txt` | Reklam veri kullanımını anlatan Türkçe/İngilizce taslak ve eski yayıncı kaydı. Hosting paketi oluşturuldu; canlı site henüz güncellenmedi. |

## İkon analizinden tamamlananlar

Okuyucudaki kelime sayacı Kelimelerim ekranını açar; geri dönüşte aynı okuma sayfası/oturum korunur. Kelime kutusundaki dekoratif kart simgesi kayıt durumuna dönüştü. Seri ve puan açıklama panelleri açar; puan simgesi tutarlıdır. Profilin sabit yıldız rütbesi yerine her 100 puan için gerçek “Okuyucu N” ve sonraki hedef gösterilir; CEFR seviyesi ile karıştırılmaz. İlk onboarding adımında geri oku görünmez. Kart ses düğmesi hazırlanma/durdurma/hata durumlarını gösterir. Paylaşım metni Google Play uygulama bağlantısı içerir.

Cihaz testi çeviri alıştırmasında aynı Türkçe çevirinin birden fazla seçenek olabildiğini ortaya çıkardı; seçenekler çeviri değeri bazında tekilleştirildi.

Hikâye favorileri, doğrudan hikâyeyi açan web/deep link, avatar fotoğrafı ve çoklu öğrenme dili analizde sonraki aşamaydı; bu pakette uygulanmadı. Uygulama bağlantısı doğrudan hikâye bağlantısı kabulü değildir. Kalıcı gece modu/yazı boyutu ayrı ürün yol haritasında kalır.

## Test ve kabul

- 23 JVM testi: reklam tekrarı, yeniden oluşturma, 10 dakika ve 24 saat sınırı, saat geri alınması, başarısız/bozuk depolama, gösterim hatası iadesi ve ortak cihaz kotası dahil.
- 120 Android cihaz testi: okuyucu → kelime defteri → aynı sayfa dönüşü, seri/puan/rütbe açıklamaları, yalnız tamamlanmış alıştırmada çıkış sınırı ve kayıt hatası/yeniden deneme/hesap değişiminde tamamlanma kanıtı dahil.
- Debug derleme, lint, Android test APK, repository kontrolü ve iki 64-bit ELF kütüphanesinin 16 KB hizalaması kontrol edilir. CI cihaz test APK'sını derler; 120 cihaz testi yerel ayrı emülatörde çalıştırılır.
- İsteğe bağlı Google ağ probunda test reklamı **yüklendi ve tam ekran gösterildi**. Geri tuşuyla kapatma denemesi callback üretmedi; tam kapatma kabulü geçti olarak yazılmadı. Prob artık operatörün reklamın kendi kapatma kontrolünü kullanmasını 120 saniye bekler; normal CI paketine eklenmez. Çalıştırma: README'deki `-PadDeviceTest=true` komutu. Canlı UMP formu ve gerçek cihaz ses motoru/TalkBack kabulü ayrıca yapılmalı.

## Canlı reklamı açmak için kalan işler

`config/ads.properties`: ENABLED=false, boş interstitial kimliği, PUBLICATION_READY=false. Debug yalnız Google örnek App ID ve interstitial kullanır. Release controller oluşturmaz. Eski rewarded ID interstitial yerine kabul edilmez. Gerçek interstitial birimi doğrulanmadan, yayın hazırlığı işaretlenmeden ve özel release imzası olmadan release üretimi engellenir.

1. AdMob hesabında mevcut English Tales App ID sahipliğini doğrula; Android interstitial birimi oluştur ve kimliğini yapılandır.
2. AdMob Privacy & messaging formunu yapılandır; UMP gerekli/gerekli değil/ağ hatası ve tercih değiştirme senaryolarını gerçek uygulama kaydıyla test et.
3. Gizlilik politikasını ve app-ads.txt'yi canlı destek sitesine yayımla; developer website alan adını AdMob/Play kaydıyla eşleştir, tarama durumunu doğrula.
4. Play Console Contains ads, Data safety, reklam kimliği ve hedef kitle beyanlarını bu SDK'nın fiili veri kullanımıyla eşleştir. Kodun genel kitle seçimi çocuk kullanımına ilişkin platform yükümlülüklerini otomatik olarak çözmez.
5. Test reklamının kendi kapatma kontrolü ve uygulamadaki başarılı devamı gerçek cihazda doğrula; sonra PUBLICATION_READY=true ve ENABLED=true, özel imzalı aday ve yayın kabulü.

Bu kayıt canlı gelir, AdMob hesap onayı, yayın veya release/R8 kabulü kanıtı değildir. SDK eklenmiş release adayının izin listesi ve R8 davranışı imzalı adayda tekrar incelenmelidir.

Platform kaynakları: [GMA Next-Gen kurulum](https://developers.google.com/admob/android/next-gen/quick-start), [Interstitial](https://developers.google.com/admob/android/next-gen/interstitial/single-load), [UMP](https://developers.google.com/admob/android/next-gen/privacy), [Play veri beyanı](https://developers.google.com/admob/android/next-gen/privacy/play-data-disclosure).
