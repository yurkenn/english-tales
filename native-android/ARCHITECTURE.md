# Yerel Android mimarisi

## Bugünkü karar

Uygulama Kotlin + Jetpack Compose olarak ayrı bir Android projesinde geliştiriliyor. Paket kimliği `com.yurken.englishtales` korunuyor. Hikâye okuma, kelime kaydı ve oyunlar internet olmadan çalışıyor. İçerik uygulamanın içinde; ilerleme Room üzerinden SQLite'ta tutuluyor. Uzak içerik ve isteğe bağlı hesap için Supabase; ürün ölçümü ve çökme takibi için Firebase seçildi.

```text
Compose ekranları → LearningViewModel (sıralı işlemler) → LearningStore → Room v4
                                                     ↘ yerel ilerleme + işlem kuyruğu (aynı transaction)
                 ↘ LearningContent → assets/catalog/v1.json (sürümlü örnek içerik)
```

## İçerik altyapısı

Hikâyeler uygulama kodundan ayrılmış sürümlü JSON kataloğunda tutuluyor. İçerik şu alanları taşıyor:

- Hikâye: kalıcı kimlik, başlık, yazar, özet, seviye, tür, kapak anahtarı, sıralı cümleler
- Cümle: kalıcı kimlik, İngilizce metin, Türkçe çeviri; ses dosyası sonraki aşamada
- Kelime: kalıcı kimlik, İngilizce yazım, telaffuz, Türkçe anlam ve örnek cümle
- Yayın: paket içi şema sürümü; hazırlanan sunucu modelinde taslak/yayımlanmış hikâye sürümü

Paket içi katalog ilk açılış ve çevrimdışı başlangıç kaynağıdır. Yeni içerik yayını Supabase Database, kapak/ses dağıtımı özel Supabase Storage bucket'ı üzerinden hazırlanır. Editör taslağı düzenler; yayıncı kontrollerden geçen yeni sürümü yayımlar. Yayımlanmış metin ve medya değiştirilmez; düzeltme yeni sürüm oluşturur. Sanity bağlantısı kurulmadı ve bu mimaride gerekli değil. Ayrıntılar [içerik rehberinde](CONTENT_GUIDE.md) ve [servis kurulumunda](backend/README.md).

Veri modeli dört migration ile English Tales Supabase test projesine kuruldu. Altı hikâye, 81 cümle çifti ve altı gerçek kapak yayınlandı. 27 SQL + 8 istemci testi geçti. `backend/admin` paneli gerçek personel oturumu, atomik kayıt, sürüm kontrollü yayın, taslak kurtarma, işlem geçmişi ve kullanılmayan medya temizliği sağlar. Gerçek Auth/Storage yükleme ve katalog erişim sınırları doğrulandı. Android uzak katalog ve hesap eşitlemesi sonraki aşamadır.

## İlerleme ve senkronizasyon

Android'de hesap ekranı ve cihazlar arası eşitleme henüz yok. Room v4, native SQLite 1/2/3 verilerini ve eski tercihler dosyasını koruyarak devralır. İşlemler ViewModel'de bir kuyruktan sırayla uygulanır. Kelime olayları, cümle konumu ve tamamlanan oturumlar yerel ilerlemeyle aynı transaction içinde gönderim kuyruğuna yazılır. Gövdeler değişmez; yeniden denemede yalnızca teslim metadata'sı güncellenir.

Misafir eski `english_tales.db` dosyasını kullanır; her hesap için ayrı bir Room dosyası ve doğrulanan sahip kaydı vardır. Misafir kuyruğu ağ gönderimine açılmaz; hesap kuyruğuna erişim/onay beklenen hesap kimliğiyle eşleşmelidir. İlk hesap bağlama, token yenileme ve sunucu durumunu birleştirme sonraki aşamadır. Eski React Native taşıması eklenmedi. Eski native toplamları sunucu oturum geçmişi gibi uydurulmaz. [Yerel geçiş analizi](docs/OFFLINE_DATA_PLAN.md).

Hazırlanan sunucu modelinde kullanıcı kimliği oturumdan alınır. Aynı işlem UUID'si ikinci kez ödül üretmez; değişmiş gövdeyle aynı UUID reddedilir. Kelime silmeleri olay olarak korunur, geç gelen eski kayıtlar kelimeyi geri getirmez. Okuma yüzdesi gerilemez; devam cümlesi en yeni olaya göre tutulur. Tercih sürümü başka cihazdaki yeni ayarın ezilmesini önler. [Eşitleme sözleşmesi](backend/SYNC_CONTRACT.md).

## Ölçüm ve kalite

Firebase Analytics ilk açılış/öğrenme geçişlerini ve geri dönüşü; Crashlytics çökme sorunlarını izleyecek. Supabase öğrenme oturumları kalıcı ilerleme içindir. Bu iki servisin Android bağlantısı henüz yapılmadı; mevcut olaylar yalnızca cihazda tutuluyor. Okuma ve alıştırmalarda aktif süre, yaşam döngüsü ve monoton saatle yerelde ölçülür; beş saniyede bir ve duraklatma/kapanışta kaydedilir. Ani süreç kaybında son checkpoint'ten sonraki birkaç saniye kaybolabilir. Yarıda bırakılan çalışma ödül üretmez. Veri saklama, gizlilik ve hesap silme akışları yayın öncesi tamamlanmalı.

## Yayına çıkış kapıları

1. Altı özgün örnek hikâyeyi yayın hacminde, dil kontrolünden geçmiş içerikle genişletme; editör akışını ve yeni kitapların kapaklarını kurma.
2. Gerçek Android cihazlarda ses, farklı ekran boyutları ve erişilebilirlik kontrolü.
3. Play Console'daki mevcut en yüksek sürüm kodunu ve yükleme imzasını doğrulama.
4. Mağaza güncellemesi için imzalı Android App Bundle, mağaza görselleri ve gerekli politika metinlerini hazırlama.

Tasarım ve özellik kararları kullanıcı tarafından paylaşılan ekran görüntülerinden çıkarılır. Mobil uygulamanın tek kaynak ve derleme alanı `native-android/` klasörüdür; kurulum ve komutlar [Android rehberinde](README.md) tutulur.
