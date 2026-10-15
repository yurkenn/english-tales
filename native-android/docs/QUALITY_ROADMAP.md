# English Tales — kalite yol haritası

15 Ekim 2026 · Kaynak: master `8bef30b` · Dayanak: [derin eksik haritası](GAP_ANALYSIS.md), [geliştirme haritası](NEXT_PHASE_ROADMAP.md).

“Kaliteli” burada ölçülebilir hedefler demektir. Her faz bir **kalite kapısıyla** biter; kapı geçilmeden sonraki faz “tamam” sayılmaz. Efor tahminleri tek geliştirici için **ideal geliştirme günü**dür (test ve doğrulama dahil, inceleme bekleme hariç); belirsizlik yüksek olan işlerde aralık verilir. Bunlar plan tahminidir, teslim vaadi değildir.

## 1. Kalite hedefleri

| Alan | Ölçüt | Hedef | Bugün | Nasıl ölçülür |
|---|---|---|---|---|
| Kararlılık | Kullanıcının fark ettiği çökme oranı | < %1,09 (Play kötü davranış eşiği), hedef < %0,5 | Crashlytics hazır (#18); 49 sürümüyle ölçülmeye başlar | Play vitals + çökme raporlama |
| Kararlılık | ANR oranı | < %0,47 (Play eşiği), hedef < %0,2 | Ölçülmüyor | Play vitals |
| Performans | Soğuk açılış (orta sınıf cihaz, medyan) | < 1,5 sn | Ölçülmüyor; 322 KB katalog ana iş parçacığında | Macrobenchmark |
| Performans | Okuyucu sayfa geçişi takılma | < %5 yavaş kare | Ölçülmüyor | Macrobenchmark `FrameTimingMetric` |
| Boyut | İndirme boyutu (release APK) | < 15 MB | 30,7 MB → 7,2 MB (#15) | `verify_release.py` |
| Doğruluk | PR başına otomatik test | Birim + backend + cihaz testleri CI'da | Cihaz testleri yalnız yerel | GitHub Actions |
| Erişilebilirlik | Ana yolculuk TalkBack ile | Tamamlanabilir; etiketsiz etkileşim 0 | 18 etiket / 31 tıklanabilir | Kabul testi + lint |
| Erişilebilirlik | Büyük yazı | fontScale 2.0'da kırpılma yok | Kısmi testler | Compose UI testleri |
| Erişilebilirlik | Kontrast | ≥ 4.5:1 metin | Tema renkleri geçiyor, 80 sabit renk denetlenmedi | Renk denetimi |
| İçerik | Sözlük kapsaması (A1/A2 benzersiz sözcük) | ≥ %60 | %19 (tüm katalog) | Katalog testi |
| İçerik | Paket = canlı | Fark 0 | Paket 359 / canlı 316 öğe | Yayın doğrulama aracı |
| Öğrenme | İlk hikâyeyi bitirme, ertesi gün dönüş, tekrar tamamlama | Önce ölçüm, sonra hedef | Ölçülmüyor | Asgari ürün olayları |
| Yayın | Kademeli dağıtım + otomatik doğrulama | Her sürüm %20 → %50 → %100 | %100 elle | Sürüm kontrol listesi |
| Kod | Kullanım dışı API ve lint uyarısı | 0 | 3 → 0 (#19) | Derleme çıktısı |

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

**Kapı Q1:** APK < 15 MB · CI'da tüm testler · derleme uyarısı 0 · ses odağı testleri. — Tüm maddeler PR'da; kapı #15–#21 birleşince geçilmiş olur.

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
| Q1.1 WebP kapaklar | İncelemede | [#15](https://github.com/yurkenn/english-tales/pull/15) | APK 30,7 → 7,2 MB; AAB 10,0 MB |
| Q1.2 CI cihaz testleri | İncelemede | [#16](https://github.com/yurkenn/english-tales/pull/16) | İlk koşu ~2,5 dk; yapılandırmaya bağlı 2 test bulundu ve koşullu yapıldı |
| Q1.3 TTS ses odağı | İncelemede | [#17](https://github.com/yurkenn/english-tales/pull/17) | Odak kaybında durur; her çıkışta odak bırakılır |
| Q1.4 `LinkAnnotation` | İncelemede | [#19](https://github.com/yurkenn/english-tales/pull/19) | Kotlin derleme uyarısı 3 → 0 |
| Q1.5 Kataloğu arka planda yükle | İncelemede | [#20](https://github.com/yurkenn/english-tales/pull/20) | Ana iş parçacığından 134–173 ms çıktı; debug soğuk açılış ~1,63 → ~1,50 sn |
| Q1.6 Güncelleme + değerlendirme | İncelemede | [#21](https://github.com/yurkenn/english-tales/pull/21) | Esnek güncelleme (3 günde bir) + 3. hikâyeden sonra tek değerlendirme isteği |
| Q1.7 Reklam SDK uyarısı | İncelemede | [#19](https://github.com/yurkenn/english-tales/pull/19) | Beyan korunarak gerekçeli bastırıldı |
| Q2.1 Çökme raporlama | İncelemede | [#18](https://github.com/yurkenn/english-tales/pull/18) | Crashlytics; test çökmesi panelde göründü |
