# Hesap yaşam döngüsü — 11 Ekim 2026

## Ön analiz

Mağaza hazırlığında e-posta hesabı oluşturma, doğrulama, parola kurtarma ve kullanıcı tarafından hesap silme eksikti.
Doğrulama ve kurtarma için uygulamaya girilen OTP seçildi. Kurtarma oturumu mevcut öğrenme hesabını değiştirmemeli.
Silme isteği yalnızca sunucunun doğruladığı kullanıcıya uygulanmalı; uygulamaya yönetici anahtarı verilmemeli.
Son beş dakika içinde açılmış, hâlâ geçerli bir oturum şartı kondu. Gerektiğinde yeniden giriş istenir.

## Uygulananlar

- Hesap oluşturma, doğrulama kodu, yeniden gönderim ve parola kurtarma ekranları.
- Başarılı doğrulama sonrasında doğrulanmış kullanıcıya ait şifreli oturum saklanır.
- Kurtarma oturumu bellekte kalır ve işlem sonunda kapatılır; eski hesap kayıtlarını açmaz veya değiştirmez.
- Yanlış e-posta, geçersiz kod ve başarısız parola değişikliği mevcut oturumu korur.
- Hesap silme ekranında açık onay ve yeniden giriş yönlendirmesi.
- Sunucuda kimlik, aktif oturum ve oturum yaşını kontrol eden RPC; kontrol sonrası önce tüm oturumların kapatılması, sonra Auth kullanıcısının silinmesi.
- Kullanıcı kimliği istek gövdesinden alınmaz. Yönetici anahtarı yalnızca Edge Function ortamındadır.
- Yerel silme ancak sunucunun aynı kullanıcı için başarı yanıtından sonra yapılır.
- Başarı yanıtından sonra kalıcı temizlik kaydı yazılır. Uygulama kapanırsa sonraki açılışta temizlik tamamlanır.
- Başka hesap ve misafir geçmişi korunur; silinen hesaba ait aktarım makbuzu kaldırılır.
- İşlem başarısızsa silindiği iddia edilmez ve yerel kayıtlar korunur.

## Doğrulama

- 16 KiB emülatörde **106 Android cihaz testi geçti**.
- **46 backend testi geçti**: kullanıcı izolasyonu, son oturum şartı, iptal öncesi silmenin engellenmesi, hatalı onay/kimlik, veri sınırı ve kayıtların silme ilişkileri.
- Test ve üretim projelerinde migration uygulandı; `delete-account` işlevi aktif.
- Üretim işlevine oturumsuz gerçek HTTP isteği **401 / sign_in_required** döndü.
- Kişisel Google veya yayıncı hesabı silinmedi. Gerçek kullanıcı silme başarılı sayılmıyor; kontrollü geçici hesapla uçtan uca kanıt gerekiyor.

## Açık yayına geçiş kapıları

1. Brevo ücretsiz SMTP bağlantısı ve Gmail'e gerçek kurtarma e-postası teslimatı tamamlandı. Yeni hesap doğrulaması, ikinci posta sağlayıcısı ve uygulama içinde gerçek parola değiştirme kontrolü bekliyor. Şablonlar ve kanıt [EMAIL_DELIVERY_SETUP.md](EMAIL_DELIVERY_SETUP.md) içinde.
2. Üretim Google sağlayıcısı ve üretim hesabıyla gerçek giriş.
3. Yayıncının sahip olduğu Storage dosyaları için silme öncesi sahiplik yönetimi. Supabase kullanıcı silmeyi dosya sahipliği nedeniyle reddedebilir; yayınlanmış hikâye kapakları silinmemeli.
4. Geçici gerçek hesap ile yeniden giriş, silme, eski oturumun reddi ve yerel temizlik doğrulaması.
5. Herkese açık gizlilik ve hesap silme sayfası; uygulama ve mağaza bağlantıları.

Bu kapılar tamamlanmadan sürüm mağaza adayı olarak işaretlenmez. Mevcut Android yapılandırması test Supabase projesini kullanır.

## 11 Ekim: kayıt ve kurtarma kodunun karışması

- Kullanıcının bildirdiği adres, üretimde zaten doğrulanmış yayıncı hesabına aitti. Ayrı test adresi için yeni Auth kullanıcısı bulunmadı.
- Brevo kayıtlarında yalnızca 21:46'da gönderilmiş kurtarma e-postası ve onun teslim/açılma olayları vardı; yeni hesap doğrulama teslimatı yoktu.
- Kayıt ve yeniden gönderim mesajları artık isteğin alındığını belirtir; e-postanın teslim edildiğini iddia etmez. Ekran, kayıt ve kurtarma için kullanılacak farklı e-posta konularını açıklar.
- Düzeltme üretim bağlantılı geçici debug paketiyle derlendi ve ikinci emülatöre yüklendi. Yerel test bağlantısı geri yüklendikten sonra standart debug derlemesi de başarılı oldu.
- Gerçek yeni hesap doğrulaması hâlâ bekliyor. İmzalı mağaza paketi bu metin değişiklikleri sonrası henüz yeniden üretilmedi.
