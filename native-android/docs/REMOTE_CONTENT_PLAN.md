# Android canlı içerik ve çevrimdışı indirme

11 Ekim 2026

## Aşama öncesi analiz ve karar

Android'in bütün ekranları sabit `LearningContent` kataloğunu kullanıyordu. Backend'de yayımlanmış sürümler ve özel Storage hazırdı. Yeni bir backend şeması gerekmiyor; mevcut okuma izinleri ve tablolar kullanılabilir.

Katalog metadatası ve indirilen sürümler ayrıldı. Yeni hikâyenin cümle/kelime bağlantıları seçildiğinde yüklenir; katalog yenilemek bütün hikâyelerin metin ve dosyalarını indirmez. Paket içi ilk hikâyeler servis erişilemezken başlangıç deneyimini korur. Başarılı boş katalog yanıtı ile ağ hatası ayrılır: boş yayın listesi eski hikâyeleri yeniden yayımlanmış gibi göstermez.

Supabase becerisi, güncel doküman araması ve changelog kullanıldı. Son PostgreSQL bakım notu mevcut istemci GET bağlantısında şema değişikliği gerektirmiyor. Bu aşama yalnızca anonim içerik okumasıdır; hesap, öğrenme eşitlemesi ve servis rollü anahtar kullanılmaz.

## Uygulanan yapı

- Android INTERNET izni; HTTPS ve sadece publishable anahtar kabul eden GET istemcisi.
- Sıralı, sayfalı katalog/cümle/kelime/bağlantı okumaları; revision UUID ve hikâye kimliği kontrolü. Metadatalar 100 kimliklik gruplar hâlinde alınır.
- İlk açılışta önbellek okunur; ardından katalog yenilenir. Uygulama ön plana geldiğinde ve Kitaplık/Yenile eyleminde tekrar kontrol edilir.
- Hikâye detayından çevrimdışı indirme; yeni hikâyede okuyucu öncesi indirme ve başarısızlıkta yeniden deneme.
- Cümleler, kelimeler ve gerçek cümle-kelime bağlantıları; okuyucunun kelime kutusu ilgili sürümden anlam gösterir.
- Özel Storage'dan kapağı anonim yayımlanmış içerik izniyle okuma; 6 MB aktarım sınırı, boyut/SHA-256 ve görsel ölçüsü kontrolü.
- Kapak ve sürüm belgesi atomik dosyalarla saklanır; indirme tamamlanmadan kullanılabilir içerik olarak işaretlenmez. Yarım işlemin sahipsiz kapak dosyası yeniden açılışta temizlenir.
- 100 MB içerik alanı sınırı; indirilenler ekranından kapak/indirme kaldırma. Öğrenilmiş kelimelerin kaynağı olan küçük metin arşivi korunur.
- Okuyucu açık sürümü sabit tutar. Kuyruğa alınan ilerleme/tamamlama işlemleri o sürümü yakalar; arka plandaki katalog değişikliği işlemin revision bilgisini değiştirmez.
- Okuma sonucu ekranı tamamlanan sürümü kullanır. Yeni sürümde eski yüzde uygulanmaz; günlük devam eylemi bulunabilen kayıtlı eski sürüme döner.
- Oturum yeniden kurulurken kayıtlı okuyucu revision'ı önbellekten bulunur.
- Ağ hatasında son geçerli katalog korunur; hasarlı önbellek açılışı çökertmez.

## Yapılandırma

Yerel, Git tarafından dışlanan `native-android/supabase.properties`:

```properties
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Bu iki değer Android BuildConfig'e girer. Publishable anahtar istemcilerde kullanılabilir; erişimi RLS/Storage politikaları sınırlar. Özel anahtar veya yönetici oturumu eklenmez. Ayarlar verilmezse paket içi içerik çalışır, yenileme başarısızlığı açıklanır. Mevcut bağlantı **English Tales test projesidir**, üretim ortamı değildir.

## Doğrulama kapsamı

- Mevcut öğrenme kontrollerine sürüm değişirken yakalanan kaynağın korunması ve yeni sürüm yüzdesinin sıfırlanması testi eklendi.
- Altı yeni içerik testi: sayfalama + çevrimdışı yeniden açılış; bozuk kapak; ağ hatasında eski içerik/açık okuyucu; indirmeyi kaldırırken kelime kaynağı; hasarlı önbellek; gerçek Supabase yayınından Android indirme ve ağsız yeniden yükleme.
- Test verileri ayrı cihaz dizinleri/veritabanlarında tutulur. Emülatörün öğrenme verisi testlerden önce yedeklenir ve sonra geri yüklenir.
- Canlı özel kapak okumasında anonim erişim, gerçek dosya boyutu ve SHA-256 eşleşmesi ayrıca doğrulandı.

## Sonuç

- Derleme başarılı; 11 birim testi ve **21 cihaz testi** geçti (15 öğrenme/veritabanı + 6 içerik). Android 15 emülatöründeki canlı test yayımlanmış metin, kelime bağlantıları ve özel Storage kapağını gerçek servisten indirdi; aynı içerik ağ istemcisi olmadan yeniden yüklendi.
- Lint: **0 hata, 17 mevcut uyarı**. Son küçük durum metni/ön plana dönüş değişikliği ayrıca derlenip lint ile kontrol edildi.
- Emülatörün önceki verisi geri yüklendi: 70 puan ve 9 kelime görünmeye devam etti.
- Gerçek arayüzden The Paper Boat indirildi; tamamlanmış durum ve servis kapağı görüntülendi.
- Wi-Fi ve mobil veri kapatılıp uygulama yeniden açıldı. İndirilen kapak ve metin açıldı; önceki `pb-9` konumu ikinci sayfada korundu. Test bitince iki bağlantı da yeniden açıldı.
- [İndirme ekranı](preview-remote-download.png) ve [ağ kapalı okuyucu](preview-remote-offline-reader.png) görsel olarak kontrol edildi. İndirme ekranındaki yinelenen başarı metni sonrasında kaldırıldı.
- Crash günlüğünde çökme kaydı yok. Bunlar emülatör sonuçlarıdır; gerçek telefon kontrolleri yapılmış sayılmaz.

## Kalan işler

- Kullanıcı oturumu, misafir aktarımı ve öğrenme kuyruğunun canlı gönderimi sonraki aşama.
- Seslendirme cihaz TTS'siyle sürer; paneldeki kayıtlı ses dosyalarını indirme/oynatma henüz bağlanmadı.
- Aktarım sırasında yüzde, iptal/devam ettirme ve büyük kataloglarda daha az sayıda HTTP çağrısı için ek iyileştirme yapılabilir. Şu an indirme durum metni ve tekrar deneme vardır.
- Gerçek cihazda düşük disk/ağ, sistem tarafından süreç sonlandırma ve tam erişilebilirlik denemeleri yayın kalite aşamasında yapılacak.
- Kaynak projedeki paket adı `com.yurken.englishtales`, eski yapılandırmadaki versionCode 3. Native değer 4. Console'daki gerçekten kullanılmış en yüksek kod ve orijinal yükleme anahtarı hâlâ Console üzerinden doğrulanmalı; yerel dosyalar yeterli kanıt değildir.

Referanslar: [Supabase anahtarları](https://supabase.com/docs/guides/getting-started/api-keys), [Storage erişimi](https://supabase.com/docs/guides/storage/buckets/fundamentals), [eşitleme sözleşmesi](../backend/SYNC_CONTRACT.md).
