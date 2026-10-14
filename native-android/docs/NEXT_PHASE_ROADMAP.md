# English Tales — 2.0 sonrası geliştirme haritası

15 Ekim 2026 · Kaynak: `b1ae829` (`codex/classic-story-library`) · Durum: öneri; aşağıdaki işler henüz uygulanmadı.

Bu harita, 48 / 2.0.0 sürümünün Google incelemesine gönderildiği noktadan başlar. Önceki planlar ([ürün planı](PRODUCT_ROADMAP.md), [24 iş paketi](DEVELOPMENT_BACKLOG.md)) geçerliliğini korur; bu belge onları bugünkü kod ve Play verisiyle yeniden önceliklendirir.

## 1. Bugünkü durum

| Alan | Gözlem | Kaynak |
|---|---|---|
| Kullanıcı | Üretimde 21 aktif kurulum; son 28 günde 14 mağaza ziyaretçisi, %46,7 dönüşüm. | Play Console, 15 Ekim |
| Kalite görünürlüğü | Android vitals “Data unavailable”; uygulamada çökme/analitik raporlama yok. | Play üretim panosu; `app/build.gradle.kts` |
| Kod | ~5.200 satır Kotlin, Compose + Room 6 + WorkManager + Supabase; 128 cihaz, 23 JVM, 57 backend testi geçiyor. | [README_SON_DURUM](../../README_SON_DURUM.md) |
| İçerik | 50 hikâye (A1 18 · A2 18 · B1 14), 1.002 cümle çifti, 316 kelime. | [CLASSICS_EXECUTION](CLASSICS_EXECUTION.md) |
| Tamamlanan plan işleri | D03/D04 güvenilirlik; U01/U02 kalıcı okuma ayarı ve tek dokunuşla devam; seyrek reklam altyapısı; 50 hikâyelik kütüphane. | Execution kayıtları |
| Açık temel işler | D05 ikinci cihazda kelime, D06 çok sözcüklü ifade, D07 TTS yaşam döngüsü, D08 gerçek iki cihaz eşitlemesi, D12 erişilebilirlik, D13 katalog sıralaması. | [DEVELOPMENT_BACKLOG](DEVELOPMENT_BACKLOG.md) |
| Gelir | Reklam kodu hazır, `config/ads.properties` içinde `ENABLED=false`; AB/ABD UMP mesajları oluşturulmadı, gizlilik sayfasının canlı güncellemesi bekliyor. | [ADS_AND_ICON_UX_EXECUTION](ADS_AND_ICON_UX_EXECUTION.md) |

## 2. Ana bulgular

1. **Kör uçuş.** Yayından sonra çökme, ANR veya ilk hikâyeyi bitirme oranı ölçülmüyor. Kurulum az olduğu için Play vitals da veri üretmiyor. Her ürün kararı tahmine dayanıyor.
2. **Büyüme en büyük darboğaz.** Ürün çalışıyor ama ayda ~14 ziyaretçi var. Mağaza dönüşümü iyi (%46,7); sorun görünürlük. Yeni özelliklerden önce ASO ve paylaşım döngüsü daha çok etki eder.
3. **Kelime yoğunluğu düşük.** 50 hikâyede 316 kelime (hikâye başına ~6). Alıştırma havuzu ve tekrar sistemi bu sınırla çalışıyor; içerik genişletmenin en ucuz yolu mevcut hikâyelere kelime/ifade eklemek.
4. **“Yeni hikâyeler” rafı yanlış sıralı.** [CatalogScreens.kt:119](../app/src/main/java/com/yurken/englishtales/ui/CatalogScreens.kt) `stories.takeLast(3)` kullanıyor; yayın tarihi değil katalog sırası belirliyor (D13).
5. **Yerelleştirme ve erişilebilirlik borcu.** 160 sabit `Text("…")`, `strings.xml`'de tek kayıt; 18 `contentDescription`. FR/DE/ES mağaza kayıtları var ama arayüz yalnız Türkçe.
6. **Tablet düzeni yok.** Sürüm 6.800 tablet modelini destekliyor; `WindowSizeClass` kullanılmıyor, ekranlar telefon düzenini geriyor.
7. **Ses yalnız cihaz TTS'i.** Kalitesi cihaza bağlı; dinleme odaklı öğrenme için kayıtlı ses yok (F08).
8. **Yayın hijyeni.** Play: hata ayıklama sembolleri yüklenmiyor; AD_ID beyanı eski aktif sürümlerle çelişiyor; Gradle 9 uyumluluk uyarısı var.

