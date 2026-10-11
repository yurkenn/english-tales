# E-posta gönderimi kurulumu

## Karar ve güncel durum — 11 Ekim 2026

Alan adı ve mevcut SMTP hesabı olmadığı için Brevo Free kurulumuna başlandı.
Ücretsiz plan günlük 300 gönderim ve transactional SMTP içerir; ücretli plana geçilmez.
Kayıt ekranı açıldı; yeni parola ve hizmet koşullarını hesap sahibi tamamlar.
Henüz SMTP bağlantısı, teslimat veya gerçek doğrulama akışı başarılı sayılmıyor.

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
