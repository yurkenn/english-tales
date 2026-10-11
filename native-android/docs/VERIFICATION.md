# Kontrol sonuçları — 10 Ekim 2026

## Canlı Android içeriği — 11 Ekim 2026

Android artık Supabase test projesinden yayımlanmış kataloğu, seçilen sürümün metin/kelime bağlantılarını ve özel Storage kapağını okuyabiliyor. Atomik önbellek, SHA-256/boyut kontrolü, okuyucu sürümü, yeni sürümde yüzde sıfırlama ve indirmeleri kaldırma eklendi.

11 birim + 21 cihaz testi geçti. Lint: 0 hata, 17 uyarı. Canlı indirme ve ağsız yeniden yükleme cihaz testinde; The Paper Boat indirme, Wi-Fi/mobil veri kapalı açılış ve ikinci sayfada devam arayüzden doğrulandı. Önceki 70 puan/9 kelime korundu. Hesap, eşitleme, üretim servisi ve fiziksel cihaz testleri sonraki aşamalar. [Analiz ve sonuç](REMOTE_CONTENT_PLAN.md).

## Önceki referans ve katalog kontrolü

### Ortam

- Medium_Phone Android emülatörü, normal görünümde 1080 × 2400 piksel / 420 dpi; küçük ekran denemesinde 720 × 1280 piksel / 320 dpi ve sistem yazı boyutu 2,0.
- Güncel debug APK emülatöre mevcut veriler korunarak yüklendi.
- Derleme ve Android Lint tamamlandı: 0 hata, 17 uyarı. Uyarılar bağımlılık sürümleri, yedekleme yapılandırması, başlatıcı simgesi ve KTX kullanım önerileriyle ilgili. Derleyici ayrıca ClickableText kullanımının eski API olduğunu bildiriyor.

## Tamamlanan kontroller

- Önceki oturumda sohbet başlangıcı, A1/tür seçimi, kitaplık → hikâye → okuyucu geçişi, cümle çevirisi, kelime kutusundan kayıt ve hikâyeyi bitirme doğrulandı.
- İlk referans sürümünde çeviri, eşleştirme, kart ve harf alıştırmaları beşer kelimeyle tamamlandı. Her sonuç ekranında 25 puan doğrulandı.
- Son sürümde büyük yazıyla çeviri cevapları, kart ve sonuç ekranındaki düğmeler kontrol edildi. Kart alıştırması beş kelimeyle tamamlandı ve 25 puan verdi. Kısa ekranlarda alıştırma içeriği kaydırılabilir.
- Kitap detayındaki seviye ve paylaşım düğmeleri, alt menü ve banner büyük yazıda kesilmiyor. Büyük yazı ayarında kelime aşaması kartları geniş satırlar halinde gösterilir; normal ayarda referanstaki üç sütun korunur.
- Altı kitabın arama listesinde görünmesi ve yeni The Red Umbrella kitabının açılması doğrulandı. Yeni `umbrella` kelimesi okuyucudan kaydedildi; ilk cümlenin Türkçe çevirisi açıldı.
- Katalog kontrolü: altı kapak dosyası, 81 İngilizce/Türkçe cümle çifti, 39 benzersiz kelime ve her seviyede iki hikâye.
- Güncellemeden sonra önceki kayıtlar korundu. Son yeniden açma kontrolündeki kayıtlar: 125 puan, 5 alıştırma, 1 günlük seri, `bakery` ve `umbrella` kelimeleri; önceki `quiet-morning` hikâyesi %100. Kapatma öncesi ve sonrası veritabanı kayıtları karşılaştırıldı.
- Ses motorunda başlatma, elle durdurma ve kısa sayfanın tamamlanması kontrol edildi. Ses bitince “Sayfayı dinle” düğmesi geri geldi. Farklı ses istekleri ayrı kimliklerle izlenir; önceki isteğin geri çağrısı yeni isteği durdurmaz.
- Emülatörün crash günlüğünde kayıt yoktu.
- Kitaplık, detay ve dört alıştırma ekranının görüntüleri görsel olarak incelendi. Referans karşılaştırması `reference-comparison.jpg`; alıştırma görünümü `practice-overview.jpg`.

