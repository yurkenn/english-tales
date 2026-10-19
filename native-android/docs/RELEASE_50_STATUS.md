# 50 / 2.2.0 — 19 Ekim 2026

Durum: imzalı aday doğrulandı; mağaza başvurusu hazırlanıyor. Üretim hâlâ 48 / 2.0.0, dahili test 49 / 2.1.0. İncelemeye gönderme ve canlı yayın ayrı kaydedilecek.

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

Kesin paket hash’i, kaynak commit ve Console başvuru durumu [yayın kanıtında](release-evidence/2026-10-19-production-50.json) tutulacak.
