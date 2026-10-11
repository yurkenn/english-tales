# İçerik yönetimi kararı

Çalışan Android sürümünde içerik, [sürümlü katalog dosyasında](app/src/main/assets/catalog/v1.json) tutulur ve pakete eklenir. Uygulama internet olmadan açılır. Uzak katalog bağlantısı eklenene kadar Android'de yeni bir hikâye sunmak uygulama güncellemesi gerektirir.

Uygulama güncellemesinden bağımsız yayın için **Supabase Database + Storage** seçildi. Kullanıcı hesabı ve öğrenme kayıtları aynı projenin Auth/Database servislerinde ayrı erişim kurallarıyla tutulacak. Sanity kullanılmayacak. English Tales test projesine dört migration kuruldu; altı hikâye ve kapakları gerçek [içerik panelinden](backend/admin/README.md) yayınlandı. Panel gerçek personel oturumuyla çalışır. Android uzak katalog bağlantısı sonraki aşamadır.

## Sunucuda yayın akışı

1. Hikâye için artan numaralı yeni taslak sürüm oluştur.
2. Cümle, çeviri ve ilgili kelimeleri düzenle; dil kontrolünü tamamla.
3. Kapak ve varsa ses dosyasını Storage API ile yeni bir yola yükle; indirilen dosyanın boyutunu ve SHA-256 özetini doğrula.
4. Önizleme sonrası yayıncı hesabıyla yayın fonksiyonunu çağır. Eksik çeviri, bozuk cümle sırası veya yüklenmemiş kapak varsa yayın reddedilir.
5. Yeni sürüm kitaplığın güncel sürümü olur. Önceki yayımlanmış sürüm korunur; açık okuyucu kendi sürümünde devam eder.

Editör taslak düzenler; yayınlama ve arşivleme yalnızca yayıncı rolündedir. Normal kullanıcı ve misafir yalnızca yayımlanmış, arşivlenmemiş içerikleri okuyabilir. Roller kullanıcı profilindeki bir alanla verilmez. [Kurulum rehberi](backend/README.md) · [Veri sözleşmesi](backend/SYNC_CONTRACT.md).

## Şema

- `schemaVersion`: okuyucunun desteklediği şema sürümü. Şu an `1`.
- `words`: kalıcı `id`, İngilizce kelime, Türkçe anlam, telaffuz ve örnek cümle.
- `stories`: kalıcı `id`, başlık, yazar, seviye, tür, özet, kapak anahtarı ve sıralı cümleler.
- `sentences`: kalıcı `id`, İngilizce metin ve Türkçe karşılık.

Okuma ve kelime ilerlemesi bu kimliklere bağlanır. İçerik düzeltilirken mevcut kimlikler korunmalıdır. Uygulama katalog açılışında sürümü, boş hikâyeleri ve yinelenen kimlikleri kontrol eder.

## Bugünkü paket içi kataloğa içerik ekleme

1. Dil ve çeviri kontrolünden geçmiş hikâyeyi `v1.json` içine ekle.
2. Kapak görselini `res/drawable-nodpi` altına koyup `BookCover.kt` içindeki kapak eşlemesine ekle.
3. Cümlelerin ve kelimelerin kalıcı kimliklerini kontrol et.
4. Android derlemesini yap; kitaplık, okuyucu, ses ve kelime kaydetme akışını emülatörde kontrol et.

`backend` klasöründe `npm run catalog:export`, mevcut kataloğu altı taslak hikâye ve kapak yükleme manifesti olarak üretir. Var olan hikâye sürümünü değiştirmez; yeni yayın için yeni revision hazırlanmalıdır. Sonraki Android adımı, doğrulanan uzak içerik ve medyayı çevrimdışı önbellekte saklamaktır.

## Güncel katalog

Altı hikâye, 81 İngilizce/Türkçe cümle çifti ve 39 kelime bulunuyor. A1, A2 ve B1 seviyelerinde ikişer hikâye var. Son eklenenler: The Red Umbrella, The Last Train ve The Attic Letter. Mevcut hikâye ve kelime kimlikleri korundu. Yeni kapakların üretim kaydı `docs/NEW_COVER_ASSETS.md` dosyasında.
