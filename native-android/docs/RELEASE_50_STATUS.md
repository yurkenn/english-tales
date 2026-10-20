# 50 / 2.2.0 — 19 Ekim 2026

## 20 Ekim takip kontrolü

Play Console tekrar salt okunur açıldı: **50 / 2.2.0 hâlâ “In review / Changes in review”; 48 / 2.0.0 “Available on Google Play”.** Yönetilen yayın kapalı, son yayımlama tarihi 16 Ekim. Yeni ret veya tamamlanmış 50 yayını görülmedi. İncelemedeki başvuru, mağaza kaydı ve dağıtım ayarları değiştirilmedi. [Güncel kontrol kaydı](release-evidence/2026-10-20-play-status.json).

Aşağıdaki bilgiler 19 Ekim başvurusunun tarihsel kanıtıdır.

Durum: **19 Ekim 2026 19:48 TRT’de üretim başvurusu gönderildi.** Console: **Changes in review**; Google hızlı kontrolleri çalışıyor. 50 / 2.2.0, %100 dağıtım ve 27 değişiklik birlikte başvuruda. Henüz canlı yayın doğrulanmadı; son canlı üretim 48 / 2.0.0, dahili test 49 / 2.1.0. Yönetilen yayın kapalı: onaylanan değişiklikler otomatik yayımlanır.

- Güncel Claude düzeltmeleri, ilk açılış dil seçimi, yerelleştirilmiş Yurken adı ve sürüm notları birleşik adayda.
- 12 arayüz dili / 11 hikâye çevirisi dili; es-ES eş metniyle 13 mağaza kaydı. İngilizce arayüzde hikâye çevirisi Türkçedir.
- 130 release birim testi, 154 backend testi ve lint (0 hata, 68 uyarı) geçti. İlgili tam CI: https://github.com/yurkenn/english-tales/actions/runs/39239785432.
- Hedefli cihaz senaryolarında hata yok; yapılandırma gerektiren canlı içerik testi atlandı. XML sayıları son kanıt kaydında tutulur.
- İmzalı 49 / 2.1.0 üstüne 50 / 2.2.0 veri silmeden kuruldu. A1, günlük hedef, son hikâye ve kaydedilen shepherd kelimesi korundu. Kelime tekrarı tamamlandı, 5 puan ve günlük hedef kaydedildi; yeniden açılışta onboarding tekrarlanmadı.
- EN/TR gerçek native ekran görüntüleri ve yeni Yurken Stories tanıtım görseli hazırlandı. Diğer diller güncel varsayılan görselleri kullanır; tüm diller için ayrı ekran görüntüsü üretildiği iddia edilmez.
- Eski Almanca/Fransızca mağaza kayıtları kaldırıldı. Reklamı kapalı üretim paketi için reklam beyanı “No” seçildi. İnceleme talimatına dil seçimi ve misafir yolu eklendi; mevcut inceleme hesabı korunur.
- Destek sitesi marka metinleri güncellendi. Daha önce 404 dönen `/story/quiet-morning` artık 200 ve doğru Play bağlantısını döndürüyor. Gizlilik, hesap silme ve `assetlinks.json` 200; App Links sertifika dosyası değişmedi.
- 12 SEO dil sayfası hâlâ içerik taslağıdır; yayımlandıkları veya indekslendikleri iddia edilmez.

Paket imzası, üretim servis bağı, baseline profile ve 16 KB APK/ELF hizalaması doğrulandı. Gerçek 16 KB cihaz / Play split paketleri ve fiziksel cihazda 48’den güncelleme bu sonuçla doğrulanmış sayılmaz. Yeni bir canlı içerik yayını veya editör onayı yapılmadı.

Son paket ana dal `32a717f` üzerinden üretildi. AAB SHA-256: `c22941f6a82b3ce777410e0a1267f40faf9472e6ae69b7b8b65115ad32e6e075`. ReTrace eşleme dosyası Console’da pakete bağlı. Engelleyici hata yok; üçüncü taraf native kütüphanelerin debug sembolleri için öneri var.

Google Play tarafından imzalanmış 50 universal APK’sının sertifikası ve Android alan adı doğrulaması geçti. Bağlantı `.MainActivity` etkinliğine yönlendi; ancak Play hesabı açık olmayan emülatörde yan yüklenen Play-enhanced paket Play girişine yönlendirdiği için tam kullanıcı yolculuğu kabulü verilmedi. Yerel yükleme sertifikalı paketle yapılan testler bu sınırdan ayrı tutulur.

İkon, yeni tanıtım görseli ve AI çizimleri içeren gerçek uygulama görüntülerinin AI etiketleri kaydedildi. Fiziksel cihazda Play üzerinden 48→50 güncelleme, veri koruma, TalkBack ve tam bağlantı yolculuğu sonraki kabul adımıdır.

Kesin paket hash’i, kaynak commit ve Console başvuru durumu [yayın kanıtında](release-evidence/2026-10-19-production-50.json).