## Sınırlar

- Seslendirme bitişinde oynatma durumunu temizleyen motor geri çağrıları eklendi; gerçek cihazda duyulan sesin kalitesi bu kontrolde değerlendirilmedi.
- Kontroller emülatörde yapıldı. Gerçek cihaz, TalkBack ile tam yolculuk ve ekran döndürme kontrolleri henüz tamamlanmadı. Temel simge düğmelerine erişilebilir adlar ve alt menüye seçili sekme bilgisi eklendi.
- Altı örnek hikâye ve 39 kelime bulunuyor. Üretim içeriği ve uzaktan içerik yayını sonraki aşamada.
- Debug APK deneme içindir. Mağaza sürümünün imzalanması ve Play Console sürüm numarası doğrulaması henüz yapılmadı.


## Günlük öğrenme akışı — son kontrol

- Son derleme ve Android Lint başarılı: **0 hata, 20 uyarı**. Uyarılar bağımlılık güncellemeleri, başlatıcı simgeleri, yedekleme yapılandırması ve KTX kullanım önerileriyle ilgili; yeni hatırlatıcıda Android 24/26 ayar ekranı farkı ele alındı.
- **8 birim testi geçti:** seri kopması, aynı gün seri artmaması, yıl sınırı, doğru/erken/yanlış tekrar ve 30 gün aralık sınırı.
- **5 emülatör entegrasyon testi geçti:** tekil oturum ödülü, günlük hedef, gün değişimi ve seri, kelime planının yeniden açılışta korunması, tercihler, ilerlemenin gerilememesi ve SQLite 2 → 3 güncellemesi. Testler ayrı veritabanı/tercihler kullanır.
- Güncelleme denemesinde önceki 125 puan, 5 çalışma, iki kelime ve üç hikâyenin ilerlemesi korundu. Ardından yalnızca emülatör uygulama verisi temizlenerek yeni kullanıcı akışı denendi.
- Yeni kullanıcı A1 / Günlük yaşam / 2 adım seçti; A Quiet Morning doğrudan açıldı. İlk kullanım rehberi kapatıldı, okuma tamamlandı; sonuç ekranı 1/2 hedef gösterdi.
- “4 kelimeyi kaydet ve çalış” ile aynı hikâyenin quiet/morning/bakery/smile kelimeleri açıldı. Dört doğru cevap 20 puan verdi; hedef 2/2 oldu. Dört kelime ertesi güne planlandı. Uygulama kapatılıp açılınca bu kayıtlar korundu.
- Yeni kullanıcının yerel olayları doğrulandı: birer kurulum başlangıcı/tamamlanması, günlük açılış, okuyucu açılışı, okuma tamamlanması, çalışma tamamlanması ve hedef; dört kelime kaydı. Uzak analiz sistemi henüz yok.
- Yanlış çeviri cevabından sonra doğru anlam ve “Anladım, devam et” düğmesi ekranda kaldı. Kullanıcı devam edince sonraki soru açıldı; yarıda bırakılan çalışma günlük hedefe sayılmadı.
- Kart çalışmasının ikinci kelimesi ve açık anlamı yatay/dikey dönüşte korundu. Yatay görünümde alttaki düğmeler kaydırılarak erişilebilir. Kart çalışması tamamlandığında 25 puan daha yazıldı; toplam 45 puan, 2 çalışma ve 3 günlük adım oldu. Aynı oturumun iki kez yazılmaması ayrıca entegrasyon testinde doğrulandı.
- Ayarlardan isim Ada, seviye A2, tür Macera, hedef 3 adım olarak değiştirildi. Ana plan A2 hikâyesi The Paper Boat'ı önerdi; yeniden açılışta 3/3 ve 45 puan korundu.
- Hatırlatıcı ilk açılışta izin istemedi. Ayarlardan açılırken Android bildirim izni gösterildi. Ret sonrası açıklama görüldü ve uygulama kullanılabildi; sonraki açık kullanıcı eyleminde izin verilip 19:00 hatırlatıcısı planlandı. Android alarm kayıtlarında uygulamanın isteği görüldü. Kapatma tercihi false olarak kaydedildi; tekrar açma ve saat seçme ekranı da denendi.
- Bildirim açılışının taşıdığı yönlendirme, uygulama zaten açıkken denendi: ayarlardan günlük plana döndü.
- Günlük plan 720×1280 / 320 dpi / sistem yazı boyutu 2,0 ile üst ve kaydırılmış bölümde görsel olarak kontrol edildi. Hikâye eylemi ve haftalık etkinlik erişilebilir; ardından 1080×2400 / 420 dpi / yazı 1,0 geri yüklendi.

