# Yayın çalışması ve geri dönüş kayıtları

11 Ekim 2026

## Kontrol noktası kuralı

1. Aşama öncesi analiz ve kabul senaryolarını yaz.
2. Bağımsız aşamayı tamamla ve ilgili testleri çalıştır.
3. Git indeksinde gizli bilgi/oluşturulan dosya kontrolünü çalıştır.
4. Açıklayıcı commit ve `checkpoint/` etiketi oluştur; ikisini GitHub'a gönder.
5. Otomatik kontrollerin sonucunu incele; başarısızsa aşamayı tamamlandı sayma.

Çalışma dalı: `codex/native-release-preparation`. GitHub'daki daha yeni React Native geçmişi ana dalda korunur. Ana dalı eski yerel kopyayla zorla değiştirme.

İlk kontrol noktası: `checkpoint/native-local-transfer-20261011` (`b1f0bbd`), çalışan native uygulama/panel ve doğrulanmış yerel misafir aktarımı. 11 birim + 45 cihaz testi; 0 Lint hatası.

İkinci kontrol noktası: `checkpoint/native-cleanup-ci-20261011` (`4452172`), eski yığının arşivlenmesi, yeni README ve GitHub Actions. Yerelde 35 servis/istemci testi, panel HTTP kontrolü ve release küçültme derlemesi geçti. İlk GitHub çalışmasındaki kaldırılmış SDK paketi sorunu `fb30a7a` ile düzeltildi. [38131794441](https://github.com/yurkenn/english-tales/actions/runs/38131794441) çalışmasında depo, servis ve Android kontrollerinin üçü de başarılı.

## İmzalı paket aşaması

Mevcut EAS yükleme anahtarı Play sertifikasıyla eşleşti. Sürüm 47 / 2.0.0 APK ve AAB, küçültme ve kaynak daraltmayla derlendi. APK sertifikası, AAB imzası ve APK ZIP 16 KB hizalaması doğrulandı. Özel imza dosyaları Git dışında tutulur; release görevi eksik imza veya servis ayarıyla durur.

**16 KB kontrolü düzeltildi:** İlk aracımız geçerli RELRO/LOAD sınır eşleşmesini hata saydı. Android Studio'nun resmi prefix/suffix kurallarıyla düzeltildi; altı regresyon testi geçti. ARM64/X86_64 statik kontrol başarılı. Aynı küçültülmüş imzalı APK, 16 KB x86_64 emülatöründe açıldı (`pageSizeCompat=0`); ayrı imzalı probe kütüphaneyi doğrudan başarıyla yükledi. [Analiz, kanıt ve tekrar çalıştırma](PAGE_SIZE_VERIFICATION.md). ARM64 gerçek cihaz ve Play split APK testi hâlâ açık.

Bu paket test Supabase projesine bağlı teknik adaydır; üretim için tamamlanmış sayılmaz. Play tarafından üretilen APK'lar, eski 46 sürümü üzerine güncelleme ve mağaza imzasıyla Google girişi henüz doğrulanmadı.

Üçüncü kontrol noktası: `checkpoint/native-signing-audit-20261011` (`86268b4`). İmza ayarları, gizli dosya koruması ve ilk 16 KB kontrolü kaydedildi. İlk kontrolün yanlış hatası yukarıdaki sonraki aşamada düzeltildi. Güncel bağımlılıkla 11 birim + 45 cihaz testi geçti; debug/release Lint ve APK/AAB derlemesi başarılı. Cihaz testleri APK güncelleme üzerinden çalıştırıldı; gerçek Google oturumu için uygulama kaldırılmadı. Bu etiket başarılı mağaza adayı anlamına gelmez.

## Temizlik analizi

Eski Expo/React Native/Sanity kaynakları yeni Android veya içerik panelinin bağımlılığı değildir. Eski kaynaklar ve yerel bağımlılıklar `C:/projects/english-tales-legacy-20261011/` içine taşındı. Bu arşiv yerel ayarlar içerebilir; GitHub'a yüklenmez. Eski kod ayrıca ilk Git kontrol noktasında korunur.

Android kapakları, katalog, panel kaynakları, şemalar, migration dosyaları ve testler tutulur. İmzalar, servis ayarları, cihaz yedekleri ve derleme önbellekleri Git'e girmez. Native test ve derleme klasörünü gerçek kullanıcı yedeği varken topluca silme.

## Geri dönüş

Kaynak kodu için önce çalışma dalını koru; hedef etiketten ayrı bir dal veya ayrı checkout aç. Henüz doğrulanmamış düzeltme için ilgili commit'i geri alan yeni commit oluştur. Paylaşılmış Git geçmişini zorla geriye taşıma.

Git etiketi veritabanını veya Supabase'i geri döndürmez. Şema değişikliği için önce yedek ve uyumluluk analizi gerekir; canlı migration geri alınırken veriyi kaybetmeyen düzeltme migration'ı tercih edilir. Android'de daha yeni Room verisiyle eski APK açmak downgrade hatası verebilir; kullanıcı verisini silerek geri dönüş yapma.

## Kalan yayın kapıları

Uygulama eşitleme bağlantısı eklendi: otomatik/elle tek hesap sırası, bir olay/tur, yeni kopya/atomik uygulama, hesap isteğinde geç yanıtı iptal etme, 401 oturum doğrulaması ve hesap ekranı durumları. [Analiz ve sınırlar](LEARNING_SYNC_EXECUTION.md). Önceki atomik birleştirme kontrol noktasının [GitHub çalışması](https://github.com/yurkenn/english-tales/actions/runs/38147594025) başarılı.

Bu aşamada 87 cihaz testi (9 yeni), 11 birim testi, debug/release Lint ve imzalı APK/AAB derlemeleri başarılı. Kontrollü testlerde otomatik giriş/alım, çıkış esnasında geciken yanıt, 45+25=70, kayıp yanıtın aynı UUID ile tekrar teslimi, kuyruk turları, yanlış hesap kopyası, kirli tercihler ve 401 kontrol edildi. Yeni testte oturum süresi yanlışlıkla saniye cinsinden verilmişti; milisaniye olarak düzeltildi. Ayrıca iki ekran akışının yayınlanma sırası düzeltildi ve tam test paketi yeniden geçti.

Güncel teknik aday APK SHA256 `6971f3293996eeb099ebec20a3d768a778e805ec7d4ea8693e40428a68bc01db`; AAB SHA256 `dc4acb8ab2a4cd2aba82dab20e92584137ece7d3d6c860e1090023369715a74a`. İmzalar ve statik 16 KB kontrolleri başarılı. Aşağıdaki eski aday hash'leri geçmiş aşamaların kaydıdır. Gerçek Google hesabıyla ağ/ikinci cihaz akışı, tercih yazımı ve kalıcı arka plan işi henüz doğrulanmadı/tamamlanmadı. Test hizmetine bağlı bu aday Play'e yüklenmedi.

Atomik birleştirme aşaması: Room 6 ve veri silmeyen 5→6 geçişi, eski cihaz katkısı, tam kopya koruması ve misafir aktarımı sonrası yeniden temel hesaplama hazır. 78 cihaz testi, 11 birim testi, debug/release Lint ve yayın derlemeleri başarılı. [Ayrıntı ve açık entegrasyon kapıları](CLOUD_RECONCILIATION_PLAN.md).

Bu aşamanın güncel imzalı adayları: APK SHA256 `c0c782e890d97b05ecd4910759c7732807f980b0c1dd28cf2bd41fcc585ae6d3`; AAB SHA256 `00b50247187954636d9b3621042630de2e98d9ba2720b2852ca58217fd0b6e21`. İmzalar ve statik 16 KB hizalaması doğrulandı. Paket hâlâ test hizmetine bağlı ve öğrenme çalıştırıcısı/UI henüz bağlı değil; mağazaya yüklenmedi. Önceki Android kopya ayrıştırma kontrol noktasının [GitHub çalışması](https://github.com/yurkenn/english-tales/actions/runs/38145684612) başarılı.

Room 6 açılmış cihazda eski Room 5 APK'ya dönmek veri silmeden çalışmaz. Kaynak geri alındığında Room 6 uyumluluğunu koruyan düzeltme gerekir; eski APK'yı zorla açmak veya downgrade için veriyi silmek doğru geri dönüş değildir. Play'e sürüm yüklendikten sonra düzeltme daha yüksek sürüm koduyla çıkarılmalıdır.

Öğrenme gönderim temeli `checkpoint/learning-upload-20261011` (`c3c40d0`) ile GitHub'a gönderildi. Gönderici henüz otomatik/UI akışında çalışmıyor. Sunucu snapshot kontrol noktası `068f891` için [GitHub kontrolleri](https://github.com/yurkenn/english-tales/actions/runs/38144712469) başarılı.

Sonraki Android snapshot doğrulama aşamasında debug/release derlemeleri, 11 birim testi ve iki Lint kontrolü geçti. İmzalı 47/2.0.0 paketleri yeniden üretildi; APK/AAB imzaları ve 16 KB statik hizalaması başarılı. Bu adayın APK SHA256 değeri `daf8fb84d91e0ffb435452414b88fad174df5098bde5dfa40777f022b47fb80a`, AAB SHA256 değeri `e5adbfd2840a84caa6a7d5ecfa93c0d447c3e7574200566d99a2db4a109aa759`. Bunlar önceki 16 KB kontrol noktası dosyalarının yerine yeni aday hash'leridir; yeni paket için Play dağıtım testi yapılmadı.

16 KB aşaması `checkpoint/native-16kb-verified-20261011` (`6251a4b`) ile kaydedildi. [GitHub kontrolü](https://github.com/yurkenn/english-tales/actions/runs/38144231831) üç işte başarılı. Sonraki sunucu snapshot aşamasının [analizi ve açık Android kabul kapısı](CLOUD_RECONCILIATION_PLAN.md).

- Canlı öğrenme gönderimi, sunucu durumunu alma ve iki cihaz eşitlemesi.
- Yeni hesap/kurtarma/silme; erişilebilir gizlilik ve hesap silme sayfaları.
- Üretim servis/panel dağıtımı, yedek geri yükleme ve güvenlik doğrulaması.
- İçerik/UI/ses/erişilebilirlik ve gerçek cihaz kontrolü.
- Play Console en yüksek sürüm kodu, yükleme anahtarı ve Play App Signing sertifikası.
- İmzalı AAB, mağaza beyanları ve beta; aynı release adayı üzerinde son kontrol.

Bu kapılar kapanmadan uygulama mağazaya hazır sayılmaz.

## Arka plan ve üretim temeli kontrol noktası — 11 Ekim 2026

Yerel işlemleri bekletmeyen ağ eşitlemesi, sürüm kontrollü tercih yazımı, kullanıcı seçimiyle çakışma çözümü ve ağ koşullu WorkManager işleri tamamlandı. 96 cihaz testi, 11 birim testi, debug/release Lint ve imzalı APK/AAB kontrolleri başarılı. Gerçek Google hesabının 14 olayı test hizmetine teslim edildi; 70 yerel puan korundu. Önceki aday hash ve eksik tercih/arka plan ifadeleri tarihsel kayıttır; güncel kanıt LEARNING_SYNC_EXECUTION.md dosyasındadır.

Kullanıcının oluşturduğu Frankfurt FREE üretim projesine şema ve taslak katalog kuruldu; otomatik RLS yardımcı işlevinin API erişimi kapatıldı. Üretim kurulumu henüz yayınlanmış uygulama anlamına gelmez. PRODUCTION_SETUP.md açık adımları izler.

## Hesap işlemleri ve üretim katalog kontrol noktası — 11 Ekim 2026

Üretimde altı hikâye ve 81 cümle gerçek yüklenmiş kapaklarla yayınlandı. Oturumsuz katalog erişimi ve yönetici/öğrenme erişiminin reddi doğrulandı. E-posta kayıt, OTP doğrulama, parola kurtarma ve onaylı hesap silme ekranları eklendi. Test/üretim silme işlevleri aktif; gerçek kişisel hesap silinmedi. Kalıcı yerel temizlik makbuzu uygulama yeniden açılışını kapsar ve diğer hesapların verilerini korur.

106 cihaz testi, 46 backend testi, 11 birim testi, debug/release Lint ve içerik panelinin HTTP kontrolü başarılı. Sürüm 47 / 2.0.0 imza ve 16 KiB kontrollerinden geçti. APK SHA256: `e5ce54921a2f3e9e45766d3a02b738c347924263036aaa759e691f81c3dc292e`. AAB SHA256: `11f656b17c9365573db653f2263909ae3631f35982d1d223004e7afdff4feccd`. Paket hâlâ test hizmeti yapılandırmasını kullanır; üretim mağaza adayı değildir.

Brevo Free kayıt ekranı kullanıcıya hazırlandı, Türkçe/İngilizce kod şablonları kaydedildi. SMTP bağlantısı ve teslimat bekleniyor. Diğer açık hesap kapıları ACCOUNT_LIFECYCLE_EXECUTION.md, gönderim adımları EMAIL_DELIVERY_SETUP.md içinde izlenir.

## Gerçek SMTP teslimatı — 11 Ekim 2026

Hesap sahibi Brevo anahtarını üretim Supabase'e bağladı. İki OTP şablonu üretime kaydedildi ve önizlemeleri doğrulandı. Gerçek kurtarma isteği HTTP 200 döndü; Brevo saat 21:46 (İstanbul) Gmail'e Delivered kaydı gösterdi. Alan adı olmayan gönderen Brevo alanına çevrildi. SMTP teslimatı kanıtlandı; uygulama içindeki gerçek doğrulama/parola değiştirme testi ve diğer mağaza kapıları devam ediyor.
