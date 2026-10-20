# Ertelenen 73 sözlük kararının tamamlanması

20 Ekim 2026 · **73/73 madde karara bağlandı: 72 düzeltme/ekleme, 1 koruma, 0 erteleme.** Bu sayılar 73 farklı dil değil, 40 lemma üzerindeki kelime–dil kayıtlarıdır.

## Sonuç ve kapsam

Önceki #152 turunda ertelenen kayıtlar Claude ile iki grupta yeniden incelendi. Kullanıcının bu kararları tamamlama talebi, Türkçe kaynak anlamını ve buna bağlı hedef karşılıkları birlikte genişletme kapsamını içerir. 11 dilde aynı lemma için gereken eklemeler de yapıldığından, `e293093` ana dalına göre **225 karşılık** değişti: 22 Türkçe kaynak, 203 hedef dil karşılığı. Önceki 92 değişiklikle birlikte `01defbe`ye göre toplam 317 farklı karşılık değişmiştir.

| Dil | Bu turda değişen karşılık |
|---|---|
| ar | 21 |
| bn | 24 |
| es-419 | 16 |
| hi | 25 |
| id | 20 |
| pt-BR | 12 |
| ru | 17 |
| th | 22 |
| tr | 22 |
| ur | 28 |
| vi | 18 |

Başlıca örnekler: `wardrobe` giysi dolabı yanında kişinin giysileri; `hide`, `soften`, `spills` için geçişli/geçişsiz anlamlar; `dreams`, `amazed`, `injured` için isim/sıfat/fiil kullanımları; Hintçe/Urduca `unlit` için ışıksız ve yakılmamış ayrımı. Hintçe `purr` mevcut sözlük karşılığıyla korundu. Urduca `wicked`ın geçerli eski anlamı silinmeden ek anlam eklendi.

## İnceleme zinciri

Claude `claude-opus-5-5`, araç/MCP erişimi ve kalıcı oturum olmadan, İngilizce bağlamlar ile mevcut 11 dil karşılığını değerlendirdi. Codex kararları ve tam değerleri kontrol etti; belirsiz noktalarda [sözlük kontrolleri](release-evidence/2026-10-20-glossary-deferred/dictionary-checks.json) kullandı. Bağımsız, yeni bağlamlı Claude oturumunda 40 × 11 = 440 nihai karşılık ve 73 karar tekrar incelendi. Bu denetimin 12 bulgusu işlendi; odaklı son turun Arapça `lay` önerisi de aynen uygulandı. Ham model çıktıları, girdiler, Codex değişiklikleri ve gerekçeler korundu. Önceki tarihsel ertelemeler silinmedi; [son karar dosyası](release-evidence/2026-10-20-glossary-deferred/final-resolution.json) bu 73 kayıt için onları günceller.

Bu AI destekli incelemedir. Yeni insan/ana dil onayı eklenmedi; `machine-draft`, `reviewed`, `disputed`, `sampleApprovedBy` alanları korundu. Türkçe kaynak genişletmelerinin önceki değeri ve gerçek AI kontrol yöntemi `correctionReview` içinde kayıtlıdır.

## Paket ve bağımlılık kontrolleri

Lemma kimlikleri, sıra, çekim tablosu ve çalışma kelimeleri korunur. 11 paket varlığı mevcut araçla yeniden üretildi; dil başına 1.098 madde ve birebir kaynak eşleşmesi kontrol edildi. Değişen lemmanın paket çalışma kelimeleriyle çakışması yok. Türkçe sözlükten türeyen editör önerilerinde yalnız dört çeviri güncellendi (`end`, `hide`, `blow`, `hide`); seçim/sıra aynı, dosya `proposal`, `reviewedBy: null`. İlk backend koşusu bu eski üretilmiş dosyayı yakaladı; araçla yenilendi.

Kesin son kaynak özetleri, test XML sayıları ve doğrulama sonuçları [özet kaydında](release-evidence/2026-10-20-glossary-deferred/summary.json). Cihaz testi Türkçe paket ayrıştırması, öğrenme kelimesi önceliği ve sözlük span yolunu doğrular; 11 dilin anlamsal doğruluğunu cihaz testi kanıtlamaz. İnsan/ana dil örneklemi, yeni mağaza paketi ve gerçek cihaz/canlı hesap kabulü ayrı işlerdir. Bu çalışma mağaza veya sunucu içeriği yayımlamaz.
