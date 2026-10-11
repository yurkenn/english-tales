# Yeni sürüm mağaza beyanları

## Analiz — 11 Ekim 2026

Mevcut 46 sürümünün beyanında üç kişisel bilgi, fotoğraf, iki uygulama etkinliği, üç performans ve cihaz kimliği kategorisi seçilmiş. Arşivlenen eski bağımlılıklarda Firebase, fotoğraf seçici ve Vexo Analytics var. Native 47'de bu SDK'lar yok. Google Play veri formu dağıtılan sürümlerle birlikte ele alınmalıdır; eski beyanı doğrudan boşaltmak veya SDK varmış gibi yeni paketi tanıtmak doğru değildir.

## Kaydedilen değişiklikler

- Gizlilik URL: `https://englishtales-app.web.app/privacy`; kaydedildi, incelemeye gönderilmedi.
- Veri güvenliği taslağında hesap silme URL: `https://englishtales-app.web.app/delete-account`.
- Hesap açma: kullanıcı adı/parola/diğer doğrulama (e-posta OTP) ve OAuth. HTTPS aktarım ve veri toplama `Yes`; hesap silmeden ayrı veri silme seçeneği `No` olarak korundu.
- Formda `Your changes have been saved` görüldü. Kategoriler ve kullanım cevapları hâlâ eski sürümün beyanı; yeni native için tamamlanmış sayılmaz. Önceki iki ekranın yerel metin kaydı tutuldu. CSV indirme otomasyonu tamamlanmadı.

## Kaynak ve paket incelemesi

Native uygulama hesap adını, e-postayı, kullanıcı kimliğini; öğrenme olaylarını, ilerlemeyi, kelimeleri ve tercihleri; eşitleme için kurulum/işlem kimliğini toplar. Google Auth metadata'sında `picture` ve `avatar_url` alanları var; profil görseli referansı da değerlendirilmelidir. Supabase/Brevo güvenlik ve teslimat kayıtları vardır. Native reklam, ödeme, Analytics veya Crashlytics SDK'sı içermez. Bildirim isteğe bağlı, kamera/mikrofon/konum/kişiler izni yok.

Son kategori ve amaçlar gerçek kaynak, SDK ve yayında kalacak bütün paketlere göre doldurulur. Hizmet sağlayıcı istisnası, isteğe bağlı hesap kullanımı ve kullanıcının başlattığı destek e-postası Google'ın tanımlarıyla eşleştirilir. Form önizlemesi doğrulanmadan gönderilmez. Bağımsız güvenlik sertifikası varmış gibi beyan edilmez.

Kaynak: [Google Play veri güvenliği tanımları](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

## Cihaz testi sınırı

Kullanıcı yalnızca emülatör kullanabildiğini bildirdi. Fiziksel telefon testi yapılmış sayılmaz; yerel emülatör ve Play cihaz raporları kullanılacak. Gerçek ARM64 telefonun bulunmaması gizlenmez veya sırf bu nedenle kullanıcıdan telefon alması istenmez.

## Önizleme incelemesi — 11 Ekim 2026

Eski giriş ekranında misafir seçeneği bulunmadı; eski 46 dağıtımı nedeniyle ad/e-posta/kimlik alanları şimdilik zorunlu beyanını koruyor. 47 tek aktif dağıtım olduğunda isteğe bağlı hesap kullanımı yeniden uygulanmalıdır. Önizlemede e-posta/kimlik güvenlik amaçları zaten seçili; kurulum kimliğine native eşitleme için App functionality eklendi ve taslak kaydedildi. Eski Analytics/Advertising amaçları eski artefaktın kapsamı netleşmeden kaldırılmadı. Performans kategorileri önizlemede görünmediği için ephemeral cevapları ayrıca denetlenmeli; SDK loglarının geçici olduğu varsayılmaz. Bu taslak henüz tam doğrulanmış veya incelemeye gönderilmiş değil.