### Yeni görüntüler

- `preview-onboarding-goal.png`, `preview-reader-first-use.png`, `preview-reading-result.png`
- `preview-practice-daily-result.png`, `preview-practice-answer-feedback.png`, `preview-daily-plan.png`
- `preview-profile-journey.png`, `preview-profile-achievements.png`, `preview-settings-journey.png`, `preview-settings-reminder.png`, `preview-reminder-denied.png`
- `preview-daily-plan-large-text.png`, `preview-daily-plan-large-text-lower.png`

### Kalan doğrulamalar

Gerçek cihazlarda pil tasarrufu altındaki zamanlı bildirim teslimatı ve hedef tamamlanınca gönderimin atlanması henüz uçtan uca gözlenmedi. Android alarmı dakika kesinliği vermez. İzin, tercih, alarm planlama ve günlük hedef kararı ayrı doğrulandı. Tam TalkBack yolculuğu, ses kalitesi ve düşük donanım performansı henüz değerlendirilmedi. Kullanıcı geri dönüş oranına ilişkin sonuç yok; mevcut kontroller akışın çalıştığını gösterir.

## Supabase veri altyapısı — 10 Ekim 2026

- İki migration ile sürümlü içerik, yayın/Storage izinleri ve kullanıcıya ait öğrenme kayıtları hazırlandı.
- Altı hikâye ve 81 cümle çiftinin taslak aktarımı, altı kapak için gerçek dosyadan SHA-256/boyut manifesti üretildi. Aktarım dosyası hiçbir hikâyeyi kendiliğinden yayımlamaz.
- **19 yerel PostgreSQL testi geçti:** kullanıcı ayrımı, editör/yayıncı yetkisi, yayın öncesi içerik kontrolü, değiştirilemeyen yayın, tekrar gönderimde tek ödül, geciken kelime/ilerleme olayları, tercih çakışması, seri ve hesap silme.
- Sonraki panel aşamasında bu sayı **23** oldu; atomik içerik kaydı, taslak sürümü ve eski düzenleme çakışması eklendi. Gerçek kapak dosyasıyla yerel HTTP/kayıt/yayın/yeniden başlatma akışı da geçti. [Güncel servis doğrulaması](../backend/VERIFICATION.md).
- Test motoru gerçek SQL/RLS/transaction çalıştırır; Auth/Storage test tablolarıyla temsil edilir. Canlı token, dosya yükleme, HTTP ve eşzamanlı ağ istemcileri henüz denenmedi.
- Bu aşamada Android kodu ve APK değiştirilmedi; çalışan uygulamaya bulut hesabı veya ölçüm servisi eklenmedi.

Ayrıntılar: [servis doğrulama kaydı](../backend/VERIFICATION.md) · [kurulum planı](../backend/README.md).

## Room ve çevrimdışı kuyruk — 10 Ekim 2026

