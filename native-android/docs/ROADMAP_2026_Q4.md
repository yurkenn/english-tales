# Yurken Stories — önümüzdeki 90 gün

20 Ekim 2026 · [PR, Claude ve canlı içerik kontrolü](PROJECT_AUDIT_2026-10-20.md) · Durum: uygulama planı; aşağıdaki açık işler tamamlanmış sayılmaz. Tek geliştirici akışına göre yaklaşık 12 hafta; Google incelemesi, editör incelemesi ve pilot veri toplama süreleri takvimi kaydırabilir.

## Ürün yönü

**İngilizce öğrenen kişinin her gün seviyesine uygun bir hikâye okuyup birkaç kelimeyi zaman içinde hatırlamasını sağlamak.** Ana döngü: hikâye seç → oku/dinle → anlamı keşfet → kelime kaydet → zamanı gelince tekrar et → sonraki hikâyeye dön.

Öncelik: güvenilir kullanım → içerik ve öğrenme kalitesi → geri dönüş → kullanıcı kazanımı. Yeni özellik seçerken bu döngüde hangi sorunu çözdüğü ve nasıl ölçüleceği yazılır. Aynı anda bir ana ürün işi ve gerekli hata düzeltmeleri yürütülür.

## Başlangıç noktası

- Son doğrulanan yayın kaydı: **50 / 2.2.0 üretim başvurusu gönderildi**, Console “Changes in review”, hızlı kontroller sürüyor. %100 dağıtım seçildi; canlı yayın bu belgede doğrulanmış sayılmaz. Son doğrulanan canlı üretim 48, dahili kanal 49. [Kesin yayın kaydı](RELEASE_50_STATUS.md).
- 12 arayüz dili, 11 hikâye çevirisi dili, 13 mağaza kaydı. Yeni kullanıcı için dil seçimi mevcut. İngilizce arayüz şu an Türkçe hikâye çevirisi kullanıyor.
- FSRS, alıştırma basamakları, anlama soruları, dikte, cümle kurma, kişisel kelimeler, favoriler, öneriler, widget ve tablet düzeni kodda mevcut. Bunlar yeniden yapılacak özellikler değil; gerçek kullanım kabulü ve iyileştirme konusudur.
- #149/#150 birleşti: 11 dilde 1.098 sözlük maddesi paket varlıklarında mevcut. Türkçe örneklem onayı kayıtlı; diğer 10 dil `machine-draft`, bağımsız ikinci inceleme ve ana dil kabulü açık. Bu varlıklar başvurulmuş 50 paketinden sonra eklendi; yeni mağaza paketi gerekir.
- #147/#148 birleşti; beş mevcut A1/A2 pilotunun sahibi onayı kayıtlı ve güncel canlı revizyonlarında toplam 131 cümle, her cümlede 11 dil karşılığı doğrulandı. Tam UI/çevrimdışı/gerçek hesap kabulü açık; diğer 45 hikâyenin çalışma kelimesi önerileri henüz tamamlanmış sayılmaz. İki yeni klasik taslağı ertelenmiş durumda.
- #151 birleşti: sade okuyucu, hareketler, kitaplık, tema seçimi ve Phosphor ikonlar mevcut. PR CI yeşil; birleşmiş ana dal `01defbe` cihaz CI’ında ilk kullanım testi zaman aşımına uğradı. Diğer üç CI işi başarılı. Önce bu hata ayrıştırılır.
- Önceki içerik denetimindeki canlı/paket farkı kapanmış kabul edilmez. Güncel canlı fark sayısı yeniden ölçülmeden tarihsel 39 hikâye bulgusu güncel sayı olarak kullanılmaz.
- Analytics kodu mevcut ve katılım varsayılan kapalı; canlı olay kabulü ve temsili kullanım başlangıç ölçümü açık. SEO dil sayfaları henüz taslak.

## Paralel çalışma — 20 Ekim ilerlemesi

