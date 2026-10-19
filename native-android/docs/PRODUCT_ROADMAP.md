> **19 Ekim 2026:** Aktif öncelik ve gelecek planı [90 günlük yol haritasında](ROADMAP_2026_Q4.md). Bu belgedeki eski durum/süre tabloları tarihsel ve teknik referanstır; yayın durumu için [50 kaydı](RELEASE_50_STATUS.md) esas alınır.

# English Tales — native ürün ve kullanıcı deneyimi planı

13 Ekim 2026 · Durum: uygulama önerisi; aşağıdaki yeni özellikler henüz uygulanmadı.

Hedef: Kullanıcı bir hikâyeye hızla başlasın, anlamadığı ifadeyi bağlamıyla öğrensin, uygulamaya döndüğünde nereden devam edeceğini bilsin. Android geliştirmesi Kotlin/Compose üzerinden ilerler. Mevcut kelime defteri, dört alıştırma, günlük hedef, TTS, hesap ve eşitleme yeniden yazılacak özellikler değildir.

Öncelik sırası: veri güvenilirliği → okuma rahatlığı → öğrenme döngüsü → içerik keşfi → gelişmiş ses ve büyüme. [24 teknik iş paketi](DEVELOPMENT_BACKLOG.md) bu planın altyapı ve yayın bağımlılıklarını tanımlar. Süre tahmini ilk uygulama ve testlerden sonra yapılacak; öncelik süre vaadi değildir.

## 1. Önce güvenilir temel

| İş | Kodda görülen dayanak | Kabul / değişimin etkisi |
|---|---|---|
| Hesaba uygun hatırlatıcı (D03) | [LearningReminders.kt](../app/src/main/java/com/yurken/englishtales/ui/LearningReminders.kt), alıcı satır 63: `LearningStore(context)` misafir varsayılanıyla açılıyor. | Aktif hesap hedefi tamamladıysa gereksiz bildirim yok; hesap değişimi/çıkış/yeniden başlatma denenir. Bildirim tercihi ve owner seçiminden etkilenir. |
| Kayıt hatasını doğru ekranda gösterme (D04) | [LearningViewModel.kt](../app/src/main/java/com/yurken/englishtales/data/LearningViewModel.kt), satır 53–54: mutation hatası hesap mesajına yazılıyor. | Okuyucu ve alıştırmada başarısız kayıt görünür; yeniden deneme aynı işlemi çoğaltmaz. Bu görünmez hata hipotezi arayüz senaryosuyla önce yeniden üretilecek. |
| İkinci cihazda kelimeyi çözme (D05/D08) | [LearningCloudSnapshot.kt](../app/src/main/java/com/yurken/englishtales/data/LearningCloudSnapshot.kt), satır 17; [CatalogScreens.kt](../app/src/main/java/com/yurken/englishtales/ui/CatalogScreens.kt), satır 267. Snapshot kaynak sürümünü taşıyor; ekran yerel sözlükten filtreliyor. | Yeni cihaz ve arşivlenmiş kaynak senaryosu; kelime kimliği kadar anlam/örnek erişimi de doğrulanır. RLS, geçmiş içerik ve çevrimdışı sözlüğe bağımlı. Canlı yetki açmadan önce tasarım incelemesi gerekir. |
| Çok sözcüklü ifadeler (D06) | [ReaderScreen.kt](../app/src/main/java/com/yurken/englishtales/ui/ReaderScreen.kt), `TappableSentence`; panel ifade desteği mevcut. | “picked up” gibi ifade tam seçilir; alt sözcük/boşluk/noktalama yanlış eşleşmez. Android tokenizer, cümle-kelime bağlantıları ve panel aynı sözleşmeyi kullanır. |

Bu bulgular bütün kullanıcıların hata yaşadığı iddiası değildir. Kod kanıtı, yeniden üretim ve düzeltme sonucu ayrı tutulur. İşlerin ayrıntılı etkisi ve kabulü [kaynak haritası](CODEBASE_MAP.md) ve [teknik haritadadır](DEVELOPMENT_ROADMAP.md).

## 2. İlk kullanıcı deneyimi paketi

