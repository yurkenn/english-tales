# English Tales — kalite yol haritası

15 Ekim 2026 · **Yenileme: 16 Ekim 2026, master `fd2b5e4`** · İlk kaynak: master `8bef30b` · Dayanak: [derin eksik haritası](GAP_ANALYSIS.md), [geliştirme haritası](NEXT_PHASE_ROADMAP.md).

“Kaliteli” burada ölçülebilir hedefler demektir. Her faz bir **kalite kapısıyla** biter; kapı geçilmeden sonraki faz “tamam” sayılmaz. Efor tahminleri tek geliştirici için **ideal geliştirme günü**dür (test ve doğrulama dahil, inceleme bekleme hariç); belirsizlik yüksek olan işlerde aralık verilir. Bunlar plan tahminidir, teslim vaadi değildir.

## 1. Kalite hedefleri

| Alan | Ölçüt | Hedef | Bugün | Nasıl ölçülür |
|---|---|---|---|---|
| Kararlılık | Kullanıcının fark ettiği çökme oranı | < %1,09 (Play kötü davranış eşiği), hedef < %0,5 | Crashlytics ana dalda (#18); yeni mağaza sürümü ve yayın beyanları bekliyor | Play vitals + çökme raporlama |
| Kararlılık | ANR oranı | < %0,47 (Play eşiği), hedef < %0,2 | Ölçülmüyor | Play vitals |
| Performans | Soğuk açılış (orta sınıf cihaz, medyan) | < 1,5 sn | Katalog arka planda (#20); cihaz bazlı Macrobenchmark ölçümü bekliyor | Macrobenchmark |
| Performans | Okuyucu sayfa geçişi takılma | < %5 yavaş kare | Ölçülmüyor | Macrobenchmark `FrameTimingMetric` |
| Boyut | İndirme boyutu (release APK) | < 15 MB | Birleşik APK 7,9 MB; AAB 11,18 MB (15 Ekim) | `verify_release.py` |
| Doğruluk | PR başına otomatik test | Birim + backend + cihaz testleri CI'da | CI emülatörü: 139 test, 136 geçti / 3 koşullu atlandı | GitHub Actions |
| Erişilebilirlik | Ana yolculuk TalkBack ile | Tamamlanabilir; etiketsiz etkileşim 0 | On ana ekranda etiketsiz/rolsüz eylem 0 (`AccessibilityAuditTest`); gerçek TalkBack ile elle yolculuk kaydı yok | Kabul testi + lint |
| Erişilebilirlik | Büyük yazı | fontScale 2.0'da kırpılma yok | 320×640 dp, fontScale 2.0'da on ana ekranda kesilen veya bölünen metin 0 (`LargeTextLayoutTest`) | Compose UI testleri |
| Erişilebilirlik | Kontrast | ≥ 4.5:1 metin | İki temada 38 metin/zemin çifti ≥ 4.5:1 (`TaleColorsContrastTest`); kalan sabit renkler kendi içinde eşleşen çiftler | Renk denetimi |
| İçerik | Sözlük kapsaması (A1/A2 benzersiz sözcük) | ≥ %60 | Paket A1 %32,3 · A2 %17,3; canlı A1 %23,5 · A2 %15,4 ([#33](CONTENT_QUALITY_AUDIT.md)) | Katalog testi |
| İçerik | Paket = canlı | Fark 0 | Hikâye sözlük ID'si paket 358 / canlı 315; 39 hikâyede fark | Yayın doğrulama aracı |
| Öğrenme | İlk hikâyeyi bitirme, ertesi gün dönüş, tekrar tamamlama | Önce ölçüm, sonra hedef | Ölçülmüyor | Asgari ürün olayları |
| Yayın | Kademeli dağıtım + otomatik doğrulama | Her sürüm %20 → %50 → %100 | %100 elle | Sürüm kontrol listesi |
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

**Kapı Q3:** TalkBack yolculuğu · koyu tema · metinler kaynakta. — **16 Ekim 2026: kod birleşti, kapı açık.** Q3.1–Q3.4 #30, #31, #32 ve #34 ile ana dala birleşti. Kapanış için gerçek TalkBack ile ana yolculuğun elle kaydı gerekir.

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
| Q6 | 5–8 | Paylaşım alan adı |
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
| Q2.1 Çökme raporlama | Kod birleşti; yayın beyanları açık | [#18](https://github.com/yurkenn/english-tales/pull/18) | Crashlytics; test çökmesi panelde göründü |
| Q2.2 Ürün olayları | Ana dala birleşti; canlı kabul açık | [#23](https://github.com/yurkenn/english-tales/pull/23) | Yedi olay, varsayılan kapalı katılım, sabit payload ve D1 cohort |
| Q2.3 Performans altyapısı | Ana dala birleşti; fiziksel kabul açık | [#26](https://github.com/yurkenn/english-tales/pull/26) | Profil üretimi 2/2, Macrobenchmark 3/3; imzalı APK/AAB profil doğrulaması geçti; [kanıt ve CI](PERFORMANCE.md) |
| Q2.4 Sürüm otomasyonu | Ana dala birleşti; GitHub secret'ları ve ilk CI çalıştırması açık | [#29](https://github.com/yurkenn/english-tales/pull/29) | Elle tetiklenen imzalı APK/AAB + `verify_release.py` (sürüm kodu, APK < 15 MB) + isteğe bağlı dahili kanal yüklemesi; yerel 49 adayı doğrulandı; [kurulum](RELEASE_AUTOMATION.md) |
| Q2.5 Kademeli yayın listesi | Hazır; bu belgeyle birlikte #22 | [#22](https://github.com/yurkenn/english-tales/pull/22) | %20 → %50 → %100; izleme, durdurma ve düzeltme kaydı |
| Q3.1 Metinler kaynakta | Ana dala birleşti | [#30](https://github.com/yurkenn/english-tales/pull/30) | 306 ekran metni `strings.xml`'e taşındı (UI, reklam/analiz tercihleri, güncelleme çubuğu, bildirim); sözcük içeren sabit `Text("…")` 0 ve `verify_repository.py` bunu korur. Tür adları (Günlük yaşam/Macera/Gizem) saklanan veri değeri olduğundan ve ViewModel hata mesajları henüz kaynakta değil |
| Q3.2 TalkBack rol/etiket | Ana dala birleşti | [#31](https://github.com/yurkenn/english-tales/pull/31) | 24 özel tıklanabilir öğeye rol eklendi (seçim kartları `selectable` + `selectableGroup`); ikonlu geri düğmesine etiket, alıştırma kapatma hedefi 32 → 48 dp. `AccessibilityAuditTest` on ana ekranda etiketsiz veya rolsüz eylem bırakmaz (yerel emülatör 10/10). Kelime bağlantıları cümle metninin bağlantıları olarak okunur. Gerçek TalkBack ile elle yolculuk kaydı yok |
| Q3.3 Koyu tema | Ana dala birleşti | [#32](https://github.com/yurkenn/english-tales/pull/32) | `Tale*` renkleri açık/koyu paletten gelir (`TaleColors`); sistem koyu temasında uygulama, Material bileşenleri ve pencere koyu. Sabit renkler yalnız kendi içinde eşleşen yerlerde kaldı (kapak, afiş, Google düğmesi, marka girişi, geri bildirim kenarlıkları). Açık temada 4.5:1 altındaki metin renkleri düzeltildi (ör. hata 2,98 → 6,5, seviye 2,96 → 5,2). `TaleColorsContrastTest` iki temada 38 metin/zemin çiftini, `DarkThemeTest` sekiz ekranı denetler (yerel emülatör 8/8). Okuyucu kendi açık/koyu seçimini korur. Önizleme: [Çalış](preview-dark-study.png), [Katalog](preview-dark-catalog.png), [Oyna](preview-dark-practice.png) |
| Q3.4 Büyük yazı ve küçük ekran | Ana dala birleşti | [#34](https://github.com/yurkenn/english-tales/pull/34) | `LargeTextLayoutTest` 320×640 dp ve fontScale 2.0'da on ana ekranı tarar: satır kaybı, üç nokta, taşma ve kelime ortasından bölünme 0 (yerel emülatör 10/10). Alt menü, katalog düğmeleri, üst çubuk ve Kelimelerim düğmesi yazıyla büyür; yan yana öğeler fontScale ≥ 1,5'te alt alta geçer. Önizleme: [Katalog](preview-large-text-catalog.png), [Hikâye](preview-large-text-storyDetail.png) |
| Q4 İçerik denetimi | Ana dala birleşti; eşitlik ve kapsama kapısı açık | [#33](https://github.com/yurkenn/english-tales/pull/33) | Paket ↔ canlı denetimi (`npm run content:audit`). 43 sözlük ID'si canlıda yok, 39 hikâye etkileniyor; A1 kapsama paket %32,3 / canlı %23,5, A2 %17,3 / %15,4. [Rapor](CONTENT_QUALITY_AUDIT.md) |
| Q4.1a Revizyonlar arası okuma güvenliği | Ana dala birleşti | [#45](https://github.com/yurkenn/english-tales/pull/45) | Okuma konumu cümle kimliği korunduğu sürece yeni revizyona taşınır; metni/kapağı gömülü hikâyeyle aynı yeni revizyon çevrimdışı açılır. Taslak aracı #40'ta. Revizyon yayını 49'dan sonra. [Ayrıntı](CONTENT_QUALITY_AUDIT.md) |
| F01 Zayıf kelime tekrarı (ilk aşama) | Ana dala birleşti | [#46](https://github.com/yurkenn/english-tales/pull/46) | Yanlış yanıt kelime/gün başına yerel olay; son 30 günde yanlış yapılan, henüz bilinmeyen kelimeler alıştırma ve günlük planda önce gelir. Aralıklar değişmedi; olaylar hesaplar arası eşitlenmez |
| 3.1b Çevrimdışı hazır filtresi | Ana dala birleşti | [#47](https://github.com/yurkenn/english-tales/pull/47) | Kitaplık listelerinde metni cihazda olan hikâyeleri gösteren çip; seviye/durum/süre filtreleriyle birleşir, yalnız indirme gereken hikâye varken görünür |
| Q4.0 Çeviri tabloları | Ana dala birleşti | [#37](https://github.com/yurkenn/english-tales/pull/37), [#36](https://github.com/yurkenn/english-tales/pull/36) | Cümle/kelime/açıklama çevirileri dil koduyla ayrı tablolarda; uygulama Türkçeyi bunlardan okur |
| Q4.1 Taslak revizyon aracı | Ana dala birleşti | [#40](https://github.com/yurkenn/english-tales/pull/40) | Paket ile canlı farkından taslak paketi üretir; yayın 49'dan sonra |
| Q4.4 Okuma süresi + süre filtresi | Ana dala birleşti | [#42](https://github.com/yurkenn/english-tales/pull/42) | Kartlarda "~N dk"; kitaplıkta yalnız katalogda bulunan süre aralıkları filtre olarak sunulur |
| Q4.5 Etiket modeli | PR açık | [#48](https://github.com/yurkenn/english-tales/pull/48) | `content_tags`/`tag_names`/`revision_tags`; masal, fabl, macera, günlük yaşam, gizem. Aesop → fabl, Grimm/Andersen/Wilde → masal. Panel, exporter, denetim ve uygulama etiketleri taşır; kitaplık kategorileri etiketlerden gelir, eski sunucuda türe düşer |
| Q5.1 Bağlamlı boşluk doldurma | Ana dala birleşti | [#28](https://github.com/yurkenn/english-tales/pull/28) | Mevcut hikâye cümlelerinden seçmeli soru; puan/oturum sözleşmesi korunur; [kapsam](SENTENCE_GAP.md) |
| Q5.2 Dinleyip seçme | Ana dala birleşti | [#38](https://github.com/yurkenn/english-tales/pull/38) | TTS ile kelimeyi dinleyip seçme; ses yoksa mod gizlenir |
| Q5.3 Anlama soruları | Ana dala birleşti | [#41](https://github.com/yurkenn/english-tales/pull/41), [#43](https://github.com/yurkenn/english-tales/pull/43) | `story_questions` (ana fikir/ayrıntı/çıkarım, 2–4 seçenek) şema, panel ve araçlarda; okuma sonrası anlama soruları |
| Q5.4 Seviye yerleştirme | Ana dala birleşti | [#27](https://github.com/yurkenn/english-tales/pull/27) | Onboarding/Ayarlar’da dokuz soru, A1–B1 başlangıç önerisi; [kapsam](READING_PLACEMENT.md) |
| Q6 Ana ekran widget'ı | Ana dala birleşti | [#39](https://github.com/yurkenn/english-tales/pull/39) | Glance widget'ı: seri, günlük hedef ve tekrarı gelen kelime sayısı; dokununca günlük plan açılır. App Links paylaşım alan adı kararı bekliyor |

## 6. Birleşik doğrulama — 15 Ekim 2026

- #14 yol haritası ve #15–#21 geliştirmeleri ana dala birleşti. #21 içinde katalog yükleme/güncelleme ekranı çakışması çözüldü. Activity yeniden oluşturulunca indirilmiş güncelleme yeniden bulunur; kapanmış örneğe gelen geç Play yanıtları yok sayılır. İki regresyon testi eklendi.
- [Birleşik kaynak CI](https://github.com/yurkenn/english-tales/actions/runs/38740235486) ve [#21 PR CI](https://github.com/yurkenn/english-tales/actions/runs/38740408476) başarılı: repository, backend, Android ve android-device.
- CI cihaz raporu: **139 test, 136 başarılı, 0 hata, 3 atlama**. İki `LearningSyncWorkerTest` ve canlı `RemoteContentTest` özel servis yapılandırması olmayan CI'da koşullu atlanır. Bunlar canlı eşitleme/indirme doğrulandı şeklinde yorumlanmaz.
- Yerel birleşik doğrulama: **29 JVM / 61 backend testi başarılı**; admin HTTP uçtan uca kontrolü ve 6 ELF doğrulayıcı testi başarılı. Debug derlemesi ve lint geçti: **0 hata / 30 lint uyarısı**. Son in-process Kotlin derlemesinde derleyici uyarısı yok.
- İmzalı APK **7,9 MB**, AAB **11,18 MB**. Üretim adresi, test adresinin dışlanması, Play upload sertifikası, APK/AAB imzası, APK ZIP ve ELF64 16 KB statik hizalama kontrolü başarılı. Bu, yeni sürüm koduyla yayımlanmış bir mağaza paketi değildir; yerel teknik kontrol 48 / 2.0.0 ile yapıldı. Sonraki yükleme Console'daki en yüksek koddan büyük olmalıdır.
- Yerel emülatör sistem izinleri nedeniyle başlatılamadı; cihaz testleri GitHub emülatöründe yapıldı. Mevcut çalışma dizini ve özel ayarlar korundu; entegrasyon geçici kopyada doğrulandı.
- Crashlytics mapping yükleme işi bu yerel paket kontrolünde çalıştırılmadı. Gerçek Play teslimatı, üretilen split paketler, gerçek 16 KB cihazı ve fiziksel ses kesintisi bu çalışmada yeniden doğrulanmadı.

**Q2 hâlâ açık:** Q2.2 ürün olayları [isteğe bağlı Analytics katmanında](PRODUCT_ANALYTICS.md) uygulandı; canlı panel kabulü açık. Q2.3 [Macrobenchmark/Baseline Profile altyapısı](PERFORMANCE.md) eklendi; kaynak profilleri kalıcı depoya kaydedildi, yerel üç senaryo ve imzalı APK/AAB profil kontrolleri geçti. PR #26 CI kontrolleri başarılı ve ana dala birleşti; fiziksel cihaz karşılaştırması ve TTFD açık. Q2.4 [imzalı CI/dahili kanal otomasyonu](RELEASE_AUTOMATION.md) eklendi; `release` ortamındaki secret'lar ve ilk GitHub çalıştırması açık. Q2.1 kodu ve önceki test çökmesi kaydı hazır; gizlilik yayını CLI ile tamamlandı; [Play veri güvenliği beyanı](CRASH_REPORTING.md) yeni mağaza sürümünden önce tamamlanmalı. Q2.5 [kademeli yayın kontrol listesi](STAGED_RELEASE.md) hazırdır; Console dağıtımı veya otomatik izleme kurulmuş sayılmaz.
