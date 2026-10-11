# Hesap ve eşitleme — aşama analizi

11 Ekim 2026

## Mevcut durum

Bu bölüm çalışmaya başlarken alınan durumdur. İlk oturum paketinin sonucu aşağıdadır.

Room v4 misafir ve hesap başına ayrı dosyalar açabiliyor. İşlem kuyruğu sahibini kontrol ediyor. Fakat uygulama hep misafir veritabanını açıyor; Auth ekranı/kalıcı oturum ve ağ gönderimi yok. Backend kendi kullanıcı verisini okuyan RLS ve kimliği JWT'den alan öğrenme RPC'lerini sunuyor.

## Uygulama sırası

1. **Oturum ve hesap ayrımı:** Mevcut hesapla giriş, Keystore ile şifreli token saklama, aynı anda tek yenileme, sunucudan kullanıcı doğrulama, çevrimdışı hesapta devam, güvenli çıkış. Profil üzerinden giriş ekranı. Şifre kaydedilmez. Hesap değişirken eski ekranda soru/kelime/okuma durumunun yeni hesaba yazılmasını engelle.
2. **Misafir aktarımı:** Kullanıcıya açık aktarım seçimi; bir kez sahiplenilen misafir geçmişini başka hesaba yeniden aktarmama; yarıda kalan aktarımı aynı kimliklerle sürdürme. Eski native sürümün ölçmediği süre/cevap geçmişini üretme. Eski toplamları yeni işlemlerle çift saymayan, test edilmiş sunucu birleştirme kararı gerekir.
3. **Eşitleme:** Önce tercihler/saat dilimi; sonra kalıcı olay kuyruğu; ardından sunucu özeti ve kendi kelime/ilerleme verisi. Bekleyen yerel değişiklikleri eski sunucu kopyasıyla ezmeme. Aynı UUID ile tekrar teslimat başarıdır; gövde çakışması kalıcı hata. İki cihaz ve hesap değişimi testleri.
4. **Hesap yaşam döngüsü:** Yeni kayıt, doğrulama, parola kurtarma ve uygulamaya güvenli dönüş; üretim e-posta sağlayıcısı/izinli yönlendirmeler; hesap silme ucu ve web yolu. Bu adımlar tamamlanmadan mağaza hesabı akışını hazır sayma.

İlk çalışma paketi 1. maddedir. Giriş ekranında mevcut hesabın kullanılabildiği ve misafir verisinin ayrı kaldığı açıkça belirtilecek. Henüz çalışan kayıt/kurtarma/aktarım/eşitleme varmış gibi düğme veya başarı mesajı gösterilmez.

## Oturum kuralları

- Sadece publishable anahtar ve kullanıcının kendi JWT'si; yönetici anahtarı kullanılmaz.
- Saklanan tokenlar Android Keystore AES-GCM anahtarıyla şifrelenir; dosya atomik yazılır. Dosya başka kurulumda çözülemiyorsa güvenli misafir durumuna dön.
- Süresi dolan token için sunucunun döndürdüğü yenilenmiş refresh token da atomik saklanır. Ağ hatası mevcut hesap dosyasını silmez.
- Başarılı girişte `/auth/v1/user` ile gerçek kullanıcı kimliğini doğrula; e-posta gösterimi yetki kararı değildir.
- Hesap açma/kapatma ve yerel öğrenme mutasyonları sıralı yapılır. Hesap değişirken ekran ağacı yeniden kurulur; eski hesabın bekleyen ekran eylemleri yeni hesaba uygulanmaz.
- Çıkışta yerel token temizliği zorunlu; ağ varsa sunucu oturumu da kapatılır. Çevrimdışı çıkışın sunucudaki tokenı anında iptal ettiği iddia edilmez.
- Misafir ve farklı hesapların ilerlemesi ayrıdır. Giriş/çıkış bunları silmez veya kendiliğinden kopyalamaz.

## Kabul kontrolleri