| ID / öneri | Kullanıcı değeri ve kapsam | Etkilenen alan / bağımlılık | Kabul ölçütü |
|---|---|---|---|
| U01 · Kalıcı okuma ayarları · P1 | Var olan yazı ve tema kontrollerini yeniden açılışta koru; satır aralığı ve rahat okuma düzenini değerlendir. Ayar önizlemesi anlık olsun. | ReaderScreen, Theme, TalesApp; önce hangi ayarın cihazda/hesapta tutulacağı kararı. Hesap tercihi ise mevcut CAS eşitlemesiyle uyum; cihaz tercihi ise ayrı kalıcı kayıt. | Uygulama kapanıp açıldığında ayar korunur; hesaplar birbirinin tercihini ezmez; büyük sistem yazısında çeviri ve kelime kartı taşmaz. |
| U02 · Tek dokunuşla devam · P1 | Ana ekranda son hikâye, konum ve bugünkü sonraki küçük adım; boş durumda açık ilk hikâye önerisi. | CatalogScreens, LearningJourney, LearningStore, TalesApp; D05/D07/D13. | Aynı hikâye sürümünün doğru cümlesine gider; indirilemeyen içerik için açıklama vardır; bitmiş hikâye yanlışlıkla yarım gösterilmez. |
| U03 · Kayıt ve eşitleme durumları · P1 | “Bu cihazda kaydedildi”, “eşitleme bekliyor”, “yeniden dene” durumları; çevrimdışında öğrenmeye devam. | LearningViewModel, ContentDownload, AccountScreen, ReaderScreen; D04/D08. | Başarı mesajı ancak yerel kayıt sonrası; ağ kesintisinde ilerleme kaybolmaz; yeniden deneme çift puan yaratmaz. |
| U04 · Erişilebilir ve tutarlı gezinme · P1 | Küçük ekranda açık geri dönüş; kelime penceresinde belirgin kapat/kaydet; ekran okuyucu etiketleri; yükleme/boş/hata durumları aynı dilde. | Compose ekranları, ReferenceComponents, Android string kaynakları; D11/D12. | TalkBack ile hikâye→kelime→alıştırma tamamlanır; büyük yazıda kritik eylemler erişilir; geri tuşu konumu kaybetmez. |

İlk PR önerisi: D03/D04 güvenilirliği; ardından U01/U02. Her PR tek kullanıcı davranışına odaklanır. Görsel tasarım bu akışlar doğrulandıktan sonra tutarlı boşluk, tipografi ve bileşenler üzerinden geliştirilir.

## 3. Öğrenme ve içerik paketi

