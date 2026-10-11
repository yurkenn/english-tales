# Veri altyapısı doğrulaması

10 Ekim 2026 — Son durum: `npm test` **35 başarılı, 0 başarısız** (27 SQL + 8 istemci). Ayrı HTTP testi ve gerçek Supabase giriş/kapak/kayıt/yayın kontrolleri geçti. Aşağıdaki ilk bölümler başlangıçtaki 19 testin tarihsel kaydıdır; güncel bulut sonucu belgenin sonunda bulunur.

## Ortam ve yöntem

Node.js test çalıştırıcısı + `@electric-sql/pglite 0.3.14` ile gerçek PostgreSQL motorunda migration, trigger, transaction, foreign key, fonksiyon izinleri ve RLS çalıştırıldı. Her test kendi işleminde geri alındı. Migration dosyaları testler için değiştirilmedi.

Auth kullanıcı tablosu, `auth.uid()` ve Storage metadata tabloları test fixture ile temsil edildi. JWT kullanıcı kimliği SQL oturumunda ayarlandı. Altı kapak için yalnızca test Storage kayıtları oluşturuldu; dosya yüklenmedi. Testlerde katalog yayımlanırken dağıtım için üretilen seed taslak olarak kalır.

## Kontroller

| # | Kontrol | Sonuç |
| --- | --- | --- |
| 1 | Altı hikâye, 81 cümle, tekrar aktarımda sabit kimlikler | Geçti |
| 2 | Taslak metin, kelime ve medya okuyucudan gizli | Geçti |
| 3 | Kullanıcı içerik/rol değiştiremez; editör yayımlayamaz; profil rolü yetki sağlamaz | Geçti |
| 4 | Eksik çeviri, bozuk sıra ve Storage kaydı olmayan kapak yayını durdurur | Geçti |
| 5 | Yayımlanmış metin ve sürüm kimlikleri değiştirilemez | Geçti |
| 6 | Yayımlanmış medya metadata kaydı ve checksum editörce değiştirilemez/silinemez | Geçti |
| 7 | Yeni sürüm eski metni korur; arşiv normal okumadan gizler | Geçti |
| 8 | Aynı oturum iki kez ödül yazmaz; değişmiş gövdeyle aynı UUID reddedilir | Geçti |
| 9 | İki cihazda aynı hikâye/gün bir okuma adımı sayılır | Geçti |
| 10 | Yedi öğrenme tablosunda kullanıcı ayrımı; doğrudan ödül yazımı yasak | Geçti |
| 11 | Kullanıcı kimliği olmayan authenticated rol öğrenme verisine erişemez | Geçti |
| 12 | On üç uygulama tablosunda RLS; ayrıcalıklı fonksiyonlarda sabit arama yolu ve açık izinler | Geçti |
| 13 | Tercih sürümü başka cihazdaki yeni ayarın ezilmesini önler | Geçti |
| 14 | Zamanlı tekrar, erken cevap, üçüncü başarı ve yanlışta 10 dakika | Geçti |
| 15 | Geç gelen eski olay silinen kelimeyi geri getirmez | Geçti |
| 16 | Eski konum yeni konumu ezmez; başka cümleye referans reddedilir | Geçti |
| 17 | Gelecek tarih, ölçülemeyecek aktif süre, geçersiz skor ve taslak oturum reddedilir | Geçti |
| 18 | Geç gelen günler gerçek seriyi tamamlar; eski etkinlik tek başına seri yaratmaz | Geçti |
| 19 | Hesap silinince öğrenme kayıtları silinir; katalog korunur | Geçti |

Katalog aktarım aracı kapak dosyalarını gerçekten okuyarak SHA-256 ve bayt boyutlarını üretti. `catalog:export` altı taslak, 81 cümle ve altı kapak kaydı hazırladı.

## Bu kontrollerin sınırı

Canlı Supabase projesi, gerçek Auth token üretimi/imza doğrulaması, oturum yenileme, Storage dosya baytları ve HTTP API'leri bu testte çalıştırılmadı. PGlite testleri tek bağlantıda yürür; iki ayrı ağ istemcisinin aynı anda kayıt göndermesi ayrıca doğrulanmalıdır.

Yayın fonksiyonu kayıtlı medya ve Storage nesne kaydının varlığını kontrol eder; dosyanın gerçek SHA-256 içeriğini veritabanında hesaplamaz. Yönetim panelinde yükleme/geri indirme doğrulaması uygulandı ve yerel gerçek dosyayla sınandı. Android önbellek doğrulaması henüz uygulanmadı. Dosya yükleme ile yayınlama arasındaki eşzamanlı işlemler canlı Storage API ile sınanmalıdır.

