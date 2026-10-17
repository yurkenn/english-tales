# Play üzerinden üretim paketi testi

## Analiz — 11 Ekim 2026

Kullanıcı yalnızca emülatör kullanabiliyor. Üretim bağlantısı ve yükleme imzası yerel pakette doğrulandı; Play imzasıyla Google girişinin ve Play tarafından üretilen split APK'ların kontrolü açık. Bu nedenle teknik aday 47 / 2.0.0 önce dahili testte hazırlanır. Yeni ikon son aşamada eklenir; 47 Play'e yüklenmişse son paket için sürüm kodu artırılır.

## Kabul adımları

1. APK/AAB üretim projesi, yükleme sertifikası, imza ve 16 KiB kontrollerini tekrar doğrula.
2. Play'deki en yüksek sürüm kodunu kontrol et. AAB'yi dahili test taslağına yükle; doğrulama uyarılarını oku.
3. Test erişimini kişisel hesabıyla sınırlı tut; herkese yeni erişim açma. Gereken erişim değişikliklerinde tarayıcı kuralına göre işlem anında onay iste.
4. Google Play cihaz raporlarını ve mağaza imzalı paket girişini değerlendir. Eski 46 üzerine güncelleme ve veri korunmasını ayrı kontrol et.
5. Yeni ikon, nihai mağaza beyanları ve son AAB tamamlanınca üretim incelemesini gönder. Dahili test taslağı, canlı yayın veya Google onayı değildir.

Fiziksel ARM64 telefon testi yapılmadı. Emülatör testini fiziksel cihaz kanıtı olarak göstermeyiz.

## Hazırlık sonucu

47 / 2.0.0 APK/AAB üretim bağlantısı, upload sertifikası ve 16 KiB statik kontrollerinden tekrar geçti; SHA256 değerleri PRODUCTION_PACKAGE_PLAN.md ile aynı. İlk Chrome dosya erişimi engelinden sonra kullanıcı eklenti ayarını değiştirdi; yeniden bağlanan tarayıcıyla AAB yüklendi ve Play 47 / 2.0.0, min 24, target 36 olarak kabul etti. ReTrace mapping pakete bağlı görünüyor. Beş dilde sürüm notları kaydedildi.

Önizlemede engelleyici hata yok, iki uyarı var: önceki dahili 4 sürümüne göre 1.999 cihaz kapsam dışına çıkıyor ve native debug symbols bulunmuyor. Android 24 minimumu ve kütüphane sembollerinin bulunabilirliği üretim öncesinde ayrıca değerlendirilecek. Bu karşılaştırma üretimdeki 46 ile güncelleme testi değildir. Yeni kurulum Play boyutu 17,9 MB.

Eski tester listesinde 26 hesap vardı. Liste silinmeden bu kanaldaki seçimi kaldırıldı; kullanıcının üretimde kullandığı Google hesabını içeren tek kişilik ayrı liste kaydedildi. 47 dahili testte Save and publish ile yayımlandı ve duraklatılan kanal yeniden açıldı. Console Active ve Available to internal testers gösteriyor. Genel üretim kanalı hâlâ 46; üretime native yayın yapılmadı. Google görünürlüğün genellikle bir saat içinde oluştuğunu, daha uzun sürebileceğini bildiriyor. Son ikonlu paket yeni sürüm koduyla oluşturulmalı; 47 artık yüklenmiştir.

## Ayrı Play emülatörü

Mevcut iki emülatörde kişisel oturumlar var; debug ve Play sertifikaları farklı olduğu için bunlar kaldırılarak değiştirilmedi. `English_Tales_Play_16K` adlı ayrı boş AVD oluşturuldu; yalnızca cihaz konfigürasyonu mevcut Play Store 16 KiB sistem imajına bağlandı. Kullanıcı verisi veya oturum dosyası kopyalanmadı. Eski avdmanager Java 17 ile çalışmadığı için yeni SDK/lisans kurulumuna geçilmeden mevcut emulator konfigürasyonu kullanıldı. Google hesabını kullanıcı bu yeni cihazda eklemeli. Bu cihaz fiziksel ARM64 testi değildir.

Yeni cihaz emulator-5558 üzerinde açıldı: sys.boot_completed=1, PAGE_SIZE=16384 ve English Tales paketi henüz kurulu değil. Play Store başlatıldı; hesabın eklenmesi, test katılımı, Play kurulumu ve uygulama Google girişinin kullanıcı tarafından tamamlanması istendi. Eski iki cihazın verileri temizlenmedi. Pre-launch report ekranında henüz rapor yok; ayarda test kimlik bilgileri sağlanmıyor. Misafir akışı test edilebilir; kişisel yayıncı parolası Google'ın crawler'ına verilmedi.

Test katılım adresi: `https://play.google.com/apps/internaltest/4701713728242169635`. Bu adres herkese erişim vermez; seçili Google tester hesabı gerekir.

## İlk mağaza kurulumu — 11 Ekim 23:27 TRT

