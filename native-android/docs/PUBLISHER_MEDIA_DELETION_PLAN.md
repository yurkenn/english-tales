# Yayıncı hesabı ve ortak içerik dosyaları

## Analiz — 11 Ekim 2026

Supabase, Storage dosyasına sahip Auth kullanıcısının silinmesini engeller. Altı canlı kapak yayıncı hesabına ait. Öğrenme hesabının silinmesiyle ortak hikâye dosyalarının silinmesi aynı işlem değildir. Genel katalog korunmalı; dosya aktarımı başarısız olduğunda hesap silindi denmemeli.

## Uygulama

Yeni envanter RPC'si yalnızca mevcut sunucu rolüne açıktır; istemciler başka kullanıcıların dosyalarını göremez. Storage metadata'sına SQL ile yazılmaz. Açık hesap silme onayı ve son beş dakika içindeki oturum kontrolünden sonra, sunucu tanınan katalog dosyalarını boyut/SHA256 ile doğrular. Aynı baytları Storage PUT API'siyle sunucu adına yükler, tekrar okuyup doğrular ve sahiplik envanterinin boş olduğunu kontrol eder. Ancak bundan sonra oturumlar iptal edilip Auth hesabı silinir. Bilinmeyen dosya, boyut/hash farkı veya sahiplik sorunu hesabı koruyarak hata döndürür.

## Doğrulama ve sınırlar

- 50 backend testi geçti; yanlış kullanıcı, eski oturum, yetki, öğrenme cascade, hash/boyut, API hatası ve boşalmayan sahiplik senaryoları kapsandı.
- Test projesinde migration uygulandı, anon/authenticated EXECUTE kapalı ve service_role açık doğrulandı. Test ve üretim delete-account v2 aktif. Üretimde aynı erişim kontrolü doğrulandı; 6 hikâye ve 6 kapak korunuyor.
- Yeni migration ile gerçek yayımlanmış içerik yedeği izole ortama tekrar geri yüklendi: altı tablo, 6 hikâye, 81 cümle ve 6 dosyanın checksum karşılaştırması başarılı.
- Advisors yeni envanter için uyarı üretmedi. Mevcut kontrollü SECURITY DEFINER RPC'leri, RLS ile API erişimi kapalı private tablolar ve Free planda parola sızıntı koruması bildirimi ayrıca mevcut güvenlik tasarımının parçası; bütün uyarıların yok olduğu iddia edilmez.
- Gerçek kişisel Google veya yayıncı hesabı silinmedi. Canlı Storage sahiplik aktarımının geçici yayıncı hesabıyla uçtan uca testi henüz yapılmadı; API kaynak davranışı ve kontrollü test kanıtı bunun yerine gerçek kullanıcı silinmesi kanıtı olarak sunulmaz. Hata durumunda silme güvenli biçimde durur.

## Geri dönüş

Kontrol noktası: `44adb28`, `checkpoint/account-media-preservation-20261011`. [GitHub kontrolü](https://github.com/yurkenn/english-tales/actions/runs/38170419479) depo, backend ve Android işlerinde başarılı.

Sunucu handler önceki sürüme döndürülebilir; yalnızca sunucuya açık read-only RPC kalabilir. Dosya aktarımı ortak medyanın içeriğini değiştirmez. Git geri dönüşü Auth silinmesini geri almaz.

Kaynaklar: [Storage sahipliği](https://supabase.com/docs/guides/storage/security/ownership), [Storage metadata kuralları](https://supabase.com/docs/guides/storage/schema/design), [Auth veri yönetimi](https://supabase.com/docs/guides/auth/managing-user-data), [Storage update API](https://supabase.com/docs/reference/javascript/storage-from-update).