| ID / öneri | Kullanıcı değeri ve kapsam | Bağımlılık / kırılma alanı | Kabul ölçütü |
|---|---|---|---|
| F01 · Zayıf kelimelere odaklanan tekrar · P1 | Mevcut zamanlı tekrarı görünür kıl: bugün zamanı gelenler, sık hata yapılanlar, kısa tekrar oturumu. İlk aşamada yeni öğrenme algoritması yerine mevcut politika ile seçim ve açıklama. | LearningPolicy, PracticeScreen, oyunlar, LearningStore; D05/D06/D08. Aralık/puan değişikliği Android ve SQL politikasını birlikte etkiler. | Aynı gün tekrar ustalığı yapay artırmaz; yanlış yanıt yeniden çalışma listesine girer; iki cihazda aynı işlem tek sayılır. |
| F02 · Bağlamlı kelime defteri · P1 | Kaydedilen kelimede kaynak cümle, çeviri, hikâyeye dön ve telaffuz; filtre ve arama. | LearningContent, CatalogScreens, RemoteContent, kaynak revision çözümü; D05/D06. Yeni not alanları eklenirse şema ve sync migration gerekir. | Çevrimdışında kayıtlı bağlam okunur; hikâye yeni sürüme geçince eski örnek sessizce değişmez; arşiv politikası açıklıdır. |
| F03 · Daha iyi kitaplık · P1 | Seviye/tür/süre filtreleri, okunmamış/indirilen görünümü; gerçek yayın tarihine göre yeni hikâyeler; önerinin nedenini göster. | CatalogScreens satır 116/134 `takeLast(3)`; RemoteContent satır 154 ID sırası. Yeni süre/tarih alanları katalog/exporter/panel/seed uyumu gerektirir. | Yeni hikâye sırası ID'den bağımsız doğru; filtreler birleşebilir ve sıfırlanabilir; önerilen hikâye erişilebilir. |
| F04 · Çevrimdışı kitaplık yönetimi · P1 | İndirme boyutu, durum, yeniden dene ve cihaz alanı; okuma metni ile medya silmenin etkisini açıkla. | ContentDownload, RemoteContent önbellek ve tarihsel sözlük; D05/D19. | İndirme yarım kalınca bozuk içerik gösterilmez; medya temizliği öğrenme kaydını silmez; uçak modunda indirilmiş hikâye tamamlanır. |
| F05 · Haftalık hedef ve anlaşılır ilerleme · P2 | Mevcut günlük hedef/seri üzerine haftalık özet; kullanıcının küçük hedef seçmesi; kaçırılan gün sonrası yumuşak dönüş. | LearningJourney, LearningPolicy, yerel ve bulut toplamları; D08. Yeni ödül veya seri affı ilk kapsamda yok. | Gün/saat dilimi sınırı ve eşitleme sonrası tutarlı; özet gerçek çalışmayı gösterir; bildirim isteğe bağlıdır. |
| F06 · Hikâye içeriğini genişletme · P1 | Seviyelere dengeli kısa hikâyeler; çeviri/kelime/ifade editör kontrolü; önerilen sonraki hikâye. | Panel, catalog exporter, CONTENT_GUIDE; D14/D15. Hacim editör kapasitesine göre seçilir. | Her yayın incelemeden geçer; hedef seviyeyi pilot kullanıcılar anlayabilir; sonradan değişen içerik mevcut okuyucunun sürümünü bozmaz. |
| F07 · Bağlamlı içerik geri bildirimi · P2 | Çeviri, cümle veya ses hatasını ilgili hikâye/sürümle bildirme. İlk pilotta açık mevcut destek kanalı; ürün içi form ayrı kapsam. | SupportLinks; form olursa yeni endpoint/tablolar, RLS, spam sınırı, editör kuyruğu ve saklama politikası. | Kullanıcı hangi metni bildirdiğini görür; kişisel öğrenme geçmişi varsayılan eklenmez; editör kaynağı bulup düzeltme sürümü yayımlayabilir. |

## 4. İkinci ürün paketi — ilk pilotun sonucuna bağlı

| Özellik | Karar ve bağımlılık | Tamamlanma ölçütü |
|---|---|---|
| Kayıtlı ses ve cümle takibi (F08/P2) | Şu an Android TTS var; panelin ses alanı native Story modeline bağlı değil. D07/D14/D16; sürüme bağlı medya, checksum, çevrimdışı politika, hız/odak ve arka plan kapsamı önce kararlaştırılır. | Metin/ses aynı revision; durdur/devam ve kesinti çalışır; dosya yoksa anlaşılır TTS alternatifi. Yeni ses altyapısı ölçüm sonrası seçilir. |
| Hikâye favorileri / okuma listesi (F09/P2) | Kelime kaydıyla ayrı kavram. Owner-scoped Room tablosu ve migration; hesap eşitlemesi, tombstone ve arşiv davranışı gerekir. | İki cihazda ekle/sil tutarlı; arşivli favori çökmeye yol açmaz; eski kayıtlar migration sonrası korunur. |
| İlgiye göre öneriler (F10/P2) | Önce seçilen seviye/tür ve okunmamış içerikle açıklanabilir kurallar. AI sağlayıcısı veya yeni takip SDK'sı ilk kapsamda yok. | Yeni kullanıcıya boş sonuç yok; aynı kitabı sürekli önermez; “neden önerildi” anlaşılır; kullanıcı tercihi değiştirebilir. |
| Arayüz dili (F11/P2) | Mevcut Türkçe arayüz metinlerini Android string kaynaklarına taşı; ikinci dili hedef kitle geri bildiriminden sonra seç. İçerik dili ayrı modeldir. | Sistem diline uyum, geri dönüş dili, uzun çeviriler ve erişilebilirlik etiketleri test edilir; öğrenilen İngilizce metin yanlışlıkla çevrilmez. |
| Topluluk hikâyeleri / yazar takibi / değerlendirme (F12/araştırma) | Eski master'da olması native kapsamını otomatik onaylamaz. Moderasyon, telif, kötüye kullanım, roller, veri modeli ve yayıncı iş akışı çözülmeden planlanmış uygulama işi değildir. | Ayrı ürün taslağı, operasyon sahibi, erişim/istismar testleri ve pilot kararı. |
| Gelir / abonelik / referans (F13/araştırma) | Eski Expo ödeme/reklam bağımlılıkları taşınmaz. Önce ücretsiz kapsam ve kullanıcı değerinin kabulü; sonra native mağaza hakları, sunucu doğrulaması ve beyanlar ayrı tasarım. | Ayrı gelir kararı; satın alma geri yükleme, iptal ve hesaplar arası hak sınırı kanıtı. |
| iOS (F14/gelecek kararı) | Bu çalışma Android içindir. iOS istenirse Swift/SwiftUI uygulaması ve ortak API sözleşmesi planlanır; React Native/Expo geri eklenmez. | Ayrı iOS kapsamı, kaynak bütçesi, hesap/veri sözleşmesi ve yayın kabulü. |

