# İçerik paneli: analiz ve uygulama planı

## 10 Ekim 2026 — başlangıç analizi

Android uygulaması içerik sürümünü ilerleme kayıtlarına bağlıyor. Bu nedenle yayınlanmış metin yerinde değiştirilemez; düzenleme yeni taslak sürümde yapılmalı. Altı hikâye, 81 cümle ve kapaklar başlangıç kataloğudur. Supabase projesi henüz bağlanmadı.

Eksikler: yönetici rolünü güvenli sorgulama, yeni sürüm oluşturma, cümle/kelime bağlantılarını atomik kaydetme, eşzamanlı düzenleme kontrolü, medya yükleme ve yayın öncesi önizleme. Çok sayıda ayrı tablo isteği kısmi kayda yol açacağı için kaydetme PostgreSQL işlemi içinde yapılacak.

## Bu aşamanın kapsamı

1. Kullanıcının oturumundan editör/yayıncı rolünü belirleyen sunucu işlevleri.
2. Yeni hikâye ve yayınlanmış hikâyeden taslak sürüm oluşturma.
3. Başlık, yazar, seviye, tür, açıklama; sıralı İngilizce/Türkçe cümleler; sözlük ve cümle bağlantıları.
4. Düzenleme sayacıyla eski kayıt ve eski yayın önizlemesini reddetme. Mevcut doğrudan tablo düzenlemeleri de sayacı ilerletir.
5. Yeni değişmez dosya yoluna kapak yükleme; dosya boyutu ve SHA-256 doğrulama. Ses dosyası isteğe bağlı.
6. Telefon okuma önizlemesi, eksiklerin listesi, yayıncıya açık yayın/arşiv işlemleri.
7. Kalıcı yerel deneme veritabanıyla çalışır panel; Supabase Auth/Data API/özel Storage bağlantı adaptörü.

## Arayüz

Türkçe, açık renkli, okunaklı panel. Sol hikâye listesi; ortada adımlara ayrılmış editör; sağda telefon önizlemesi. Kaydedilmemiş değişikliklerde gezinme uyarısı. Yerel deneme etiketi sürekli görünür; burada yayınlama Android kataloğunu veya bulut verisini değiştirmez.

## Yetki ve çalışma sınırları

Yerel deneme yalnızca 127.0.0.1 üzerinde çalışır ve örnek yayıncı kimliği kullanır; gerçek kimlik doğrulama değildir. Bulut modunda gerçek oturum ve veritabanındaki personel rolü gerekir. Tarayıcıya yalnızca proje URL'si ve publishable key verilir; service_role/secret key kullanılmaz. Oturum bellekte tutulur. Panel ayrı paket olarak Android kaynaklarından bağımsız çalışır.

## Kabul kontrolleri

- Yetkisiz kullanıcı yönetici işlevlerine erişemez; editör yayınlayamaz.
- Hatalı kelime bağlantısı tüm kaydı geri alır; eski düzenleme sayacı mevcut içeriği ezemez.
- Yayınlanmış sürüm korunur; eksik çeviri/kapak yayınlanamaz.
- Yerel gerçek PostgreSQL akışı: taslak → düzenle → kaydet → yeniden aç → önizle → yayınla → arşivle.
- Tarayıcıda masaüstü/dar ekran, klavye etiketleri, kayıt durumu ve hata akışları incelenir.

## Sonraki aşama

Supabase test projesini bağlamak, gerçek Auth/Storage yüklemelerini doğrulamak, ardından Android uzak katalog ve hesap eşitlemesini bağlamak. Kullanıcı oturum raporları ve Firebase ölçümleri ayrı aşamada ele alınacak; panelde örnek kullanıcı istatistikleri gerçekmiş gibi gösterilmeyecek.

Kaynaklar: [Supabase Data API](https://supabase.com/docs/guides/api), [Storage yükleme](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [parola ile giriş](https://supabase.com/docs/guides/auth/passwords).

## Uygulanan sonuç

Panel `backend/admin` içinde kuruldu. Yeni ön yüz bağımlılığı eklemeden Node sunucusu ve tarayıcı modülleri kullanıldı. Yerel PostgreSQL verisi ve gerçek yüklenen dosyalar kalıcıdır. Altı başlangıç hikâyesi taslak olarak açılır. Supabase yapılandırılırsa yerel deneme uçları kapanır ve gerçek personel oturumu istenir.

23 SQL testi ve ayrı HTTP/dosya akışı başarılı. Tarayıcıda düzenle → kaydet → eksik çeviri kontrolü → kapak yükle → yayınla → yeni taslak akışı doğrulandı. [Kullanım](../backend/admin/README.md) · [Doğrulama ve kalan canlı ortam işleri](../backend/VERIFICATION.md).

## Tamamlama analizi — 10 Ekim 2026

İlk sürümün kapanması için gerekli eksikler:

- Yanlış açılmış taslağı sürüm kontrolüyle silme; yayınlanmış sürümü ve öğrenme geçmişini koruma.
- Taslak oluşturma/kaydetme/silme, yayın ve arşiv için oturum kimliğine bağlı içerik işlem geçmişi.
- Yenileme/kapanma sonrasında kaydedilmemiş metni kurtarma; çakışmada indirilebilir yedek ve eski sürümü ezmeden güncel kaydı açma.
- Kelimelerin bütün bağlantılarında gerçekten İngilizce cümlede bulunması; medya metadata değişince incelenen taslak sürümünü geçersiz sayma.
- Yükleme hatasında oluşturulan dosya/metadata'yı güvenli geri alma; yalnızca hiçbir sürüme bağlanmamış medya için silme.
- Ağ kesintisi, oturum yenileme, rol eksikliği, HTTP hatası ve bozuk dosya durumlarını istemci adaptöründe sınama.
- Bağlantı/rol/şema durumunu panelde görünür yapma ve gerçek Supabase bağlantısını doğrulama.

Supabase eklentisi keşfedildi ve bağlantı önerisi sunuldu. Gerçek proje kurulumu ve Auth/Storage doğrulaması için kullanıcının kendi hesabını eklentiye bağlaması gerekir. Bu bağlantı gelene kadar bağımsız panel ve veri işleri tamamlanacak; yerel test bulut doğrulaması olarak raporlanmayacak.

## Tamamlanan aşama

Taslak kurtarma/JSON yedek, sürüm kontrollü taslak silme ve arşivleme, işlem geçmişi, kelime-cümle uyumu ve kullanılmayan dosya temizliği uygulandı. 27 SQL + 8 istemci testi ve ayrı HTTP akışı geçti.

Supabase eklentisi bağlandı. Kullanıcının oluşturduğu yurken / English Tales Frankfurt projesine dört migration kuruldu; gerçek yayıncı hesabı ve yerel panel bağlantısı tamamlandı. Altı hikâye ve kapakları gerçek Storage/API üzerinden yayınlandı. Panelde yedek kurtarma ve işlem geçmişi denendi. Ayrıntılı sınırlar backend/VERIFICATION.md içindedir.

Sıradaki bağımsız aşama Android uzak katalog ve doğrulanmış çevrimdışı önbellektir. Başlamadan önce Room sürümleri, okuma oturumunun sabit içerik sürümü, indirme hataları ve hesap/eşitleme sınırları analiz edilecek.
