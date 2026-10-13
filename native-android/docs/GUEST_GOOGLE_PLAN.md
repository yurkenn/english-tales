# Misafir ve Google girişi

11 Ekim 2026 — uygulama öncesi analiz

## Karar

Misafir kullanıcı için cihazdaki mevcut Guest Room dosyası kullanılacak. Sunucuda anonim kullanıcı açmak gerekmiyor: ilk öğrenme çevrimdışı çalışıyor; gereksiz anonim hesap ve aktarım karmaşıklığı oluşmaz. İlk açılışta misafir, Google ve e-posta seçenekleri gösterilir. Giriş zorunlu değildir. Misafir devamı seviye/hedef seçimine gider; sonraki açılışlar tercihi korur. Mevcut kullanıcı oturumu ve tamamlanmış misafir başlangıcı tekrar seçim ekranına zorlanmaz.

Google için Credential Manager'ın açık düğme akışı ve Supabase ID token değişimi kullanılacak. Web istemci kimliği Android'e girer; Android paket adı ve imza SHA-1'i Google Cloud'da kayıtlı olmalıdır. Secret Android'e eklenmez. Her denemede rastgele nonce üretilir, SHA-256 biçimi Google'a, ham nonce Supabase'e gönderilir. Google tokenı yerelde saklanmaz; doğrulanmış Supabase oturumu mevcut şifreli kasaya yazılır.

Google hesabının e-postası yerelde hesap birleştirme yetkisi vermez. Sunucudan doğrulanan UID ile mevcut hesap ayrımı çalışır. Misafir verileri otomatik kopyalanmaz. Misafir aktarımı ve bulut eşitlemesi önceki plandaki ayrı işler olarak sürer.

## Güvenlik ve kullanıcı davranışı

- Düğme yalnızca açık kullanıcı eylemiyle hesap seçiciyi açar; otomatik Google girişi yok.
- İptal veya ağ hatası mevcut misafir/hesap kayıtlarını değiştirmez. Paralel girişler engellenir.
- Çıkış yerel Supabase oturumunu temizler; Credential Manager'a da çıkış bildirilir. Kullanıcının cihazdaki Google hesabı kaldırılmaz.
- Yapılandırma eksikse Google girişi başarı gibi gösterilmez; mevcut e-posta ve misafir seçenekleri kullanılabilir.
- Debug imzası geliştirme içindir. Mağaza sürümü için Play App Signing sertifikasıyla ayrı Android istemci kaydı doğrulanmalıdır.

## Doğrulama

1. Yeni kullanıcı → misafir → seviye/hedef → öğrenme; kapat/aç korunur.
2. Google ID token ve nonce sunucuya gönderilir; kullanıcı UID'si `/auth/v1/user` ile doğrulanır.
3. Google iptali/ret/ağ hatası eski veriye ve oturuma zarar vermez.
4. Hesap geçişi ve mevcut 29 cihaz testi geçmeye devam eder.
5. Gerçek Google hesap seçimi, sağlayıcı değişimi ve yeniden açılış ayrıca gözlenir. Kullanıcı Google oturumunu kendisi açar.

## Kaynaklar

[Android uygulama akışı](https://developer.android.com/identity/sign-in/credential-manager-siwg-implementation), [kararlı Credential Manager sürümü](https://developer.android.com/jetpack/androidx/releases/credentials), [Supabase Google ve nonce](https://supabase.com/docs/guides/auth/social-login/auth-google). Credential Manager 1.6.0 ve Google ID sürümleri resmi sürüm/Maven kaynağından kontrol edildi. Google ID 1.2.1 Kotlin 2.4 metadata nedeniyle mevcut Kotlin 2.1 derleyicisiyle uyumsuz çıktı; uyumlu kararlı 1.1.1 sürümü sabitlendi. Supabase changelog'daki güncel değişiklikler bu akış için ek şema değişikliği gerektirmiyor.

## Uygulama sonucu

- İlk açılışa üç seçenekli başlangıç ekranı eklendi: Google, e-posta ve misafir. Misafir seçimi seviye/hedef akışına gider. Tamamlanmış başlangıç ve mevcut oturumlar korunur. [Görsel kontrol](preview-welcome-guest-google.png).
- Credential Manager düğme akışı ve nonce ile Supabase ID token değişimi eklendi. Mevcut hesap ekranından da Google hesabı seçilebilir; iptal mevcut hesabı kapatmaz.
- Google Cloud'daki mevcut `english-tales-77d32` projesinin web istemcisi kullanıldı. `English Tales native debug` Android istemcisi oluşturuldu; paket `com.yurken.englishtales`, SHA-1 `64:97:92:FF:B8:B2:BA:25:54:90:2F:73:D8:06:29:32:4A:15:DC:17`. Mevcut diğer Android istemcileri değiştirilmedi.
- Supabase test projesinde Google etkinleştirildi, web ve yeni debug istemci kimliği kaydedildi. Nonce kontrolü açık, e-postasız kullanıcı kabulü kapalı. Native ID token akışı için OAuth secret eklenmedi. Genel Auth settings uç noktası `google=true`, `anonymous_users=false` döndürüyor. [Sağlayıcı kontrolü](preview-google-provider.png).
- **11 birim testi ve 34 cihaz testi geçti.** Yeni beş kontrol: Google nonce/ID token gövdesi ve sunucu UID doğrulaması, ret halinde eski oturumun korunması, nonce rastgeleliği/SHA-256, seçici iptalinde misafir verileri, Google → hesap → misafir ayrımı. Auth sonuçları kontrollü örneklerle temsil edildi. Gerçek Google seçici ayrıca açıldı, iptal edildi; iptal sonrası uygulama kullanılabilir kaldı.
- Derleme/Lint başarılı: **0 hata, 19 uyarı**. Uyarılar sürüm güncellemeleri, yedekleme beyanı, başlatıcı ikonları ve Kotlin yardımcılarıyla ilgili. Google ID için yeni sürüm önerisi mevcut; sürüm derleyici uyumluluğu nedeniyle sabitlendi.
- Misafir başlangıcı ayrı geçici uygulama dosyalarıyla arayüzden denendi: A1 / Günlük yaşam / 1 adım → ilk hikâye. Kapat/aç sonrası ana plan ve seçimler korundu. Orijinal dosyalar geri alındı; mevcut gerçek hesabın doğrulanmış oturumu, 20 puanı ve 4 kelimesi korundu. Uygulama kaldırılmadan test edildi; Keystore anahtarı korundu.
- Kullanıcı hesabını Google'ın kendi ekranına ekleyerek girişi tamamladı. Google → Supabase → uygulama dönüşü ve sunucudan doğrulanmış oturum görüldü. Yeni Google hesabının başlangıcı kontrol için A1 / Günlük yaşam / 1 adım ile tamamlandı; ilk hikâye açıldı. Uygulama zorla kapatılıp yeniden açıldı: aynı hesap e-postası, doğrulanmış oturum ve profil/hedef korundu. Parola, doğrulama kodu veya token okunmadı. Yeni hesabın yerel puanı/kelimeleri sıfır; önceki hesabın veya misafirin toplamları otomatik aktarılmadı.

## Yayından önce kalanlar

Play App Signing imzası/Android istemcisi, OAuth marka/gizlilik kontrolleri ve farklı cihazlarda Google Play Services davranışı doğrulanmalı. Gerçek Google girişi ve yeniden açılış kontrolü tamamlandı. Google projesinin Audience ekranı External / In production durumunda; yalnızca temel kimlik kapsamı kullanılıyor. Misafir aktarımı ve cihazlar arası eşitleme ayrı geliştirme adımlarıdır.
