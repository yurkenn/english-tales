# Üretim kurulumu

## 11 Ekim 2026

Kullanıcı `yurken / English Tales Production / Frankfurt / FREE` projesini oluşturdu. Proje kimliği: `gtuangjukckpuerczfxd`. Test projesi: `jukyylozahikjhtokayw`. İki ortamın kullanıcıları ve oturumları ayrıdır.

Beş test edilmiş şema migration'ı sırayla uygulandı. Üretim kontrolünde Dashboard Auto RLS işlevinin API rollerine açık olduğu görüldü; `restrict_platform_helpers` migration'ıyla anonim/oturum açmış API erişimi kaldırıldı. Aynı migration test ortamına da uygulandı. Özel yayıncı tablosunda RLS açıldı. Yönetici işlevlerinin yayıncı/editör denetimi sunucuda yapılır; istemciye yönetici anahtarı verilmez.

Altı hikâye ve 81 cümle sabit kaynak kimlikleriyle yüklendi. Kullanıcının oluşturduğu üretim hesabına yayıncı rolü bağlandı. Kullanıcı üretim paneline giriş yaptı; altı gerçek kapak Storage'a yüklendi, kaydedildi ve bütün hikâyeler panelin sürüm kontrollü yayın akışıyla yayınlandı. Altı yayın için kapak dosyası mevcut. Canlı anonim HTTP kontrolü 6 hikâyeyi görür; yönetici/öğrenme erişimini ve yanlış tokenı reddeder.

Üretim SMTP, Brevo Free üzerinden bağlandı. Doğrulama ve parola kurtarma OTP şablonları kaydedildi; gerçek kurtarma e-postası Gmail'e teslim edildi. Anahtar yalnızca hizmet yapılandırmasında kalır. Kanıt ve kalan e-posta testleri EMAIL_DELIVERY_SETUP.md içinde.

## Henüz tamamlanmayanlar

- Google sağlayıcısı, yeni hesap doğrulaması ve uygulama içindeki gerçek parola değiştirme testi.
- HTTPS paneli ve gizlilik/hesap silme sayfaları.
- Aktif hesap silme uç noktasının geçici gerçek hesapla uçtan uca doğrulanması ve yayıncı medya sahipliği yönetimi.
- Uygulamanın üretim bağlantısı; yeni imzalı aday ve Play kabul testleri.

Üretim verisi yalnızca kaynak kodu etiketine dönerek geri alınamaz. FREE proje için otomatik yedek varmış gibi kabul edilmez; geri yükleme kanıtı ayrıca gereklidir.