- **Claude / R05:** On dilde aynı 121 kelimenin bağımsız incelemesi tamamlandı (1.210 karşılık). 37 adaydan Portekizce `amounts` ve Rusça `wardrobe` düzeltildi; altı sözlük testi ve 11 dil varlık eşleşmesi geçti. Diğer 35 aday ve her dildeki kalan 977 madde açık; ana dil onayı verilmedi. [İnceleme ve düzeltmeler: taslak PR #152](https://github.com/yurkenn/english-tales/pull/152).
- **Codex / R00:** İlk kullanım testi API 36'da tek başına 1/1, CI'daki önceki testlerle 6/6 ve ek hata bilgisiyle tekrar 6/6 geçti. Orijinal CI zaman aşımı yerelde tekrarlanmadı. 339 testlik deneme ayrı bir süreç kapanmasıyla 39. testte durdu; tüm cihaz testleri geçti sayılmaz. [Araştırma ve ekran durumu kaydı: taslak PR #153](https://github.com/yurkenn/english-tales/pull/153). Ana dal CI ikinci denemesi ve PR cihaz kontrolleri tamamlanmadan R00 kapatılmaz.
- Bu iki PR henüz ana dala birleşmedi. Canlı içerik ve mağaza yayını yapılmadı; paralel işlerin sonucu fiziksel cihaz kabulünün yerine geçmez.

## Önce kapatılacak teknik açık

**R00 · P0 — Ana dal ilk kullanım testi:** [39386537157](https://github.com/yurkenn/english-tales/actions/runs/39386537157) çalışmasında `FirstLaunchJourneyTest` 20 saniye zaman aşımıyla başarısız. Hedefli tekrar ile ürün/test/zamanlama nedeni ayrıştırılır; gerekli düzeltmeden sonra aynı birleşik kaynakta tam cihaz CI yeşil olmalı. #151 PR CI sonucu ana dal sonucunun yerine geçmez.

## 1. Yayını sağlamlaştır — 1–2. hafta

| ID | İş | Bitti sayılma ölçütü |
|---|---|---|
| R01 · P0 | 50'nin inceleme sonucunu ve mağazaya teslimini doğrula | Console ve telefonda Play sürümü kaydı; yeni ad, yerel metinler/görseller ve 13 dil kaydı onaydan sonra kontrol edilmiş. Ret varsa nedeni düzeltilip yeni başvuru kaydedilmiş. |
| R02 · P0 | Gerçek telefonda eski sürümden güncelleme ve öğrenme yolculuğu | Play üzerinden 48→50; kayıtlı kelime, ilerleme, favoriler ve tekrar planı korunuyor. Misafir ve hesaplı kullanım, iki cihaz eşitlemesi, uçak modu, yeniden açılış, İngilizce TTS kesintisi test edilmiş. Cihaz/OS/sürüm ve sonuç kayıtlı. |
| R03 · P0 | Erişilebilirlik ve bağlantı kabulü | Aynı Play paketiyle TalkBack ana yolculuğu ve büyük yazı; uygulama kurulu/kurulu değil hikâye bağlantısı, ilk açılıştan gelen bağlantı doğru hikâyeye dönüyor. Play-imzalı universal APK'daki alan adı doğrulaması tek başına uçtan uca kabul sayılmaz. |
| R04 · P0 | Ölçümü kullanılabilir hale getir | Analytics kapalı→açık→kapalı davranışı ve izin verilen olaylar panelde doğrulanmış; test/üretim ayrımı var. Crashlytics ve Play vitals görünürlüğü kaydedilmiş; örneklem yoksa “veri yok” yazılıyor. Fiziksel cihaz açılış/okuma performansının başlangıç ölçümü var. |

**Geçiş koşulu:** Bilinen kritik çökme veya veri kaybı yok; güncelleme kabulü kaydedilmiş; ölçümün çalışıp çalışmadığı açık. Veri kaybı veya hesaplar arası veri karışması görülürse içerik ve büyüme işi durur, düzeltme öne geçer. Sonraki paket için Console'daki en yüksek sürüm koduna bakılır; 50 tekrar kullanılmaz.

## 2. Okurken takılmayı azalt — 3–5. hafta

| ID | İş | Bitti sayılma ölçütü |
|---|---|---|
| R05 · P1 | Sözlük ve canlı/paket tutarlılığı | Önce canlıya yazmadan güncel denetim. Türkçe örneklem onayı #149 ile tamamlandı. Diğer 10 sözlük dili için ikinci model/geri çeviri, itiraz ve dil örneklemi incelemesi kaydedilmiş; makine taslağı ile insan incelemesi ayrı belirtilmiş. Revizyon yayınından sonra aynı kapsamda paket/canlı farkı 0; indirilmiş eski hikâyeler ve kişisel kelimeler korunuyor. |
| R06 · P1 | Çalışma kelimelerini sözlükten ayrı yönet | Beş A1/A2 pilotu onaylandı ve canlıda; yerel okuyucu/FSRS sözleşmesi test edildi. Kalan kabul: gerçek yayımlanmış revizyonda okuyucu, kaydetme, tekrar, eski kayıt koruma, çevrimdışı kullanım ve hesap eşitlemesi. Ardından kalan 45 hikâyeye editör kapasitesine göre genişletilir. |
| R07 · P1 | Arayüz dili ve çeviri tercihini netleştir | İngilizce arayüz kullanan kişi çeviri dilini bilinçli seçebilir; mevcut tercihler korunur. Desteklenmeyen dilde açık geri dönüş; RTL, uzun metin ve TTS denenir. Dil başına hata listesi tutulur. |
| R08 · P1 | Az sayıda kaliteli yeni hikâye yayımla | Şimdilik ertelendi: sahibi mevcut hikâyelere odaklanmayı seçti. İki yeni klasik taslağı korunur; beş mevcut pilotun kabulü ve 45 hikâyenin iyileştirme planı sonrası kapsam yeniden değerlendirilir. |

**Ölçüm ayrımı:** Dokunma sözlüğünün anlam bulma kapsaması ile çalışılacak kelime sayısı ayrı raporlanır. Önceki `%60` çalışma sözlüğü ölçüsü, yeni dokunma sözlüğünün yerine geçmez. Dokunma sözlüğünde `%98` geçiş kapsaması ürün hedefidir; özel adlar/çekimler dahil payda tanımı ve dil bazlı editör doğruluğu ayrıca kaydedilir. Sırf oran yükselsin diye kelimeler alıştırmaya eklenmez. Türkçe sözlük onayı diğer 10 dilin onayı sayılmaz; pilot diğer dillerde aynı kalite süreciyle genişler.

**Geçiş koşulu:** Pilot hikâyelerde yanlış anlam/bağlantı sorunları kapalı; çevrimdışı okuma ve kayıtlar korunmuş; çalışma kelimeleri gerçekten uygulamada kullanılıyor. Katalog hacmi artırmadan önce bir hikâyenin üretim ve inceleme maliyeti biliniyor.

## 3. Kullanıcının geri gelmesini sağla — 6–8. hafta

| ID | İş | Bitti sayılma ölçütü |
|---|---|---|
| R09 · P1 | Gönüllü küçük pilot ve ilk hafta gözlemi | Hedef 5–8 katılımcı, mümkünse en az iki destek dili. İlk hikâyeyi bulma, bitirme, kelime kaydetme, ertesi gün tekrar ve çevrimdışı devam görevleri gözlenir. Kullanıcıya mesaj/iletişim gönderme ayrıca o iş kapsamında yetkilendirilir; bu plan otomatik iletişim başlatmaz. |
| R10 · P1 | En fazla sorun yaratan tek adımı iyileştir | Pilot ve olaylarla seçilen tek sorun için küçük değişiklik: örneğin ilk hikâyeye ulaşma, kelime kaydetmeyi fark etme veya günlük tekrara dönme. Önce/sonra görev başarısı ve tereddüt kaydı; yeni akış eski kayıtları bozmaz. |
| R11 · P1 | Haftalık öğrenme hedefini anlaşılır kıl | Mevcut günlük plan, haftalık özet ve öneriler doğrulanır; aynı şeyi yapan yeni ekran eklenmez. Hatırlatıcı isteğe bağlı kalır. Doğru yanıt/FSRS durumu, bağımsız öğrenme kanıtı gibi sunulmaz. |

**Geçiş koşulu:** Kullanıcı ilk hikâyeyi ve bir tekrar oturumunu yardımsız tamamlayabiliyor; geri dönmeme nedenleri kayda geçmiş. Bir sorun çözülmeden yeni oyun modu eklenmez. Küçük pilotun sonucu bütün dillere veya tüm kullanıcılara genellenmez.

## 4. Çalışan deneyimi büyüt — 9–12. hafta

| ID | İş | Bitti sayılma ölçütü |
|---|---|---|
| R12 · P1 | En güçlü iki dil/pazarda ASO deneyi | Play trafik/dönüşüm verisi ve dil kalitesiyle iki öncelik seçilir; yeterli trafik yoksa karar pilot gözlemine dayanır ve deney sonucu iddia edilmez. İlk ekran görüntüsü veya kısa açıklamadan yalnız biri değiştirilir. Console örneklem/süre tahmini ve güven aralığıyla sonuç; “daha çok veri gerekli” ise kazanan ilan edilmez. |
| R13 · P1 | Gerçek içerikli SEO sayfaları | Önce Türkçe ve verinin desteklediği ikinci dilde seviye/çevirili okuma sayfaları; gerçek hikâye örneği, Play bağlantısı, canonical/hreflang, sitemap ve mobil kontrol. Dil incelemesi sonrası indekslenme ve nitelikli mağaza trafiği ölçülür. Yayın, indekslenme ve trafik üç ayrı sonuçtur. |
| R14 · P2 | Sürdürülebilir içerik ve gelir değerlendirmesi | İçerik üretim maliyeti ve tekrar kullanım gözden geçirilir. 17 Ekim kararındaki yalnız tamamlama reklamları yaklaşımı esas; 50'de reklamlar kapalı kalır. Açılacaksa sonraki kapsamda rıza, beyan, gösterim sıklığı ve okuma/geri dönüş etkisi kabul edilmeden etkinleştirilmez. |

**Geçiş koşulu:** En az bir edinim kanalının ziyaret→yükleme verisi ile ilk kullanım kalitesi birlikte değerlendirilebiliyor. Trafik düşükse büyüme sonucu “belirsiz” kalır; ücretli edinime otomatik geçilmez.

## Haftalık karar tablosu

| Soru | Ölçü / kaynak | Yorum kuralı |
|---|---|---|
| Gelen kişi yükledi mi? | Play mağaza ziyaretçisi → edinim; dil/kaynak ve tarih aralığı | Marka değişiminden önce/sonra fark tek başına nedensellik kanıtı değil. |
| Öğrenmeye başlayabildi mi? | İlk hikâyeyi bitirenler / uygun yeni kullanıcılar; pilotta ilk okumaya kadar süre | Mevcut olaylar payda için yetmiyorsa önce ölçüm tasarlanır. |
| Geri geliyor mu? | Mevcut ertesi gün dönüş olayı; mümkünse uygun D1/D7 cohort | D7 varmış sayılmaz; izinli olaylarla hesaplanabilirliği doğrulanır, gerekirse ayrı ölçüm işi açılır. |
| Tekrarını yapıyor mu? | Başlayan/tamamlanan tekrar; ölçüm yeterli değilse gözlem | Oturum tamamlama ile uzun vadeli öğrenme birbirinden ayrı. |
| Öğrenme faydası var mı? | Seçili kelimelerde gecikmeli hatırlama ve hikâye anlama gözlemi | Küçük pilot, başarı/CEFR sertifikası veya bilimsel etki iddiası üretmez. |
| Güvenilir mi? | Çökme/ANR, veri kaybı, eşitleme, dil hatası ve cihaz profili | Küçük örneklemde ham olay sayısı da yazılır; “0 rapor” hatasızlık kanıtı değil. |

İlk iki haftalık kullanılabilir veriden sonra ürün hedef yüzdeleri belirlenir; bugünden ölçülmemiş büyüme veya tutulum hedefi başarı diye yazılmaz. Varsayılan kapalı Analytics yalnız katılan kullanıcıları temsil eder; pilot, Play ve Analytics paydaları birbirine karıştırılmaz. Ek ölçüm gerekiyorsa amaç/izin/saklama kapsamı ayrıca tasarlanır.

## Şimdilik sonraya bırakılanlar

- Yeni destek dilleri: mevcut 11 çeviri dilinin kalitesi ve öncelikli pazar sonucu görülünce.
- iOS: 90. gün değerlendirmesinde kullanıcı talebi, ortak API/veri kabulü ve bakım kapasitesiyle ayrı Swift/SwiftUI kapsamı.
- AI sohbet, konuşma puanlama ve sosyal topluluk: ana okuma/tekrar döngüsünde çözülmemiş ihtiyaç olduğuna dair kanıttan sonra.
- Kayıtlı/üretilmiş ses: mevcut TTS kararı sürer; cihaz sesiyle çözülemeyen ihtiyaç ölçülürse yeniden değerlendirilir.
- Abonelik/premium, agresif reklam ve ücretli büyüme: mevcut ürün/gelir kararını değiştireceği için ayrı ürün kararı.

## İlk başlanacak somut paket

1. **R00:** Ana dal ilk kullanım cihaz testini yeniden üret ve düzelt; tam birleşik CI sonucunu kaydet.
2. **R01–R04:** 50’nin güncel Play durumunu ve fiziksel cihaz kabulünü kaydet; canlı ölçümü doğrula. #149–#151 için yeni paket/sürüm kodu ayrıca gerekir.
3. **R05:** 10 dilde sözlük ikinci incelemesi ve dil örneklemi; yeni arayüz metinlerinin dil kontrolü.
4. **R06:** Canlıdaki beş pilotun UI/çevrimdışı/hesap kabulü. Sonra kalan 45 hikâyenin çalışma kelimeleri ve çeviri kaynağı planı; yeni hikâye ekleme ertelendi.

Bu tur yalnız planı ve belge yönlendirmelerini günceller. Yeni kod, içerik yayını, mağaza değişikliği, takip görevi veya reklam harcaması başlatmaz. Her uygulama işinde tek kullanıcı sonucu, ilgili test/kabul, geri dönüş yolu ve yeni kanıt kaydı tutulur.

## Dayanaklar ve güncelleme

- [50 yayın kaydı](RELEASE_50_STATUS.md), [kanıt JSON'u](release-evidence/2026-10-19-production-50.json), [mevcut kalite işlerinin ayrıntısı](QUALITY_ROADMAP.md).
- [Sözlük taslağı](../backend/content/glossary/tr.json), [çalışma kelimesi önerileri](../backend/content/study-words/proposals.json), [ASO araştırması](../store/aso/2026-10-19/RESEARCH.md).
- Google [mağaza deneyi rehberi](https://support.google.com/googleplay/android-developer/answer/12053285?hl=en): tek varlıkla deney, örneklem/süre tahmini ve yetersiz veri sonucu. 19 Ekim 2026 kontrol edildi.
- Google [Android vitals](https://developer.android.com/google/play/vitals): kaliteyi cihaz ve sürüm bazında takip etme dayanağı. 19 Ekim 2026 kontrol edildi.

Bu dosya aktif öncelik sırasıdır. Eski planlar teknik tasarım ve tarihsel kanıt olarak korunur; eski süreler ve “açık PR” ifadeleri güncel görev durumu sayılmaz. Her faz sonunda bu belge, yayın kaydı ve ilgili kanıt birlikte yenilenir.
