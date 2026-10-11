# Üretim girişleri, herkese açık sayfalar ve yayın operasyonu

## Aşama analizi — 11 Ekim 2026

Üretim e-posta yaşam döngüsü çalışıyor. Google sağlayıcısı kapalı, destek sitesi eski ve panel yalnızca yerel ortamdaydı. İlk hedef mevcut FREE hizmetlerle gerçek üretim Google girişini ve HTTPS destek/panel erişimini tamamlamak. Uygulamaya yönetici anahtarı eklenmez. Firebase dağıtımı yalnızca mevcut `englishtales-app` Hosting sitesini kapsar; veritabanı veya Storage kuralları dağıtılmaz.

Kabul: Google kimliğiyle üretimde gerçek giriş; web gizlilik/silme/panel adreslerine 200; panel yetkisi sunucuda; Android hesap ve ayarlarda erişilebilir destek yolları; gerçek veri davranışına uygun beyan.

## Tamamlananlar

- Kullanıcı işlem anında Google etkinleştirmesini onayladı. Üretim Google sağlayıcısına mevcut web, Play ve debug istemci kimlikleri kaydedildi. Native ID token akışı kullanılır; OAuth web secret eklenmedi. Nonce denetimi açık, e-postasız giriş kapalı.
- İkinci emülatörde üretim önizlemesiyle gerçek Google girişi yapıldı. Üretim Auth'ta Google kimliği ve 19:25:29 UTC başarılı giriş görüldü. Kullanıcı kapat/aç sonrası girişin korunduğunu bildirdi. Play imzalı sürüm testi ayrıca bekliyor.
- Firebase CLI'nin mevcut oturumu yenilendi; mevcut iki site görüldü. Yalnızca `englishtales-app` sitesine dağıtım başarılı.
- `https://englishtales-app.web.app/`, `/privacy`, `/delete-account`, `/studio`, `/api/config` HTTPS 200 döndü. Panel giriş ekranı gerçek tarayıcıda açıldı. Üretim paneli authenticated kullanıcı/personel denetimini mevcut Supabase API ile yapar.
- Kullanıcı HTTPS paneline giriş yaptı; gerçek yayıncı rolü, altı yayınlanmış hikâye, korunmuş sürüm, kapak ve tıklanan cümlenin Türkçe çevirisi tarayıcıda doğrulandı. Bu kontrolde yeni yayın sürümü oluşturulmadı.
- Web silme kaynağı, uygulamayı yeniden kurmayı gerektirmeyen destek e-postası yolunu sunar. E-posta düğmesi yalnızca taslak açar; otomatik gönderim veya otomatik silme yapmaz.
- Android hesap ve ayarlara gizlilik, silme bilgileri ve destek/içerik hata bağlantıları eklendi; bağlantı açılmazsa adres görünür. Debug derleme ve Lint başarılı, üretim geçici önizlemesi ikinci emülatöre yüklendi. Yerel test ayarları geri yüklendi.
- Brevo per-contact tracking consent `Yes`, bilinmeyen rıza için tracking `No` kaydedildi. Bu uygulama takip rızası toplamaz. Daha önceki testlerde açılma kayıtları vardı; geçmiş olayların silindiği iddia edilmez. Yeni gönderim için bağımsız piksel incelemesi yapılmadı.
- Brevo tüm göndericiler için işlem kayıtlarını 1 ay saklayacak, e-posta önizlemelerini hiç saklamayacak şekilde kaydedildi. Kaydetmeden sonra sayfa yeniden açılarak değerlerin korunduğu doğrulandı.

## Destek ve silme operasyonu

- Sorumlu: uygulama sahibi Oğuz Yürken; destek adresi `oguz.yurken@gmail.com`.
- Kimliği doğrulanmış web silme talepleri en geç 30 gün içinde işleme alınır; sonuç e-postayla bildirilir. Hesap e-postasına yanıtla sahiplik doğrulanır; parola, kod veya kimlik belgesi istenmez. Sadece mesajdaki başka bir e-posta adresine dayanarak silme yapılmaz.
- Supabase kullanıcı silmeden önce oturumlar iptal edilir; öğrenme kayıtları aynı kullanıcıya göre kaldırılır. Destek talebi başka kişisel/panel hesabını etkilememeli.
- Destek yazışması talep kapandıktan sonra en fazla 90 gün tutulur; yasal/güvenlik istisnası gerekçesi bildirilir. Sonlandırılmış talepler için bu temizliği uygulama sahibi yürütür. Otomatik Gmail temizleyicisi kurulmadı.
- Yedeklerden geri yüklemede silinmiş hesaplar tekrar etkinleştirilmez; restore prosedürü silme talepleriyle karşılaştırılmalıdır. Yedek kapsamı ve restore kanıtı sonraki kapıdır.
- İlk native paket reklam, ödeme, Analytics/Crashlytics SDK'sı içermez. Mevcut hata izleme kaynağı Play Android vitals ve sağlayıcı teknik kayıtlarıdır; ayrı Firebase ölçüm SDK'sı önerisi bu pakette uygulanmış sayılmaz. Beyan gerçek paketle eşleşmelidir.

## Dağıtım ve geri dönüş

`python tooling/build_hosting.py` yalnızca `native-android/build/hosting` çıktı klasörünü yeniden oluşturur. Studio dosyaları izinli listeden kopyalanır, sunucu ve özel ayarlar kopyalanmaz. Public API config yalnızca üretim URL/publishable key içerir. CSP, nosniff, frame ve referrer kısıtları dağıtıldı. Firebase sürüm geçmişi web geri dönüşü sağlar; Git etiketi hizmet ayarlarını veya veritabanını geri almaz.

## Açık kapılar

- İkinci posta sağlayıcısına teslimat.
- Üretim yedek/geri yükleme, yayıncı medya sahipliği ve kalan eşitleme kabul senaryoları.
- Referans UI, gerçek cihaz/API uçları, eski Play sürümünden güncelleme, Play imzasıyla Google girişi.
- Mağaza beyanları/görseller, yeni ikon, nihai üretim AAB, Play test ve üretim başvurusu.

## Kaynaklar

- [Supabase native Google girişi](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Play hesap silme kaynağı](https://support.google.com/googleplay/android-developer/answer/13327111)
- [Brevo rızaya göre izleme](https://help.brevo.com/hc/en-us/articles/37114679474706-About-email-tracking-pixels-and-the-CNIL-recommendation-in-Brevo)
- [Brevo saklama kuralları](https://help.brevo.com/hc/en-us/articles/4415743225746-Configure-a-custom-retention-period-for-your-transactional-logs-and-email-previews)