- Son derleme ve Lint başarılı: **0 hata, 17 uyarı**. Room 2.8.5, KSP2 ve v4 şema dosyası eklendi.
- **11 birim testi**: mevcut sekiz öğrenme politikası; ön plan/arka plan saati, checkpoint başlangıcı ve backend ile aynı revision UUID'si.
- **14 cihaz veritabanı testi**: eski kontrollerle birlikte SQLite 1/2/3 → Room 4, tercihler/tekrar tarihlerinin korunması, değişmez kuyruk, transaction geri alma, tekrar ödül, cümle konumu, yarım oturum, ayrı hesap dosyaları, gönderim sahibi ve retry, kaynak/zaman hataları.
- Emülatörün v3 verisiyle gerçek geçiş: önceki 45 puan, 2 çalışma, 4 kelime ve Ada/A2/Macera/3 hedefi korundu. Eski %100 hikâye kaydı korunurken eksik geçmiş için kuyruk üretilmedi.
- The Paper Boat ikinci sayfası `pb-9`/revision/yüzde 88 olarak yazıldı. Uygulama kapatılıp açıldı; aynı sayfa açıldı. Okuma ve beş soruluk çalışma 25 yeni puan verdi: 70 puan, 3 çalışma, 9 kelime.
- Android'den çıkan 14 gerçek işlem gövdesi yerel PostgreSQL sunucu sözleşmesine uygulandı; tamamı kabul edildi. 14 tekrarın tümü `applied=false`; sunucu yalnızca yeni 25 puanı saydı.
- Yeni görseller: `preview-reader-resume.png`, `preview-offline-practice-result.png`.

Henüz canlı Auth/Storage/HTTP bağlantısı, ilk hesap bağlama veya ağ worker'ı yok. Ani süreç kaybı aktif sürenin son birkaç saniyesini kaybettirebilir. Testlerin uygulamayı kaldırabilmesi nedeniyle emülatörün öğrenme verisi kontrol öncesinde yedeklendi ve kontrol sonunda geri yüklendi. [Analiz ve sonuç](OFFLINE_DATA_PLAN.md).

## Uzak içerik ve ilk hesap paketi — 11 Ekim 2026

- Uzak yayımlanmış katalog, metin/kelime/kapak indirme, hash/boyut doğrulama ve çevrimdışı önbellek uygulandı. Gerçek test projesinden içerik indirme ve arayüzde ağ kapalı okuma doğrulandı. [İçerik kontrolü](REMOTE_CONTENT_PLAN.md).
- Profil üzerinden mevcut hesapla giriş/çıkış; şifreli kalıcı oturum, yenileme ve hesap başına ayrı yerel kayıt eklendi. Hesap değişimi açık ekranları sıfırlar; eski ekranın sıradaki eylemleri yeni hesaba yazılmaz.
- Son derleme başarılı. **11 birim + 29 cihaz testi geçti; Lint 0 hata / 17 uyarı.** Cihaz testleri: 15 öğrenme/veritabanı, 6 içerik/önbellek, 6 oturum servisi, 2 hesap geçişi.
- Oturum kontrolleri gerçek Android Keystore ve kontrollü Auth yanıtlarıyla yapıldı; kişisel hesapla canlı giriş ayrıca doğrulandı. Uygulama zorla kapatılıp açıldı: aynı hesap ve sunucudan doğrulanmış oturum, A1 profili, 20 puan, 4 kelime, 2/1 günlük adım korundu. Parola/token okunmadı.
- Test öncesindeki tam emülatör verisi geri yüklendi. Profilde Ada, A2/Macera, 70 puan ve 9 kelime korundu. Giriş ekranının boş/kapalı düğme durumu görsel olarak incelendi.
- Misafir aktarımı, öğrenme kuyruğunun canlı gönderimi, iki cihaz eşitlemesi ve yeni hesap/kurtarma/silme henüz uygulanmadı. [Hesap planı ve sonuç](ACCOUNT_SYNC_PLAN.md).

