# English Tales — kalite yol haritası

15 Ekim 2026 · Kaynak: master `8bef30b` · Dayanak: [derin eksik haritası](GAP_ANALYSIS.md), [geliştirme haritası](NEXT_PHASE_ROADMAP.md).

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
| Erişilebilirlik | Ana yolculuk TalkBack ile | Tamamlanabilir; etiketsiz etkileşim 0 | 18 etiket / 31 tıklanabilir | Kabul testi + lint |
| Erişilebilirlik | Büyük yazı | fontScale 2.0'da kırpılma yok | Kısmi testler | Compose UI testleri |
| Erişilebilirlik | Kontrast | ≥ 4.5:1 metin | Tema renkleri geçiyor, 80 sabit renk denetlenmedi | Renk denetimi |
| İçerik | Sözlük kapsaması (A1/A2 benzersiz sözcük) | ≥ %60 | %19 (tüm katalog) | Katalog testi |
| İçerik | Paket = canlı | Fark 0 | Paket 359 / canlı 316 öğe | Yayın doğrulama aracı |
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

**Kapı Q3:** TalkBack yolculuğu · koyu tema · metinler kaynakta.

### Q4 — İçerik kalitesi · ~8–12 gün · karar: sözlük kaynağı

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
| Q2.2 Ürün olayları | Kod hazır; canlı kabul açık | Bu değişiklik | Yedi olay, varsayılan kapalı katılım, sabit payload ve D1 cohort |
| Q2.3 Performans altyapısı | Checkpoint; son kabul açık | Bu değişiklik | İzole paket, profil üreticisi ve TTID/kare ölçümleri; [durum](PERFORMANCE.md) |
| Q2.5 Kademeli yayın listesi | Hazır; bu belgeyle birlikte #22 | [#22](https://github.com/yurkenn/english-tales/pull/22) | %20 → %50 → %100; izleme, durdurma ve düzeltme kaydı |

## 6. Birleşik doğrulama — 15 Ekim 2026

- #14 yol haritası ve #15–#21 geliştirmeleri ana dala birleşti. #21 içinde katalog yükleme/güncelleme ekranı çakışması çözüldü. Activity yeniden oluşturulunca indirilmiş güncelleme yeniden bulunur; kapanmış örneğe gelen geç Play yanıtları yok sayılır. İki regresyon testi eklendi.
- [Birleşik kaynak CI](https://github.com/yurkenn/english-tales/actions/runs/38740235486) ve [#21 PR CI](https://github.com/yurkenn/english-tales/actions/runs/38740408476) başarılı: repository, backend, Android ve android-device.
- CI cihaz raporu: **139 test, 136 başarılı, 0 hata, 3 atlama**. İki `LearningSyncWorkerTest` ve canlı `RemoteContentTest` özel servis yapılandırması olmayan CI'da koşullu atlanır. Bunlar canlı eşitleme/indirme doğrulandı şeklinde yorumlanmaz.
- Yerel birleşik doğrulama: **29 JVM / 61 backend testi başarılı**; admin HTTP uçtan uca kontrolü ve 6 ELF doğrulayıcı testi başarılı. Debug derlemesi ve lint geçti: **0 hata / 30 lint uyarısı**. Son in-process Kotlin derlemesinde derleyici uyarısı yok.
- İmzalı APK **7,9 MB**, AAB **11,18 MB**. Üretim adresi, test adresinin dışlanması, Play upload sertifikası, APK/AAB imzası, APK ZIP ve ELF64 16 KB statik hizalama kontrolü başarılı. Bu, yeni sürüm koduyla yayımlanmış bir mağaza paketi değildir; yerel teknik kontrol 48 / 2.0.0 ile yapıldı. Sonraki yükleme Console'daki en yüksek koddan büyük olmalıdır.
- Yerel emülatör sistem izinleri nedeniyle başlatılamadı; cihaz testleri GitHub emülatöründe yapıldı. Mevcut çalışma dizini ve özel ayarlar korundu; entegrasyon geçici kopyada doğrulandı.
- Crashlytics mapping yükleme işi bu yerel paket kontrolünde çalıştırılmadı. Gerçek Play teslimatı, üretilen split paketler, gerçek 16 KB cihazı ve fiziksel ses kesintisi bu çalışmada yeniden doğrulanmadı.

**Q2 hâlâ açık:** Q2.2 ürün olayları [isteğe bağlı Analytics katmanında](PRODUCT_ANALYTICS.md) uygulandı; canlı panel kabulü açık. Q2.3 [Macrobenchmark/Baseline Profile altyapısı](PERFORMANCE.md) eklendi; kaynak profillerinin kalıcı kaydı, son koşu ve fiziksel cihaz karşılaştırması açık. Q2.4 imzalı CI/dahili kanal otomasyonu uygulanacak. Q2.1 kodu ve önceki test çökmesi kaydı hazır; gizlilik yayını CLI ile tamamlandı; [Play veri güvenliği beyanı](CRASH_REPORTING.md) yeni mağaza sürümünden önce tamamlanmalı. Q2.5 [kademeli yayın kontrol listesi](STAGED_RELEASE.md) hazırdır; Console dağıtımı veya otomatik izleme kurulmuş sayılmaz.