- Giriş tokenı sunucudan doğrulanır; yanlış parola anlaşılır hata verir.
- Kalıcı dosyada düz token/parola yok; bozulma/anahtar kaybı uygulamayı çökertmez.
- Token yenileme UID değiştiremez; geçersiz yenileme tekrar giriş ister, ağ hatası çevrimdışı ilerlemeyi korur.
- A → misafir → B → A geçişlerinde farklı kelime ve puanlar karışmaz; yeniden açılış aynı sahibi kullanır.
- Eski ekranda sıraya alınan mutasyon yanlış hesaba geçmez.
- Mevcut öğrenme ve canlı içerik testleri geçmeye devam eder.

Canlı girişin son kontrolü için kullanıcı şifresini doğrudan uygulamadaki alana girecek. Sohbette, araç çıktısında veya test dosyasında kişisel parola/token tutulmaz.

## Güncel kaynaklar

Supabase becerisi, güncel doküman araması ve changelog kontrol edildi. [Parolayla giriş](https://supabase.com/docs/guides/auth/passwords), [oturumlar](https://supabase.com/docs/guides/auth/sessions), [mobil yönlendirmeler](https://supabase.com/docs/guides/auth/native-mobile-deep-linking). Varsayılan deneme e-posta hizmeti üretim kaydı/kurtarma için ayrıca değerlendirilmelidir.

## İlk oturum paketi — uygulama sonucu

- Profil üzerinden mevcut hesapla giriş ve çıkış ekranı eklendi. Parola saklanmaz; gönderimden sonra giriş alanı temizlenir. Ekran yeni kayıt/kurtarma veya bulut eşitlemesi tamamlanmış gibi davranmaz.
- HTTPS Auth istemcisi kullanıcıyı sunucudan doğrular. Oturum dosyası Keystore AES-GCM ile şifrelenir ve atomik yazılır; tokenlar hata metinlerine yazılmaz. Aynı anda yapılan yenilemeler tek yenilenmiş tokenı kullanır.
- Ağ hatasında hesap verileri kullanılabilir. Geçersiz oturum yeniden giriş ister. Çıkış yerel oturumu siler; sunucu kapatılamadıysa açıklama gösterir.
- Hesap değişimi yeni Room dosyasını açar ve ekran ağacını yeniden kurar. Sırada bekleyen eski hesap/misafir eylemleri yeni hesaba uygulanmaz. Hesap dosyası açılamazsa yeni oturum yerelde temizlenir.
- Android 15 emülatöründe **11 birim + 29 cihaz testi** geçti; Lint **0 hata, 17 uyarı**. Yeni sekiz cihaz testi: gerçek Keystore saklama/bozulma, sunucudan doğrulanmış giriş/geri yükleme, eşzamanlı yenileme, ağ hatası/ret ayrımı, yenilemede UID uyuşmazlığı, çevrimdışı çıkış, A → misafir → B → A kayıt ayrımı, eski ekran eyleminin atlanması.
- Auth ağ yanıtları bu testlerde kontrollü örneklerle temsil edildi. Kullanıcının doğrudan uygulamaya girdiği kişisel hesapla canlı giriş doğrulandı. Uygulama zorla kapatılıp yeniden açıldı: aynı hesap e-postası, sunucudan doğrulanmış oturum, A1 profili, 20 puan, 4 kelime ve 2/1 günlük adım korundu. Token/parola okunmadı veya araç çıktısına yazılmadı.
- Test öncesindeki emülatör verisi yedeklendi ve sonrasında geri yüklendi. Ada / A2 / Macera / 3 adım, 70 puan ve 9 kelime arayüzde korundu. [Giriş ekranı](preview-account-login.png) görsel olarak incelendi.

**Sıradaki analiz:** Misafir geçmişini tek hesaba bir kez aktarma ve eski toplamları çift saymadan birleştirme. Ardından canlı kuyruk gönderimi ve iki cihaz eşitlemesi. Yeni hesap, doğrulama, kurtarma ve silme akışları ayrıca tamamlanacak.