Kullanıcı teste katıldığını ancak eski uygulamayı aldığını bildirdi. emulator-5558 paket bilgisi Play Store kurulumunu doğruluyor: versionCode=46, versionName=1.1.0, minSdk=24, targetSdk=36; kurulum zamanı 20:21:08 UTC. Yeni 47 sürümü Console'da 23:11 TRT yayına çıkmış görünüyor. Güncel Console kontrolünde kanal Active, 47 Available to internal testers ve seçili tek kişilik listede doğru tester hesabı kayıtlı. Sunucu tarafında kanal veya tester kaydı hatası saptanmadı; cihazdaki aktif Play hesabı ve test katılım hesabının eşleşmesi henüz kullanıcı tarafından doğrulanmadı. Dağıtım gecikmesi olasılık, doğrulanmış kök neden değil.

Test sürümü aynı paket ve mağaza sayfasını kullanır; ayrı uygulama aranmaz. Önce hesap eşleşmesi kontrol edilir, aynı sayfada Güncelle seçeneği beklenir. Eski 46 silinmez: 46→47 güncelleme kontrolü için korunur. Yerel APK yüklemek Play imzasıyla gerçek giriş testinin yerine geçmez. Mağazadan 47 kurulumu ve Google giriş/yeniden açılış kanıtı hâlâ açık.

Gerçek 46 paketinde minimum Android API 24 görüldü. Önceki dahili 4 ile cihaz kaybı uyarısı, üretim 46'nın minimum API'sinin yükseltildiği anlamına gelmez.

## Play imzalı paketle güncelleme — 11 Ekim 23:38 TRT

Kullanıcı Play hesabını ogi311999 olarak doğruladı. Ayrı Play AVD kapanmıştı; yeniden başlatıldı. Medium_Phone_2 üzerinde de mağaza kurulumlu 46 görüldü; kişisel emülatörün verileri değiştirilmedi. Ayrı AVD'de de 46 kuruluydu. Console 47 için Available to internal testers, 19.243 cihaz ve 16 KB desteği gösteriyor; x86_64 destekli, gereken tek özellik faketouch. Dağıtım sorununun kök nedeni henüz saptanmadı.

Beklerken Console → 47 → Downloads → Signed, universal APK indirildi. Dosya SHA256: `5ac55f64035497b2f22407a32695c1473e9d21804ab05416f74a14eef02654aa`. APK imza doğrulaması v2/v3 ve Google SourceStamp ile geçti. Sertifika SHA256 `13ef5910fd56b0a43f5d6578d2cc90271fe087c2a0baa6cc06a0b5f1056a3ba8`, SHA1 `4cee8c1d40268c97f4cb6b5bfedbb1f0911466d1`; kayıtlı Play uygulama imzasıyla eşleşiyor. min24, target36, dört ABI ve zipalign 16 KiB kontrolü geçti.

Bu Google Play üretimi APK yalnızca ayrı emulator-5558'e geliştirme aracının update (-r) işlemiyle yüklendi; 46→47 güncelleme Success verdi. Son paket version47/name2.0.0; installerPackageName=null, dolayısıyla bu kurulum mağazadan otomatik dağıtım veya Play split APK testi sayılmaz. Medium_Phone_2 üzerinde mağaza kurulumlu 46 korunuyor. Uygulama açıldı; kullanıcıdan Google hesabıyla giriş ve yeniden açılışta oturum kontrolü istendi. İmza uyumlu güncelleme geçti; eski öğrenme verisinin taşınması ve Google giriş sonucu henüz doğrulanmadı.

## 49 / 2.1.0 dahili yayını — 16 Ekim 2026, 23:38 TRT

Kaynak `6f4804098f715353f2ddab01b7678618451e035a` (master `a14fa5f` dahil). Yerel imzalı APK/AAB, 94 JVM ve 144 backend testi, imza/üretim adresi/baseline profile/AD_ID/statik 16 KB kontrolleri geçti. Kaynak master CI cihaz işi dahil başarılı. AAB SHA-256 `2e0433d6341d3d35d7f9cdf868428865a9d9422af52ae39f95e4cc734f19b88b`.

Kullanıcı Chrome dosya iznini açtıktan sonra AAB, beş dilde notla dahili kanala elle yüklendi ve yayımlandı. Console **Active / Available to internal testers** gösteriyor. Tek kişilik mevcut test listesi korundu. ReTrace mapping dosyası pakete bağlı. Tek uyarı native debug symbols; engelleyici hata ve önceki dahili 47’ye göre cihaz kaybı yok. Üretim kanalı 48 olarak kaldı.

[Teste katıl](https://play.google.com/apps/internaltest/4701713728242169635). Yetkili Google hesabıyla aynı uygulama sayfasında güncelleme yapılmalı; 48 silinmemeli. Play görünürlüğü gecikebilir. 49’un gerçek telefona Play’den kurulumu, Google girişi, ilerleme korunması, çevrimdışı okuma, TalkBack ve 16 KB çalışma zamanı kabulü henüz kaydedilmedi. [Tam yayın kaydı](../../senin-adimlarin.md).
