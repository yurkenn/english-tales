# E-posta gönderimi kurulumu

## Karar ve güncel durum — 11 Ekim 2026

Alan adı ve mevcut SMTP hesabı olmadığı için Brevo Free kurulumuna başlandı.
Ücretsiz plan günlük 300 gönderim ve transactional SMTP içerir; ücretli plana geçilmez.
Hesap sahibi kayıt, kimlik doğrulaması ve SMTP anahtarı bağlantısını tamamladı.
Üretim Supabase SMTP bağlantısı kaydedildi; doğrulama ve kurtarma kodu şablonları üretime uygulandı.
Gerçek `/auth/v1/recover` isteği 200 döndü. Brevo, 11 Ekim 2026 saat 21:46 (İstanbul) Gmail alıcısına **Delivered** kaydı gösterdi.
Gönderen adresi `oguz.yurken@12431337.brevosend.com` olarak yeniden yazıldı. Gizli SMTP anahtarı okunmadı veya depoya kaydedilmedi.
Bu kanıt SMTP ve bir Gmail teslimatını kapsar; yeni hesap doğrulaması ve uygulama içinde gerçek parola değişikliği henüz tamamlandı sayılmıyor.

## Bağlantı

- Brevo'da gönderen adı: English Tales. Gönderen e-posta: doğrulanmış destek adresi.
- Kişisel posta alan adı doğrulanamaz. Brevo'nun alan adı olmayan göndericiler için From adresini değiştirme davranışı gerçek teslimat ile kontrol edilir.
- Supabase Production → Authentication → Emails → SMTP Settings.
- Host: `smtp-relay.brevo.com`; port: `587`.
- Kullanıcı adı: Brevo SMTP sayfasındaki **Login** değeri; hesap e-postası olduğu varsayılmaz.
- Parola: Brevo **SMTP key**; API anahtarı veya hesap parolası kullanılmaz.
- Anahtar yalnızca Supabase sunucu yapılandırmasına girilir; Android, içerik paneli veya GitHub'a konmaz.
- Gönderen adı: English Tales; e-posta Brevo'da doğrulanmış gönderenle eşleşir.
- E-posta açılma ve bağlantı takibi kapatılır.
- Supabase e-posta doğrulaması açık tutulur. OTP geçerliliği en çok 1 saat, yeniden gönderim en az 60 saniye.
- Başlangıç Supabase gönderim limiti 30/saat; Brevo limiti ayrıca 300/gündür. Bir limit diğerini kaldırmaz.

## Şablonlar

- Confirm signup: `backend/supabase/templates/confirmation.html`
- Reset password: `backend/supabase/templates/recovery.html`
- Konular: `English Tales — E-posta doğrulama kodun` ve `English Tales — Parola kurtarma kodun`.
- `{{ .Token }}` Supabase tarafından üretilir. Uygulama kodu doğrudan alır; bağlantı yönlendirmesine dayanmaz.

## Yayına geçiş kapıları

11 Ekim kontrolünde mevcut yayıncı adresiyle kayıt denemesi ve eski kurtarma kodunun doğrulama ekranında kullanılması tespit edildi. Ayrı test hesabı henüz oluşmadı. Uygulama mesajları, istek kabulü ile teslimatı ayıracak ve doğru e-posta konusunu gösterecek şekilde düzeltildi. Brevo açılma olayları gözlendi; kimlik doğrulama e-postalarında izleme ayarlarının kapatılması da yayın öncesinde kontrol edilmeli.

11 Ekim 22:11'de ayrı test hesabı oluşturuldu ve kullanıcı yeni e-postadaki kodla uygulamada giriş yaptı. Üretim Auth kaydında 19:11:41 UTC gönderim, 19:11:53 UTC doğrulama ve ilk giriş görüldü. Bu hesap için gerçek doğrulama akışı tamamlandı; ikinci posta sağlayıcısı ve gerçek parola değiştirme kontrolleri bekliyor.

11 Ekim 22:15'te gerçek parola kurtarma da doğrulandı: kurtarma isteği, kod doğrulaması, kullanıcı güncellemesi, geçici oturumun kapatılması ve test adresiyle yeni parola girişi başarılı HTTP durumlarıyla sunucuda görüldü. Kullanıcı uygulamayı yeniden açınca akışın çalıştığını bildirdi. İkinci posta sağlayıcısı, kimlik doğrulama e-postalarında izleme ayarı ve kayıt kodlarının olumsuz senaryoları hâlâ bekliyor.

1. Ücretsiz hesabın ve gönderenin doğrulanması; transactional gönderimin aktif olması.
2. İki farklı posta sağlayıcısına teslimat, gerçek From adresi ve spam klasörü kontrolü.
3. Yeni hesabın doğru kodla doğrulanması; yanlış, süresi geçmiş ve tekrar kullanılan kodun reddedilmesi.
4. Parola kurtarma sonrası yeni parolayla giriş; kurtarma oturumunun uygulama hesabına kaydedilmemesi.
5. Google ve misafir girişinin etkilenmemesi; tekrar gönderim ve kota hatalarının anlaşılır görünmesi.

## Kaynaklar

- [Brevo Free plan](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans)
- [Brevo gönderen gereksinimleri](https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders)
- [Brevo SMTP](https://developers.brevo.com/docs/smtp-integration)
- [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase şablon değişkenleri](https://supabase.com/docs/guides/auth/auth-email-templates)
