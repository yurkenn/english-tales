# İçerik, öğrenme ve dil genişlemesi planı

16 Ekim 2026 · Kaynak: master `5682f1c`, paket kataloğu, [#33 içerik denetimi](https://github.com/yurkenn/english-tales/pull/33) · Kapsam: [kalite yol haritası](QUALITY_ROADMAP.md) Q4 ve Q5'in ayrıntılandırılması ve yeni bir **dil genişlemesi (L)** hattı. Bu bir plandır; hiçbir madde uygulanmadı.

Uygulamanın kalitesini belirleyen döngü şudur: **okur seviyesine uygun bir hikâye bulur → takıldığı her kelimeye dokunur → kelimeyi kaydeder → doğru zamanda tekrar eder → bir sonraki hikâyeyi biraz daha kolay okur.** Bugün bu döngünün her halkasında ölçülebilir bir boşluk var. Plan, halkaları sırayla güçlendirir.

## 1. Bugünkü durum: rakamlar

Sayımlar paket kataloğundan (`app/src/main/assets/catalog/v1.json`, 15 Ekim) alındı. Token = `[a-z]+`.

| Seviye | Hikâye | Hikâye başına sözcük (medyan, aralık) | Ort. cümle uzunluğu | Benzersiz sözcük | Sözlükte (benzersiz) | Metindeki geçişlerin sözlükte olanı |
|---|---|---|---|---|---|---|
| A1 | 18 | 93 (76–139) | 7,1 | 532 | 162 (%30) | %21 |
| A2 | 18 | 236 (80–339) | 11,2 | 979 | 165 (%17) | %12 |
| B1 | 14 | 362 (89–427) | 12,7 | 1.212 | 180 (%15) | %9 |

- **Toplam içerik 10.768 sözcük.** Bu, kısa bir graded reader kitabının birkaç bölümü kadardır. A1 hikâyelerinin medyanı 93 sözcük; yaklaşık bir dakikalık okuma.
- **En sık 300 sözcük metnin %70'ini kapsar.** Kalan %30'luk kısım 1.571 farklı sözcükten oluşur; bunların 799'u yalnız bir kez geçer. Okurun takıldığı kelimeler bu uzun kuyruktadır ve çoğu dokunulamaz durumdadır.
- **Tür dengesi:** Macera 33 · Günlük yaşam 11 · Gizem 6.
- **Kaynak dengesi:** 44 klasik uyarlama (Aesop 16, Grimm 16, Andersen 8, …) ve 6 özgün hikâye.
- **Canlı ve paket farkı ([#33](https://github.com/yurkenn/english-tales/pull/33)):** Canlıda 43 sözlük öğesi eksik ve 39 hikâye etkileniyor. Seçilebilir token kapsaması A1 için paket %32 / canlı %24, A2 için paket %17 / canlı %15.
- **Öğrenme:**
  - Tekrar aralıkları sabit: 1/3/7/14/30 gün (`LearningPolicy.review`). Yanlış cevap sayacı sıfırlar; kelimenin zorluğu hesaba katılmaz.
  - Alıştırma modları: kart, çeviri seçme, eşleştirme, harf dizme ve hikâye cümlesinde boşluk doldurma.
  - Anlama sorusu ve dinleme alıştırması yok.
  - Seviye belirleme testi var (Q5.4).
- **Dil:** Destek dili Türkçeye sabit.
  - Veritabanında `story_sentences.turkish` sütunu, Android'de `StorySentence.turkish` alanı var.
  - Mağazada en-US, fr-FR, de-DE ve es-ES kayıtları var, ama uygulama yalnız Türkçe konuşan okura hizmet ediyor.

## 2. Temel tasarım kararı: iki ayrı sözlük katmanı

Bugün tek bir "sözlük" iki farklı işi birden yapıyor ve hedefleri birbirini engelliyor:

| Katman | Amaç | Boyut | Kalite ölçütü |
|---|---|---|---|
| **Dokunma sözlüğü** (glossary) | Metindeki *her* sözcüğe dokununca anlamını göstermek | Hikâyedeki tüm lemmalar (bugün ~1.900, büyüdükçe 3–5 bin) | Kapsama: dokunulabilen token oranı (hedef ≥ %98) |
| **Çalışma kelimeleri** (vocabulary) | Hikâye başına seviyeye uygun 8–15 kelimeyi öğretmek; alıştırma ve tekrar bunlardan beslenir | Hikâye başına seçilmiş liste | Seviyeye uygunluk, örnek cümle, telaffuz, editör onayı |

Q4.3'teki "%60 kapsama" hedefi bu ayrım yapılmadan konduğu için iki hata riski taşıyor. Ya çalışma listesi şişer (her "the" ve "went" alıştırmaya girer) ya da okur yine dokunamadığı kelimelerle karşılaşır.

**Öneri:**
- Kapsama hedefi **dokunma sözlüğüne** taşınsın ve ≥ %98 token olsun.
- Çalışma kelimeleri için ayrı bir ölçüt tanımlansın: her hikâyede 8–15 seviye kelimesi.
- Dokunma sözlüğünde lemma ve çekim tablosu bulunsun (`walked → walk`). Bugünkü eşleyici kök indirgemesi yapmıyor; bu tablo kuralı belirleyici tutar ve Android, panel ve denetim aracı aynı veriyi kullanır.

Bu ayrım **dil genişlemesinin de temelidir** (§5). Her yeni destek dili, iki katmanın çevirisinden ibaret olur. Ayrım şimdi yapılmazsa sözlük Türkçeye sabit büyür ve her yeni dil için yeniden yazılması gerekir.

## 3. Q4 — İçerik kalitesi (ayrıntılı)

Sıra bağımlılığa göredir. Efor tek geliştirici için ideal gündür (test dahil); içerik üretim süresi ayrıca verilmiştir.

| # | İş | Kabul ölçütü | Bağımlılık | Efor |
|---|---|---|---|---|
| Q4.0 | **Destek dilini parametre yap** (yalnız TR verisiyle). `story_sentences.turkish` → `sentence_translations(revision_id, sentence_id, lang, text)`. Kelime, açıklama ve tür etiketleri için de aynısı. Android modelinde `turkish` → `translation`. | Mevcut TR içerik veri kaybı olmadan taşınır. Android, panel, exporter ve denetim aracı `lang` alır. Eski uygulama sürümleri eski API ile çalışmaya devam eder. | — | 3–4 |
| Q4.1 | Paket → taslak revizyon üretimi + yayın doğrulama (#33 denetiminin üstüne) | `content:audit --require-parity` canlıda geçer | #33 | 2–3 |
| Q4.2 | Pilot revizyonları canlıya yayımla | 39 etkilenen hikâye eşit; denetim raporu ekte | Q4.1 + yayıncı onayı | 0,5 |
| Q4.3a | **Dokunma sözlüğü altyapısı:** `glossary(lemma, sense_id, lang, gloss)`, `glossary_forms(form → lemma)`, okuyucuda bağlanmamış her tokene dokununca bağlama uygun anlam | Okuyucuda dokunulamayan token ≤ %2. "Listeme ekle" kişisel kelime oluşturur. Çevrimdışı çalışır. | Q4.0 | 4–5 |
| Q4.3b | **Sözlük verisi üretimi:** önce makine taslağı, sonra editör onayı (§3.1) | 1.871 lemmanın tümünde TR karşılık. İki model çapraz kontrolü yapılmış; anlaşmazlıklar ve rastgele %10 örneklem uygulama sahibince incelenmiş. Örneklem hata oranı kaydedilmiş; %5'i aşarsa örneklem genişletilir. | Q4.3a + kaynak kararı | 2 geliştirme + 2–3 inceleme |
| Q4.3c | **Çalışma kelimesi seçimi:** her hikâyede seviyeye uygun 8–15 kelime | Hikâye başına liste. Seviye dışı kelime oranı raporlanır. | Q4.3b | 1 araç + 2 inceleme |
| Q4.4 | Okuma süresi ve sözcük sayısı alanı + süre filtresi | Kartlarda "~3 dk". Filtre çalışır. | — | 1–1,5 |
| Q4.5 | Tür yerine **etiket modeli** (masal, fabl, günlük yaşam, gizem, macera…), etiket adları dile göre | Sabit SQL listesi kalkar. Yeni etiket şema değişikliği gerektirmez. | Q4.0 | 1,5–2 |
| Q4.6 | **Seviye profili denetimi:** her hikâye için cümle uzunluğu, sıklık bandı dışı sözcük oranı ve yeni kelime yoğunluğu | `content:audit` raporunda seviye başına eşikler; aykırı hikâyeler listelenir | Q4.3a | 1,5 |
| Q4.7 | **İçerik hacmi:** A1/A2'ye bölümlü (3–5 bölüm) daha uzun hikâyeler. B1'i 20'ye çıkarma. B2 pilotu (5 hikâye). | Toplam ≥ 30.000 sözcük; A1 medyanı ≥ 250 sözcük (bölümlerle) | Q4.6 araçları + içerik hızı kararı | Hikâye başına 0,5–1 gün |
| Q4.8 | Cümle cümle seslendirme ve vurgulu takip | Okunan cümle vurgulanır. Cümleye basılı tutunca o cümleden okunur (kelime dokunma korunur). | — | 1,5–2 |

### 3.1 Sözlük verisi nereden gelecek (karar)

| Seçenek | Artı | Eksi | Değerlendirme |
|---|---|---|---|
| **Wiktionary türevi** (ör. kaikki.org/wiktextract çıktısı) | Geniş, çok dilli, çekim bilgisi var | Lisans CC BY-SA: atıf gerekir ve sözlük verisi aynı lisansla paylaşılmalıdır. Anlamlar bağlamdan bağımsız ve fazla teknik olabilir. | Çekim tablosu (`forms`) için güçlü kaynak. Anlam için tek başına zayıf. Lisans, uygulamaya koymadan önce doğrulanmalı. |
| **Bağlama göre makine taslağı + editör onayı** | Her geçiş için hikâyedeki anlam; öğrenciye uygun sade dil. Her yeni dil için aynı hat çalışır. | Hata riski; inceleme emeği gerekir; üretim maliyeti | **Önerilen anlam kaynağı.** Toplam metin küçük (~11 bin sözcük), maliyet düşük. Kalite editör örneklemesiyle ölçülür. |
| Çevrimiçi çeviri API'si (anlık) | Sıfır içerik emeği | Çevrimdışı çalışmaz; gizlilik ve maliyet; kalite kontrolü yok | Önerilmez. Okuyucunun çevrimdışı olma vaadiyle çelişir. |

**Karar (16 Ekim 2026):** Çekimler (`forms`) Wiktionary türevinden gelir; lisans, kullanmadan önce doğrulanır. Anlamlar, Claude/Codex oturumlarında bağlama göre üretilen taslaktan gelir ve depoda sürümlü dosya olarak tutulur. Ek API anahtarı kullanılmaz.

Taslağı bir model üretir, diğeri denetler. Uygulama sahibi anlaşmazlıkları ve rastgele %10 örneklemi inceler. Her öğede `source`, `checked_by` ve `reviewed` alanları tutulur. Yayın denetimi, çapraz kontrolden geçmemiş anlamı reddeder.

## 4. Q5 — Öğrenme kalitesi (ayrıntılı)

| # | İş | Kabul ölçütü | Bağımlılık | Efor |
|---|---|---|---|---|
| Q5.1 | Bağlamlı boşluk doldurma | ✅ Birleşti (#28) | — | — |
| Q5.4 | Seviye belirleme testi | ✅ Birleşti (#27) | — | — |
| Q5.2 | **Dinleyip seçme:** kelime veya kısa cümle seslendirilir, doğru anlam ya da yazılış seçilir | TTS yoksa mod gizlenir. Puan/oturum sözleşmesi korunur. | — | 1,5–2 |
| Q5.3 | **Anlama soruları:** hikâye başına 3–5 İngilizce çoktan seçmeli soru (ana fikir, ayrıntı, çıkarım). `story_questions` şeması, panel editörü, okuma sonucu ekranında gösterim. | 50 hikâyenin tamamında onaylı sorular. Hikâye başına doğru oranı ölçülür. | Q4.0 (soru metni İngilizce, açıklamalar dile göre) | 3–4 + soru üretimi 2 |
| Q5.5 | **Bilinen kelime modeli:** her lemma için durum (görüldü / dokunuldu / kaydedildi / tekrar ediliyor / biliniyor) | Kişisel "bilinen kelime" sayısı. Eşitleme sözleşmesine eklenir. | Q4.3a | 3 |
| Q5.6 | **Kişisel zorluk ve öneri:** her hikâye için "bu hikâyede ~N yeni kelime". Öneri, okurun bilinen kelime kapsaması yüksek olan hikâyeleri öne çıkarır. | Ana ekranda "sana uygun" rafı bu ölçüyle sıralanır | Q5.5 | 2 |
| Q5.7 | **Uyarlanabilir tekrar (FSRS):** sabit 1/3/7/14/30 yerine kelime başına zorluk ve hatırlama olasılığı | Android ve SQL `apply_word_event` birlikte değişir. Eski kayıtlar taşınır. Tekrar yükü simülasyonla karşılaştırılır. | — | 3–4 |
| Q5.8 | **Alıştırma basamakları:** kelime aşamasına göre mod sırası: tanıma (seçme) → hatırlama (harf) → bağlam (boşluk) → dinleme | Oturum, kelimenin aşamasına uygun modu seçer | Q5.2, Q5.7 | 2 |
| Q5.9 | **Cümle sıralama / dikte** (B1 için) | Hikâye cümlesinden. TTS yoksa dikte gizlenir. | Q5.2 | 2 |
| Q5.10 | **İlerleme ve geri bildirim:** okunan sözcük, bilinen kelime, haftalık özet. Bekleyen tekrar sayısını söyleyen hatırlatıcı. | Profil ve bildirim metinleri gerçek veriye dayanır | Q5.5 | 2 |

### 4.1 Neden "kişisel kapsama" önemli

Okuma araştırmalarındaki yaygın bulgu şudur: metindeki sözcüklerin yaklaşık %95–98'ini bilen okur, yardımsız okuduğunu anlayabilir. Bu eşik Hu ve Nation'ın (2000) çalışmasından gelir. Ancak o çalışma %98'i doğrudan ölçmedi; yeni replikasyonlar eşiğin kişiye ve okuma türüne göre değiştiğini gösteriyor. Bu yüzden eşik sabit bir kural olarak kullanılmamalı; ürün içinde ölçülerek ayarlanmalı.

Q5.3'teki anlama sorusu doğru oranı ile Q5.6'daki kişisel kapsama birlikte kaydedilirse, bu uygulamanın kendi okurları için doğru zorluk aralığı veriyle bulunur. Bu, rakip uygulamalarda nadir görülen bir farklılaştırıcıdır.

### 4.2 Ölçüm

Q2.2 olayları (isteğe bağlı, varsayılan kapalı) yalnız toplu ölçüm verir. Kalite kararları için gereken ek, içerik metni içermeyen olaylar:
- hikâye başına anlama doğru oranı,
- dokunulan / dokunulamayan token oranı,
- tekrar oturumu tamamlama oranı.

Bu olaylar mevcut gizlilik çerçevesine eklenmeden önce gizlilik metni ve veri güvenliği beyanı güncellenmelidir.

## 5. Dil genişlemesi (L hattı)

### 5.1 Bir dil eklemek tam olarak ne demek

Öğrenilen dil herkes için İngilizce olduğundan İngilizce metin, kapaklar, seviyeler, seslendirme ve alıştırma mantığı **bütün diller için ortaktır.** Her yeni dil yalnız "destek katmanı" ekler:

| Parça | Bugünkü hacim (TR) | Not |
|---|---|---|
| Arayüz metinleri | ~344 string (Q3.1 sonrası) | Q3.1 birleşince çeviri dosyası eklemek yeterli |
| Cümle çevirileri | 1.002 cümle (~8.000 sözcük) | Q4.0 şeması gerekir |
| Hikâye açıklamaları | 50 açıklama (~1.600 sözcük) | |
| Sözlük anlamları | Bugün 359; Q4.3 sonrası ~2.000 lemma | En kritik kalite parçası |
| Yerleştirme testi, bildirim, yardım/gizlilik sayfaları | Az | Gizlilik metni hukuki doğruluk ister |
| Mağaza kaydı ve ekran görüntüleri | 1 kayıt | Hızlı ve ucuz deney |

**Dil başına maliyet** (Q4.0 ve Q4.3 tamamlandıktan sonra):
- Makine taslağı birkaç saat sürer.
- Anadili konuşan bir editörün ~12 bin sözcüğü ve ~2 bin anlamı incelemesi 2–4 iş günü sürer.
- Mühendislik işi dil başına ≤ 1 gün olur.

Q4.0 yapılmadan her dil bir şema projesine dönüşür. Bu yüzden **Q4.0 dil genişlemesinin ön şartıdır.**

### 5.2 Hangi diller

İngilizce, Duolingo'nun 2025 raporunda 154 ülkede en çok öğrenilen dil ve dünyada ilk sırada. Seçim kriterleri: büyük İngilizce öğrenen nüfus, düşük/orta İngilizce seviyesi (A1–B1 içeriğe ihtiyaç), Android payı (uygulama yalnız Android) ve tek çeviriyle ulaşılan ülke sayısı.

| Aday dil | Ana pazarlar | EF EPI 2025 bandı | Android payı (StatCounter, Eylül 2026) | Değerlendirme |
|---|---|---|---|---|
| **İspanyolca (es-419)** | Meksika, Kolombiya ve Latin Amerika | Düşük (Meksika, Kolombiya) | Meksika %72 | Tek çeviri ~20 ülkeye ulaşır. Rekabet yüksek, ama "hikâyeyle İngilizce" nişi Duolingo'dan farklı. **1. aday** |
| **Portekizce (pt-BR)** | Brezilya | Düşük | %79 | Tek ülke ama çok büyük ve Android ağırlıklı. **2. aday** |
| **Endonezce (id)** | Endonezya | Düşük | %79 | Büyük nüfus, Android ağırlıklı, görece az yerel rakip. Kullanıcı başına gelir düşük. **3. aday** |
| Arapça (ar) | Mısır, Suudi Arabistan, Körfez | Düşük / çok düşük | Mısır %83 | Talep yüksek, ama sağdan sola düzen ve iki yönlü metin ek iş getirir (okuyucu İngilizce, çeviri Arapça). **4. aday**, ayrı tasarım işi |
| Vietnamca (vi) | Vietnam | Düşük–orta | %60 | Talep yüksek, iOS payı belirgin. **5. aday** |
| Japonca (ja) | Japonya | Düşük | %39 (iOS %61) | Gelir yüksek, ama uygulama yalnız Android. Şimdilik değil. |
| Almanca / Fransızca | Almanya, Fransa | Yüksek / orta | — | A1–B1 içerik ihtiyacı düşük. Mevcut DE/FR mağaza kayıtları yanıltıcı, kaldırılmalı veya İngilizce arayüze bağlanmalı. |

### 5.3 Önerilen yol

1. **L0 — Hazırlık (Q4.0 ile birlikte):**
   - İngilizce arayüz eklenir; destek dili seçimi Android'in uygulama başına dil özelliğiyle yapılır.
   - Mağazadaki FR/DE/ES kayıtları ya gerçek içerikle eşleştirilir ya da kaldırılır.
   - Bugün ayda ~14 mağaza ziyaretçisi var; dil eklemenin etkisi, o dilde aranabilir olmaya bağlıdır.
2. **L1 — Pilot dil (İspanyolca):**
   - Destek katmanının tamamı makine taslağı + anadili editör onayıyla hazırlanır.
   - es-419 mağaza kaydında 3–5 anahtar kelime denenir ("aprender inglés con cuentos" gibi).
   - Başarı ölçütü (4–6 hafta): mağaza sayfası dönüşümü, ilk hikâyeyi bitirme ve ertesi gün dönüş, TR kullanıcılarına göre en az aynı seviyede.
3. **L2 — Ölçeklendirme:** Pilot tutarsa pt-BR ve id eklenir. Ardından sağdan sola tasarım işiyle Arapça gelir.
4. **Kalite kuralı (karar):**
   - İspanyolca, iki model çapraz kontrolüyle hazırlanır: biri çevirir, diğeri denetler. Anlaşmazlıklar listelenir.
   - İnsan kontrolü olmadığı için Latin Amerika kullanımlarında hata riski vardır. Bu yüzden ilk sürümde uygulama içinde "çeviri hatası bildir" seçeneği bulunur.
   - Ölçeklendirmeden (L2) önce anadili bir kişiden en az örneklem kontrolü alınması önerilir.
   - `content:audit` her dil için tamlık raporu üretir.

## 6. Bütünleşik sıra

Tahminler ideal gündür; içerik ve inceleme emeği ayrı yazılmıştır.

| Dalga | İşler | Neden bu sırada | Efor |
|---|---|---|---|
| **1. Temel** | Q4.0 destek dili şeması · Q4.1/Q4.2 canlı eşitlik · Q4.4 okuma süresi | Diğer her şey bu veri modeline yazılacak; eşitlik olmadan iyileştirmeler kullanıcıya ulaşmaz | 7–9 |
| **2. Her kelimeye dokunma** | Q4.3a altyapı · Q4.3b sözlük verisi (TR) · Q4.3c çalışma kelimeleri | Ürünün ana vaadi; en büyük kalite sıçraması | 7–8 + 4–5 inceleme |
| **3. Öğrenme döngüsü** | Q5.2 dinleme · Q5.3 anlama · Q5.5 bilinen kelime · Q5.6 kişisel öneri | Okuma → anlama → öneri döngüsü kapanır | 10–12 + 2 soru üretimi |
| **4. Pilot dil** | L0 İngilizce arayüz · L1 İspanyolca | Dalga 1–2'den sonra dil ekleme ucuzdur | 3–4 + 3–4 editör |
| **5. Derinlik** | Q5.7 FSRS · Q5.8 basamaklar · Q4.5 etiketler · Q4.6 seviye denetimi · Q4.8 cümle sesi | Ölçüm verisi birikince ayar yapılır | 11–14 |
| **Sürekli** | Q4.7 içerik hacmi (≥ 30 bin sözcük, B2 pilotu) | Ritim kararına bağlı | Hikâye başına 0,5–1 gün |

## 7. Kararlar (16 Ekim 2026)

| Konu | Karar | Etkilediği işler |
|---|---|---|
| Sözlük anlam kaynağı | Çekimler Wiktionary türevinden (lisans doğrulanacak); anlamlar bağlama göre makine taslağından | Q4.3 |
| Taslak üretimi | Claude/Codex oturumlarında; çıktılar depoda sürümlü dosya; ek API anahtarı yok | Q4.3b, Q5.3, L1 |
| Türkçe kontrol | Örneklem: iki model çapraz kontrolü + uygulama sahibinin anlaşmazlıkları ve rastgele %10'u incelemesi; hata oranı %5'i aşarsa örneklem büyür | Q4.3b |
| İspanyolca kontrol | İki model çapraz kontrolü; uygulama içinde çeviri hatası bildirimi; L2 öncesi anadili örneklemi önerilir | L1 |
| İçerik hızı | İki haftada bir 1–2 hikâye veya bölüm | Q4.7 |
| Mağaza DE/FR/ES kayıtları | Şimdi kaldırılır (Play Console'da uygulama sahibi yapar); İspanyolca destekle es-419 kaydı açılır | L0 |
| İlk yeni dil | İspanyolca (es-419) | L1 |

## 8. Sınırlar

- İçerik sayımları paket kataloğundandır; canlı değerler #33 denetim raporundandır.
- Pazar verileri dış kaynaklardandır ve kaynaklar arasında küçük farklar var (EF EPI puanları kaynağa göre birkaç puan oynuyor). Burada yalnız band düzeyi kullanıldı.
- Efor tahminleri plan tahminidir. Hiçbir kullanıcı kazanımı vaat edilmez.
- Wiktionary verisinin lisansı, kaynağın kendi indirme sayfasından ayrıca doğrulanmalıdır.

**Kaynaklar:**
- EF EPI 2025: [EF](https://www.ef.com/wwes/epi/), [World Population Review özeti](https://worldpopulationreview.com/country-rankings/ef-english-proficiency-index-by-country)
- Duolingo 2025 dil raporu (ikincil kaynak): [duolingoguides.com](https://duolingoguides.com/duolingo-language-report/)
- Mobil işletim sistemi payları: StatCounter [Brezilya](https://gs.statcounter.com/os-market-share/mobile/brazil), [Endonezya](https://gs.statcounter.com/os-market-share/mobile/indonesia), [Meksika](https://gs.statcounter.com/os-market-share/mobile/mexico), [Vietnam](https://gs.statcounter.com/os-market-share/mobile/viet-nam), [Mısır](https://gs.statcounter.com/os-market-share/mobile/egypt), [Japonya](https://gs.statcounter.com/os-market-share/mobile/japan), [Türkiye](https://gs.statcounter.com/os-market-share/mobile/turkey)
- Okuma kapsaması: [Hu ve Nation 2000 replikasyonu üzerine](https://aila2021.dryfta.com/program/abstract-archive/abstract/public/416/unknown-vocabulary-density-reading-comprehension-and-the-98-coverage-figure-replicating-hu-nation-2000), [Durbahn vd. 2024](https://www.cambridge.org/core/product/DFCA6605076705D5762C98F286D16B27)
- Sözlük ve tekrar algoritması: [wiktextract](https://github.com/tatuylonen/wiktextract), [FSRS (py-fsrs, MIT)](https://pypi.org/project/fsrs)
