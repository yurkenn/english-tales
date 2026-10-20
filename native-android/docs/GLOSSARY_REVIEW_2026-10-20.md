# On dilde sözlük — bağımsız örneklem incelemesi

20 Ekim 2026 · Kaynak `01defbe` · **Örneklem incelemesi tamamlandı; bütün sözlük ve dil onayı açık.**

Kullanıcının görev paylaşımı isteğiyle Claude CLI’ye bağımsız ikinci inceleme verildi. Codex bu sırada ilk kullanım testini araştırdı. Claude `claude-opus-5-5` ile çalıştı; araç, MCP, dosya yazma ve oturum kaydı kapalıydı. Yalnız depodaki sözlük karşılıkları ve kaynak örnekler paylaşıldı; hesap veya servis bilgisi paylaşılmadı.

## Kapsam

1.098 Türkçe referans maddesinden 121 farklı lemma seçildi. Önce çok anlamlı/riskli sabit terimler, sonra kalanlardan `Random(20261020)` ile örneklem alındı. Aynı 121 lemma, on hedef dilde incelendi: toplam 1.210 karşılık. Riskli terimler özellikle seçildiği için sonuç rastgele hata oranı veya bütün sözlüğün doğruluk tahmini olarak kullanılamaz. Her dilde kalan **977 madde incelenmedi**.

| Dil | İncelenen karşılık | Aday bulgu |
|---|---|---|
| es-419 | 121 | 3 |
| pt-BR | 121 | 1 |
| id | 121 | 2 |
| ar | 121 | 3 |
| vi | 121 | 4 |
| hi | 121 | 6 |
| ru | 121 | 2 |
| bn | 121 | 3 |
| ur | 121 | 6 |
| th | 121 | 7 |

Claude 37 aday bildirdi: 1 yüksek, 22 orta, 14 düşük önem. Bunlar otomatik doğrulanmış hata değildir; yanıttaki `confirmed` etiketi modelin değerlendirmesidir. Her kayıtta mevcut/önerilen karşılık, ikisinin İngilizce geri çevirisi, gerekçe ve güven bulunur. Bağımsız ana dil konuşuru incelemesi yapılmadı.

## Codex karşılaştırması ve karar

- **Öncelikli dil doğrulaması:** Arapça `endangering` için `معرّض للخطر` yazımının aktif/pasif belirsizliği; Hintçe/Urduca `find` karşılığının aramak/bulmak ayrımı; Urduca `short` karşılığının saç uzunluğu bağlamı; Vietnamca `remained` karşılığının fiziksel kalmak/devam etmek ayrımı.
- **Kaynak anlamı birlikte incelenmeli:** `wardrobe` örneği kıyafet koleksiyonu hakkında, Türkçe referans `gardırop`. Modelin dokuz dilde bildirdiği mobilya/kıyafet farkı yalnız çeviri dosyaları düzeltilerek kapatılmaz. Türkçe referans, aynı lemmanın diğer hikâyelerdeki kullanımı ve çok anlam politikası birlikte gözden geçirilmeli. Mevcut genel sözlük lemma başına tek anlam alanı kullanıyor.
- **Dar bağlamdan otomatik düzeltme yapılmadı:** `confusion` için zihinsel karışıklık da geçerli bir anlam; tek mutfak örneği bütün lemma kullanımlarını kanıtlamaz. `fine` için `bien`/`fino`, bütün kullanımlar görülmeden sırf sözcük türü gerekçesiyle kaldırılmaz. Düşük güvenli `purr` önerileri kaynak yerine geçirilmedi.
- **Küçük netleştirme adayı:** Portekizce `amounts` için gıda/içecek bağlamında `quantidades`; Rusça `wardrobe` için iki anlamı kapsayan `гардероб`. Bunlar da bu tur üretim varlığına otomatik uygulanmadı.

Bu iş inceleme raporu üretir; sözlük karşılıklarını, `sampleApprovedBy`, `reviewStatus` veya uygulama varlıklarını değiştirmez. Model önerileri insan onayı, ana dil kabulü veya mağaza yayın izni olarak kaydedilmedi.

## Kalan iş

1. Öncelikli anlam bulgularını bütün hikâye kullanımlarıyla karşılaştır; kabul/ret gerekçesi ve dil doğrulaması kaydet.
2. Her dilin kalan 977 maddesini izlenebilir gruplarla ikinci incelemeden geçir; kaynak dosya özeti değişirse ilgili grup yeniden incelenir.
3. Kabul edilen düzeltmelerden sonra `glossary:build`, `glossary:check` ve backend testleri; Android çevrimdışı anlam/kaydetme kontrolü.
4. Ana dil örneklemini ve mağaza paketinin kapsamını ayrı kaydet. Bu rapor sözlüğün tamamının hazır olduğu anlamına gelmez.

[İnceleme paketi](release-evidence/2026-10-20-glossary-review-packet.json) · [Claude aday bulguları, kaynak özetleri ve kapsam](release-evidence/2026-10-20-glossary-claude-review.json).
