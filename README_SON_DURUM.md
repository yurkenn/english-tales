# 25 Ekim 2026 — Açık Premium testi ve bölgesel fiyatlar

56 / 2.4.0-sandbox mevcut tek kişilik dahili grupta **Available to internal testers**. Enerji/Premium test ortamında açık; test reklamları ve lisans testi kullanılır. 19 ülkenin **38/38 aylık/yıllık fiyatı** Play'de kaydedildi, yeniden okundu; mevcut aboneler taşınmadı. Gizlilik/hesap silme/abonelik koşulları Hosting'de HTTP 200 ve kaynakla aynı. Kaynak CI: **383 cihaz + 3 açılış + 3 servis**, hata/atlama yok; 148 JVM ve 240 backend başarılı. AdMob ödülü 1 enerji ve staging SSV kaydedildi; Google imzalı Console testi tam 1 kredi verdi, tekrar aynı istekte ikinci ödül çıkmadı. Telefonda reklam izleme, gerçek Play lisans testi satın alması ve üretim binary açılışı henüz tamamlanmadı. [PR #179](https://github.com/yurkenn/english-tales/pull/179) · [Güncel durum](native-android/docs/MONETIZATION_SETUP_2026-10-24.md). Aşağıdaki kayıtlar tarihçedir.

# 25 Ekim 2026 — Enerji ve Premium hazırlığı

Özellik üretimde kapalıdır. 24 Ekim canlı Console kontrolü: 52 / 2.3.1 üretimde erişilebilir, %100 dağıtım. Aşağıdaki gönderim kayıtları tarihçedir. [Güncel monetization durumu](native-android/docs/MONETIZATION_SETUP_2026-10-24.md).

# 24 Ekim 2026 — 52 üretim gönderimi

52 / 2.3.1 dahili testte yayımlandı; aynı paket %100 üretim dağıtımı için Google incelemesine gönderildi. Play: **Changes in review**, hızlı kontroller sürüyor, gönderilmemiş değişiklik yok. Onaydan sonra otomatik yayım (managed publishing kapalı). Fiziksel cihaz/runtime/editör kabul eksikleri kapanmış sayılmaz. [Güncel yayın kaydı](native-android/docs/RELEASE_52_STATUS.md). Aşağıdaki eski durum kayıtları tarihsel kanıttır.

# English Tales — son çalışmalar ve yayın durumu

Son güncelleme: **24 Ekim 2026**.

Gelecek işler ve öncelik sırası: [90 günlük yol haritası](native-android/docs/ROADMAP_2026_Q4.md).

## Enerji ve Premium — 24 Ekim 2026

Claude ile ortak plan ve uygulama `codex/energy-premium` dalında hazırlandı: günlük 3 hikâye hakkı, SSV doğrulamalı ödüllü reklam ve RevenueCat aylık/yıllık Premium. Özellik varsayılan kapalıdır. Supabase **test** ortamına migration ve üç fonksiyon uygulandı; üretim backend'i değiştirilmedi. RevenueCat yeni offering'i iki abonelikle hazır, eski offering geri alınabilir biçimde pasif. Türkiye hedef fiyatları aylık 99,99 TL / yıllık 699,99 TL; Play kaydı ayrıca doğrulanacak. 229 backend, 148 JVM ve hedefli 6 API36 cihaz testi geçti. [Plan, kanıtlar ve açık kabul kapıları](native-android/docs/MONETIZATION_SETUP_2026-10-24.md).

Canlı Play Console kontrolünde **52 / 2.3.1 üretimde erişilebilir ve %100 dağıtımda** (24 Ekim). Önceki sürüm kayıtları aşağıda tarihçedir. Yeni 53 / 2.4.0 imzalı paket yalnız dahili test taslağı için hazırlandı; yeni özelliğin canlıya açıldığı anlamına gelmez.
## 52 devamı — 24 Ekim 2026

51 yalnız dahili testte yayımlandı. Claude'un son incelemesinde, geciken eski hesap eşitlemesinin yeni hesabın sandık eşitlemesini yutabildiği durum cihaz testinde doğrulandı. Güncel owner'a damgalı tekrar deneme ile düzeltildi; hesap/sandık regresyonları 32/32 geçti. 52 / 2.3.1 imzalı paket, mapping ve 142 release testi doğrulandı; tam kaynak CI'ı 377 cihaz + 3 açılış + 3 servis testiyle hatasız/atlamasız geçti. Play yüklemesi kabul edildi. Mac ekran kilidi nedeniyle son dahili yayın onayı bekliyor; dahili 51, üretim 50'de. [Sorun, kanıt ve yayın takibi](native-android/docs/RELEASE_52_STATUS.md).

## 51 hazırlığı — 24 Ekim 2026

Claude #174/#175 ana dalda; beş hesap/gizlilik/indirme bulgusu düzeltildi ve 13 dilde sürüm notları hazır. Son master CI: 376 cihaz + 3 açılış + 3 servis testi, 0 hata/atlama; backend 212, JVM 142 geçti. Canlıda 31 hikâyenin 119 sorusu ve eksik dil satırları tamamlandı: 67 hikâye, 2.839 cümle, 11 tam dil, 67 korunmuş medya. Üretim hâlâ 50 / 2.2.0; 51 / 2.3.0 dahili testte yayında (24 Ekim 03:13 TRT). Fiziksel Play güncelleme ve açık içerik hedefleri tamamlanmış sayılmadı. [Aday, hash'ler ve kalan kabul işleri](native-android/docs/RELEASE_51_STATUS.md).

## İçerik ve yarım kalan işler — 23 Ekim 2026

Claude #172 birleştirildi; 13 yeni uzun hikâyeye ek olarak 14 mevcut hikâye uzatması ve dört kısa hikâye yayınlandı. Canlı katalog **67 hikâye**, güncel revizyonlarda **2.839 cümle**; 18 hedefin 11 dili ve 67 medya SHA-256 değeri anonim API üzerinden doğrulandı. Önceki metin ve çeviriler korundu. Kaynak/yayın kanıtları #173 içinde takip edilir.

İzin verilen mevcut hesap canlı sandık kabulünde iki test oturumu, 25 oyun + 20 sandık puanı ve okuma dahil 65 lig XP doğrulandı; tekrar gönderme/açma ek puan yazmıyor. Backend 201/201, hedefli Android sandık testleri 4/4 geçti. [Tamamlama raporu ve sınırlar](native-android/docs/COMPLETION_2026-10-23.md). Bu kayıt yeni mağaza paketi veya ana dil onayı iddia etmez. Aşağıdaki önceki tarihli kayıtlar tarihçedir.

## Güncel proje kontrolü — 21 Ekim 2026

**50 / 2.2.0 Google Play üretim kanalında Active ve %100 dağıtımda.** Canlı Console’da son yayın tarihi 20 Ekim, yayımlanmamış değişiklik sayısı sıfır. Dahili sürüm 49 / 2.1.0. Crash/ANR oranlarında henüz veri yok; hatasızlık sonucu çıkarılmaz. [Yayın kanıtı](native-android/docs/release-evidence/2026-10-21-play-status.json).

PR denetimi sözlükteki 73 ertelenmiş kararın sonuçlarını (#154), oyun ödülleri/günlük görevleri (#156) ve akıcı paragraflar/sepya okuyucuyu (#157) bir arada doğrular. #157 ana dala birleşti; artık bulunmayan Expo kodunu hedefleyen Ocak ayı test taslağı #1 tarihçesi korunarak kapatıldı. Kartta geciken kaydırma cevabının sonraki kartı atlaması engellendi. İlk açılış regresyon testi, Compose test saatinin IO iş parçacığında oluşturabildiği Looper hatasını önlemek için gerçek Android pencere döngüsüne taşındı. [Denetim ve kalan kabul işleri](native-android/docs/PROJECT_AUDIT_2026-10-21.md).

Fiziksel telefonda Play üzerinden güncelleme/veri koruma, TalkBack, hesaplar arası eşitleme, canlı Analytics ve ana dil örneklemi kabulü açık. Yeni PR kaynakları yayımlanan 50 paketinden sonradır; mağazaya ulaştıkları iddia edilmez. Aşağıdaki 20 Ekim ve önceki tarihli kayıtlar tarihsel durumları gösterir.

## Paralel işlerin ilerlemesi — 20 Ekim

Claude ve Codex on dilde 10.980 sözlük karşılığını AI destekli inceledi. 190 adayın 81’i kabul, 36’sı ret, 73’ü erteleme aldı; koordineli kaynak düzeltmeleriyle **92 karşılık** güncellendi. Tam backend **172/172**, 11 dil varlık eşleşmesi ve son sözlük başlığının iki tam CI koşusu başarılı. Yerel API36 tam paketi de 336 geçti / 3 atlandı / 0 hata verdi. [Sözlük PR #152](https://github.com/yurkenn/english-tales/pull/152), [cihaz testi PR #153](https://github.com/yurkenn/english-tales/pull/153) ve [kesin kaynak/rapor kanıtı](native-android/docs/release-evidence/2026-10-20-write-ui-scheduler.json). Devam turunda 73/73 kayıt 72 düzeltme/ekleme ve 1 koruma kararıyla tamamlandı; 11 dilde 225 ek karşılık güncellendi. [Son inceleme](native-android/docs/GLOSSARY_DEFERRED_RESOLUTION_2026-10-20.md). Ana dil örneklemi ayrı kabul olarak açık. Bu yeni turun test sonuçları kendi özetinde takip edilir. Bu çalışmada mağaza veya içerik yayını yapılmadı.

## Play takip kontrolü — 20 Ekim

Console’da **50 / 2.2.0 hâlâ incelemede**, **48 / 2.0.0 Google Play’de erişilebilir** olarak yeniden doğrulandı. Başvuru veya yayın ayarı değiştirilmedi. [Güncel kontrol kaydı](native-android/docs/release-evidence/2026-10-20-play-status.json).

## Son doğrulanan yayın kaydı — 19 Ekim, 50 / 2.2.0

**19 Ekim kaydı: üretim başvurusu gönderildi; canlı yayın doğrulanmadı.** 20 Ekim’de Console yeniden kontrol edilmedi. Kaydın alındığı sırada Console “Changes in review” gösteriyor ve Google hızlı kontrolleri çalışıyor. Yeni paket, %100 dağıtım, Yurken Stories markası, 13 mağaza dili, güncel EN/TR ekran görüntüleri ve reklam beyanı birlikte başvuruda. Yönetilen yayın kapalı olduğundan onaydan sonra otomatik yayımlanır. Son canlı üretim 48 / 2.0.0, dahili test 49 / 2.1.0.

Güncel Claude düzeltmeleri ile #71, #117, #118, #140, #141, #142, #143 ve #144 birleşti. İlgisiz eski Expo test taslağı #1 açık bırakıldı. 130 Android release birim testi, 154 backend testi, hedefli cihaz testleri (47 toplam, 1 atlama, 0 hata) ve lint (0 hata) geçti. İmzalı yerel 49→50 güncellemesinde kayıtlar korundu. Destek sitesindeki `/story/quiet-morning` 404 sorunu giderildi; gizlilik ve hesap silme sayfaları erişilebilir.

Fiziksel cihazda **Play üzerinden 48→50 güncelleme, kayıt koruma, TalkBack, performans ve canlı ölçüm kabulü** açık. Google-imzalı universal APK’da sertifika ve App Links alan adı doğrulandı; Play hesabı olmayan emülatör tam Play kullanıcı yolculuğunu doğrulamaya yetmedi. 19 Ekim başvurusu sırasında SEO dil sayfaları içerik taslağıydı ve pilot içeriği henüz yayımlanmamıştı. Sonraki beş pilot yayını yukarıdaki 20 Ekim kontrolünde doğrulandı.

[Ayrıntılı 50 yayın kaydı](native-android/docs/RELEASE_50_STATUS.md) · [Makine okunabilir paket ve başvuru kanıtı](native-android/docs/release-evidence/2026-10-19-production-50.json)

Aşağıdaki tarihli notlar geçmiş kayıtlardır.

## Birleştirmeler — 17 Ekim 2026

Yayın kurulumu kaydı (#67), emülatör imajı indirmesini tekrar deneyen CI düzeltmesi (#70), alıştırma basamaklarının ikinci adımı (#74, Q5.8) ve App Links uygulama yönlendirmesi (#72, Q6) ana dala birleşti; ana dal CI'ı yeşil. Dahili testteki 49 bu değişiklikleri içermez; bunlar **en az 50** sürüm koduyla yeni pakette kullanıcıya ulaşır. App Links için `story.html` web karşılığının Hosting'e yayımlanması ve kurulu/kurulu değil cihaz denemesi açık.

## Hesap ve yayın kurulumu — 16 Ekim 2026

Canlı Play Console’da **48 / 2.0.0 üretimde %100** olarak doğrulandı. GitHub `release` ortamı ve beş zorunlu secret kuruldu; **49 / 2.1.0** için [ilk yüklemesiz CI çalışması](https://github.com/yurkenn/english-tales/actions/runs/38959199613) başarılı. Daha yeni kaynak commit `6f48040` ile hazırlanan 49 paketi 16 Ekim 23:38 TRT’de dahili testte yayımlandı; üretim 48 olarak kaldı. İlk altı migration’a ek olarak FSRS migration’ı da ayrı onayla canlıya uygulandı; 144 backend testi, yayın yedeğinin yerel geri yüklemesi, içerik bütünlüğü ve RLS kontrolleri geçti. Data safety güncellendi ve Google incelemesine gönderildi. `englishtales-app.web.app` için assetlinks.json yayımlandı, Google `linked: true` doğruladı. [Kanıtlar, migration eşlemesi ve kalan işler](senin-adimlarin.md).

Kullanıcı 16 Ekim’de mağazadaki **48 / 2.0.0** paketinde TalkBack yolculuğunu sorunsuz tamamladığını bildirdi; Q3 kapanışı için yeni erişilebilirlik kodunu içeren paketin testi hâlâ gerekli. Dahili kanal elle yüklemesi tamamlandı. İsteğe bağlı servis hesabıyla otomatik Play yüklemesi, Analytics canlı olay kabulü açık; App Links yönlendirmesi 17 Ekim'de ana dala girdi (#72). Aşağıdaki önceki tarihli yayın notları tarihseldir; güncel durum için yukarıdaki kayıt esas alınır.

## Erişilebilirlik ve içerik denetimi — 16 Ekim 2026

Q3 erişilebilirlik/yerelleştirme işleri ana dala birleşti: 306 ekran metni `strings.xml`'e taşındı (#30), TalkBack rol ve etiketleri eklendi (#31), uygulama geneli koyu tema (#32) ve fontScale 2.0 / küçük ekran düzeni (#34). Otomatik denetimler (`AccessibilityAuditTest`, `TaleColorsContrastTest`, `DarkThemeTest`, `LargeTextLayoutTest`) eklendi. Kullanıcı mağazadaki 48 / 2.0.0 ile ana TalkBack yolculuğunu sorunsuz denediğini bildirdi; Q3 değişikliklerini içeren yeni paket testi bekleniyor.

[İçerik denetimi](native-android/docs/CONTENT_QUALITY_AUDIT.md) (#33) paket ile canlı yayını karşılaştırır. 50 hikâye ve 1.002 cümle eşleşiyor; ancak 43 kelime/ifade ID'si canlıda yok ve 39 hikâye etkileniyor. A1/A2 sözlük kapsaması hedefin (%60) altında: canlıda A1 %23,5, A2 %15,4. Bu çalışma canlı veriyi değiştirmedi.

Bu güncellemede Play Console durumu kontrol edilmedi ve yeni yayın yapılmadı. 48 / 2.0.0 inceleme sonucu belgelenmedi; #7 sonrası uygulama değişiklikleri kullanıcıya bir sonraki sürümle (49) ulaşacak. Takip: [kalite yol haritası](native-android/docs/QUALITY_ROADMAP.md).

## Kalite güncellemesi — 15 Ekim 2026

Q1 geliştirmeleri (#15–#21) ve kalite yol haritası (#14) ana dala birleşti. Birleşik APK 7,9 MB / AAB 11,18 MB; 29 JVM ve 61 backend testi başarılı. GitHub emülatöründe 139 testten 136'sı geçti, özel servis yapılandırması gerektiren 3 test atlandı. Debug lint: 0 hata / 30 uyarı. İmza, üretim bağlantısı ve statik 16 KB kontrolleri geçti.

Güncelleme bildiriminin Activity yeniden oluşturulunca kaybolması ve kapanmış ekrana gelen geç Play yanıtları düzeltildi. Crashlytics kodu ana dalda; Play beyanı ve yeni mağaza sürümü açık yayın adımlarıdır. Güncel gizlilik sayfası Firebase CLI ile yayımlandı ve canlı içerik kaynakla karşılaştırıldı. Q2.2 için yedi ürün olayı ve Ayarlar’da başlangıçta kapalı “Kullanım istatistikleri” seçeneği eklendi. Katılım geri çekilebilir; ad/e-posta, içerik kimliği/metni ve cevaplar özel olaylara eklenmez. [Firebase Analytics canlı kabulü ve yayın adımları](native-android/docs/PRODUCT_ANALYTICS.md) açık; [performans altyapısı ve profilleri eklendi](native-android/docs/PERFORMANCE.md). Kalıcı depoda profil üretimi 2/2, üç Macrobenchmark senaryosu 3/3 geçti; imzalı APK/AAB içinde profiller, imza, üretim adresi ve statik 16 KB hizalama doğrulandı. [PR #26 ve CI](https://github.com/yurkenn/english-tales/pull/26/checks). Fiziksel cihaz karşılaştırması, TTFD ve sürüm otomasyonu açık; bu kontrol için Play yüklemesi yapılmadı.

CLI ile GA4 bağlantısı ve Android stream doğrulandı. Analytics rapor/retention API çağrıları mevcut oturumun OAuth kapsamı yetersiz olduğu için 403 döndürdü; canlı olay alımı ve panel ayarları henüz doğrulanmadı. Ayrıntılar ve kalan yetkilendirme adımı [ürün ölçümleri belgesinde](native-android/docs/PRODUCT_ANALYTICS.md).

[Kalite yol haritası ve doğrulama sınırları](native-android/docs/QUALITY_ROADMAP.md) · [Kademeli yayın kontrol listesi](native-android/docs/STAGED_RELEASE.md).

Aşağıdaki 48 / 2.0.0 mağaza başvurusu tarihsel son kayıttır; bu kalite çalışmasında Play Console durumu tekrar kontrol edilmedi ve yeni yayın yapılmadı.

## Yeni özellik — kısa seviye testi

Onboarding ve Profilim → Ayarlar’dan açılan dokuz soruluk A1–A2–B1 başlangıç önerisi eklendi. Test çevrimdışı çalışır; atlanabilir, cevaplar Analytics’e gönderilmez. Kullanıcı sonucu kabul etmeden seviye değişmez; Ayarlar’da ayrıca kaydetmek gerekir. [Puanlama, kayıt davranışı ve doğrulama kapsamı](native-android/docs/READING_PLACEMENT.md).

## Yeni özellik — cümlede boşluk doldurma

Oyna ekranına hikâye cümlesi, Türkçe ipucu ve dört İngilizce seçenekle çalışan yeni alıştırma eklendi. En fazla beş farklı kelime; tekrar zamanı gelen/kaydedilen kelimeler ve seviye öncelikli. Tamamlanan oturum mevcut puan, günlük hedef ve kelime tekrarı yolunu kullanır. [Soru üretimi, durum koruması ve kayıt sözleşmesi](native-android/docs/SENTENCE_GAP.md). Bu özellik için Play yüklemesi yapılmadı.

## Kısa durum

Uygulama Kotlin ve Jetpack Compose ile native Android olarak geliştiriliyor. Kütüphanedeki **50 hikâye canlı içerik servisinde yayımlandı**. Yeni marka, maskot ve mağaza paketi hazır. **48 / 2.0.0 üretimde %100 yayımlandı; bu durum 16 Ekim 2026’da Console’dan doğrulandı. 49 / 2.1.0 yalnız dahili testte yayımlandı.**

## Tamamlanan çalışmalar

### Hikâye kütüphanesi

- Mevcut 6 özgün hikâyeye 44 klasik hikâye uyarlaması eklendi; toplam 50 hikâye üretim içerik servisinde yayımlandı.
- İçerik toplamı: 1.002 İngilizce/Türkçe cümle çifti ve 316 kelime kaydı.
- Klasikler Külkedisi, Rapunzel, Pamuk Prenses ve Karlar Kraliçesi gibi tanınan anlatıların seviyeye göre hazırlanmış kısa uyarlamalarıdır. Tam özgün baskı metinleri olarak sunulmaz.
- Yayımlanan kayıtlar, metinler, kelime bağlantıları ve kapak dosyaları kontrol edildi; önceki 6 hikâyenin içerikleri korundu.
- Native uygulamada canlı katalog, hikâye indirme ve çevrimdışı açılış denendi.
- Üretim verileri güncellendi; test içerik projesine yayın yapılmadı.

### Marka ve uygulama arayüzü

- YUR/KEN tipografisi uygulama açılışında kısa yayıncı ekranı olarak kullanıldı.
- Yeni uygulama ikonu için mavi kitap maskotu kullanıldı.
- Maskotun karşılama, düşünme, kutlama ve destek ifadeleri hazırlandı.
- Maskot başlangıç/karşılama, sonuç, boş kelime listesi ve yanlış cevap geri bildirimi gibi uygun ekranlara eklendi.
- Çalışma, okuma, oyun, puan, seri ve çeviri ikonları yenilendi.
- Kütüphanedeki aktif tanıtım banner'ı da kitap maskotuna geçirildi. Önceki analizdeki “kullanılmıyor” tespiti düzeltildi.
- Kullanılmayan eski kadın görseli kaynaklarda tutuluyor; release kaynak küçültme etkin. Tamamen silindiği iddia edilmez.

Marka kaynakları: [English Tales](brand/english-tales/README.md), [maskot ifadeleri](brand/english-tales/expressions/README.md), [Yurken](brand/yurken/README.md).

### İçerik paneli oturumu

- Yayıncı paneline isteğe bağlı “oturumu hatırla” davranışı eklendi.
- Tarayıcıda yalnız proje kapsamındaki yenilenen refresh token saklanır; erişim token'ı bellekte tutulur, parola kaydedilmez.
- Oturumun devamı sunucunun token geçerliliğine ve tarayıcı depolamasının korunmasına bağlıdır; süresiz giriş garantisi verilmez.

### Google Play mağaza hazırlığı

- 512 × 512 opak ikon, Türkçe ve İngilizce 1.024 × 500 tanıtım görselleri hazırlandı.
- Gerçek Compose ekranlarından 6 adet 1.080 × 1.920 mağaza ekran görüntüsü alındı. Arayüz dili Türkçedir; kontrollü örnek kelime verileri kullanılmıştır.
- Türkçe ve İngilizce başlık, kısa/uzun açıklama ve sürüm notları hazırlandı.
- Yeni ikon, altı ekran görüntüsü, İngilizce tanıtım görseli ve EN/TR açıklamalar Play Console taslağına kaydedildi. Türkçe tanıtım görseli ayrıca yüklenip Türkçe taslağa kaydedildi.
- Form yeniden açılarak İngilizce taslağın kalıcı olduğu doğrulandı; Türkçe değişikliklerde “Your changes have been saved” sonucu görüldü.
- AI görsel beyanı tamamlandı: ikon ve iki tanıtım görseli “AI ile üretildi” olarak etiketlendi; gerçek ekran görüntüleri etiketlenmedi.
- Fransızca, Almanca ve İspanyolca kayıtlardaki eski vaatler (topluluk, yazar takibi, TOEFL) kaldırıldı; metinler EN sürümünün çevirisiyle değiştirildi ve depoya eklendi.
- Yeni mağaza görsellerinin herkese açık sayfada yayımlandığı henüz doğrulanmadı.

Dosyalar: [Google Play mağaza paketi](native-android/store/google-play/README.md).

### İmzalama ve yeni sürüm

- Mevcut Expo/EAS hesabındaki `yurken/english-tales` projesinden eski Android yükleme anahtarı indirildi; yeni anahtar oluşturulmadı.
- Anahtarın SHA-1 sertifikası önceki Play kaydıyla eşleşti: `EF:07:C9:73:55:FD:F7:63:14:C7:AA:94:6E:FC:A4:44:D7:2D:48:30`.
- Özel yerel imzalama ayarı kuruldu. Anahtar ve parolalar bu belgeye veya Git'e eklenmedi; `signing.properties` Git tarafından yok sayılıyor.
- `assembleRelease` ve `bundleRelease` başarıyla tamamlandı: **48 / 2.0.0**.
- APK/AAB imzası, üretim servis adresi, test servisinin pakette bulunmaması, APK ZIP 16 KB hizalaması ve iki ELF64 kütüphanesinin hizalaması doğrulandı.
- Üretim reklamları kapalı tutuluyor. Test reklamı üretime açılmadı.

Yerel çıktılar:

- APK: `native-android/app/build/outputs/apk/release/app-release.apk`
- AAB: `native-android/app/build/outputs/bundle/release/app-release.aab`
- Doğrulama raporu: `native-android/app/build/outputs/release-verification.json`
- Derleme günlüğü: `/tmp/english-tales-release-48-build.log` (geçici dosya)
- AAB SHA-256: `14a342c5315155c9f4c996cf931989c1c435302c93a0c8067961e0accbce7ace`

## Doğrulama sonuçları

| Kontrol | Sonuç |
| --- | --- |
| Android cihaz testleri | 128/128 geçti |
| JVM birim testleri | 23/23 geçti |
| Backend testleri | 57 test geçti |
| ELF doğrulayıcı regresyonları | 6 test geçti |
| Debug derleme ve lint | Başarılı |
| İmzalı release APK ve AAB derlemesi | Başarılı |
| Release statik paket ve imza kontrolleri | Başarılı, sürüm 48 / 2.0.0 |
| Mağaza varlık ölçü/boyut kontrolleri | Başarılı |
| Play tarafından üretilen yeni split APK'lar | Henüz doğrulanmadı |
| Yeni release paketinin gerçek 16 KB cihaz testi | Henüz yapılmadı |

Önceki sürümlerde yapılan kontroller, yeni 48 numaralı paket için yapılmış gibi değerlendirilmemelidir. Derleme Gradle 9 uyumluluğuna ilişkin kullanım dışı özellik uyarısı verdi; mevcut Gradle 8.13 derlemesi başarılıdır.

## Google Play'de mevcut durum

- Uygulama kimliği: `com.yurken.englishtales`.
- Son doğrulanan üretim sürümü: **46 / 1.1.0**.
- Son doğrulanan dahili test sürümü: **47 / 2.0.0**.
- Yeni aday: **48 / 2.0.0**.
- Yeni üretim sürümü hazırlama formu açıldı; AAB yüklenmedi, sürüm notları girilmedi ve üretime gönderim yapılmadı.
- Mağaza metin/görsel taslakları ile canlı uygulama sürümü farklı aşamalardadır. Taslak kaydı yayın anlamına gelmez.
- 15 Ekim 2026: 48 (2.0.0) AAB üretim kanalına yüklendi; 5 dilde sürüm notları girildi, %100 dağıtımla kaydedildi.
- Play'in AD_ID hatası (beyan “kullanıyor”, eski aktif sürümlerde izin yok) bu sürüm için “Release without permission” ile geçildi; 48 paketinde AD_ID izni bulunuyor.
- 15 Ekim 2026: 20 değişiklik (48 sürümü + mağaza kaydı + gizlilik URL'si) Google incelemesine gönderildi; durum “Changes in review”. Managed publishing kapalı: onaylanınca otomatik ve %100 yayımlanır. İnceleme sonucu gelmeden “yayında” olarak işaretleme.

## Devam edilecek işler

1. Mağazadaki AI görsel beyanını tamamla, diğer mevcut dillerin metin/görsellerini gözden geçir ve mağaza değişikliklerini kaydet.
2. Yeni imzalı release paketini çalışma zamanı açısından doğrula; Play yüklemesinde daha yüksek sürüm kodu bulunmadığını kontrol et.
3. 48 numaralı AAB'yi yükle, sürüm notlarını gir ve Play'in paket/uyumluluk sonuçlarını incele.
4. Uygulama erişimi, veri güvenliği, reklam ve içerik beyanlarının son paketin gerçek davranışıyla eşleştiğini kontrol et.
5. Uygun yayın kontrolleri tamamlanınca değişiklikleri Google incelemesine gönder. İnceleme sonucu gelmeden “yayında” olarak işaretleme.
6. Play'in ürettiği paketleri ve güncelleme yolunu doğrula; kullanıcı ilerlemesinin korunmasına özellikle bak.
7. Bekleyen kaynak/doküman değişikliklerini commit et, GitHub dalını güncelle ve mevcut PR durumunu tamamlanan doğrulamalara göre güncelle.

## Git kontrol noktası

Bu kayıt hazırlanırken dal `codex/classic-story-library`, son yerel commit `c2c7550` (`feat: prepare branded native release and publish classic library`) idi. Mağaza dosyalarının `store/` yerine `native-android/store/` altına taşınması ve bu durum belgesi ayrı bir commit olarak eklendi; iki commit de uzak depoya gönderildi.

Mevcut PR: [GitHub PR #6](https://github.com/yurkenn/english-tales/pull/6). PR'ın varlığı, yeni release'in üretime yayımlandığı anlamına gelmez.