## 3. Harita

Boyut göreli: **S** küçük tek PR · **M** birkaç PR veya şema/test etkisi · **L** çok aşamalı. Süre vaadi değildir.

### Faz 0 — Yayını kapat (hemen)

| İş | Değer | Boyut | Not |
|---|---|---|---|
| 0.1 İnceleme sonucunu izle, yayında doğrula | 2.0'ın gerçekten kullanıcıya ulaşması | S | Play'in ürettiği split APK'larla bir cihazda güncelleme + ilerleme korunumu (status belgesi adım 6). |
| 0.2 AD_ID beyanını sürümlerle eşitle | Sonraki sürümlerde aynı hatanın çıkmaması | S | **Kod tarafı yapıldı** (`codex/release-hygiene`): manifestte açık AD_ID izni, `verify_release.py` kontrolü. Play tarafı açık: 47 dahili test sürümünü 48 ile değiştir. |
| 0.3 Native debug sembollerini AAB'ye ekle | Play'de okunabilir native çökme izi | S | **Ayar eklendi, uyarı kalır**: tek native kütüphane (AndroidX graphics-path) hazır derlenmiş ve sembolleri silinmiş geliyor; çıkarılacak sembol yok. Ayar ileride eklenecek native kod içindir. |
| 0.4 Veri güvenliği / reklam beyanı denetimi | Politika uyumu | S | Üretimde reklam kapalı; beyanlar paketin gerçek davranışıyla karşılaştırılır. |

### Faz 1 — Görünürlük ve temel güvenilirlik

| İş | Değer | Boyut | Bağımlılık |
|---|---|---|---|
| 1.1 Gizlilik dostu çökme raporlama | Hataları kullanıcı şikâyeti beklemeden görmek | M | Sağlayıcı kararı (Crashlytics/Sentry/yalnız Play vitals). Gizlilik metni ve veri güvenliği beyanı güncellenir. |
| 1.2 Asgari ürün ölçümü | “İlk hikâyeyi bitirdi”, “ertesi gün döndü”, “tekrar oturumu bitirdi” | M | 1.1 ile aynı karar; içerik metni, e-posta, öğrenme geçmişi loglanmaz (PRODUCT_ROADMAP §5). |
| 1.3 D13 katalog sıralaması | Yeni hikâyeler gerçekten yeni görünür | S | **Uygulandı** (`codex/catalog-new-stories`): `stories.created_at` katalogla gelir, raf ilk yayın tarihine göre sıralanır; tarihsiz/gömülü içerikte eski katalog sırası korunur. Şema veya panel değişikliği gerekmedi. |
| 1.4 D05 + D08 iki cihaz kabulü | Hesaplı kullanıcı kelime/ilerleme kaybetmez | M | Gerçek iki cihaz/emülatör; arşivli kaynak senaryosu. |
| 1.5 D07 TTS yaşam döngüsü | Ekran değişiminde sesin takılmaması | S | — |

### Faz 2 — Öğrenme çekirdeği

