# Yurken Stories — önümüzdeki 90 gün


## 23 Ekim tamamlama kaydı

#172 ana dala alındı. Önceki 13 yeni uzun hikâyenin ardından ertelenen 14 uzatma, Goldilocks/Three Little Pigs ve iki özgün kısa taslak da 11 dilde yayınlandı; canlı katalog 67 hikâye. Görev sandığının mevcut hesapla izinli canlı kabulü ve yayın yedeğinin büyük katalog sayfalaması tamamlandı. Backend 201/201 ve hedefli cihaz 4/4 geçti. [Kanıt, PR #173 ve kabul sınırları](COMPLETION_2026-10-23.md). Aşağıdaki 21 Ekim temel durumu tarihsel kayıttır; “iki klasik ertelendi” ve “yayın yapılmadı” ifadeleri bu tamamlama kaydıyla güncellenmiştir.

21 Ekim 2026 · [Güncel PR ve yayın kontrolü](PROJECT_AUDIT_2026-10-21.md) · Durum: uygulama planı; aşağıdaki açık işler tamamlanmış sayılmaz. Tek geliştirici akışına göre yaklaşık 12 hafta; Google incelemesi, editör incelemesi ve pilot veri toplama süreleri takvimi kaydırabilir.

## Ürün yönü

**İngilizce öğrenen kişinin her gün seviyesine uygun bir hikâye okuyup birkaç kelimeyi zaman içinde hatırlamasını sağlamak.** Ana döngü: hikâye seç → oku/dinle → anlamı keşfet → kelime kaydet → zamanı gelince tekrar et → sonraki hikâyeye dön.

Öncelik: güvenilir kullanım → içerik ve öğrenme kalitesi → geri dönüş → kullanıcı kazanımı. Yeni özellik seçerken bu döngüde hangi sorunu çözdüğü ve nasıl ölçüleceği yazılır. Aynı anda bir ana ürün işi ve gerekli hata düzeltmeleri yürütülür.

## Başlangıç noktası

- **21 Ekim canlı Console kontrolü:** 50 / 2.2.0 üretimde Active, dağıtım %100; 20 Ekim’de yayımlanmış. Yayımlanmamış değişiklik yok. Dahili kanal 49 / 2.1.0. R01’in Console yayın sonucu doğrulandı; fiziksel telefon ve mağaza sunumu kabulü açık. [Güncel kayıt](release-evidence/2026-10-21-play-status.json), [50 yayın kaydı](RELEASE_50_STATUS.md).
- 12 arayüz dili, 11 hikâye çevirisi dili, 13 mağaza kaydı. Yeni kullanıcı için dil seçimi mevcut. İngilizce arayüz şu an Türkçe hikâye çevirisi kullanıyor.
- FSRS, alıştırma basamakları, anlama soruları, dikte, cümle kurma, kişisel kelimeler, favoriler, öneriler, widget ve tablet düzeni kodda mevcut. Bunlar yeniden yapılacak özellikler değil; gerçek kullanım kabulü ve iyileştirme konusudur.
- #149/#150 birleşti: 11 dilde 1.098 sözlük maddesi paket varlıklarında mevcut. #152 devamında 10 dilde 10.980 karşılığın AI incelemesi tamamlandı; 190 adayın 81’i kabul, 36’sı ret, 73’ü ilk turda kaynak/dil kararına ayrıldı; devam turunda tamamı 72 düzeltme/ekleme ve 1 koruma olarak sonuçlandı. Koordineli anlam eklemeleriyle 90 hedef dil + 2 Türkçe referans olmak üzere 92 karşılık düzeltildi. `machine-draft` ve insan onayı sınırları korunur; #152 ile ana dala alındı; yeni mağaza paketi henüz yayımlanmadı.
- #147/#148 birleşti; beş mevcut A1/A2 pilotunun sahibi onayı kayıtlı ve güncel canlı revizyonlarında toplam 131 cümle, her cümlede 11 dil karşılığı doğrulandı. Tam UI/çevrimdışı/gerçek hesap kabulü açık; diğer 45 hikâyenin çalışma kelimesi önerileri henüz tamamlanmış sayılmaz. İki yeni klasik taslağı ertelenmiş durumda.
- #151 birleşti: sade okuyucu, hareketler, kitaplık, tema seçimi ve Phosphor ikonlar mevcut. Ana dal `01defbe` ilk cihaz CI denemesinde zaman aşımına uğradı; aynı kaynağın ikinci denemesi ve önceki PR başlıkları geçti. Son sözlük başlığında ayrı kayıt hatası testi çizim çakışması bulundu; #153/#152 test düzeltmesinin son tam CI sonucu aşağıdaki R00 kaydında doğrulandı.
- Önceki içerik denetimindeki canlı/paket farkı kapanmış kabul edilmez. Güncel canlı fark sayısı yeniden ölçülmeden tarihsel 39 hikâye bulgusu güncel sayı olarak kullanılmaz.
- Analytics kodu mevcut ve katılım varsayılan kapalı; canlı olay kabulü ve temsili kullanım başlangıç ölçümü açık. SEO dil sayfaları henüz taslak.

