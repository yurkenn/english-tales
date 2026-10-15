# English Tales — son çalışmalar ve yayın durumu

Son güncelleme: **15 Ekim 2026** (Türkiye saati). Bu dosya, tamamlanan çalışmaları ve devam edilecek yayın adımlarını kaydeder.

## Kalite güncellemesi — 15 Ekim 2026

Q1 geliştirmeleri (#15–#21) ve kalite yol haritası (#14) ana dala birleşti. Birleşik APK 7,9 MB / AAB 11,18 MB; 29 JVM ve 61 backend testi başarılı. GitHub emülatöründe 139 testten 136'sı geçti, özel servis yapılandırması gerektiren 3 test atlandı. Debug lint: 0 hata / 30 uyarı. İmza, üretim bağlantısı ve statik 16 KB kontrolleri geçti.

Güncelleme bildiriminin Activity yeniden oluşturulunca kaybolması ve kapanmış ekrana gelen geç Play yanıtları düzeltildi. Crashlytics kodu ana dalda; gizlilik sayfası/Play beyanı ve yeni mağaza sürümü açık yayın adımlarıdır. Q2'nin ürün olayları, performans ölçümü ve sürüm otomasyonu işleri sürmektedir; tamamlandıkları iddia edilmez.

[Kalite yol haritası ve doğrulama sınırları](native-android/docs/QUALITY_ROADMAP.md) · [Kademeli yayın kontrol listesi](native-android/docs/STAGED_RELEASE.md).

Aşağıdaki 48 / 2.0.0 mağaza başvurusu tarihsel son kayıttır; bu kalite çalışmasında Play Console durumu tekrar kontrol edilmedi ve yeni yayın yapılmadı.

## Kısa durum

Uygulama Kotlin ve Jetpack Compose ile native Android olarak geliştiriliyor. Kütüphanedeki **50 hikâye canlı içerik servisinde yayımlandı**. Yeni marka, maskot ve mağaza paketi hazır. **48 / 2.0.0 üretim kanalına yüklendi ve mağaza güncellemesiyle birlikte 15 Ekim 2026'da Google incelemesine gönderildi. İnceleme sonucu henüz gelmedi.**

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
