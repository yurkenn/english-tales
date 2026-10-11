# English Tales — Google Play yayın yol haritası

11 Ekim 2026 · Mevcut proje incelemesine dayalı plan

**Güncelleme:** Android canlı test kataloğu ve seçilen hikâye/kelime/kapak indirmesi uygulandı. 11 birim + 21 cihaz testi geçti; arayüzden ağ kapalı okuma doğrulandı. [Aşama sonucu](REMOTE_CONTENT_PLAN.md). Aşağıdaki başlangıç tablosu plan hazırlanırken alınan durumu gösterir; hesap/eşitleme, üretim ve mağaza işleri hâlâ açık.

**Hesap aşaması ilk adımı:** Mevcut hesapla giriş/çıkış, şifreli oturum ve yerel hesap ayrımı uygulandı. Güncel kontrol 11 birim + 29 cihaz testi, Lint 0 hata / 17 uyarı. Kişisel hesapla canlı giriş ve uygulamayı kapatıp açınca aynı oturum/kayıtların korunması doğrulandı. Misafir aktarımı, iki cihaz eşitlemesi, kayıt/kurtarma/silme tamamlanmadı; Aşama 2 hâlâ açık. [Hesap analizi](ACCOUNT_SYNC_PLAN.md).

## 1. Nerede olduğumuz

**Misafir/Google güncellemesi:** Üç seçenekli başlangıç, native Google hesap seçicisi ve Supabase Google sağlayıcısı/debug imzası bağlandı. Son kontrol 11 birim + 34 cihaz testi; Lint 0 hata / 19 uyarı. Misafir başlangıcı ve Google iptali gerçek arayüzde denendi. Gerçek Google girişi, sunucudan oturum doğrulama ve kapat/aç sonrası aynı hesap/profilin korunması tamamlandı. Aşama 2 ve mağaza imzası kontrolleri açık. [Giriş seçenekleri](GUEST_GOOGLE_PLAN.md).

**Yerel aktarım güncellemesi:** Room v5 ile misafir geçmişi seçilen hesaba bir kez taşınır; yarıda kalan aktarım aynı hedefte sürdürülebilir. Kullanıcının seçtiği Google hesabına 70 puan / 9 kelime aktarıldı; kapat/aç sonrası korundu. E-posta hesabının 20 puan / 4 kelimesi ayrı kaldı. Bulut gönderimi ve ikinci cihaz eşitlemesi sonraki iştir. [Aktarım sonucu](GUEST_TRANSFER_PLAN.md).

Uygulama henüz mağaza yayınına hazır değil. Native öğrenme deneyimi ve gerçek içerik yönetimi çalışıyor; Android ile canlı servis arasındaki bağlantı ve üretim doğrulamaları tamamlanmalı.

| Alan | Doğrulanan durum | Yayın için kalan |
| --- | --- | --- |
| Android | Kotlin/Compose; başlangıç, katalog, okuyucu, kelimeler, dört çalışma türü, günlük hedef, profil, hatırlatıcı; uzak indirme ve gerçek giriş | Eşitleme, hesap yaşam döngüsü, gerçek cihaz ve release kontrolleri |
| Yerel veri | Room v5, hesaplara ayrı veri alanı, değişmez gönderim kuyruğu, misafir aktarımı | Ağ gönderimi, sunucu özetiyle uzlaştırma, cihazlar arası çakışmalar |
| İçerik servisi | Gerçek Supabase test projesi; 6 yayımlanmış hikâye, 81 iki dilli cümle, 6 kapak; Android çevrimdışı indirme | Üretim ortamı, içerik hacmi |
| İçerik paneli | Gerçek hesapla giriş, düzenleme, sürümleme, kapak yükleme, yayın/arşiv ve işlem geçmişi | HTTPS üzerinden dağıtım, operasyon ve canlı güvenlik senaryoları |
| Kontroller | Android: 11 birim + 45 cihaz testi; backend: 27 SQL + 8 istemci testi; gerçek indirme/giriş/yerel aktarım | İkinci cihaz eşitlemesi, gerçek donanım ve release denemeleri |
| Mağaza paketi | Paket adı korunuyor; SDK 36; release küçültme açık | Orijinal imza/yükleme anahtarı, son sürüm kodu, imzalı AAB, mağaza beyanları |