## Misafir başlangıcı ve Google girişi — 11 Ekim 2026

- İlk açılışta Google, e-posta veya misafir seçimi eklendi. Google için Credential Manager, rastgele nonce / SHA-256 ve Supabase ID token değişimi; çıkışta Credential Manager oturum temizliği bağlandı.
- Google Cloud'da mevcut proje/web istemcisi ve yeni native debug imzası kayıtlı; Supabase test projesinde Google etkin. Nonce kontrolü açık. Genel Auth settings uç noktası Google sağlayıcının açık ve anonim hesap oluşturmanın kapalı olduğunu doğruladı.
- **11 birim + 34 cihaz testi geçti, Lint 0 hata / 19 uyarı.** Önceki 29 teste nonce, Google gövdesi/UID, ret/iptalde eski kayıtların korunması ve Google hesabının misafirden ayrımı eklendi.
- Yeni misafir akışı ayrı geçici uygulama dosyalarıyla baştan sona denendi; A1 / Günlük yaşam / 1 adım → ilk hikâye → kapat/aç → ana plan. Başlangıç ve seçimler korundu. Orijinal uygulama dosyaları geri yüklendi; gerçek hesaptaki 20 puan / 4 kelime ve doğrulanmış oturum korundu.
- Gerçek Google ekranı açıldı; iptal sonrası düğmeler kullanılabilir ve kayıtlar yerinde. Kullanıcı Google hesabını ekleyip girişi tamamladı. Uygulamaya dönüşte yeni hesabın başlangıcı görüldü; kontrol için A1 / Günlük yaşam / 1 adım seçilip ilk hikâye açıldı. Hesap ekranında oturum sunucudan doğrulandı. Zorla kapat/aç sonrası aynı hesap e-postası, doğrulanmış oturum, profil ve hedef korundu. Kişisel parola/kod/token okunmadı.
- Mağaza imzası, OAuth marka/gizlilik doğrulaması ve gerçek cihaz kontrolleri açık. Misafir aktarımı / bulut eşitlemesi bu pakette tamamlanmadı. [Aşama analizi](GUEST_GOOGLE_PLAN.md).

## Yerel misafir aktarımı — 11 Ekim 2026

- **11 birim + 45 cihaz testi geçti; Lint 0 hata / 19 uyarı.** Yeni 11 aktarım testi; Room v5 migration, tekrar/kesinti, farklı hedef, tercih ve silme önceliği, sürümlü konum, takvim, eski toplamlar ve transaction geri alma kontrollerini kapsar.
- Kullanıcı hedef olarak açık Google hesabını seçti. Gerçek hesap ekranındaki onayla 70 puan, 9 kelime ve 2 hikâye geçmişi aktarıldı. Uygulama zorla kapatılıp yeniden açıldı: 70 puan / 9 kelime ve Google hesabının A1 / Günlük yaşam / 1 hedefi korundu.
- Kaynak misafir 0 puan / 0 kelime, aktarım günlüğü `completed`; hedefte tek makbuz ve doğru sahipli kuyruk doğrulandı. Diğer e-posta hesabının ayrı 20 puan / 4 kelimesi korundu. Eski ölçülmemiş 45 puan / 2 çalışma hedef makbuzunda ayrıca saklandı; sahte oturum üretilmedi.
- Öncesi ve sonrası cihaz yedekleri yerel derleme klasöründe saklandı. APK güncellemesi ve instrumentation uygulamayı kaldırmadan yürütüldü; Keystore/oturum korundu. Test dosyaları gerçek kullanıcı verisinden ayrıdır.
- Bu paket **yerel aktarım** yapar; canlı öğrenme gönderimi ve iki cihaz eşitlemesi henüz yok. [Analiz ve sonuç](GUEST_TRANSFER_PLAN.md) · [Aktarım sonrası](preview-guest-transfer-home.png).
