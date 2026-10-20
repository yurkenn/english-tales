# On dilde sözlük — bağımsız örneklem incelemesi

> **Devamı tamamlandı:** Kalan 977 kelimenin on dildeki incelemesi, bütün kararlar ve toplam 92 karşılık değişikliği [tam inceleme kaydında](GLOSSARY_FULL_REVIEW_2026-10-20.md). Aşağıdaki 121 kelimelik örneklem kendi tarihsel kapsamıyla korunur.

20 Ekim 2026 · Kaynak `01defbe` · **37 adayın kararı kaydedildi: 5 kabul, 16 ret, 16 erteleme; bütün sözlük ve dil onayı açık.**

Kullanıcının görev paylaşımı isteğiyle Claude CLI’ye bağımsız ikinci inceleme verildi. Codex bu sırada ilk kullanım testini araştırdı. Claude `claude-opus-5-5` ile çalıştı; araç, MCP, dosya yazma ve oturum kaydı kapalıydı. Yalnız depodaki sözlük karşılıkları ve kaynak örnekler paylaşıldı; hesap veya servis bilgisi paylaşılmadı.

## Kapsam

1.098 Türkçe referans maddesinden 121 farklı lemma seçildi. Önce çok anlamlı/riskli sabit terimler, sonra kalanlardan `Random(20261020)` ile örneklem alındı. Aynı 121 lemma, on hedef dilde incelendi: toplam 1.210 karşılık. Riskli terimler özellikle seçildiği için sonuç rastgele hata oranı veya bütün sözlüğün doğruluk tahmini olarak kullanılamaz. Bu ilk örneklem sırasında her dilde kalan 977 madde henüz incelenmemişti; devamı yukarıdaki tam inceleme kaydında tamamlandı.

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

Kalan 35 aday, paket katalogdaki bütün birebir lemma ve Türkçe çekim tablosu eşleşmeleriyle karşılaştırıldı. Yalnız ilk örnek cümleye dayanılmadı: `find/found` 37, `remained` 5, `cold` 11 ve `warm` 10 cümlede geçiyor. Bu yöntem anlamsal arama veya çekim tablosunda olmayan biçimlerin tamamını kapsadığını iddia etmez. Kaynak katalog ve Türkçe ana sözlük SHA-256 özetleri, eşleşen cümle kimlikleri ve her aday için ayrı gerekçe yapılandırılmış `codexDisposition` kaydındadır.

Bu tur **3 düzeltme** uygulandı:

- Arapça `endangering`: `معرّض للخطر` → `يُعرِّض للخطر`. Elisa kardeşlerini tehlikeye atan kişidir; açık aktif fiil, eski ortaçtaki aktif/pasif okuma belirsizliğini giderir.
- Vietnamca `remained`: `đã ở lại` → `vẫn còn; vẫn là; ở lại`. Hatıra olarak kalmak, donmuş/hareketsiz kalmak ve geride kalanı kapsayan anlamlar eklendi; sarayda fiziksel kalma anlamı korundu.
- Tayca `cold`: `เย็น` → `หนาว; เย็น`. Birden fazla hikâyedeki kişinin üşümesi anlamı eklendi; düşük sıcaklık karşılığı korundu.

Önceki iki düzeltme (Portekizce `amounts`: `quantidades`; Rusça `wardrobe`: `гардероб`) korunur. Böylece 37 adayın **5'i kabul edildi, 16'sının önerilen otomatik değişikliği reddedildi, 16'sı belirli bir kaynak/dil kararı için ertelendi**. Kararsız/kayıtsız aday yoktur; ertelenen 16 madde açık iş olmaya devam eder. Ret, ilgili lemmanın ana dil konuşurunca doğrulandığı anlamına gelmez; yalnız önerilen değişikliğin mevcut kanıta göre gerekli veya güvenli olmadığını belirtir.

`sampleApprovedBy` ve `reviewStatus: machine-draft` değişmedi. Bu AI destekli inceleme insan/ana dil onayı veya mağaza yayını değildir. İlk inceleme girdileri ve hash'leri geçmiş kaydı olarak korundu; yeni kaynak hash'leri ayrı alandadır.

### Aday bazında sonuçlar