Android lint sonucu 0 hata ve 19 uyarı. Uyarılar tek tek değerlendirilmeli. Debug APK ve emülatör başarısı mağaza sürümünün doğrulandığı anlamına gelmez. Panel şu anda yerel bilgisayarda çalışıyor. Android canlı test kataloğunu kullanır; servis erişilemediğinde geçerli önbellek veya başlangıç içeriği sunar.

## 2. Önerilen ilk yayın kapsamı

- Misafir olarak öğrenmeye hemen başlama; hesabı ilerlemeyi korumak ve başka cihazda devam etmek için isteğe bağlı sunma.
- A1/A2/B1 hikâyeler; çeviri, kelime kaydı, okuma konumu, kelime tekrarları ve günlük plan.
- Kullanıcının indirdiği içerikle çevrimdışı öğrenme; bağlantı gelince güvenilir eşitleme.
- EWA ekranlarının düzen, yoğunluk ve etkileşim yaklaşımına yakın; English Tales'a ait görseller ve içerik.
- İlk yayın için ücretsiz, reklamsız, aboneliksiz kapsam önerisi. Bu bir ürün önerisidir; gelir modeli kararı kesinleşmeden ödeme sistemi eklenmez.
- Supabase kalıcı içerik/hesap/öğrenme kaydı; Firebase Analytics ve Crashlytics ölçüm/hata takibi. Firebase bağlantısı henüz uygulanmadı.

İlk yayın sonrasına bırakılacaklar: ligler, sosyal akış, arkadaş daveti, yapay zekâ sohbeti, iOS, abonelikler ve karmaşık kişiselleştirme. Temel öğrenme döngüsü ve kalite önce tamamlanmalı.

## 3. Aşamalar ve tamamlanma ölçütleri

### Aşama 0 — Mağaza kimliği ve yayın sınırları

**Öncelik: Yayını engeller. İlk teknik kontrol.**

- Play Console'daki uygulama kaydı, üretim erişimi, geliştirici hesap türü ve açık politika/kimlik doğrulama bildirimlerini kontrol et.
- `com.yurken.englishtales` paket adını mevcut kayıtla doğrula.
- Play App Signing, yükleme sertifikası ve anahtarın erişilebilirliğini kontrol et. Anahtar/parola sohbet veya kaynak koduna konmaz.
- Console'da kullanılmış en yüksek versionCode'u bul; projedeki geçici 4 değerini buna göre güncelle.
- Hedef ülkeler, desteklenecek diller, hedef yaş grubu, destek adresi ve ilk gelir modelini belirle. Çocuklara yönelik kapsam seçilirse içerik, SDK ve beyan planını ayrıca incele.
- Eski React Native verilerini sıfırlama tercihini koru; mağazadaki eski sürümden yeni sürüme kurulumun sorunsuz gerçekleştiğini yine de test et.

**Bitti sayılır:** Aynı mağaza kaydına güncelleme gönderebildiğimiz doğrulanmış; imza, sürüm kodu ve kapsam kararları kayda alınmış.

