# Hikâye geliştirme pilotu — 19 Ekim 2026

Durum: **7 yerel taslak; yayın yapılmadı.** Kapsam: 5 mevcut A1/A2 hikâyesinde yeni revizyon taslağı + 2 dünyaca bilinen kamu malı hikâyenin yeni seviyeli uyarlaması. Kullanıcı tercihi: mevcutları geliştir ve yeni hikâyeleri klasiklerden seç.

[İngilizce/Türkçe okuma önizlemesi](STORY_PILOT_READING_2026-10-19.md)

## Hazırlanan paket

| Hikâye | Seviye hedefi | Eski → yeni sözcük | Çalışma kelimesi | Soru |
|---|---|---|---|---|
| [The Three Little Pigs](../backend/content/drafts/stories/classic-three-little-pigs.json) | A1 | yeni → 294 | 10 | 4 |
| [Goldilocks and the Three Bears](../backend/content/drafts/stories/classic-goldilocks-three-bears.json) | A2 | yeni → 351 | 10 | 5 |
| [A Quiet Morning](../backend/content/drafts/revisions/quiet-morning.json) | A1 | 76 → 164 | 10 | 3 |
| [The Paper Boat](../backend/content/drafts/revisions/paper-boat.json) | A2 | 80 → 218 | 10 | 4 |
| [The Last Train](../backend/content/drafts/revisions/last-train.json) | A2 | 172 → 253 | 10 | 4 |
| [The Tortoise and the Hare](../backend/content/drafts/revisions/classic-tortoise-hare.json) | A1 | 108 → 192 | 10 | 3 |
| [The Lion and the Mouse](../backend/content/drafts/revisions/classic-lion-mouse.json) | A1 | 108 → 176 | 10 | 3 |

## Yapılan editoryal değişiklikler

- **A Quiet Morning:** beklenen kişi, doğum günü diyaloğu ve karşılaşmanın sonu somutlaştırıldı.
- **The Paper Boat:** kızın tekneye nereden eriştiği açıklandı; arkadaşlık daveti ve teknenin sudan geri alınması eklendi.
- **The Last Train:** biletin bırakıldığı yer, üstündeki taş ve son treni kaçırmanın sonucu açıklandı.
- **The Tortoise and the Hare:** başlangıç/bitiş yeri ile tavşanın yanlış güven duygusu görünür hale getirildi.
- **The Lion and the Mouse:** korku, sesin tanınması ve iyiliğin karşılığının olaylarla anlatımı güçlendirildi.

Mevcut cümlelerin kimlikleri, metinleri ve çeviri haritaları korunur; yeni cümleler yeni kimliklerle taslak revizyona eklenir. Anlama sorularının kalıcı kimlikleri korunur; çıkarım sorusu neden/sonuç değerlendirecek şekilde iyileştirildi. Her hikâyeye 10 çalışma kelimesi önerildi. Mevcut kelime kimliklerine yeni anlam yazılmadı. Taslak listeleri okuyucuya bağlanmış sayılmaz.

## Yeni klasiklerin kaynakları

- **The Three Little Pigs:** Joseph Jacobs (1916’da öldü), *English Fairy Tales*, [Project Gutenberg #7439](https://www.gutenberg.org/ebooks/7439). İlk iki domuzcuğun da kurtulduğu, kurdun uzaklaştığı yumuşatılmış yeni son; kaynaktaki ölümler, sonraki oyunlar ve baca bölümü çıkarıldı.
- **Goldilocks and the Three Bears:** Flora Annie Steel (1929’da öldü), *English Fairy Tales* (1918 tarihli kaynak), [Project Gutenberg #17034](https://www.gutenberg.org/ebooks/17034). Eski metnin kaçış sonrası yaralanma/ceza ihtimalleri çıkarıldı.
- Gutenberg iki kaynağı da ABD’de kamu malı olarak listeliyor. Tanımlanan tarihî derleyici/yazarlar 70 yıldan uzun süre önce öldü; [Bakanlığın süre rehberi](https://telifhaklari.ktb.gov.tr/TR-332373/telif-hakki-kac-yil-sureyle-korunur.html) kontrol edildi. Bu kaynak kaydı dünya çapında tüm ülkeler için hukukî izin iddiası değildir.
- Yeni İngilizce uyarlama, Türkçe çeviri ve sorular bu paket için yazıldı; modern bir baskının çevirisi, görseli veya karakter tasarımı alınmadı. Bölüm metninin SHA-256 özeti ve hesaplama yöntemi her taslağın `rights` alanında.

## Yayına geçmeden kalan gerçek işler

1. İnsan editörün anlam, doğallık, hedef seviye, kelime listesi ve soru yanıtlarını incelemesi. `reviewedBy` şu an boş; onay taklit edilmedi.
2. Yeni eklenen cümleler ve iki yeni hikâye için diğer 10 destek dilinin çevirisi ve dil kontrolü. Eski çeviriler yeni İngilizce için kopyalanıp tamamlandı sayılmadı.
3. Yeni hikâyelerin kapak varlıkları/hak kayıtları, uygulama eşlemesi ve checksum doğrulaması. Şu an kapak yalnız hedef anahtardır.
4. Onaylı çalışma listelerini sürüm/eşitleme sözleşmesiyle uygulamaya bağlamak; yeni revizyonları stüdyoda doğrulamak. Sonra yayın kapsamı içinde publisher yayını ve anonim katalog/paket/çevrimdışı kabulü.

## Doğrulama ve sınırlar

- Odaklı 5 içerik testi geçti: taslak şeması, katalogdan ayrılık, eski cümle/kelime/soru kimliklerinin korunması, 8–15 çalışma kelimesi sınırı ve gerçek metinde eşleşme, soru kaynak cümleleri, kaynak hak metadatası, kesintisiz okuma bölümleri.
- Testler İngilizce/Türkçe anlam doğruluğunu veya CEFR seviyesini ispatlamaz; bunlar editör/pilot kabulüdür.
- `catalog/v1.json`, aktif kaynak listesi, canlı veriler, mevcut 10 dil dosyası ve uygulama paketi değiştirilmedi. 50 sürümünün üretim incelemesi bu içerik paketinden bağımsız sürüyor.
- Backend testlerinin tamamı geçti: **157 test, 0 hata, 0 atlama**. Yeni uygulama paketi üretilmedi; runtime kaynağı değişmedi.
