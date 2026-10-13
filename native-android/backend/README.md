# English Tales servis altyapısı

10 Ekim 2026 — veri modeli ve erişim kuralları aşaması.

**Durum:** Dört veritabanı geçişi `yurken / English Tales` Frankfurt test projesine kuruldu (`jukyylozahikjhtokayw`). İçerik paneli gerçek Auth/Storage/API bağlantısıyla çalışıyor; 6 hikâye ve 81 cümle çifti yayınlandı. 27 yerel PostgreSQL + 8 istemci testi başarılı. Android'de Room v4 ve kalıcı gönderim kuyruğu hazır; Android uzak katalog/metin/kelime/kapak indirmesi bağlı; mevcut hesapla giriş/çıkış ve şifreli oturum eklendi; misafir aktarımı, öğrenme eşitlemesi, hesap yaşam döngüsü ve Firebase bağlantısı sonraki aşamalardır.

## Verilen karar

| İhtiyaç | Kullanılacak servis | Bu aşama |
| --- | --- | --- |
| Hikâye, çeviri, kelime ve yayın | Supabase Database | Şema, taslak aktarımı, yayın doğrulaması hazır |
| Kapak ve isteğe bağlı ses dosyaları | Supabase Storage | Özel bucket, erişim kuralları ve kapak manifesti hazır |
| İsteğe bağlı hesap ve kullanıcı verisi | Supabase Auth + Database | Kullanıcıya bağlı kayıtlar ve işlem uçları hazır |
| İlk açılış, akış ve geri dönüş ölçümü | Firebase Analytics | Android bağlantısı sonraki aşama |
| Çökme takibi | Firebase Crashlytics | Android bağlantısı sonraki aşama |

Misafir kullanıcı internetsiz öğrenmeye başlayacak. Buluta öğrenme kaydı yazmak isteğe bağlı hesap gerektirecek; anonim Auth hesabı oluşturma bu yapılandırmada kapalıdır. Misafir kullanımının ölçümü ile hesabın öğrenme yedeği ayrı ihtiyaçlardır. Hikâye okuma için hesap gerekmez.

## Hazırlanan parçalar

- `supabase/migrations/202610100001_content.sql`: Hikâye sürümleri, cümleler, kelime bağlantıları, medya kayıtları, editör/yayıncı izinleri, yayın ve arşivleme işlemleri.
- `supabase/migrations/202610100002_learning.sql`: Tercihler, öğrenme oturumları, kelime olayları, okuma konumu, puan, günlük hedef ve başarılar.
- `supabase/migrations/202610100003_content_admin.sql`: Güvenli personel rolü, taslak oluşturma/kopyalama, atomik kaydetme, düzenleme sayacı ve yayın kontrolü.
- `supabase/migrations/202610100004_admin_completion.sql`: İçerik işlem geçmişi, sürüm kontrollü taslak silme/arşivleme, kelime-cümle uyumu, kullanılmayan medya için güvenli silme rezervasyonu.
- `admin/`: Türkçe içerik paneli. Kalıcı yerel deneme + gerçek Supabase oturum/API adaptörü. [Panel kullanımı](admin/README.md).
- `supabase/seed.sql`: Altı hikâye ve 81 cümle çifti. **Yalnızca taslak oluşturur.** Mevcut sürümleri değiştirmez; medya dosyalarını yüklemez.
- `supabase/asset-upload-manifest.json`: Altı kapağın kaynak yolu, hedef yolu, SHA-256 özeti ve bayt boyutu.
- `tests/`: Gerçek PostgreSQL motorunda erişim ve öğrenme kuralları. Auth ve Storage için yalnızca test tabloları kullanılır.
- [Uygulama ve eşitleme sözleşmesi](SYNC_CONTRACT.md): Android entegrasyonunun takip edeceği kurallar.
- [Doğrulama kaydı](VERIFICATION.md): Yapılan kontroller ve canlı ortamda kalan işler.

## Yerel kontrolleri çalıştırma

Bu klasörde Node.js ile:

```powershell
npm ci --ignore-scripts --no-fund --no-audit
npm run catalog:export
npm test
```

Emülatörün ürettiği gerçek işlem gövdelerini yerel sunucu sözleşmesiyle kontrol etmek için:

```powershell
node tools/verify-android-outbox.mjs <android-outbox.json-yolu>
```

Girdi, `learning_outbox` satırlarının JSON dizisidir (`id`, `rpc`, `payload`, `state`). Araç yalnızca geçici test veritabanına yazar; Android kuyruğunu onaylamaz ve canlı servise bağlanmaz. Deneme yolculuğundaki 14 işlem kabul edildi; aynı 14 gövdenin ikinci gönderimi yeni ödül üretmedi.

Testler PGlite üzerinden PostgreSQL çalıştırır. Docker veya Supabase hesabı gerektirmez; test veritabanı geçicidir. Android projesinin bağımlılıklarını değiştirmez.

Supabase CLI ve Docker kurulursa, bu klasörde `supabase start` ile ayrı bir yerel ortam kurulabilir. Bu ortamda Auth ve gerçek Storage HTTP akışları ayrıca doğrulanmalıdır. Buradaki bilgisayarda CLI/Docker bulunmadığından bu kontrol yapılmadı. Test fixture dosyasını bir Supabase projesine yüklemeyin.

