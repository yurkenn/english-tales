# Canlı yayın içeriği yedeği ve geri yükleme

## Analiz — 11 Ekim 2026

Git kontrol noktası canlı metinleri veya Storage dosyalarını geri getirmez. Öncelikle kimlik doğrulama bilgileri gerektirmeyen okuyucuya açık içerik yedeği hazırlanır. Bu kapsam kullanıcı/oturum/öğrenme kayıtlarının tam yedeği değildir; ayrı kontrol gerektirir.

## Araçlar

- `node tooling/backup_public_content.mjs`: üretim public anahtarıyla salt okunur katalog ve medya alımı. Altı tablonun kayıtları, kaynak kimlikleri, sürümleri ve kapak dosyaları alınır. Bayt boyutu/SHA256 tutmazsa veya işlem boyunca etkin hikâye sürümleri değişirse işlem başarısız olur. Sayfalama birincil anahtara göre sıralıdır.
- `node native-android/backend/tools/verify-content-restore.mjs <yedek-klasörü>`: yalnızca yerel, ayrı PGlite veritabanına fixture ve bütün migration'ları kurar; yedek kayıtlarını yükler. Üretime yazmaz. Altı tablonun bütün alanları ve medya dosyaları karşılaştırılır; anon okuma doğrulanır.
- Kayıtlar geri yüklenirken yerel optimistic-lock sayacını korumak için sadece `revision_version` tetikleyicisi geçici kapatılır ve transaction içinde yeniden açılır. İçerik bütünlük tetikleyicileri ve foreign key'ler açık kalır. İlk deneme sayacı artırdığı için başarısız oldu; bu düzeltme sonrası tam eşleşme sağlandı.

## Gerçek sonuç

`2026-10-11T19-44-03.720Z` yedeğinde altı hikâye, 81 cümle ve altı medya dosyası var. Altı tablonun geri yüklenen kayıtları kaynakla eşleşti; bütün kapakların boyut ve SHA256 kontrolü başarılı. Yedek `native-android/build/content-backups/` içinde Git dışında tutulur; ayrı yerel arşiv kopyası da oluşturulur.

## Sınırlar ve sonraki kabul

Bu yedek yalnızca okuyucuya açık yayınları kapsar; taslak, arşiv, editör işlem geçmişi, kullanıcı, kimlik, öğrenme kaydı ve servis ayarları içermez. Medya baytları doğrulandı; hosted Storage'a geri yükleme denenmedi. Tam üretim felaketten kurtarma testi tamamlandı sayılmaz. Tam yedekte erişim kısıtı, saklama süresi, silinen hesapların tekrar açılmasını önleme ve ayrı ortamda geri yükleme ayrıca doğrulanmalıdır.