| Dil | Lemma | Karar | Gerekçe / açık karar |
|---|---|---|---|
| id | `confusion` | Ret | Zihinsel karışıklık da kaynak cümlenin geçerli okumasıdır; fiziksel kargaşa zorunlu değildir. |
| vi | `confusion` | Ret | Zihinsel karışıklık da kaynak cümlenin geçerli okumasıdır; fiziksel kargaşa zorunlu değildir. |
| hi | `confusion` | Ret | Zihinsel karışıklık da kaynak cümlenin geçerli okumasıdır; fiziksel kargaşa zorunlu değildir. |
| ur | `confusion` | Ret | Zihinsel karışıklık da kaynak cümlenin geçerli okumasıdır; fiziksel kargaşa zorunlu değildir. |
| ru | `confusion` | Ret | Zihinsel karışıklık da kaynak cümlenin geçerli okumasıdır; fiziksel kargaşa zorunlu değildir. |
| bn | `confusion` | Ret | Zihinsel karışıklık da kaynak cümlenin geçerli okumasıdır; fiziksel kargaşa zorunlu değildir. |
| th | `confusion` | Ret | Zihinsel karışıklık da kaynak cümlenin geçerli okumasıdır; fiziksel kargaşa zorunlu değildir. |
| ar | `endangering` | Kabul | Aktif fiil kardeşlerini tehlikeye atmak anlamını açıkça verir. |
| hi | `find` | Erteleme | Aramak / bulmak ayrımı birleşik fiil ve sonuç bildiren kullanımda hedef dilce doğrulanmalı. |
| ur | `find` | Erteleme | Aramak / bulmak ayrımı birleşik fiil ve sonuç bildiren kullanımda hedef dilce doğrulanmalı. |
| hi | `have` | Ret | Mevcut fiilin sahip olma anlamı da vardır; yardımcı/ettirgen kullanımları tek sözlük anlamıyla çevrilemez. |
| ur | `have` | Ret | Mevcut fiilin sahip olma anlamı da vardır; yardımcı/ettirgen kullanımları tek sözlük anlamıyla çevrilemez. |
| ur | `short` | Ret | Rekhta mevcut مختصر için fiziksel kısa anlamını da verir; yalnız kısa metin iddiası doğrulanmadı. |
| vi | `remained` | Kabul | Devam eden durum ve geride kalan anlamı eklendi; fiziksel kalma korundu. |
| es-419 | `wardrobe` | Erteleme | Kıyafet koleksiyonu / mobilya anlamı Türkçe ana referansla birlikte kararlaştırılmalı. |
| id | `wardrobe` | Erteleme | Kıyafet koleksiyonu / mobilya anlamı Türkçe ana referansla birlikte kararlaştırılmalı. |
| ar | `wardrobe` | Erteleme | Kıyafet koleksiyonu / mobilya anlamı Türkçe ana referansla birlikte kararlaştırılmalı. |
| vi | `wardrobe` | Erteleme | Kıyafet koleksiyonu / mobilya anlamı Türkçe ana referansla birlikte kararlaştırılmalı. |
| hi | `wardrobe` | Erteleme | Kıyafet koleksiyonu / mobilya anlamı Türkçe ana referansla birlikte kararlaştırılmalı. |
| ru | `wardrobe` | Kabul | Önceki düzeltme korundu: гардероб kıyafet koleksiyonu ve dolap anlamlarını kapsar. |
| bn | `wardrobe` | Erteleme | Kıyafet koleksiyonu / mobilya anlamı Türkçe ana referansla birlikte kararlaştırılmalı. |
| ur | `wardrobe` | Erteleme | Kıyafet koleksiyonu / mobilya anlamı Türkçe ana referansla birlikte kararlaştırılmalı. |
| th | `wardrobe` | Erteleme | Kıyafet koleksiyonu / mobilya anlamı Türkçe ana referansla birlikte kararlaştırılmalı. |
| th | `blow` | Erteleme | Ana çekim tablosu blew rüzgâr fiilini de blow maddesine bağlar; isim/fiil kapsamı birlikte kararlaştırılmalı. |
| th | `cold` | Kabul | Kişinin üşümesi eklendi; düşük sıcaklık anlamı korundu. |
| th | `described` | Erteleme | Anlatmak/açıklamak örtüşmesi için Tayca kullanım incelemesi gerekli; yakın anlamlı otomatik değiştirilmedi. |
| bn | `convinced` | Ret | Mevcut ikna/emin karşılıkları geçerlidir; tek cümle için eş anlamlı değişimi yapılmadı. |
| hi | `convinced` | Ret | Mevcut ikna/emin karşılıkları geçerlidir; tek cümle için eş anlamlı değişimi yapılmadı. |
| pt-BR | `amounts` | Kabul | Önceki düzeltme korundu: yiyecek/içecek miktarı. |
| es-419 | `fine` | Ret | Mevcut fino sıfatı kalite/incelik anlamını kapsar; sırf bien sözcük türü nedeniyle çift değiştirilmedi. |
| ar | `god` | Erteleme | Genel lemma ile özel God adı ve Arapça dini kullanım politikası birlikte ele alınmalı. |
| es-419 | `warm` | Ret | Önerilen yiyecek odaklı değişim, diğer hikâyelerdeki duygusal/iklimsel sıcaklık anlamını daraltır. |
| th | `warm` | Ret | Önerilen yiyecek odaklı değişim, diğer hikâyelerdeki duygusal/iklimsel sıcaklık anlamını daraltır. |
| ur | `wicked` | Erteleme | Mevcut kötü/ahlaksız karşılığının masal bağlamındaki çağrışımı Urduca incelemesi gerektirir. |
| hi | `purr` | Erteleme | Mevcut ve önerilen hayvan sesi ifadeleri düşük güvenli; mırlama/hırlama/sızlanma ayrımı doğrulanmalı. |
| th | `purr` | Erteleme | Mevcut ve önerilen hayvan sesi ifadeleri düşük güvenli; mırlama/hırlama/sızlanma ayrımı doğrulanmalı. |
| vi | `surrounded` | Ret | Mahsur kalma bağlamında mevcut olumsuz çatı geçerlidir; nötr/olumlu çatı zorunlu değil. |