## Canlı kurulum sırası

1. Uygulamaya ait Supabase projesini ve bölgesini belirle; önce deneme ortamını kullan. `config.toml` içindeki `english-tales` yerel ortam adıdır, canlı proje kimliği değildir.
2. Dört migration dosyasını sırayla uygula. Data API'de yalnızca `public` şemasını aç; `private` şemasını açma. Mevcut bucket/policy varsa çakışmaları önce incele.
3. `seed.sql` ile taslakları aktar. Yeni içerik düzeltmeleri için yeni sürüm oluştur; seed'i değiştirerek yayımlanmış metni güncelleme.
4. Gerçek Auth hesabını oluştur; doğrulanmış kullanıcı UUID'sine editör veya yayıncı rolünü güvenilir yönetim bağlantısından ata. Rol verme işlemi uygulamaya veya kullanıcı profil bilgisine bırakılmaz.
5. Kapakları **Storage API üzerinden**, mevcut dosyayı ezmeden yükle. Kaynak ve geri indirilen dosyanın boyutunu ve SHA-256 özetini karşılaştır. Panel yeni UUID/hash yolu oluşturur ve taslağı bu doğrulanmış dosyaya bağlar; manifest kaynaklarını karşılaştırma için sakla. `storage.objects` tablosuna elle kayıt eklemek dosya yüklemez.
6. Panelde editör önizlemesi ve dil kontrolünden sonra yayıncı hesabıyla `admin_publish` çağır. Düzenleme sayacı, eksik çeviri, sıra veya kapak yüklemesi varsa işlem mevcut yayını değiştirmeden reddedilir.
7. İki gerçek kullanıcıyla erişim ayrımını, oturum yenilemeyi, dosya indirmeyi ve paralel eşitlemeyi doğrula. Android'e yalnızca proje URL'si ve publishable anahtar ekle; kullanıcının kendi oturum token'ı Auth tarafından üretilir.

Güvenilir yönetim bağlantısında rol atama örneği; UUID gerçek hesapla değiştirilmelidir:

```sql
insert into private.content_staff(user_id,role)
values ('GERCEK_AUTH_KULLANICI_UUID'::uuid,'publisher')
on conflict(user_id) do update set role=excluded.role;
```

`service_role`, secret anahtar veya yönetici parolası Android paketine ve yönetim panelinin tarayıcı koduna konulmaz. Normal panel oturumu, atanmış editör/yayıncı hesabıyla işlem yapar.

`story-media` bucket'ı özeldir. Yayımlanmış dosyalara okuma izni vardır; taslak ve arşivlenmiş içerik normal okuyucudan gizlidir. Uygulama, izinli indirme veya kısa süreli imzalı URL kullanmalı; URL süresi dolduğunda yenilemelidir. Bucket'ı herkese açık yapmak taslak dosyaları da açacağından bu tasarımla uyumlu değildir.

## Sonraki aşamaların sırası

1. **Tamamlandı:** Android Room geçişi, işlem kimlikleri, cümle konumu, oturum/aktif süre ve kalıcı kuyruk. 11 birim + 14 cihaz veritabanı testi; gerçek Android gövdeleri yerel PostgreSQL sözleşmesiyle doğrulandı. [Geçiş kaydı](../docs/OFFLINE_DATA_PLAN.md).
2. **Tamamlandı:** İçerik paneli, taslak kurtarma, işlem geçmişi ve dosya temizliği. 35 yerel test + ayrı HTTP akışı geçti. Gerçek Supabase hesabı, altı kapak ve altı hikâyenin kayıt/yayını doğrulandı. Ayrıntılı sınırlar doğrulama kaydında.
3. **Tamamlandı:** Android canlı katalog, seçilen metin/kelime ve kapak indirmesi; doğrulanan çevrimdışı önbellek ve sabit okuyucu sürümü. 6 içerik testi ve arayüzden ağsız okuma geçti. [Bağlantı kaydı](../docs/REMOTE_CONTENT_PLAN.md).
4. **İlk hesap adımı uygulandı:** mevcut hesapla giriş/çıkış, şifreli oturum ve yerel hesap ayrımı; kontrollü Android Auth testleri başarılı. Kişisel hesapla canlı giriş ve yeniden açılışta oturumun korunması doğrulandı. Misafir aktarımı, cihazlar arası eşitleme ve hesap yaşam döngüsü açık. [Hesap aşaması](../docs/ACCOUNT_SYNC_PLAN.md).
5. Firebase ölçümlerini ve çökme takibini veri saklama/gizlilik kararlarıyla birlikte bağla; ilk kullanıcı yolculuğunu gerçek cihazda uçtan uca dene.

Her yeni aşama mevcut kod ve veri üzerindeki etkisi analiz edildikten sonra uygulanır.

## Teknik dayanak

Erişim modeli [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [veritabanı fonksiyonları](https://supabase.com/docs/guides/database/functions) ve [Storage erişim kontrolü](https://supabase.com/docs/guides/storage/security/access-control) üzerine kurulur. Uygulama anahtarının türü [Supabase API anahtarı rehberine](https://supabase.com/docs/guides/getting-started/api-keys) göre seçilmelidir. Yerel motor için [PGlite belgeleri](https://pglite.dev/docs/).