## 5. Pilot ve başarı değerlendirmesi

İlk pilotta üç görev: yeni kullanıcının ilk hikâyeyi bitirmesi; ertesi gün kaldığı yerden devam ve kelime tekrarı; çevrimdışında çalışma ve yeniden eşitleme. Misafir ve hesaplı kullanıcı ayrı gözlenir.

- Gözlemler: ilk okumaya kadar süre/tereddüt, kelime kaydının bulunması, hikâye tamamlama, tekrar oturumunu bitirme, okuma rahatlığı, kayıp/çift kayıt, anlaşılmayan hata mesajları.
- İlk baseline'dan sonra hedef belirlenir; ölçülmemiş yüzde veya kullanıcı kazanımı vaat edilmez. Tutulum oranı öğrenme kazanımının tek kanıtı değildir.
- İlk aşamada gönüllü pilot ve mevcut test kayıtları yeterli. Üretim analitiği ayrıca kapsamlandırılır; e-posta, token, tam metin ve bireysel öğrenme geçmişi loglanmaz. Yeni SDK bu PR'ın parçası değildir.
- Feature öncesi sahiplik/şema/sync/offline etkisi yazılır. Sonrasında kabul senaryosu, test sonucu, kalan sınır ve geri dönüş adımı PR'da tutulur.

## 6. Uygulama sırası ve kapılar

1. GitHub native temel + tekrar çalıştırılan kontroller. React Native kaynakları geçmişte korunur.
2. D03–D08 ile kayıt/kelime/hatırlatıcı/eşitleme güvenilirliği; U01–U04 ile okuma rahatlığı ve devam akışı.
3. F01–F04/F06 ile tekrar, bağlam, keşif, çevrimdışı ve içerik pilotu.
4. D09–D22 ile gerçek hesap, silme, geri yükleme, imzalı Play güncellemesi ve yayın kabulü. Eski kullanıcı verisi kararı bu kapının parçasıdır.
5. Pilot bulgularına göre F05/F07–F11. F12–F14 için ayrı kapsam kararı.

Teknik bağımlılığı olmayan UX işleri yayın öncesi paralel planlanabilir; aynı veri/sync sözleşmesini değiştiren işler sıralanır. Bu belge ürün uygulaması için öneridir; yeni ekranlar, şema veya canlı servis değişikliği yapılmadı.

Platform dayanağı: [Compose erişilebilirlik](https://developer.android.com/develop/ui/compose/accessibility) ve [kullanıcının yazı boyutuna uyum](https://developer.android.com/develop/ui/compose/accessibility/scalable-content). Tercih saklama tasarımı mevcut Room/hesap sınırlarından başlanarak seçilir; [DataStore rehberi](https://developer.android.com/topic/libraries/architecture/datastore) küçük cihaz ayarları için bir seçenek, zorunlu yeni bağımlılık değildir.