### Sözlük kanıtları

Bunlar hedef dilde insan onayı değildir. Bazı kararlar dilbilgisi ve katalog karşılaştırmasından çıkarımdır; özellikle Arapça aktif fiil seçimi kaynak İngilizcedeki etken rolün yorumudur.

- [Cambridge remain — Vietnamca](https://dictionary.cambridge.org/dictionary/english-vietnamese/remain): kalan, fiziksel kalma ve devam etme anlamları.
- [Cambridge cold — Tayca](https://dictionary.cambridge.org/us/dictionary/english-thai/cold): sıcaklık ile kişinin üşümesi ayrımı.
- [Rekhta مختصر](https://www.rekhtadictionary.com/meaning-of-mukhtasar?lang=ur): fiziksel kısa anlamı da mevcut.
- [Rekhta rakhnaa](https://www.rekhtadictionary.com/meaning-of-rakhnaa?lang=ur): keep/place yanında possess/own/have anlamları.
- [Rekhta Dhuu.nDnaa](https://www.rekhtadictionary.com/meaning-of-dhuundnaa?lang=hi): arama/iz sürme anlamları; sonuç bildiren birleşik kullanım için tek başına yeterli değil.
- [Cambridge fine](https://dictionary.cambridge.org/es/diccionario/english/fine): kalite ve incelik sıfatları yanında zarf kullanımı da mevcut.
- [Cambridge describe — Tayca](https://dictionary.cambridge.org/dictionary/english-thai/describe): adayın anlamını destekler; mevcut yakın anlamlının tüm bağlamlarda yanlış olduğunu tek başına kanıtlamaz.
- [Cambridge endanger](https://dictionary.cambridge.org/dictionary/english/endanger): başkasını tehlikeye atma etken rolü.

## Doğrulama

`glossary:build` ve `glossary:check` 11 dilde başarılı; mevcut altı sözlük testi 6/6, tam backend testleri 172/172 geçti. Tam testin ilk denemesinde mevcut PGlite bağımlılığı bu worktree’de kurulu değildi; değişmeyen lockfile ile `npm ci` sonrası tekrarın tamamı geçti. `git diff --check` temiz.

İlk bulgular/metadata korunumu, 37 adayın birebir karar eşlemesi ve yalnız üç kaynak karşılığının değiştiği ayrıca doğrulandı. Bu tur paket farkı yalnız Arapça, Vietnamca ve Taycada birer karşılıktır. Yeni bağımlılık sürümü veya sunucu yayını yok. Yeni sözlük değerleriyle Android cihaz/çevrimdışı kaydetme kabulü bu alt görevde çalıştırılmadı.

## Kalan iş

1. Ertelenen 16 aday için `nextAction` alanındaki somut kaynak/dil kararlarını tamamla. Özellikle `wardrobe` ve `blow` ana referans/çok anlam kapsamı, `find` sonuç bildiren kullanım, `purr` hayvan sesi ayrımı açık.
2. **AI inceleme kapsamı tamamlandı:** Her dilin kalan 977 maddesi beş grupta incelendi; [tam kayıt](GLOSSARY_FULL_REVIEW_2026-10-20.md). Değişen girdiler için yeniden inceleme ve ana dil kabulü ayrı kalır.
3. Android çevrimdışı anlam/kaydetme kontrolünü yeni paket üzerinde ayrıca çalıştır.
4. Ana dil örneklemini ve mağaza paketinin kapsamını ayrı kaydet. Bu rapor sözlüğün tamamının hazır olduğu anlamına gelmez.

[İnceleme paketi](release-evidence/2026-10-20-glossary-review-packet.json) · [Claude aday bulguları, kaynak özetleri ve 37 Codex kararı](release-evidence/2026-10-20-glossary-claude-review.json).
