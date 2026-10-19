> **19 Ekim 2026:** Aktif öncelik ve gelecek planı [90 günlük yol haritasında](ROADMAP_2026_Q4.md). Bu belgedeki eski durum/süre tabloları tarihsel ve teknik referanstır; yayın durumu için [50 kaydı](RELEASE_50_STATUS.md) esas alınır.

# English Tales — 2.0 sonrası geliştirme haritası

İlk sürüm: 15 Ekim 2026 (`b1ae829`). Yenileme: 15 Ekim 2026, master `8bef30b` + #12. **Durum notu: 16 Ekim 2026, master `fd2b5e4`.**

> **16 Ekim 2026 durum notu.** Bu belgeden sonra #13–#34 ana dala birleşti. Günlük takip artık [kalite yol haritasındadır](QUALITY_ROADMAP.md); aşağıdaki §1–§5 15 Ekim tarihli kayıt olarak korunur. Bu haritadaki işlerden kapananlar:
>
> | İş | Sonuç | PR |
> |---|---|---|
> | 1.1 Çökme raporlama | Crashlytics kodu birleşti; veri güvenliği 16 Ekim’de incelemeye gönderildi, onay açık | [#18](https://github.com/yurkenn/english-tales/pull/18) |
> | 1.2 Asgari ürün ölçümü | Yedi olay, varsayılan kapalı katılım; canlı panel kabulü açık | [#23](https://github.com/yurkenn/english-tales/pull/23) |
> | 1.6 TTS ses odağı | Odak kaybında durur, odak bırakılır | [#17](https://github.com/yurkenn/english-tales/pull/17) |
> | 4.3 Metinler `strings.xml`'de + D12 | 306 metin kaynakta; TalkBack rol/etiket, koyu tema, büyük yazı | [#30](https://github.com/yurkenn/english-tales/pull/30), [#31](https://github.com/yurkenn/english-tales/pull/31), [#32](https://github.com/yurkenn/english-tales/pull/32), [#34](https://github.com/yurkenn/english-tales/pull/34) |
> | Kotlin uyarıları (§4.7) | `ClickableText` → `LinkAnnotation`; reklam SDK uyarısı gerekçeli bastırıldı | [#19](https://github.com/yurkenn/english-tales/pull/19) |
> | Ek: seviye testi, cümlede boşluk doldurma | Bu haritada yoktu; kalite haritası Q5.4 ve Q5.1 | [#27](https://github.com/yurkenn/english-tales/pull/27), [#28](https://github.com/yurkenn/english-tales/pull/28) |
>
> Paket/canlı farkının boyutu da değişti: [içerik denetimi](CONTENT_QUALITY_AUDIT.md) (#33) farkın yalnız beş pilotta değil **39 hikâyede** olduğunu gösterdi; 0.5 bu kapsamla ele alınır. Açık kalanlar: 0.1–0.6 dış adımlar, 1.4, 2.1b, 2.3–2.5, 3.1b–3.5, 4.1, 4.2, 4.4–4.6.

Bu harita 48 / 2.0.0 sürümünün Google incelemesine gönderildiği noktadan başlar. Önceki planlar ([ürün planı](PRODUCT_ROADMAP.md), [24 iş paketi](DEVELOPMENT_BACKLOG.md)) geçerliliğini korur; bu belge onları bugünkü kod ve Play verisiyle önceliklendirir.

## Son yayın güncellemesi — 16 Ekim 2026

Üretim **48 / 2.0.0**, yeni **49 / 2.1.0** ise 23:38 TRT itibarıyla yalnız dahili testte. Yedi migration (FSRS dahil) canlıya uygulandı. İmzalı paket üretimi/doğrulaması otomatik, bu dahili kanal yüklemesi **elle** yapıldı; servis hesabıyla otomatik yükleme kurulmadı. Data safety incelemeye gönderildi. App Links alan adı `englishtales-app.web.app` seçildi ve web ilişkilendirmesi yayımlandı; Android yönlendirmesi açık.

Sıradaki işler: 49’da telefon güncellemesi/ilerleme ve TalkBack kabulü, canlı Analytics ve yayın kontrolleri. Q4 içerik eşitliği/kapsama ve Q6 App Links uygulama tarafı ayrıca açık. [Güncel kalite yol haritası ve kabul sırası](QUALITY_ROADMAP.md#7-güncel-kabul-sırası-ve-açık-kapılar) · [kanıtlı yayın kaydı](../../senin-adimlarin.md). Aşağıdaki 15 Ekim gözlem ve plan tabloları **tarihsel başlangıç durumudur**; güncel tamamlanma durumları için kalite haritası esas alınır.

## 1. Başlangıç durumu — 15 Ekim 2026

| Alan | Gözlem | Kaynak |
|---|---|---|
| Yayın | 48 / 2.0.0 ve mağaza güncellemesi 15 Ekim'de Google incelemesine gönderildi; sonuç bekleniyor. Managed publishing kapalı: onayda %100 yayımlanır. | [README_SON_DURUM](../../README_SON_DURUM.md) |
| Kullanıcı | Üretimde 21 aktif kurulum; son 28 günde 14 mağaza ziyaretçisi, %46,7 dönüşüm. | Play Console, 15 Ekim |
| Kalite görünürlüğü | Android vitals “Data unavailable”; uygulamada çökme/analitik raporlama yok. | Play üretim panosu; `app/build.gradle.kts` |
| Kod | ~5.300 satır Kotlin; 132 cihaz, 32 JVM, 60 backend testi geçiyor. AGP 8.13.0, Gradle 9 uyarısı yok. | Bu yenilemedeki test çalıştırmaları |
| İçerik (paket) | 50 hikâye (A1 18 · A2 18 · B1 14), 1.002 cümle çifti, 359 kelime/ifade. | [CONTENT_GUIDE](../CONTENT_GUIDE.md) |
| İçerik (canlı) | Canlı katalog hâlâ 316 kelimelik klasik paketi sunuyor; pilot kelime/ifadeler yalnız uygulama paketinde. | Pilot revizyonlar yayımlanmadı; §3 |
| Gelir | Reklam kodu hazır, `ENABLED=false`; AB/ABD UMP mesajları ve canlı gizlilik sayfası bekliyor. | [ADS_AND_ICON_UX_EXECUTION](ADS_AND_ICON_UX_EXECUTION.md) |

## 2. Tamamlananlar (bu turda)

| İş | Sonuç | PR |
|---|---|---|
| Yayın hijyeni (0.2/0.3, Gradle 9) | AGP 8.13.0; manifestte açık AD_ID ve `verify_release.py` kontrolü; sembol ayarı (tek native kütüphane silinmiş geldiği için Play uyarısı kalır). | [#7](https://github.com/yurkenn/english-tales/pull/7) |
| D13 katalog sıralaması (1.3) | “Yeni hikâyeler” `stories.created_at` ile ilk yayın tarihine göre; önbellek ve indirmelerde korunur. | [#8](https://github.com/yurkenn/english-tales/pull/8) |
| Kelime yoğunluğu pilotu (2.1) | 5 A1 klasiğinde 6–9 → 13–19 seçilebilir kelime (37 kelime). | [#9](https://github.com/yurkenn/english-tales/pull/9) |
| D06 çok sözcüklü ifadeler (2.2) | Android `PhraseMatcher`, panel `matchSpans` ve exporter yayın kontrolüyle aynı kural; 6 pilot ifade; harf oyunu ifade uyumlu. | [#10](https://github.com/yurkenn/english-tales/pull/10) |
| D07 TTS yaşam döngüsü (1.5) | Arka plana geçince ses durur; hazırlanırken durdurulabilir; kart değişince önceki kelime susar. | [#11](https://github.com/yurkenn/english-tales/pull/11) |
| F03 kitaplık filtreleri (3.1, kısmi) | Liste görünümlerinde birleşebilen seviye + okuma durumu filtreleri. Süre ve indirilen filtresi açık. | [#12](https://github.com/yurkenn/english-tales/pull/12) |

## 3. Açık dış adımlar (kod dışı)

Bu adımlar Play Console veya yayıncı paneli gerektirir; her biri ayrı onayla yapılır.

| Adım | Neden | Not |
|---|---|---|
| 0.1 İnceleme sonucunu izle, yayında doğrula | 2.0'ın kullanıcıya ulaşması | Onaydan sonra Play'in ürettiği split APK'larla güncelleme ve ilerleme korunumu. |
| 0.2b Dahili test 47 → 48 | Sonraki sürümlerde AD_ID hatasının tekrarlanmaması | 47 AD_ID içermiyor; 48 içeriyor. |
| 0.4 Veri güvenliği / reklam beyanı denetimi | Politika uyumu | Üretimde reklam kapalıyken beyanların paket davranışıyla eşleşmesi. |
| 0.5 Pilot revizyonlarını canlıda yayımla | #9/#10 kelime ve ifadeleri canlı kullanıcılara ulaşsın | 5 hikâye için yeni revision; yayın sonrası `verify-classic-publication.mjs` yeni kural ve revizyonlarla güncellenir. |
| 0.6 49 sürüm adayı | #7–#12 uygulama değişiklikleri kullanıcıya ulaşsın | `versionCode` 49; imzalı derleme + `verify_release.py`; 48 onaylandıktan sonra. |

## 4. Ana bulgular (güncel)

1. **Kör uçuş sürüyor.** Çökme, ANR ve ilk hikâyeyi bitirme oranı ölçülmüyor; düşük kurulumda Play vitals veri üretmiyor. Sağlayıcı kararı bekliyor (§6).
2. **Büyüme en büyük darboğaz.** Ayda ~14 ziyaretçi; dönüşüm iyi (%46,7). ASO ve paylaşım, yeni özelliklerden daha çok etki eder.
3. **Paket ile canlı içerik ayrıştı.** Pilot kelime/ifadeler yalnız gömülü katalogda; canlı kullanıcı uzak katalog okur. Her içerik iyileştirmesi panel yayınıyla kapanmalı.
4. **Yerelleştirme ve erişilebilirlik borcu.** 163 sabit `Text("…")`, `strings.xml`'de tek kayıt, 18 `contentDescription`. FR/DE/ES mağaza kaydı var, arayüz yalnız Türkçe.
5. **Tablet düzeni yok.** 6.800 tablet modeli destekleniyor; ekranlar telefon düzenini geriyor.
6. **Ses yalnız cihaz TTS'i.** Ses odağı (audio focus) ve kesinti yönetimi yok; kayıtlı ses yok (F08).
7. **Kotlin uyarıları.** `ClickableText` ve `setTagForChildDirectedTreatment` kullanım dışı; okuyucu dokunma ve reklam SDK güncellemesinde ele alınmalı.

## 5. Kalan harita

Boyut göreli: **S** küçük tek PR · **M** birkaç PR veya şema/test etkisi · **L** çok aşamalı. Süre vaadi değildir.

### Faz 1 — Görünürlük ve güvenilirlik

| İş | Değer | Boyut | Bağımlılık |
|---|---|---|---|
| 1.1 Gizlilik dostu çökme raporlama | Hataları şikâyet beklemeden görmek | M | Sağlayıcı kararı; gizlilik metni ve veri güvenliği beyanı. |
| 1.2 Asgari ürün ölçümü | İlk hikâyeyi bitirme, ertesi gün dönüş, tekrar oturumu | M | 1.1 kararı; içerik metni/e-posta/öğrenme geçmişi loglanmaz. |
| 1.4 D05 + D08 iki cihaz kabulü | Hesaplı kullanıcı kelime/ilerleme kaybetmez | M | Test hesapları ve iki emülatör; arşivli kaynak senaryosu. |
| 1.6 TTS ses odağı ve kesintiler | Arama/başka medya sırasında doğru durma | S | #11 üzerine; `AudioFocusRequest`. |

### Faz 2 — Öğrenme çekirdeği

| İş | Değer | Boyut | Bağımlılık |
|---|---|---|---|
| 2.1b Kelime/ifade yoğunluğunu 50 hikâyeye yay | Pilot sonucu tüm kütüphaneye | M | 0.5 canlı yayın ve pilotun gözden geçirilmesi. |
| 2.3 F01 zayıf kelime tekrarı | Hata yapılan kelimeler öne çıkar | M | LearningPolicy + SQL `apply_word_event`. |
| 2.4 F02 bağlamlı kelime defteri | Kaynak cümle, çeviri, hikâyeye dön, arama | M | D05 kaynak revizyonu çözümü. |
| 2.5 Okuma sonrası anlama soruları | Anlamayı ölçen 3–5 soru | M | İçerik şemasına soru alanı; panel editörü. |

### Faz 3 — İçerik ve keşif

| İş | Değer | Boyut | Bağımlılık |
|---|---|---|---|
| 3.1b Süre ve indirilen filtresi | F03'ü tamamlamak | S–M | Katalogda cümle sayısı/süre alanı (exporter + panel); CatalogScreen'e indirme durumu. |
| 3.2 Düzenli içerik akışı | Yeni hikâye ritmi; B1'i 18'e çıkar, B2 pilotu | L | D14/D15 editör akışı. |
| 3.3 F08 kayıtlı ses (pilot) | Dinleme becerisi | L | Ses üretim/hak kararı; sürüme bağlı medya. |
| 3.4 F09 favoriler | Kullanıcının kendi rafı | M | Room migration + eşitleme tombstone. |
| 3.5 Tablet düzeni | İki sütunlu okuma/katalog | M | WindowSizeClass. |

### Faz 4 — Büyüme ve gelir

| İş | Değer | Boyut | Bağımlılık |
|---|---|---|---|
| 4.1 ASO ve mağaza deneyleri | Ziyaretçi artışı | S | Play store listing experiments. |
| 4.2 Paylaşım döngüsü | Bitirilen hikâye/seri kartı paylaşma | S–M | Mevcut paylaşım intent'i. |
| 4.3 Metinleri `strings.xml`'e taşı + D12 | Erişilebilirlik ve ikinci arayüz dili hazırlığı | M | Ekran ekran; TalkBack kabulü. |
| 4.4 Hatırlatıcı ve haftalık özet (F05) | Geri dönüş | M | 1.2 ölçümü. |
| 4.5 Reklam **veya** abonelik | Gelir | M–L | Ürün kararı (§6). |
| 4.6 Ana ekran widget'ı | “Devam et” tek dokunuş | S–M | Glance. |

### Faz 5 — Araştırma / ayrı karar

AI destekli açıklama veya konuşma pratiği; topluluk hikâyeleri (F12); iOS (F14). Her biri ayrı ürün kararı ister.

## 6. Önerilen sıradaki işler

*16 Ekim güncellemesi: 15 Ekim listesindeki 2. ve 3. madde kapandı (#17, #30–#34).*

1. **0.1 + 0.6** — 48'in inceleme sonucunu doğrula; onaylanınca veri güvenliği beyanı, release secret'ları ve CI'dan 49 adayı.
2. **0.5 genişletilmiş** — 39 hikâyelik paket/canlı farkı için revizyon taslakları; beş A1 pilotu ilk yayın grubu ([içerik denetimi](CONTENT_QUALITY_AUDIT.md)).
3. **Q3 kapısı** — gerçek TalkBack ile ana yolculuğun elle kaydı.
4. **2.3 F01 zayıf kelime tekrarı** — ilk aşama [#46](https://github.com/yurkenn/english-tales/pull/46)'da (yerel yanlış kaydı ve öncelik).

## 7. Senin kararın gereken konular

| Karar | Seçenekler | Etkilediği işler |
|---|---|---|
| Ölçüm / çökme raporlama | Crashlytics · Sentry · yalnız Play vitals | 1.1, 1.2 |
| Gelir modeli | Seyrek reklam (hazır) · premium/abonelik · şimdilik ücretsiz | 4.5 |
| Kayıtlı ses | İnsan seslendirme · yüksek kaliteli TTS üretimi · cihaz TTS'i | 3.3 |
| İçerik hızı | Haftalık · iki haftalık · aylık | 3.2 |
| İkinci arayüz dili | Yok · İngilizce · diğer | 4.3 |

## 8. Sınırlar

Kullanıcı sayıları 15 Ekim'deki Play Console ekranlarından okundu. Kod sayımları `grep` ile yapılan statik taramalardır. Test sayıları bu yenilemede `English_Tales_Native` emülatöründe ve yerel backend testlerinde alındı. Hiçbir madde için kullanıcı kazanımı veya süre vaadi verilmez.
