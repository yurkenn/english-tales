# Sözlüğün tamamı — AI incelemesi ve düzeltmeler

> **Devam turu:** Aşağıdaki ilk turda ertelenen 73 kayıt artık 72 düzeltme/ekleme ve 1 koruma kararıyla tamamlandı. 225 ek karşılık güncellendi; [son inceleme ve sınırlar](GLOSSARY_DEFERRED_RESOLUTION_2026-10-20.md). Aşağıdaki 92 değişiklik ve 73 erteleme sayıları ilk turun tarihsel kaydıdır.

20 Ekim 2026 · **10 dilde 10.980 karşılık incelendi; 92 karşılık değişti. Ana dil onayı ve çözülmemiş kararlar açık.**

## Kapsam ve yöntem

İlk 121 kelimelik örneklemden sonra kalan 977 kelime beş gruba ayrıldı (196 + 196 + 196 + 196 + 193). Her grupta aynı on hedef dilin bütün karşılıkları Claude’a ayrı, araçsız ve MCP erişimsiz bir bağlamda verildi. Örtüşme yok: dil başına 1.098 benzersiz lemma, toplam 10.980 hedef karşılık. İlk örneklem girdisi ile kalan grupların `66a5453` kaynak girdisi ayrı saklandı.

Claude, Türkçe referansı, İngilizce örneği ve paket/önceki anonim canlı snapshot içinden kelime/çekim eşleşmesiyle çıkarılan lemma başına en fazla sekiz katalog cümlesini kullandı. Bu sınır anlamsal veya bütün çekim biçimlerini kapsayan bir bağlam araması değildir. Codex, işaretlenen adayları kaynak cümleler ve gerektiğinde sözlük kaynaklarıyla değerlendirdi. Geçerli eş anlamlar ve çok anlamlı kelimeler yalnız tek örneğe göre daraltılmadı. Bu, her özgün taslaktan farklı model ailesi kullanıldığı iddiası değildir; yeni bağlamdaki Claude incelemesi ve adaylar üzerindeki Codex değerlendirmesidir. İşaretlenmeyen her karşılık Codex tarafından ayrıca tek tek doğrulanmış sayılmaz.

## Kararlar ve değişiklikler

190 adayın **81’i kabul**, **36’sı ret**, **73’ü erteleme** aldı. Ret, modelin hata diye sunduğu geçerli bir kullanımın değiştirilmemesidir. Erteleme; anlam kapsamı, onaylı kaynak politikası veya kesin hedef dil ifadesi için somut sonraki adım gerektirir; bunlar sessizce onaylanmadı.

Kabul edilen adaylara ek olarak `tie`ın kravat anlamı on dilde ve `unlit`ın yakılmamış anlamı Türkçe kaynakta birlikte tamamlandı. `tie` Türkçe düzeltmesi adaylarla ortak olduğu için iki kez sayılmadı. Sonuç ana dala göre **90 hedef dil karşılığı + 2 Türkçe referans = 92 değişiklik**.

| Dil | Sözlük maddesi | Değişen karşılık |
|---|---|---|
| tr | 1.098 | 2 |
| es-419 | 1.098 | 7 |
| pt-BR | 1.098 | 6 |
| id | 1.098 | 10 |
| ar | 1.098 | 8 |
| vi | 1.098 | 14 |
| hi | 1.098 | 7 |
| ru | 1.098 | 13 |
| bn | 1.098 | 8 |
| ur | 1.098 | 6 |
| th | 1.098 | 11 |

Başlıca düzeltmeler:

- `curled`: yalnız vücudun kıvrılması yerine saç kıvırma anlamı da mevcut.
- `call`, `companion`, `heart`, `laces`: telefon, yolculuk, duygusal kalp veya yalnız ayakkabı bağıyla sınırlı anlamlar ilgili genel/anatomik/giyim anlamlarıyla genişletildi.
- `weakened`: sekiz dilde başkasını zayıflatma yanında kendisinin zayıflaması anlamı eklendi. Harekelenmemiş Arapçanın aktif/edilgen belirsizliği otomatik hata sayılmadı.
- `unlit cigar`: sekiz hedef dil ve Türkçe kaynakta ateşlenmemiş/yakılmamış anlamı eklendi; eski ışıksız anlamı korundu. Hintçe ve Urduca kesin ifade seçimi bekliyor.
- `tie`: ip bağlama fiili korunarak Türkçe ve on hedef dilde kravat ismi eklendi.
- Hintçe `Thumbelina` karşılığındaki yanlış yüzük açıklaması kaldırıldı; özel ad etiketi ve adın yazımı korundu.
- Vietnamca `sapphire` için farklı bir taş anlamı yerine yerel kullanımda belgelenmiş `đá sapphire` kullanıldı. `travel`, `poured`, `rose`, `service`, `simple` ve `spread` için eksik bağlam anlamları eklendi.

Türkçedeki iki kaynak genişletmesinde `checkedBy` gerçekten yapılan Claude/Codex değerlendirmesine güncellendi; önceki karşılık ve kontrol kaydı `correctionReview` içinde korundu. **`reviewed`, `disputed` ve `sampleApprovedBy` değerleri değiştirilmedi; yeni insan onayı eklenmedi.** Mevcut çalışma kelimesi önceliği korunur; 92 değişikliğin hiçbir lemması paket içindeki tek sözcüklü çalışma kelimeleriyle çakışmıyor. Canlı indirilen revizyonların tümü bu statik karşılaştırmayla denetlenmiş sayılmaz. Diğer on dil `machine-draft` durumunu korur; politika metni artık tamamlanan AI incelemesini ve kalan sınırları doğru anlatır.

## Kanıt ve doğrulama

[Özet, 92 kesin fark ve kaynak özetleri](release-evidence/2026-10-20-glossary-full/summary.json). Aynı klasörde beş tam girdi, modelin ham yanıtları, normalize edilmiş incelemeler ve her adayın gerekçeli kararı bulunur. Türkçe kaynakla birebir eşleşen `tr-reference`/`all` bulguları `tr` kaynak etiketiyle normalize edildi; özgün etiket ve ham yanıt korundu. Girdi SHA-256, lemma kapsamı, dil başına sayı, adayın mevcut değeri ve tek karar eşleşmesi doğrulandı.

Paket sözlükleri mevcut `glossary:build` ile yeniden üretilir; 11 dilin çıktısı `glossary:check` ile kaynakla eşleşmelidir. Mevcut altı sözlük testi ve tam backend paketi çalıştırılır; kesin test/CI sonuçları [özet kaydındaki](release-evidence/2026-10-20-glossary-full/summary.json) validation alanında tutulur. Önceki #152 CI sonucu yeni 92 değişikliğin cihaz sonucu yerine kullanılmaz.

## Kalanlar

73 ertelenen adayın ayrıntısı karar dosyalarında; Hintçe/Urduca `unlit`, hayvan sesi `purr`, referans anlam kapsamı ve bazı düşük güvenli doğal ifade kararları bunlara dahildir. Ana dil konuşuru kabulü ve yeni mağaza paketinin gerçek cihaz yolculuğu tamamlanmadı. Çalışma kelimeleri, hikâye metinleri, sunucu içeriği, canlı yayın ve mağaza sürümü değiştirilmedi. İnsan/CEFR doğruluk sertifikası veya ölçülmüş hata oranı iddiası yok.