Mevcut uygulamayı güncellemek için paket adı ve imza uyumu, daha yüksek sürüm kodu gerekir. [Google Play güncelleme kuralları](https://support.google.com/googleplay/android-developer/answer/9859350).

### Aşama 1 — Android'i gerçek içerik servisine bağlama

**Öncelik: Yayını engeller. Sıradaki geliştirme işi.**

- Ağ izni ve istemci katmanı; servis ayarları; sayfalı yayımlanmış katalog okuma.
- Taslakların Android'e görünmediği gerçek servis kontrolü.
- Hikâye ve kapakları indirme; indirme durumu, tekrar deneme ve çevrimdışı açıklamaları.
- Geçici dosyaya indirme → boyut/hash kontrolü → başarılıysa mevcut önbelleği değiştirme. Hatalı indirme çalışan içeriği bozmaz.
- Açık okuyucuda içerik sürümünü sabitleme; yeni yayınla okuma konumunu kaybetmeme.
- Disk sınırı, indirmeyi kaldırma, depolama dolması ve yarıda kalan indirmeyi toparlama.
- İlk açılışta servis erişilemezse kullanılabilir başlangıç içeriği; sonraki açılışlarda son geçerli katalog.
- Arşivlenen içerik ve indirilmiş eski sürüm davranışını mevcut eşitleme sözleşmesine uygun sunma.

**Bitti sayılır:** Panelden yeni bir hikâye yayımlanınca uygulama güncellemesi olmadan görünür; indirme sonrası internet kapalıyken okunur; bozuk indirme ve yeni yayın mevcut ilerlemeyi bozmaz.

### Aşama 2 — Hesap, misafir ilerlemesi ve eşitleme

**Öncelik: Hesaplı yayın için zorunlu. Aşama 1 üzerine kurulur.**

- Kayıt, e-posta doğrulama, giriş, çıkış, parola sıfırlama ve uygulamaya dönüş bağlantıları.
- Misafir ilerlemesini hesaba yalnızca bir kez bağlayan, çatışma kuralları açık aktarım.
- Token yenileme ve güvenli cihaz saklaması; süresi dolmuş oturumun öğrenmeyi kaybettirmemesi.
- Kalıcı işlem kuyruğunu arka planda gönderme; geçici hatalarda bekleyerek tekrar deneme; kalıcı hataları görünür hâle getirme.
- Aynı işlem iki kez ulaşınca çift puan/çift çalışma oluşmaması; sunucunun hesapladığı özetle yerel görünümü uzlaştırma.
- A hesabından çıkıp B hesabına girince veri ve bekleyen işlemlerin karışmaması.
- İki cihazda çevrimdışı çalışma, geç gelen olaylar, tercihler ve saat dilimi değişimi.
- Ayarlarda hesabı/veriyi silme; sunucuda ilişkili kayıtların temizlenmesi ve eski oturumların erişiminin kesilmesi. Yeni kayıt veya misafir kullanımıyla eski silinmiş kuyruğu tekrar göndermeme.

**Bitti sayılır:** Misafir öğrenir → hesap açar → ikinci cihazda devam eder → çevrimdışı çalışır → yeniden bağlanınca tek doğru sonuç görür. Hesap değişimi ve silme veri sızıntısı oluşturmaz.

### Aşama 3 — Üretim servisi ve panel işletimi

**Öncelik: Gerçek kullanıcılardan önce zorunlu.**

- Test ve üretim verisini/ayarlarını ayır; geçişleri kayıtlı ve tekrar uygulanabilir tut.
- Paneli HTTPS üzerinden yayımla; üretim yönlendirme adreslerini ve yetkileri sınırla.
- Normal kullanıcı, ikinci normal kullanıcı, editör, yayıncı ve anonim kullanıcıyla gerçek erişim matrisi testi.
- Canlı oturum yenileme, eşzamanlı düzenleme/yayın, gerçek dosya silme ve yarım kalan yükleme temizliğini doğrula.
- Açık parola koruması uyarısını incele; plan desteği ve maliyetini doğrulamadan ücretli yükseltme yapma.
- Yedek kapsamı/sıklığı/saklama süresi belirle; veritabanı ve medya için gerçek geri yükleme denemesi yap.
- Servis kesintisi, depolama büyümesi, hata kayıtları ve bütçe uyarıları; kullanıcı verisi içermeyen tanılama.
- İçerik yanlış yayımlanırsa önceki geçerli sürüme dönme prosedürü; veri şeması değişirken eski uygulama sürümlerine uyumluluk.

**Bitti sayılır:** Yetkisiz erişim senaryoları reddedilir; yedekten geri yükleme kanıtlanır; içerik ve servis arızasında uygulanacak müdahale adımları bellidir.

### Aşama 4 — Tasarım kalitesi ve ilk açılıştan sonuca kullanıcı deneyimi

**Öncelik: Kullanıcının talebi doğrultusunda yayın öncesi kalite kapısı. Aşama 1 ile birlikte başlayabilir.**

- Referans ekranlarla başlangıç, kitaplık, hikâye detayı, okuyucu, kelime kutusu, kelimeler, dört alıştırma ve profil için yan yana karşılaştırma.
- Tek tip yazı, simge, boşluk, kapak oranı, köşe, renk ve düğme durumları; Android sistem çubukları ve ekran kenarı yerleşimleri.
- Yeni hesap, indirme, hata ve ayar ekranlarını aynı tasarım diliyle tamamlama.
- Yükleniyor, boş liste, arama sonucu yok, internet yok, süresi dolan oturum ve başarısız kayıt durumlarında açık yönlendirme.
- İlk açılışta kullanıcının seviye/hedef seçip bir hikâyeye ulaşması; bitince kelime çalışmasına ve ertesi günün planına geçmesi.
- Küçük ekran, büyük yazı, klavye, TalkBack, kontrast, dokunma alanı, geri tuşu, ekran dönüşü ve uygulamanın arka planda kapanması.
- Seslendirme, okuma hızı, mevcut ses bulunamaması, ses kesintileri ve kulaklık değişimi için anlaşılır davranış.

**Bitti sayılır:** Ana yolculuklarda taşma, kapalı düğme veya kaybolan konum yok; referans karşılaştırmaları ve gerçek cihaz görüntüleri onaylanabilir durumda.

### Aşama 5 — İçerik ve ses kalite süreci

**Öncelik: İlk gün ve sonraki günler için yeterli değer. Teknik işlemlerle birlikte yürütülebilir.**

- Mevcut altı hikâyeyi seviye, dil bilgisi, doğal Türkçe çeviri ve kelime anlamı açısından editör kontrolünden geçir.
- Önerilen yayın hedefi: A1/A2/B1'e dengeli dağılmış 18–30 nitelikli hikâye. Bu mağaza zorunluluğu değil, ürün kapsamı önerisidir.
- Günlük öğrenme planına göre en az 7–14 günlük anlamlı içerik çeşitliliğini pilot kullanıcıyla kontrol et; sayı tek başına yeterlilik ölçüsü değildir.
- Her kelimenin cümle bağlantısı, bağlama uygun anlamı, örneği ve telaffuzu; kapak/metin uyumu.
- Cihaz TTS kalitesini farklı cihazlarda değerlendir. Kalite hedefini karşılamayan hikâyeler için lisanslı veya özgün ses kaydı üretimini planla.
- İçerik, görsel ve sesin kullanım haklarını/provenansını kayıt altına al.
- Taslak → editör kontrolü → telefon önizlemesi → yayın → kullanıcı hata bildirimi → yeni sürüm süreci.
- Uygulamada hikâye/çeviri hatasını bildirme ve destek yolu.

**Bitti sayılır:** Yayın kataloğu editör kontrolünden geçmiş; seviyeler dengeli; ses vaatleri mevcut özelliklerle uyumlu; düzenli içerik üretiminin sorumlusu belli.

### Aşama 6 — Ölçüm, performans ve dayanıklılık

**Öncelik: Gerçek cihaz ve beta aşamasında zorunlu.**

- Firebase Analytics/Crashlytics bağlantısını veri envanteriyle birlikte kur; e-posta, parola, token veya hikâye metnini olay/hata kaydına gönderme.
- Kurulum → ilk hikâye → tamamlama → ilk kelime çalışması akışını ölç.
- D1/D7 geri dönüş, zamanlı tekrar tamamlama ve farklı günlerde doğru cevaplar. Aktif süreyi uygulamanın açık kalma süresinden ayır.
- Release sürümünde başlangıç süresi, kaydırma takılması, bellek, ağ/disk yükü, pil ve indirme boyutunu ölç; cihaz bazlı başlangıç değerleri ve hedefleri kaydet.
- Düşük kapasiteli gerçek cihaz, güncel cihaz; desteklenen API 24–36 aralığının uçları ve davranış değişiklikleri olan sürümlerde kontrol.
- Bildirim izni reddi, pil tasarrufu, cihaz yeniden açılması, saat dilimi, düşük depolama, işlem öldürülmesi ve ağ kopması.
- R8 küçültülmüş sürümde ağ/serileştirme, veri geçişi ve hata raporlarını doğrula; kritik akışlarda açık çökme/ANR/veri kaybı hatası bırakma.

**Bitti sayılır:** Test matrisi ve ölçüm raporu mevcut; bilinen kritik kusur yok; hata raporları doğru sürüme bağlanıyor. Az sayıda test oturumundan temsili çökmesiz kullanıcı yüzdesi iddia edilmez.

### Aşama 7 — Gizlilik ve mağaza sunumu

**Öncelik: Başvuru öncesi zorunlu; gerçek SDK/veri davranışı kesinleşince sonlandırılır.**

- Toplanan veri, amaç, servisler, saklama/silme süresi ve destek iletişimi envanteri.
- Uygulamadan ve webden erişilen gizlilik politikası; hesap silme talep sayfası.
- Data Safety beyanı: uygulama ve kullanılan SDK'ların gerçek davranışıyla eşleşmeli.
- Yaş/hedef kitle, içerik derecelendirme, reklam durumu ve gerekli erişim beyanları.
- İnceleme ekibinin erişmesi gereken hesaplı özellikler için ayrı test hesabı ve açık talimatlar; kişisel panel hesabını paylaşma.
- Gerçek release ekranlarından mağaza görselleri; ikon, tanıtım görseli, açıklama, destek adresi ve sürüm notları. Çalışmayan özellik veya kanıtlanmamış öğrenme sonucu vaat etme.

**Bitti sayılır:** Kamuya açık bağlantılar çalışır; mağaza beyanları uygulama ile aynı; incelemeci gerekli akışlara erişebilir.

Uygulamada hesap oluşturma varsa hesap silmeyi başlatmak için uygulama içi yol ve uygulama dışından kullanılabilen web kaynağı gerekir. [Hesap silme gereklilikleri](https://support.google.com/googleplay/android-developer/answer/13327111). Veri güvenliği formu kullanılan SDK'ları da kapsar. [Data Safety rehberi](https://support.google.com/googleplay/android-developer/answer/10787469).

### Aşama 8 — İmzalı mağaza paketi ve beta

**Öncelik: Son teknik yayın kapısı.**

- Üretim ayarlarıyla imzalı AAB oluştur; gizli anahtarları pakete koyma; yükleme anahtarını güvenli sakla.
- Sürüm kodunu doğrula; test servis adresleri, demo kullanıcıları ve debug seçeneklerini çıkar.
- AAB'nin ürettiği APK'ları, bağımlılıkları, izinleri ve 16 KB uyumunu kontrol et.
- Aynı release adayında temiz kurulum ve mağazadaki eski sürüm üzerine güncelleme denemesi.
- Internal test → gerçek kullanıcılarla kapalı beta → kusur düzeltmeleri → son aday.
- Play ön yayın raporlarını incele; otomatik raporu gerçek cihaz denemeleriyle tamamla.
- Beta görevleri: ilk hikâyeyi bul, çeviri/kelime kullan, indirip çevrimdışı oku, tekrar çalış, hesapla ikinci cihazda devam et, destek ve hesap silme yolunu bul.

**Bitti sayılır:** Üretimle aynı imzalı aday üzerinden tüm temel görevler geçer; açık kritik hata yok; Console başvuruyu engelleyen eksik göstermiyor.

11 Ekim 2026'da kontrol edilen resmi kurala göre yeni Android telefon uygulaması ve güncellemeleri API 36 veya üzerini hedeflemeli; proje zaten 36 kullanıyor. [Hedef API gerekliliği](https://developer.android.com/google/play/requirements/target-sdk). Son paket için 16 KB uyumu ayrıca doğrulanmalı. [Android 16 KB rehberi](https://developer.android.com/guide/practices/page-sizes).

12 testçi/14 gün şartı 13 Kasım 2023 sonrasında açılan belirli kişisel hesapların üretim erişimi içindir. Mevcut yayımlanmış uygulamaya otomatik olarak uygulanmış kabul etmiyoruz; Console durumu kontrol edilecek. [Test gerekliliği](https://support.google.com/googleplay/android-developer/answer/14151465).

### Aşama 9 — Yayın ve ilk haftanın işletimi

- Son adayın sürümünü, veri şemasını, içerik sürümlerini ve test raporunu kaydet.
- Console koşulları ve kullanıcı hacmi uygunsa kademeli dağıtım; kullanıcı yoksa düşük yüzde tek başına yeterli test verisi sağlamaz.
- İlk 24 saat ve ilk hafta: çökme/ANR, giriş, indirme, eşitleme, destek ve içerik hatalarını takip et.
- Kritik hata: dağıtımı durdur; gerekirse sorunlu içeriği arşivle; düzeltmeyi daha yüksek sürüm koduyla yayımla. Dağıtımı durdurmak kurulmuş sürümleri geri almaz.
- Haftalık içerik planını kapasiteye göre başlat; ilk gerçek verilerle akış kaybı ve D1/D7 değerlendirmesi.

**Bitti sayılır:** Mağazada erişilebilir sürüm, çalışan destek/silme yolları, sağlıklı servis ve ilk hafta kontrol kaydı mevcut.

## 4. Yayın kararı kontrol listesi

- [ ] Mağaza kimliği, imza ve sürüm kodu doğrulandı.
- [ ] Panelden yayın → Android katalog → indirme → çevrimdışı okuma çalışıyor.
- [ ] Misafir → hesap → ikinci cihaz → yeniden eşitleme veri kaybetmiyor.
- [ ] Tekrarlanan işlem çift ödül vermiyor; farklı hesaplar arasında veri karışmıyor.
- [ ] Hesap silme, sunucu temizliği ve eski oturum erişimi kontrol edildi.
- [ ] Editör onaylı içerik ve referanslarla karşılaştırılmış UI hazır.
- [ ] Gerçek cihaz, büyük yazı, TalkBack, ses, bildirim ve release testleri tamamlandı.
- [ ] Üretim yetkileri, yedek/geri yükleme ve hata takibi doğrulandı.
- [ ] Gizlilik/silme web sayfaları, Data Safety ve mağaza materyalleri tamamlandı.
- [ ] İmzalı AAB, 16 KB uyumu ve eski mağaza sürümünden güncelleme geçti.
- [ ] Yayını engelleyen kusur veya Console bildirimi yok; destek/müdahale sorumlusu belli.

## 5. Uygulama sırası ve karar noktaları

Ana sıra: **0 → 1 → 2 → üretim doğrulaması → release beta → mağaza başvurusu.** Tasarım ve içerik çalışması 1. aşamadan itibaren birlikte ilerlemeli. Gizlilik envanteri başta açılır, SDK ve hesap davranışları kesinleşince beyanlar sonlandırılır.

Her yeni aşama öncesi kısa analiz: mevcut durum, değişecek alanlar, kullanıcıya etkisi, kabul senaryoları ve servis maliyeti. Sonra uygulama ve sonuç raporu. Bu plan aşamaların tamamlandığı anlamına gelmez; her kapı gerçek sonuçlarla işaretlenecek.

İlk somut çalışma paketi: mağaza paket/imza/sürüm incelemesiyle birlikte Android uzak katalog ve güvenilir indirme/önbellek planını hazırlamak; ardından bu bağlantıyı tamamlamak. Panelde yeniden tasarım yapmadan mevcut yayın akışını Android'de kullanılabilir hâle getirmek.

Gerektiği aşamada kullanıcıdan alınacak bilgiler: Play Console durumu ve son sürüm kodu; anahtarın güvenli konumu; destek e-postası/alan adı; hedef yaş/ülke/dil; gelir modeli kararı; gerçek cihaz ve beta katılımcıları. Parola, oturum tokenı veya özel anahtarın sohbet üzerinden paylaşılması gerekmez.

Takvim, anahtar erişimi, içerik üretimi, gerçek cihaz/beta sonuçları ve Google incelemesine bağlıdır. Bu kontrollerden önce kesin yayın tarihi veya tamamlanma yüzdesi verilmez. Politika kaynakları yükleme günü yeniden kontrol edilecek.