| İş | Değer | Boyut | Bağımlılık |
|---|---|---|---|
| 2.1 Hikâye başına kelime/ifade yoğunluğunu artır | Daha zengin kelime defteri ve alıştırma havuzu (hedef: hikâye başına 12–20) | M | **Pilot paket içinde** (`codex/vocabulary-density-pilot`): 5 A1 klasiğine 37 kelime; 6–9 → 13–19 seçilebilir kelime. Yalnız tek kelime (ifadeler D06'ya bağlı). Canlı kullanıcılar için yeni revision'ların yayıncı panelinden yayımlanması gerekir. |
| 2.2 D06 çok sözcüklü ifadeler | “pick up”, “once upon a time” gibi kalıplar doğru seçilir | M | Tokenizer, cümle-kelime bağlantıları, panel doğrulaması. |
| 2.3 F01 zayıf kelime tekrarı | Hata yapılan kelimeler öne çıkar; kısa günlük tekrar | M | LearningPolicy + SQL `apply_word_event` birlikte. |
| 2.4 F02 bağlamlı kelime defteri | Kaynak cümle, çeviri, hikâyeye dön, arama/filtre | M | D05 kaynak revizyonu çözümü. |
| 2.5 Okuma sonrası anlama soruları | Hikâyeyi anladığını ölçen 3–5 soru; seviye uygunluğu sinyali | M | İçerik şemasına soru alanı; panel editörü. |

### Faz 3 — İçerik ve keşif

| İş | Değer | Boyut | Bağımlılık |
|---|---|---|---|
| 3.1 F03 kitaplık filtreleri | Seviye/tür/süre/okunmamış/indirilen | S–M | 1.3. |
| 3.2 Düzenli içerik akışı | Haftalık/iki haftalık yeni hikâye; B1'i 18'e çıkar, B2 pilotu | L | D14/D15 editör akışı; CONTENT_GUIDE. |
| 3.3 F08 kayıtlı ses (pilot) | Dinleme becerisi; cümle vurgusu | L | Ses üretim/hak kararı, sürüme bağlı medya, çevrimdışı boyut. Önce 5 hikâyelik pilot. |
| 3.4 F09 favoriler / okuma listesi | Kullanıcının kendi rafı | M | Room migration + eşitleme tombstone. |
| 3.5 Tablet ve büyük ekran düzeni | 6.800 desteklenen tablette iki sütunlu okuma/katalog | M | WindowSizeClass; mevcut fontScale testleri. |

### Faz 4 — Büyüme ve gelir

| İş | Değer | Boyut | Bağımlılık |
|---|---|---|---|
| 4.1 ASO ve mağaza deneyleri | Ziyaretçi sayısını artırma; anahtar kelime ve görsel A/B | S | Play Store listing experiments; mevcut EN/TR metinler. |
| 4.2 Paylaşım ve davet döngüsü | Bitirilen hikâye/seri kartı paylaşma | S–M | Mevcut paylaşım intent'i (CatalogScreens). |
| 4.3 Arayüz metinlerini `strings.xml`'e taşı | Erişilebilirlik + ileride ikinci arayüz dili | M | D12 ile birlikte; ikinci dil kararı ayrı (F11). |
| 4.4 Hatırlatıcı ve haftalık özet (F05) | Geri dönüş; yumuşak seri | M | 1.2 ölçümü ile etkisi izlenir. |
| 4.5 Reklamı aç **veya** abonelik/premium | Gelir | M–L | Ürün kararı. Reklam için: UMP mesajları, canlı gizlilik sayfası, `PUBLICATION_READY`. Abonelik için: Play Billing + sunucu doğrulaması (F13). |
| 4.6 Ana ekran widget'ı | Günlük hedef ve “devam et” tek dokunuş | S–M | Glance; mevcut LearningStore okuması. |

### Faz 5 — Araştırma / ayrı karar

- **AI destekli açıklama veya konuşma pratiği**: kelime/cümle için “neden bu anlam” açıklaması. Maliyet, gizlilik, içerik doğruluğu ve çevrimdışı davranış ayrı tasarım ister.
- **Topluluk hikâyeleri / yazar takibi (F12)**: moderasyon ve telif çözülmeden plan değildir.
- **iOS (F14)**: ayrı SwiftUI uygulaması ve ortak API sözleşmesi.

## 4. Önerilen ilk üç PR

1. **Yayın hijyeni** — 0.2 + 0.3 + Gradle 9 uyarısı. Uygulandı: AGP 8.10.1 → 8.13.0 Gradle 9 uyarılarını kaldırdı.
2. **Katalog doğruluğu** — 1.3 (D13): yayın tarihi alanı, “Yeni hikâyeler” rafı, testler.
3. **Kelime yoğunluğu pilotu** — 2.1 + 2.2'nin ilk adımı: 5 A1 hikâyesinde kelime/ifade sayısını artır, oyun havuzu ve tekrar sonuçlarını doğrula, sonra 50 hikâyeye yay.

## 5. Senin kararın gereken konular

| Karar | Seçenekler | Etkilediği işler |
|---|---|---|
| Ölçüm / çökme raporlama | Crashlytics · Sentry · yalnız Play vitals | 1.1, 1.2, gizlilik beyanı |
| Gelir modeli | Seyrek reklam (hazır) · premium/abonelik · şimdilik ücretsiz | 4.5 |
| Kayıtlı ses | İnsan seslendirme · yüksek kaliteli TTS üretimi · cihaz TTS'i ile devam | 3.3 |
| İçerik hızı | Haftalık · iki haftalık · aylık | 3.2 |
| İkinci arayüz dili | Yok · İngilizce · diğer | 4.3 |

## 6. Sınırlar

Kullanıcı sayıları 15 Ekim'deki Play Console ekranlarından okundu. Kod sayımları `grep` ile yapılan statik taramalardır; erişilebilirlik ve tablet bulguları cihazda yeniden doğrulanmalıdır. Hiçbir madde için kullanıcı kazanımı veya süre vaadi verilmez; etki 1.2'deki ölçüm kurulduktan sonra değerlendirilir.
