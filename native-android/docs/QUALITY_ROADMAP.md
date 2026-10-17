# English Tales — kalite yol haritası

15 Ekim 2026 · **Yenileme: 16 Ekim 2026, 23:38 TRT dahili yayın kaydı; paket kaynağı `6f48040`, içerdiği master `a14fa5f`** · İlk kaynak: master `8bef30b` · Dayanak: [derin eksik haritası](GAP_ANALYSIS.md), [geliştirme haritası](NEXT_PHASE_ROADMAP.md).

“Kaliteli” burada ölçülebilir hedefler demektir. Her faz bir **kalite kapısıyla** biter; kapı geçilmeden sonraki faz “tamam” sayılmaz. Efor tahminleri tek geliştirici için **ideal geliştirme günü**dür (test ve doğrulama dahil, inceleme bekleme hariç); belirsizlik yüksek olan işlerde aralık verilir. Bunlar plan tahminidir, teslim vaadi değildir.

## Güncel durum — 16 Ekim 2026

[Hesap ve yayın kaydı](../../senin-adimlarin.md), [paket doğrulaması](release-evidence/2026-10-16-internal-49-package.json) ve [Play yayın kanıtı](release-evidence/2026-10-16-internal-49-play.json) bu tablonun dayanağıdır. Kaynak/doküman güncellemeleri [PR #67](https://github.com/yurkenn/english-tales/pull/67) üzerinde; PR hâlâ taslak ve ana dala birleşmedi. Canlı servis ve dahili yayın işlemleri ise tamamlandı.

| Alan | Tamamlanan | Açık kabul / sonraki iş |
|---|---|---|
| Play sürümleri | Üretim **48 / 2.0.0, %100**; **49 / 2.1.0** dahili testte Active / Available to internal testers (23:38 TRT) | 49’un telefona Play’den teslimi, 48→49 güncelleme ve ilerleme korunması; 49 üretim yayını yapılmadı |
| Q2.4 Paket üretimi | Beş zorunlu secret, master ile sınırlı `release` ortamı ve required reviewer; ilk imzalı CI çalışması başarılı | Play yüklemesi bu kez **elle** yapıldı. Servis hesabıyla otomatik dahili kanal yüklemesi **isteğe bağlı ve kurulmadı**; tam otomasyon tamamlandı sayılmaz |
| Q2.1 / Q2.2 Veri beyanları | Data safety güncellendi ve Google incelemesine gönderildi; gizlilik sayfası yayımlandı; Crashlytics mapping yükleme görevi başarılı | Google onayı / yeni beyanın görünürlüğü; Analytics kapalı–açık–kapalı canlı olay kabulü ve GA ayarları |
| Canlı veri tabanı | Çeviriler, sorular, etiketler, favoriler, kişisel kelimeler, bilinen kelimeler ve ayrıca onaylanan FSRS: **7 migration canlıda** | 49’da hesap eşitlemesinin gerçek cihazda doğrulanması; migration’lar yeniden uygulanmamalı |
| Q5.7 FSRS | #65 birleşti; canlı migration `20261016202236`; 28 SQL vektörü referansla aynı; mevcut dört kelime kaydının eski alanları ve olayları korundu | Gerçek kullanımda tekrar planı / cihazlar arası uyum gözlemi; simülasyon saha sonucu sayılmaz |
| Q3 TalkBack | Kullanıcı **48 / 2.0.0** ile yolculuğu sorunsuz denedi | **49 / 2.1.0** ile aynı yolculuk ve cihaz/sürüm kaydı; **Q3 kapısı açık** |
| Q6 App Links | `englishtales-app.web.app` seçildi; Play app signing sertifikasıyla assetlinks.json yayımlandı; Google `linked: true` | Uygulama tarafı (#72) ana dalda; `story.html` web karşılığının Hosting yayını ve 49'dan sonraki pakette kurulu/kurulu değil denemesi açık |
| Doğrulama | Yerel **94 release JVM / 144 backend** testi; imza, üretim bağlantısı, profil ve statik 16 KB kontrolleri; master CI cihaz işi dahil başarılı | Play split paketleri, fiziksel cihaz / gerçek 16 KB çalışma zamanı, Google girişi ve veri koruma kabulü |

**Öncelik sırası:** 49’u mevcut uygulamanın üzerine Play’den güncelle → giriş, ilerleme, çevrimdışı okuma ve hesap eşitlemesini kontrol et → 49’da TalkBack yolculuğunu kaydet → canlı ölçüm ve yayın kabulünü tamamla → [kademeli üretim yayın kontrolünü](STAGED_RELEASE.md) uygula. İçerik eşitliği/kapsama ve App Links uygulama tarafı ayrı açık işlerdir; otomatik Play yüklemesi mevcut elle yayın yolunu engellemez. Daha sonraki farklı paket için 49’u tekrar kullanma; en yüksek Play sürüm kodunu kontrol ederek **en az 50** seç.

## 1. Kalite hedefleri

| Alan | Ölçüt | Hedef | Bugün | Nasıl ölçülür |
|---|---|---|---|---|
| Kararlılık | Kullanıcının fark ettiği çökme oranı | < %1,09 (Play kötü davranış eşiği), hedef < %0,5 | Crashlytics 49 dahili paketinde; Data safety incelemeye gönderildi, canlı metrikler/Google onayı açık | Play vitals + çökme raporlama |
| Kararlılık | ANR oranı | < %0,47 (Play eşiği), hedef < %0,2 | Ölçülmüyor | Play vitals |
| Performans | Soğuk açılış (orta sınıf cihaz, medyan) | < 1,5 sn | Katalog arka planda (#20); cihaz bazlı Macrobenchmark ölçümü bekliyor | Macrobenchmark |
| Performans | Okuyucu sayfa geçişi takılma | < %5 yavaş kare | Ölçülmüyor | Macrobenchmark `FrameTimingMetric` |
| Boyut | İndirme boyutu (release APK) | < 15 MB | 49: APK 9.323.769 bayt (~8,89 MiB); AAB 13.391.538 bayt; Play yeni kurulum önizlemesi 8,13 MB | `verify_release.py` |
| Doğruluk | PR başına otomatik test | Birim + backend + cihaz testleri CI'da | 49 kaynak master CI: repository/backend/Android/android-device başarılı; yerel 94 release JVM + 144 backend testi geçti | GitHub Actions |
| Erişilebilirlik | Ana yolculuk TalkBack ile | Tamamlanabilir; etiketsiz etkileşim 0 | On ana ekranda etiketsiz/rolsüz eylem 0 (`AccessibilityAuditTest`); 16 Ekim kullanıcı TalkBack testi mağazadaki 48 / 2.0.0 için sorunsuz; yeni Q3 paketi denenmeli | Kabul testi + lint |
| Erişilebilirlik | Büyük yazı | fontScale 2.0'da kırpılma yok | 320×640 dp, fontScale 2.0'da on ana ekranda kesilen veya bölünen metin 0 (`LargeTextLayoutTest`) | Compose UI testleri |
| Erişilebilirlik | Kontrast | ≥ 4.5:1 metin | İki temada 38 metin/zemin çifti ≥ 4.5:1 (`TaleColorsContrastTest`); kalan sabit renkler kendi içinde eşleşen çiftler | Renk denetimi |
| İçerik | Sözlük kapsaması (A1/A2 benzersiz sözcük) | ≥ %60 | Paket A1 %32,3 · A2 %17,3; canlı A1 %23,5 · A2 %15,4 ([#33](CONTENT_QUALITY_AUDIT.md)) | Katalog testi |
| İçerik | Paket = canlı | Fark 0 | Hikâye sözlük ID'si paket 358 / canlı 315; 39 hikâyede fark | Yayın doğrulama aracı |
| Öğrenme | İlk hikâyeyi bitirme, ertesi gün dönüş, tekrar tamamlama | Önce ölçüm, sonra hedef | Ölçülmüyor | Asgari ürün olayları |
| Yayın | Kademeli dağıtım + otomatik doğrulama | Her sürüm %20 → %50 → %100 | 48 üretim %100; 49 dahili testte elle yayımlandı; imza/paket kontrolleri otomatik | Sürüm kontrol listesi |
| Kod | Kullanım dışı API ve lint uyarısı | 0 | Kotlin 0 uyarı; debug lint 0 hata / 30 uyarı | Derleme çıktısı |

## 2. Fazlar

### Q1 — Temel sağlamlık (karar gerektirmez) · ~6–8 gün

| # | İş | Kabul ölçütü | Efor |
|---|---|---|---|
| Q1.1 | Kapakları WebP'ye çevir; PNG kaynakları APK dışına (`backend/content/covers/`) taşı | APK < 15 MB; görsel karşılaştırma; exporter ve checksum testleri kaynak PNG'den çalışır; BookCover aynı drawable adları | 1–1,5 |
| Q1.2 | CI'da emülatör üzerinde cihaz testleri | Her PR'da `connectedDebugAndroidTest` yeşil; süre < 20 dk | 1 |
| Q1.3 | TTS ses odağı ve kesintiler | Arama/başka medya odağı alınca durur; odak bırakılır; test | 0,5–1 |
| Q1.4 | Okuyucu dokunmayı `LinkAnnotation`'a taşı (`ClickableText` kaldır) | Uyarı 0; kelime/ifade dokunma testleri geçer; TalkBack bağlantıları okur | 1 |
| Q1.5 | Kataloğu arka planda yükle | Ana iş parçacığında JSON ayrıştırma yok; açılış testi | 0,5–1 |
| Q1.6 | Uygulama içi güncelleme + değerlendirme isteği | Esnek güncelleme; 3. tamamlanan hikâyeden sonra en fazla bir değerlendirme isteği | 1 |
| Q1.7 | Reklam SDK uyarısı (`setTagForChildDirectedTreatment`) | Uyarı 0; reklam kapalıyken davranış değişmez | 0,5 |

**Kapı Q1:** APK < 15 MB · CI'da tüm testler · derleme uyarısı 0 · ses odağı testleri. — **15 Ekim 2026: geçildi.** #15–#21 ana dala birleşti. Birleşik doğrulama ve sınırlar aşağıda kayıtlı.

### Q2 — Görünürlük ve yayın güvenliği · ~5–7 gün · karar: ölçüm sağlayıcısı

| # | İş | Kabul ölçütü | Efor |
|---|---|---|---|
| Q2.1 | Çökme/ANR raporlama | Test çökmesi panelde görünür; kişisel veri yok; veri güvenliği beyanı güncel | 1–1,5 |
| Q2.2 | Asgari ürün olayları (5–7 olay) | İlk hikâye bitti, ertesi gün dönüş, tekrar tamamlandı; içerik metni/e-posta yok | 1,5–2 |
| Q2.3 | Macrobenchmark + baseline profile | Açılış ve sayfa geçişi ölçülür, profil pakette | 1–1,5 |
| Q2.4 | Sürüm otomasyonu | CI'da imzalı AAB + `verify_release.py`; dahili kanala yükleme | 1,5–2 |
| Q2.5 | [Kademeli dağıtım kontrol listesi](STAGED_RELEASE.md) | %20 → %50 → %100; vitals eşiğinde durdurma | 0,5 |

**Kapı Q2:** Çökme ve ANR görünür · açılış ölçülmüş · sürüm tek komutla doğrulanır.

### Q3 — Erişilebilirlik ve yerelleştirme · ~6–9 gün

| # | İş | Kabul ölçütü | Efor |
|---|---|---|---|
| Q3.1 | 163 sabit metni `strings.xml`'e taşı | Sabit `Text("…")` 0; testler geçer | 2–3 |
| Q3.2 | TalkBack ve rol/etiket denetimi | Ana yolculuk TalkBack ile tamamlanır; etiketsiz etkileşim 0 | 1,5–2 |
| Q3.3 | Uygulama geneli koyu tema | 80 sabit rengin tema token'larına taşınması; kontrast ≥ 4.5 | 2–3 |
| Q3.4 | Büyük yazı ve küçük ekran testleri | fontScale 2.0'da ana ekranlar kırpılmasız | 1 |

**Kapı Q3:** TalkBack yolculuğu · koyu tema · metinler kaynakta. — **16 Ekim 2026: kod birleşti, kapı açık.** Q3.1–Q3.4 #30, #31, #32 ve #34 ile ana dala birleşti. Kullanıcı 16 Ekim’de gerçek telefonda ana TalkBack yolculuğunu sorunsuz tamamladığını ve **mağazadaki 48 / 2.0.0** paketini denediğini doğruladı. Yeni erişilebilirlik kodunu içeren, artık dahili testteki 49 paketinde kabul yapılmadığından kapı açık; cihaz ve TalkBack sürümü belirtilmedi.

### Q4 — İçerik kalitesi · ~8–12 gün · karar: sözlük kaynağı

Ayrıntılı plan, iki katmanlı sözlük kararı ve dil genişlemesi: [içerik, öğrenme ve dil planı](LEARNING_QUALITY_PLAN.md).

| # | İş | Kabul ölçütü | Efor |
|---|---|---|---|
| Q4.1 | Paketten taslak revizyon üretimi + yayın doğrulama | Paket ve canlı farkı 0; doğrulama aracı yeni kuralla | 2–3 |
| Q4.2 | Pilot revizyonlarını canlıda yayımla | 5 hikâye canlıda 13–19 kelime/ifade | 0,5 (+ publisher onayı) |
| Q4.3 | Sözlük kapsamasını A1/A2'de ≥ %60'a çıkar | Katalog testi kapsamayı ölçer ve korur | 4–6 |
| Q4.4 | Katalogda okuma süresi alanı + süre filtresi | Kartlarda süre; filtre çalışır | 1–1,5 |
| Q4.5 | Tür dengesi (masal/fabl) | SQL + Android + panel birlikte | 1–1,5 |

**Kapı Q4:** Kapsama ≥ %60 · canlı eşit · süre görünür.

### Q5 — Öğrenme kalitesi · ~8–12 gün

| # | İş | Kabul ölçütü | Efor |
|---|---|---|---|
| Q5.1 | Bağlamlı boşluk doldurma (hikâye cümlesinden) | Yeni alıştırma modu; puan/oturum sözleşmesi korunur | 2–3 |
| Q5.2 | Dinleyip seçme (TTS) | Ses yoksa mod gizlenir | 1,5–2 |
| Q5.3 | Okuma sonrası anlama soruları | İçerik şemasında soru alanı; panel editörü | 3–4 |
| Q5.4 | Seviye yerleştirme | Onboarding'de kısa test; seviye önerisi | 1,5–2 |

**Kapı Q5:** Alıştırmaların en az biri cümle düzeyinde · yerleştirme testi.

### Q6 — Büyüme kalitesi · ~5–8 gün

App Links ile paylaşılan hikâyenin uygulamada açılması (2–3) · ana ekran widget'ı (1,5–2) · tablet iki sütun düzeni (2–3).

## 3. Toplam ve sıra

| Faz | Efor (ideal gün) | Karar |
|---|---|---|
| Q1 | 6–8 | — |
| Q2 | 5–7 | Ölçüm sağlayıcısı |
| Q3 | 6–9 | — |
| Q4 | 8–12 | Sözlük kaynağı |
| Q5 | 8–12 | — |
| Q6 | 5–8 | Alan adı seçildi; uygulama yönlendirmesi açık |
| **Toplam** | **38–56** | |

Sıra: Q1 → Q2 → (Q3 ve Q4 paralel) → Q5 → Q6. Q1 karar beklemeden başlar; Q2 için sağlayıcı kararı Q1 sürerken verilmelidir.

## 4. Çalışma kuralları

- Her iş ayrı PR; açıklamada kabul ölçütü, test sonucu ve bilinen sınır.
- Her PR'da: JVM + backend + emülatör testleri, lint, gerekiyorsa ekran görüntüsü.
- Canlı servis, Play Console veya yayıncı paneli adımları ayrıca onayla yapılır.
- Bu belge her faz kapısında güncellenir: “Bugün” sütunu ölçülen değerle değiştirilir.

## 5. İlerleme

| İş | Durum | PR | Ölçülen sonuç |
|---|---|---|---|
| Q1.1 WebP kapaklar | Ana dala birleşti | [#15](https://github.com/yurkenn/english-tales/pull/15) | APK 30,7 → 7,2 MB; AAB 10,0 MB |
| Q1.2 CI cihaz testleri | Ana dala birleşti | [#16](https://github.com/yurkenn/english-tales/pull/16) | İlk koşu ~2,5 dk; yapılandırmaya bağlı 2 test bulundu ve koşullu yapıldı |
| Q1.3 TTS ses odağı | Ana dala birleşti | [#17](https://github.com/yurkenn/english-tales/pull/17) | Odak kaybında durur; her çıkışta odak bırakılır |
| Q1.4 `LinkAnnotation` | Ana dala birleşti | [#19](https://github.com/yurkenn/english-tales/pull/19) | Kotlin derleme uyarısı 3 → 0 |
| Q1.5 Kataloğu arka planda yükle | Ana dala birleşti | [#20](https://github.com/yurkenn/english-tales/pull/20) | Ana iş parçacığından 134–173 ms çıktı; debug soğuk açılış ~1,63 → ~1,50 sn |
| Q1.6 Güncelleme + değerlendirme | Ana dala birleşti | [#21](https://github.com/yurkenn/english-tales/pull/21) | Esnek güncelleme (3 günde bir) + 3. hikâyeden sonra tek değerlendirme isteği |
| Q1.7 Reklam SDK uyarısı | Ana dala birleşti | [#19](https://github.com/yurkenn/english-tales/pull/19) | Beyan korunarak gerekçeli bastırıldı |
| Q2.1 Çökme raporlama | Kod ve mapping hazır; Data safety incelemede | [#18](https://github.com/yurkenn/english-tales/pull/18) | Crashlytics; önceki test çökmesi panelde göründü. 49 mapping yüklemesi geçti; Data safety incelemeye gönderildi, Google onayı ve yeni paket canlı kabulü açık |
| Q2.2 Ürün olayları | Ana dala birleşti; canlı kabul açık | [#23](https://github.com/yurkenn/english-tales/pull/23) | Yedi olay, varsayılan kapalı katılım, sabit payload ve D1 cohort |
| Q2.3 Performans altyapısı | Ana dala birleşti; fiziksel kabul açık | [#26](https://github.com/yurkenn/english-tales/pull/26) | Profil üretimi 2/2, Macrobenchmark 3/3; imzalı APK/AAB profil doğrulaması geçti; [kanıt ve CI](PERFORMANCE.md) |
| Q2.4 Sürüm otomasyonu | CI üretim/doğrulama geçti; dahili yayın elle tamamlandı; otomatik yükleme açık | [#29](https://github.com/yurkenn/english-tales/pull/29), [#67](https://github.com/yurkenn/english-tales/pull/67) | [İlk imzalı CI çalışması](https://github.com/yurkenn/english-tales/actions/runs/38959199613) başarılı; beş zorunlu secret ve ortam korumaları hazır. Güncel 49 paketi 23:38 TRT’de Console’dan dahili testte yayımlandı. `PLAY_SERVICE_ACCOUNT_JSON` ve workflow ile yükleme kurulmadı; [kanıt](../../senin-adimlarin.md), [kurulum](RELEASE_AUTOMATION.md) |
| Q2.5 Kademeli yayın listesi | Hazır; bu belgeyle birlikte #22 | [#22](https://github.com/yurkenn/english-tales/pull/22) | %20 → %50 → %100; izleme, durdurma ve düzeltme kaydı |
| Q3.1 Metinler kaynakta | Ana dala birleşti | [#30](https://github.com/yurkenn/english-tales/pull/30) | 306 ekran metni `strings.xml`'e taşındı (UI, reklam/analiz tercihleri, güncelleme çubuğu, bildirim); sözcük içeren sabit `Text("…")` 0 ve `verify_repository.py` bunu korur. Tür adları (Günlük yaşam/Macera/Gizem) saklanan veri değeri olduğundan ve ViewModel hata mesajları henüz kaynakta değil |
| Q3.2 TalkBack rol/etiket | Ana dala birleşti | [#31](https://github.com/yurkenn/english-tales/pull/31) | 24 özel tıklanabilir öğeye rol eklendi (seçim kartları `selectable` + `selectableGroup`); ikonlu geri düğmesine etiket, alıştırma kapatma hedefi 32 → 48 dp. `AccessibilityAuditTest` on ana ekranda etiketsiz veya rolsüz eylem bırakmaz (yerel emülatör 10/10). Kelime bağlantıları cümle metninin bağlantıları olarak okunur. 16 Ekim kullanıcı TalkBack testi mağazadaki 48 / 2.0.0 için sorunsuz; yeni Q3 paketi denenmeli |
| Q3.3 Koyu tema | Ana dala birleşti | [#32](https://github.com/yurkenn/english-tales/pull/32) | `Tale*` renkleri açık/koyu paletten gelir (`TaleColors`); sistem koyu temasında uygulama, Material bileşenleri ve pencere koyu. Sabit renkler yalnız kendi içinde eşleşen yerlerde kaldı (kapak, afiş, Google düğmesi, marka girişi, geri bildirim kenarlıkları). Açık temada 4.5:1 altındaki metin renkleri düzeltildi (ör. hata 2,98 → 6,5, seviye 2,96 → 5,2). `TaleColorsContrastTest` iki temada 38 metin/zemin çiftini, `DarkThemeTest` sekiz ekranı denetler (yerel emülatör 8/8). Okuyucu kendi açık/koyu seçimini korur. Önizleme: [Çalış](preview-dark-study.png), [Katalog](preview-dark-catalog.png), [Oyna](preview-dark-practice.png) |
| Q3.4 Büyük yazı ve küçük ekran | Ana dala birleşti | [#34](https://github.com/yurkenn/english-tales/pull/34) | `LargeTextLayoutTest` 320×640 dp ve fontScale 2.0'da on ana ekranı tarar: satır kaybı, üç nokta, taşma ve kelime ortasından bölünme 0 (yerel emülatör 10/10). Alt menü, katalog düğmeleri, üst çubuk ve Kelimelerim düğmesi yazıyla büyür; yan yana öğeler fontScale ≥ 1,5'te alt alta geçer. Önizleme: [Katalog](preview-large-text-catalog.png), [Hikâye](preview-large-text-storyDetail.png) |
| Q4 İçerik denetimi | Ana dala birleşti; eşitlik ve kapsama kapısı açık | [#33](https://github.com/yurkenn/english-tales/pull/33) | Paket ↔ canlı denetimi (`npm run content:audit`). 43 sözlük ID'si canlıda yok, 39 hikâye etkileniyor; A1 kapsama paket %32,3 / canlı %23,5, A2 %17,3 / %15,4. [Rapor](CONTENT_QUALITY_AUDIT.md) |
| Q4.1a Revizyonlar arası okuma güvenliği | Ana dala birleşti | [#45](https://github.com/yurkenn/english-tales/pull/45) | Okuma konumu cümle kimliği korunduğu sürece yeni revizyona taşınır; metni/kapağı gömülü hikâyeyle aynı yeni revizyon çevrimdışı açılır. Taslak aracı #40'ta. Revizyon yayını 49'dan sonra. [Ayrıntı](CONTENT_QUALITY_AUDIT.md) |
| F01 Zayıf kelime tekrarı (ilk aşama) | Ana dala birleşti | [#46](https://github.com/yurkenn/english-tales/pull/46) | Yanlış yanıt kelime/gün başına yerel olay; son 30 günde yanlış yapılan, henüz bilinmeyen kelimeler alıştırma ve günlük planda önce gelir. Aralıklar değişmedi; olaylar hesaplar arası eşitlenmez |
| 3.1b Çevrimdışı hazır filtresi | Ana dala birleşti | [#47](https://github.com/yurkenn/english-tales/pull/47) | Kitaplık listelerinde metni cihazda olan hikâyeleri gösteren çip; seviye/durum/süre filtreleriyle birleşir, yalnız indirme gereken hikâye varken görünür |
| Q4.0 Çeviri tabloları | Ana dala birleşti | [#37](https://github.com/yurkenn/english-tales/pull/37), [#36](https://github.com/yurkenn/english-tales/pull/36) | Cümle/kelime/açıklama çevirileri dil koduyla ayrı tablolarda; uygulama Türkçeyi bunlardan okur |
| Q4.1 Taslak revizyon aracı | Ana dala birleşti | [#40](https://github.com/yurkenn/english-tales/pull/40) | Paket ile canlı farkından taslak paketi üretir; yayın 49'dan sonra |
| Q4.3a Dokunma sözlüğü (1. adım) | Ana dala birleşti | [#53](https://github.com/yurkenn/english-tales/pull/53) | Okuyucuda öğrenme kelimesi olmayan her bilinen kelime dokunulur: çevrimdışı sözlük (`glossary/tr.json`) + düzenli çekim kuralları + 153 düzensiz biçim. Öğrenme kelimeleri altı çizili ve kaydedilebilir kalır; sözlük kelimesi yalnız anlam gösterir. Paket metninde dokunulabilir token %12,0 → %13,4 (asıl artış Q4.3b verisiyle). Kişisel kelime kaydı 2. adımda |
| Q4.3b Sözlük anlam taslakları | Ana dala birleşti | [#68](https://github.com/yurkenn/english-tales/pull/68) | Paket hikâyelerindeki 1.407 sözlük biçiminden öğrenme kelimesi olmayan 1.098’i için Türkçe anlam taslağı (`backend/content/glossary/tr.json`, kaynak: Claude taslağı, örnek cümle ve geçiş sayısıyla). `npm run glossary:build` yalnız çapraz kontrolden geçmiş (`checkedBy`) ve itiraz edilmişse incelenmiş girişleri uygulamaya alır; şu an 0. `glossary:sample` %10 inceleme örneklemini verir (121) |
| Q4.3b Sözlük çapraz kontrolü | Ana dala birleşti | [#73](https://github.com/yurkenn/english-tales/pull/73) | 1.098 taslağın tamamı ikinci bir modelle (Claude Sonnet) örnek cümlesine göre kontrol edildi (`checkedBy`); 44’ü itirazlı ve önerili (`suggestion`, `note`). Uygulamaya hiçbir şey girmez: sahibi %10 örneklemi (`npm run glossary:sample`) ve itirazlıları (`npm run glossary:disputed`) inceleyip `sampleApprovedBy` alanını doldurana kadar `glossary:build` boş liste üretir |
| Q4.3b İtirazların çözümü | Ana dala birleşti | [#78](https://github.com/yurkenn/english-tales/pull/78) | Sahip kararıyla 44 itirazlı girişte çapraz kontrolün önerisi anlam oldu (`reviewed`, `reviewedBy`; eski taslak `draftGloss` alanında). Yayın kapısı (`sampleApprovedBy`) hâlâ kapalı: sahibi %10 örneklemi (`npm run glossary:sample`) inceleyip onaylayınca sözlük uygulamaya girer |
| Q4.7a B1 hikâye taslakları | PR açık | [#84](https://github.com/yurkenn/english-tales/pull/84) | Sahip kararıyla iki özgün B1 taslağı (`backend/content/drafts/stories/`): *The Notes in the Night Library* (Gizem, 34 cümle/396 sözcük) ve *The First Big Order* (Günlük yaşam, 35 cümle/387 sözcük); Türkçe çeviri, 4 soru (main/detail/inference), 6’şar yeni kelime. `status: draft`, katalogda değil; editör onayı (`reviewedBy`) ve kapak sonrası yayımlanır. `tests/story-drafts.test.mjs` biçim, kimlik çakışması ve uzunluk sınırlarını denetler |
| Q4.3a Kişisel kelimeler (2. adım) | Ana dala birleşti | [#54](https://github.com/yurkenn/english-tales/pull/54) | Sözlük kelimesi okuyucudan "Öğren" ile sözlük biçimi ve anlamıyla kaydedilir (`personal_words`, Room sürüm 8); Kelimelerim ve tüm alıştırmalar onu öğrenme kelimesi gibi kullanır, tekrar aralıkları aynı. Misafir aktarımı taşır. Hesap eşitlemesi 3. adımda |
| Q4.3a Kişisel kelime eşitlemesi (3. adım) | Ana dala birleşti | [#55](https://github.com/yurkenn/english-tales/pull/55) | `apply_word_event` revizyonsuz `glossary:` kimliklerini kabul eder; kaydetme kelime ve anlamı taşır, `user_personal_words` en yeni anlamı tutar, `get_learning_snapshot` metni döner. Uygulama olayı kuyruğa koyar; uzlaştırma kişisel kelimeyi metniyle kurar veya kaldırır. Migration 16 Ekim’de canlıya uygulandı; 49 cihaz eşitleme kabulü açık |
| Q4.4 Okuma süresi + süre filtresi | Ana dala birleşti | [#42](https://github.com/yurkenn/english-tales/pull/42) | Kartlarda "~N dk"; kitaplıkta yalnız katalogda bulunan süre aralıkları filtre olarak sunulur |
| Q4.6 Seviye profili denetimi | Ana dala birleşti | [#56](https://github.com/yurkenn/english-tales/pull/56) | `content:audit` her hikâye için cümle uzunluğu, MATTR çeşitliliği ve katalog sıklık bandı dışı token payını ölçer; seviye başına Q3 + 1,5 × IQR sınırı, aykırı 4 hikâye ve 1 seviye sırası bulgusu. [Sonuçlar](CONTENT_QUALITY_AUDIT.md) |
| Q4.8 Cümle cümle seslendirme | Ana dala birleşti | [#52](https://github.com/yurkenn/english-tales/pull/52) | Sayfa her cümle ayrı bir seslendirme olarak sıraya girer; okunan cümle vurgulanır. Cümleye basılı tutmak (TalkBack'te "Bu cümleden itibaren dinle" eylemi) o cümleden okutur. Kelime dokunma ve çeviri aynen çalışır |
| Q4.5 Etiket modeli | Ana dala birleşti | [#48](https://github.com/yurkenn/english-tales/pull/48) | `content_tags`/`tag_names`/`revision_tags`; masal, fabl, macera, günlük yaşam, gizem. Aesop → fabl, Grimm/Andersen/Wilde → masal. Panel, exporter, denetim ve uygulama etiketleri taşır; kitaplık kategorileri etiketlerden gelir, eski sunucuda türe düşer |
| F09a Favori hikâyeler | Ana dala birleşti | [#49](https://github.com/yurkenn/english-tales/pull/49) | Hikâye sayfasında yer imi; kitaplıkta "Favorilerim (N)", en son eklenen önce. Cihazda Room tablosu (sürüm 7), misafir aktarımı taşır. Hesaplar arası eşitleme F09b |
| F09b Favori eşitleme | Ana dala birleşti | [#50](https://github.com/yurkenn/english-tales/pull/50) | `favorite_events` + `user_story_favorites`, son yazan kazanır (`occurred_at`, `id`); `get_learning_snapshot` favorileri silinenlerle birlikte döner. Uygulama yalnız gerçek değişikliği kuyruğa koyar, bekleyen dokunuşu bulut anlık görüntüsüne ezdirmez; eski sunucuda favoriler yerel kalır |
| Q6 Tablet düzeni | Ana dala birleşti | [#51](https://github.com/yurkenn/english-tales/pull/51) | Hikâye listeleri kart en az 320 dp sığdıkça sütun ekler (telefonda tek sütun); okuyucu satır genişliği en fazla 720 dp ve ortalı; hikâye, profil ve kelime ekranları en fazla 840 dp. `TabletLayoutTest` 1280×800 ve 411×800 dp |
| Q5.1 Bağlamlı boşluk doldurma | Ana dala birleşti | [#28](https://github.com/yurkenn/english-tales/pull/28) | Mevcut hikâye cümlelerinden seçmeli soru; puan/oturum sözleşmesi korunur; [kapsam](SENTENCE_GAP.md) |
| Q5.2 Dinleyip seçme | Ana dala birleşti | [#38](https://github.com/yurkenn/english-tales/pull/38) | TTS ile kelimeyi dinleyip seçme; ses yoksa mod gizlenir |
| Q5.3 Anlama soruları | Ana dala birleşti | [#41](https://github.com/yurkenn/english-tales/pull/41), [#43](https://github.com/yurkenn/english-tales/pull/43) | `story_questions` (ana fikir/ayrıntı/çıkarım, 2–4 seçenek) şema, panel ve araçlarda; okuma sonrası anlama soruları |
| Q5.5 Bilinen kelime modeli (1. adım) | Ana dala birleşti | [#59](https://github.com/yurkenn/english-tales/pull/59) | Biten hikâyelerde okunan sözlük biçimleri ve okurken bakılan kelimeler cihazda tutulur (Room 9). Aşamalar: görüldü, bakıldı, kaydedildi, tekrar ediliyor, biliniyor. Biliniyor = tekrarda "biliyorum" ya da en az 2 biten hikâyede okunup hiç bakılmamış. Profilde bilinen kelime sayısı |
| Q5.5 Bilinen kelime eşitlemesi (2. adım) | Ana dala birleşti | [#63](https://github.com/yurkenn/english-tales/pull/63) | `apply_lemma_event` (okuma/bakma), `user_lemma_reads` ve `user_lemma_lookups` yalnız büyüyen kümeler; `get_learning_snapshot` ikisini döner, uygulama birleşimle ekler. Hikâyenin ilk bitişi ve kelimenin ilk açılışı birer olay; tekrarlar kuyruğa girmez. Migration 16 Ekim’de canlıya uygulandı; 49 cihaz eşitleme kabulü açık |
| Q5.6 Kişisel zorluk ve öneri | Ana dala birleşti | [#60](https://github.com/yurkenn/english-tales/pull/60) | Hikâye sayfasında "Bu hikâyede ~N yeni kelime" (öğrenen en az bir kelime bildiğinde). Çalış ekranındaki "Senin için" rafı: bitmemiş hikâyeler, seviyen ve okurun bildiği sözcük oranı (kapsama) yüksek olanlar önce. Kapsama, bilinen kelime modeline (Q5.5) dayanır |
| Q5.10 İlerleme ve geri bildirim | Ana dala birleşti | [#61](https://github.com/yurkenn/english-tales/pull/61) | Hatırlatıcı, tekrar zamanı gelen kelime varsa sayısını söyler ("Tekrar zamanı gelen 3 kelimen var"). Son 7 gün kartı: bu hafta bitirilen hikâyelerdeki sözcük sayısı ve bilinen kelime sayısı. Hepsi cihazdaki gerçek veriden |
| Q5.7 FSRS (1. adım: çekirdek + simülasyon) | Ana dala birleşti | [#64](https://github.com/yurkenn/english-tales/pull/64) | FSRS-5 JS referansı ve Kotlin modeli, 28 adımlık ortak vektörle eşit. Simülasyon (20 tohum, 200 kelime, 120 gün): aynı akılda tutmayla %11 daha az tekrar, son ayın günlük yükü 13,3 → 9,3. Bu ilk aşama tek başına zamanlamayı değiştirmedi; sonraki #65 geçişi aşağıda canlı uygulama kaydıyla tamamlandı. [Ayrıntı](FSRS_PLAN.md) |
| Q5.7 FSRS (2. adım: geçiş) | Ana dala birleşti; sunucu canlıda, 49 dahili testte | [#65](https://github.com/yurkenn/english-tales/pull/65) | Tekrar aralığını artık FSRS-5 belirler: uygulama (`LearningPolicy`, Room 10) ve sunucu (`apply_word_event` oynatımı, `private.fsrs_review`) aynı vektörlerle eşit. "Biliyorum" = kararlılık ≥ 21 gün. Eski uygulamalar için `interval_days` kademelerde kalır. Migration 16 Ekim’de canlıya uygulandı; 49 cihaz eşitleme kabulü açık |
| Q5.8 Alıştırma basamakları (1. adım) | Ana dala birleşti | [#62](https://github.com/yurkenn/english-tales/pull/62) | "Akıllı tekrar" ve günlük plandaki tekrar: öğrenilmekte olan kelime anlam seçme (tanıma), tekrara geçmiş kelime harflerden kurma (hatırlama) sorusuyla gelir. Bağlam ve dinleme ayrı modlar olarak kalır; basamaklar FSRS (Q5.7) ile inceltilecek |
| Q5.8 Alıştırma basamakları (2. adım) | PR açık | [#74](https://github.com/yurkenn/english-tales/pull/74) | "Akıllı tekrar" dört basamağı kullanır: öğrenilen kelime anlam seçme, kararlılığı 7 günün altındaki tekrar kelimesi harflerden kurma, 7 gün ve üstü hikâye cümlesinde boşluk doldurma, bilinen kelime (≥ 21 gün) dinleyip seçme. Oturum bu sırayla ilerler; cümlesi olmayan kelime ya da İngilizce sesi olmayan cihazda bir alt basamağa iner. Günlük plandan açılan tekrar, ses henüz denetlenmediği için dinleme basamağını kullanmaz. `PracticeLadderTest` |
| Q5.9 Cümle kurma | Ana dala birleşti | [#57](https://github.com/yurkenn/english-tales/pull/57) | Oyna ekranında yeni mod: hikâyedeki 4–10 sözcüklük bir cümlenin karışık sözcüklerini doğru sıraya koy; Türkçe anlamı ipucu, seçilen sözcük geri alınabilir, tekrar eden sözcükler birbirinin yerine geçer. Seviyendeki cümleler önce; oturum `choice` olarak sayılır |
| Q5.9 Dikte | Ana dala birleşti | [#58](https://github.com/yurkenn/english-tales/pull/58) | "Dinle ve yaz": aynı kısa hikâye cümleleri seslendirilir, öğrenen yazar; büyük/küçük harf ve noktalama sayılmaz, her farklı/eksik/fazla sözcük sayılır. Cihazda İngilizce ses yoksa mod görünmez; oturum `choice` |
| Q5.4 Seviye yerleştirme | Ana dala birleşti | [#27](https://github.com/yurkenn/english-tales/pull/27) | Onboarding/Ayarlar’da dokuz soru, A1–B1 başlangıç önerisi; [kapsam](READING_PLACEMENT.md) |
| Q6 Ana ekran widget'ı | Ana dala birleşti | [#39](https://github.com/yurkenn/english-tales/pull/39) | Glance widget'ı: seri, günlük hedef ve tekrarı gelen kelime sayısı; dokununca günlük plan açılır. App Links ayrı satırda |
| Q6 App Links | Ana dala birleşti | [#72](https://github.com/yurkenn/english-tales/pull/72) | Paylaşılan bağlantı `https://englishtales-app.web.app/story/{id}`; manifestte `autoVerify` ile yalnız `/story/` yolu. Uygulama yüklüyse hikâye sayfası açılır, katalogda olmayan hikâye kitaplığı açar, onboarding bitmeden gelen bağlantı onboarding'den sonra açılır. Uygulama yoksa `story.html` Play bağlantısı gösterir (Hosting yayını ayrı adım). `StoryLinksTest`, `StoryLinkIntentTest` |

## 5a. Kalan işler ve yayın sırası — 16 Ekim 2026

Karar gerektirmeyen kod işleri tamamlandı (#45–#65). Kalanlar uygulama sahibinin kararını veya emeğini bekliyor:

| İş | Neden bekliyor |
|---|---|
| Q4.2 Pilot revizyonları canlıya yayımla | Canlı panel/Supabase yayını; "yayına al" onayı |
| Q4.3b Sözlük anlamları | Taslaklar (#68), çapraz kontrol (#73) ve itirazların çözümü (#78) tamam. Yayına girmesi için yalnız sahibinin %10 örneklem incelemesi (`npm run glossary:sample`, 121) ve `sampleApprovedBy` onayı kaldı |
| Q4.3c Hikâye başına çalışma kelimesi seçimi | Q4.3b verisine bağlı; editör incelemesi |
| Q4.7 İçerik hacmi (bölümlü hikâyeler, B1/B2) | İlk iki B1 taslağı hazır (#84); editör onayı, kapak ve katalog yayını gerekir. Sonraki taslaklar iki haftada 1–2 hikâye ritmiyle |
| L0 İngilizce arayüz | Arayüz İngilizceyken destek dilinin (çevirilerin) ne olacağı ürün kararı |
| Q6 App Links | Alan adı `englishtales-app.web.app` seçildi ve `assetlinks.json` yayında (#67); uygulama yönlendirmesi ana dalda (#72); `story.html` Hosting yayını ve cihaz denemesi açık |
| Q2 ölçüm sağlayıcısı, gelir modeli, kayıtlı ses | Ürün kararları |

**Yayın sırası (canlıya alırken):** Sunucu migration'ları uygulama sürümünden önce uygulanmalı, çünkü yeni uygulama bu RPC ve alanları kullanır:
`20261016090000_translation_tables` → `20261016100000_story_questions` → `20261016110000_story_tags` → `20261016120000_story_favorites` → `20261016130000_personal_words` → `20261016140000_known_words` → `20261016150000_fsrs`.
16 Ekim 2026'da bu yedi migration canlıya uygulandı (#67, [son durum](../../README_SON_DURUM.md)). FSRS geçişi eski uygulamalarla uyumludur (`interval_days` eski kademelerde kalır). Kişisel kelime ve bilinen kelime olayları eski sunucuda reddedilir, bu yüzden sıra önemlidir.

## 6. Birleşik doğrulama — 15 Ekim 2026

- #14 yol haritası ve #15–#21 geliştirmeleri ana dala birleşti. #21 içinde katalog yükleme/güncelleme ekranı çakışması çözüldü. Activity yeniden oluşturulunca indirilmiş güncelleme yeniden bulunur; kapanmış örneğe gelen geç Play yanıtları yok sayılır. İki regresyon testi eklendi.
- [Birleşik kaynak CI](https://github.com/yurkenn/english-tales/actions/runs/38740235486) ve [#21 PR CI](https://github.com/yurkenn/english-tales/actions/runs/38740408476) başarılı: repository, backend, Android ve android-device.
- CI cihaz raporu: **139 test, 136 başarılı, 0 hata, 3 atlama**. İki `LearningSyncWorkerTest` ve canlı `RemoteContentTest` özel servis yapılandırması olmayan CI'da koşullu atlanır. Bunlar canlı eşitleme/indirme doğrulandı şeklinde yorumlanmaz.
- Yerel birleşik doğrulama: **29 JVM / 61 backend testi başarılı**; admin HTTP uçtan uca kontrolü ve 6 ELF doğrulayıcı testi başarılı. Debug derlemesi ve lint geçti: **0 hata / 30 lint uyarısı**. Son in-process Kotlin derlemesinde derleyici uyarısı yok.
- İmzalı APK **7,9 MB**, AAB **11,18 MB**. Üretim adresi, test adresinin dışlanması, Play upload sertifikası, APK/AAB imzası, APK ZIP ve ELF64 16 KB statik hizalama kontrolü başarılı. Bu, yeni sürüm koduyla yayımlanmış bir mağaza paketi değildir; yerel teknik kontrol 48 / 2.0.0 ile yapıldı. Sonraki yükleme Console'daki en yüksek koddan büyük olmalıdır.
- Yerel emülatör sistem izinleri nedeniyle başlatılamadı; cihaz testleri GitHub emülatöründe yapıldı. Mevcut çalışma dizini ve özel ayarlar korundu; entegrasyon geçici kopyada doğrulandı.
- Crashlytics mapping yükleme işi bu yerel paket kontrolünde çalıştırılmadı. Gerçek Play teslimatı, üretilen split paketler, gerçek 16 KB cihazı ve fiziksel ses kesintisi bu çalışmada yeniden doğrulanmadı.

## 7. Güncel kabul sırası ve açık kapılar

- [x] 49 için imzalı paket, 94 release JVM / 144 backend testi ve kaynak master CI; yedi migration’ın canlı uygulaması.
- [x] 49’un mevcut tek kişilik listeye **elle** dahili yayını; [test bağlantısı](https://play.google.com/apps/internaltest/4701713728242169635).
- [ ] **Telefon kabulü:** Play’den 48→49 güncelle; sürüm 2.1.0 / 49’u doğrula. Giriş/yeniden açılış, okuma konumu, kaydedilen kelimeler/tekrar planı, favoriler ve kişisel/bilinen kelime eşitlemesi korunmalı; çevrimdışı okuma ve ses kesintileri denenmeli. Play split paketleri ve gerçek 16 KB cihaz kontrolü ayrı kaydedilmeli.
- [ ] **Q3:** 49’da açılış → kitaplık → hikâye → okuma → kelime kaydetme → alıştırma yolunu TalkBack ile tamamla; 48 için alınan olumlu sonucu 49’a taşıma.
- [ ] **Q2.1/Q2.2:** Data safety inceleme sonucunu doğrula; yeni paket Crashlytics/ANR görünürlüğü, Analytics katılımı kapalı/açık/tekrar kapalı alım kontrolü ve GA retention / `mode` boyutu / cohort ayarlarını tamamla.
- [ ] **Q2.3:** Fiziksel cihaz performans karşılaştırması ve TTFD. Mevcut Macrobenchmark ve paket profil kontrolü bunların yerine geçmez.
- [ ] **49 üretim kararı:** [Kademeli yayın kabulü](STAGED_RELEASE.md), güncelleme/veri koruma ve ölçüm kontrollerinden sonra %20 → %50 → %100. 49 şu an yalnız dahili kanalda; üretim 48.
- [ ] **Q4:** Paket–canlı içerik farkı, A1/A2 kapsama ≥ %60, içerik revizyon yayını ve yeniden denetim. Şema migration’larının uygulanması yeni sözlük/soru içeriklerinin yayımlandığı anlamına gelmez.
- [ ] **Q6 App Links:** Web ilişkilendirmesi ve uygulama rotası (#72) hazır; `story.html` Hosting'e yayımlanıp 49'dan sonraki pakette kurulu/kurulu değil senaryoları denenmeli.
- [ ] **İsteğe bağlı:** Yalnız test kanalına yetkili Play servis hesabı + `PLAY_SERVICE_ACCOUNT_JSON`; workflow’un otomatik yükleme yolunu ayrıca doğrula. Elle dahili yayın başarılı olduğu için bu bir paket üretim veya elle yükleme engeli değildir.

**Q2 ve Q3 açık kalır.** Otomatik teknik paket doğrulaması ile elle Play yayını, Console’daki dahili erişim ile gerçek telefon kabulü ayrı kaydedilir. PR #67 kaynak/doküman kaydıdır; birleşmesi tek başına üretim yayını değildir.