Puan sunucuda doğru cevap sayısından türetilir; cevapların gerçekten doğru verildiği bağımsız olarak doğrulanmaz. Yerel test başarıları kullanıcı geri dönüşü veya performans sonucu değildir. Büyük olay geçmişinde sorgu ve kelime geçmişi değerlendirme maliyeti gerçek yükle ölçülmelidir.

## Canlı ortamda gerekli doğrulamalar

1. Ayrı iki hesap, geçersiz/süresi dolmuş token ve boş oturumla REST/RPC erişimleri.
2. Misafir/yayıncı/editör ile gerçek dosya yükleme, indirme, imzalı URL süresi, taslak ve arşiv erişimi.
3. Aynı kullanıcıya iki istemciden aynı UUID, iki farklı okuma UUID'si ve eşzamanlı tercih güncellemesi.
4. Yayınla eşzamanlı taslak/medya düzenlemesi; hiçbir yarım yayın veya değişen yayımlanmış dosya oluşmaması.
5. Android çevrimdışı kuyruk, uygulama kapanması, hesap değiştirme, misafir verisi bağlama ve eski SQLite geçişi.
6. Gerçek Auth hesap silme işleminden sonra öğrenme kayıtları ve Firebase veri süreci.

Bu aşamada Kotlin kodu ve APK değiştirilmedi. Önceki Android kontrolleri [uygulama doğrulama kaydında](../docs/VERIFICATION.md) bulunur.

## İçerik paneli — 10 Ekim 2026

`npm test`: **23 test, 23 başarılı, 0 hata.** Önceki 19 kontrole ek olarak:

- Oturum kimliğine bağlı gerçek personel rolü; normal kullanıcı ve anon için yönetici erişimi kapalı.
- Yeni hikâye/taslak; yayınlanmış metinden sabit cümle kimlikleriyle yeni sürüm; aynı hikâyeye tekrar istekte mevcut taslağın açılması.
- Hatalı belge/alan boyutu reddi; bütün tabloları kapsayan atomik kayıt/geri alma; eski sürüm ve doğrudan tablo düzenlemesi sonrası çakışma.
- Yayıncı rolü + incelenen düzenleme sayacı; yayınlanmış tarihi sürüm ve öğrenme bağlantılarının korunması.

İzin kontrolü 13 uygulama tablosunu ve 21 ilgili fonksiyonu kapsar.

`npm run test:admin`: ayrı yerel HTTP sürecinde dış origin reddi, JSON zorunluluğu, RPC allowlist, gerçek PNG yükleme/indirme/hash doğrulama, tekrar yüklemeyi reddetme, kayıt çakışması, yayın, yeni sürüm, arşiv ve süreç yeniden başladıktan sonra kayıt/dosya kalıcılığı geçti. Test ayrı `test-output/admin-http-*` verisi kullanır. Gerçek Supabase Auth, JWT imza doğrulama ve Storage HTTP servisi değildir.

Playwright ile görünür tarayıcıda: iki dilli editör, açıklama kaydetme, boş çeviride yayın düğmesinin kapanması, kapak seçimi/yükleme, yayın özeti/onay, yeni taslakta eski yayının korunması, boş yeni hikâye penceresinden vazgeçme ve yayın kontrolü kutusu denendi. Kontrol kutusunun yeniden çizilerek odağı kaybetmesi düzeltildi. Yeni taslağı bulunan yayın filtreye dahil edildi. Son tarayıcı konsolunda hata yok.

1500×1050 masaüstü ve 390×844 dar ekran incelendi. Dar ekranda sayfa yatay taşmıyor (375 px belge / 390 px pencere); kütüphane kendi yatay listesini, editör dikey akışı kullanıyor. Yayın kontrolü kutusu işaretlendikten sonra odağı korudu. [Masaüstü görüntüsü](../docs/preview-content-admin.png) · [Dar ekran görüntüsü](../docs/preview-content-admin-mobile.png).

Supabase adaptörü Auth giriş/yenileme, rol sorgusu, Data API RPC, özel Storage yükleme/indirme ve dosya doğrulamayı hazırlar. Canlı proje yapılandırılmadı; gerçek bulut akışı henüz test edilmedi. Yerel yayın işlemleri Android'e aktarılmıyor.

## İçerik yönetiminin tamamlanması ve gerçek Supabase — 10 Ekim 2026