## Paralel çalışma — 20 Ekim ilerlemesi

- **Claude + Codex / R05:** İlk 121 kelimeden sonra kalan 977 kelime beş grupta incelendi: 1.098 × 10 = 10.980 karşılık. İlk turda 190 aday 81 kabul / 36 ret / 73 erteleme aldı. Devam turunda bu 73 kayıt da 72 düzeltme/ekleme ve 1 koruma kararıyla tamamlandı; kaynak anlamlarıyla birlikte 225 ek karşılık güncellendi. [Son kararlar ve test kapsamı](GLOSSARY_DEFERRED_RESOLUTION_2026-10-20.md). 92 karşılık düzeltildi, lemma/kimlikler ve insan onayı bayrakları korundu. Tam backend 172/172 ve 11 dil varlık eşleşmesi geçti. Son 92 değer ayrı Claude regresyon turunda tekrar incelendi; yeni somut hata bildirilmedi ([kanıt](release-evidence/2026-10-20-glossary-final-regression.json)); bu ana dil onayı değildir. Güncel APK sözlük yükleme testi API36’da 1/1 geçti; son `2e64334` başlığı iki tam CI’da geçti: 336 cihaz testi, 3 yapılandırmalı atlama, 0 hata; 3/3 açılış ölçümü. [Tam inceleme ve düzeltmeler: PR #152](https://github.com/yurkenn/english-tales/pull/152).
- **Codex / R00:** İlk kullanım zaman aşımı için ekran/durum tanılaması eklendi; orijinal neden kanıtlanmadı. Ayrı kayıt hatası testi çakışması için yalnız o testin zamanlayıcısı düzeltildi. Tekil ve beş tekrarlı koşu; ardından sözlükle birlikte ilk kullanım/kayıt güvenilirliği 19/19 geçti. Güncel [PR #152](https://github.com/yurkenn/english-tales/pull/152) iki tam CI’da, [PR #153](https://github.com/yurkenn/english-tales/pull/153) bağımsız PR CI’da geçti. Sözlük başlığının yerel tam paketi de 336/339 (3 yapılandırmalı atlama) başarılı. Önceki CI kanıtı son kaynak yerine kullanılmaz.
- #153 (`83d2725`) ve #152 (`b2a8c09`) ana dala birleşti; birleşik ana dal CI’ı ayrıca doğrulanıyor. Canlı içerik ve mağaza yayını yapılmadı; paralel işlerin sonucu fiziksel cihaz kabulünün yerine geçmez.

## R00 — 21 Ekim regresyonu ve önceki CI kanıtı

21 Ekim `f66f8a9` PR CI 39570936929’da `FirstLaunchReadinessTest` başarısız oldu; aynı kaynak push CI 39570928218 tam geçti. XML iç nedeni artık somut: Compose 1.8.1 test saatinin unconfined devamı IO’dan `LazyColumn` oluştururken `The current thread must have a looper!` hatası verdi. Hazır model ile eski yükleme ağacı bu hatanın sonucu; aşağıdaki eski zaman aşımının tamamının aynı neden olduğu iddia edilmez. Yeni regresyon testi gerçek Activity pencere saatini kullanır; IO bekletme, 0/1 animasyon ölçekleri ve 20 saniyelik görünür dil seçimi kontrolü korunur. [Güncel denetim](PROJECT_AUDIT_2026-10-21.md).

### Önceki test düzeltmeleri ve tam CI kayıtları

**Yeni bulgu:** `050db6b` push CI 39398362194 geçti; PR CI 39398368677 kayıt hatası testinde `SnapshotStateObserver` çizim çakışmasıyla 280 testte durdu. İlk kullanım testi geçti. #153 (`a70ab0e`) ve #152 (`2e64334`) yalnız ilgili teste `StandardTestDispatcher` ve çizilmiş düğme beklemesi ekler; zaman sınırları ve kayıt kontrolleri korunur. Yerel API 36’da 1/1 ve beş ayrı instrumentation sürecinde 5/5 geçti. Sözlük ve testin birleşik `2e64334` başlığında ilk kullanım + kayıt güvenilirliği + UI senaryoları 19/19, atlamasız geçti. [Kanıt](release-evidence/2026-10-20-write-ui-scheduler.json). Son sözlük başlığı [push CI 39442907494](https://github.com/yurkenn/english-tales/actions/runs/39442907494) ve [PR CI 39442917858](https://github.com/yurkenn/english-tales/actions/runs/39442917858) ile tam geçti: 336 cihaz testi, 3 yapılandırmalı atlama, 0 hata; açılış ölçümleri 3/3. Yerel tam paket de aynı 336/339 sonucunu verdi. Eski başarısız koşu kanıtta korunur; iki geçiş bütün aralıklı sorunların sonsuza dek bittiğini kanıtlamaz.

[39386537157](https://github.com/yurkenn/english-tales/actions/runs/39386537157) ana dal ikinci denemesi; [#152 CI](https://github.com/yurkenn/english-tales/actions/runs/39392341293) ve [#153 CI](https://github.com/yurkenn/english-tales/actions/runs/39392752746) başarılı. Her çalışmada cihaz testleri **336 geçti / 3 atlandı / 0 hata**, açılış benchmark testleri **3/3**. İlk zaman aşımının kök nedeni doğrulanmadı; 20 saniye sınırı artırılmadı, kullanıcı yolculuğu gevşetilmedi. #153 tekrar olursa beklenen düğme, ekran ağacı ve başlangıç durumunu hata kaydına ekler. Önceki ve son sözlük kaynaklarının teknik CI kapısı geçti; fiziksel cihaz/Play kabulü R01–R04 kapsamında açık.

## 1. Yayını sağlamlaştır — 1–2. hafta

| ID | İş | Bitti sayılma ölçütü |
|---|---|---|
| R01 · P0 | 50'nin mağazaya teslimini doğrula — 21 Ekim Console: Active / %100; telefon ve mağaza sunumu kabulü açık | Console ve telefonda Play sürümü kaydı; yeni ad, yerel metinler/görseller ve 13 dil kaydı onaydan sonra kontrol edilmiş. Ret varsa nedeni düzeltilip yeni başvuru kaydedilmiş. |
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
- **24 Ekim sahibi kararı:** enerji + ödüllü reklam + RevenueCat premium geliştirmesi onaylandı; [uygulama planı](MONETIZATION_PLAN_2026-10-24.md). Fiyatlar, gerçek mağaza ürünleri, satın alma/SSV kabulü ve üretim açılışı ayrı doğrulanır. Ücretli kullanıcı kazanımı için kampanya açılmadı.

## İlk başlanacak somut paket

1. **R00 CI kapısı geçti:** Son #152 başlığı iki tam CI’da başarılı; yerel tam paket de 336 geçti / 3 atlandı / 0 hata. #153 iki bağımsız tam CI’da başarılı; orijinal ilk kullanım zaman aşımının nedeni açık araştırma olarak kalır.
2. **R01–R04:** 50’nin güncel Play durumunu ve fiziksel cihaz kabulünü kaydet; canlı ölçümü doğrula. #149–#151 için yeni paket/sürüm kodu ayrıca gerekir.
3. **R05 AI kapsamı tamamlandı:** #152’deki 92 düzeltmenin paket kabulü; 73/73 kaynak/dil kararı AI düzeyinde tamamlandı; 225 ek karşılığın yeni paket/CI kabulü ve ana dil örneklemi açık. Yeni arayüz metinlerinin dil kontrolü ayrıca açık.
4. **R06:** Canlıdaki beş pilotun UI/çevrimdışı/hesap kabulü. Sonra kalan 45 hikâyenin çalışma kelimeleri ve çeviri kaynağı planı; yeni hikâye ekleme ertelendi.

Bu tur yalnız planı ve belge yönlendirmelerini günceller. Yeni kod, içerik yayını, mağaza değişikliği, takip görevi veya reklam harcaması başlatmaz. Her uygulama işinde tek kullanıcı sonucu, ilgili test/kabul, geri dönüş yolu ve yeni kanıt kaydı tutulur.

## Dayanaklar ve güncelleme

- [50 yayın kaydı](RELEASE_50_STATUS.md), [kanıt JSON'u](release-evidence/2026-10-19-production-50.json), [mevcut kalite işlerinin ayrıntısı](QUALITY_ROADMAP.md).
- [Sözlük taslağı](../backend/content/glossary/tr.json), [çalışma kelimesi önerileri](../backend/content/study-words/proposals.json), [ASO araştırması](../store/aso/2026-10-19/RESEARCH.md).
- Google [mağaza deneyi rehberi](https://support.google.com/googleplay/android-developer/answer/12053285?hl=en): tek varlıkla deney, örneklem/süre tahmini ve yetersiz veri sonucu. 19 Ekim 2026 kontrol edildi.
- Google [Android vitals](https://developer.android.com/google/play/vitals): kaliteyi cihaz ve sürüm bazında takip etme dayanağı. 19 Ekim 2026 kontrol edildi.

Bu dosya aktif öncelik sırasıdır. Eski planlar teknik tasarım ve tarihsel kanıt olarak korunur; eski süreler ve “açık PR” ifadeleri güncel görev durumu sayılmaz. Her faz sonunda bu belge, yayın kaydı ve ilgili kanıt birlikte yenilenir.