- Proje: yurken / English Tales, Frankfurt, `jukyylozahikjhtokayw`. Kullanıcı proje ve gerçek Auth hesabını oluşturdu; doğrulanmış hesaba güvenilir bağlantıyla yayıncı rolü atandı.
- Dört migration gerçek PostgreSQL 17.11'e kuruldu. 13 public uygulama tablosunun tamamında RLS açık; story-media bucket özel. Test Auth/Storage fixture'ı buluta yüklenmedi. Panel yalnızca publishable anahtar kullanır; secret/service_role veya yönetici parolası alınmadı.
- Gerçek panel girişinden sonra altı PNG Storage API ile yeni UUID/hash yollarına yüklendi, geri indirildi ve SHA-256/boyut doğrulandı. İki dilli metin gözden geçirildi, taslaklar kaydedildi ve sürüm kontrolüyle yayınlandı. Altı hikâye / 81 cümle çifti / 41 sürüm-kelime kaydı / altı gerçek Storage nesnesi mevcut.
- Seed'den kalan, hiçbir sürüme bağlı olmayan ve Storage nesnesi bulunmayan altı metadata kaydı rezervasyon/finalizasyon fonksiyonlarıyla temizlendi. Panelde “Temizlenecek dosya yok” görüldü. Bulutta gerçek dosyanın DELETE isteği bu oturumda uygulanmadı; yerel HTTP temizliği ve istemci Storage DELETE sözleşmesi sınandı.
- A Quiet Morning'in 1. sürümü yayında tutulurken 2. taslak açıldı. Kaydedilmemiş deneme başlığı tarayıcı yedeğine yazıldı; Yenile ardından yedek teklifi görüldü, geri getirildi, asıl başlıkla temiz taslak kaydedildi. İkinci taslak yayınlanmadı; düzenleme başlangıcı olarak tutuldu. İşlemler sekmesinde gerçek yayıncı/sürüm/tarih kayıtları doğrulandı.
- `verify-hosted.mjs` gerçek Data API üzerinden altı yayını okudu. Anon yönetici/öğrenme işlevleri ve geçersiz token reddedildi. Taslak 2 anon katalogda görünmüyor. Bu kontrol iki ayrı gerçek normal kullanıcı yalıtımının yerine geçmez.
- `npm test`: 27 SQL + 8 istemci/kurtarma kontrolü geçti. 32 ilgili ayrıcalıklı fonksiyonun sabit search_path ve izinleri doğrulandı. Yeni kontroller: sürüm kontrollü silme, gerçek aktörle audit, kelimenin cümlede bulunması, arşiv çakışması, medya değişiminde taslak sayacı, silme rezervasyonu ve nesne yok olduktan sonra finalizasyon.
- İstemci kontrolleri: ortak token yenilemesi, yenileme sürerken çıkışın oturumu geri açmaması, 401 sonrası oturum kaybı, Storage DELETE/finalizasyon sırası, başarısız yükleme temizliği, tam kelime eşleşmesi, eski yedekte güncel sürüm/medyanın korunması ve yanlış proje/sürüm/bağlantı reddi.
- Ayrı HTTP sürecinde dosya hash'i, sürüm çakışması, yayın/kopyalama/arşiv, taslak silme/audit, kullanılan dosyanın korunması, kullanılmayan dosyanın temizlenmesi ve yeniden başlatma kalıcılığı geçti.
- 1500×1050 masaüstü: 1485 px belge / 1500 px pencere. 390×844 dar ekran: 375 px belge / 390 px pencere. Sayfa yatay taşmıyor; form ve telefon önizlemesi dar ekranda dikey akıyor. Güncel görüntüler docs klasöründe.

### Güvenlik danışmanı ve sonraki kontroller

Supabase danışmanı ERROR vermedi. 19 authenticated SECURITY DEFINER uyarısı, sunucuda gerçek kullanıcı/personel kontrolü yapan açıkça izin verilmiş RPC'ler için beklenen mimari bildirimdir. Normal kullanıcının personel işlevlerini kullanamayacağı yerel testlerde kontrol edildi. [Danışman açıklaması](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

private.content_audit için RLS açık/policy yok INFO bildirimi beklenir: doğrudan erişim kaldırılmış, geçmiş yalnızca personel kontrollü fonksiyonla okunur. [Açıklama](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

Auth için sızmış parola koruması kapalı WARN bildirimi alındı; Auth planı veya ayarları değiştirilmedi. [Parola koruması](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Gerçek token süresinin dolması/yenilenmesi, ikinci gerçek normal/editör hesabıyla erişim sınırları, eşzamanlı yayın/medya/öğrenme istekleri ve gerçek ses yükleme henüz sınanmadı. Bunlar mağaza yayını öncesindeki servis doğrulama kapılarıdır. Android uzak katalog, Auth ve eşitleme henüz bağlı değildir; APK bu aşamada değişmedi. Panel internete dağıtılmadı.
