# Destek dili sözleşmesi — Q4.0

16 Ekim 2026. Android ve içerik araçları için tablo/alan adları bu sözleşmeyle sabittir. Öğrenilen dil İngilizce; `lang` cümle çevirisinin, kelime karşılığının ve hikâye açıklamasının destek dilidir. Tür etiketleri bu değişikliğin kapsamında değildir.

## Şema ve eski uygulamalar

`supabase/migrations/20261016090000_translation_tables.sql` mevcut geçişlerden sonra uygulanır. Eski kolonlar kaldırılmaz:

| Yeni tablo | Alanlar | Birincil anahtar | Bağlı kayıt |
|---|---|---|---|
| `public.sentence_translations` | `revision_id uuid`, `sentence_id text`, `lang text`, `text text` | `(revision_id, sentence_id, lang)` | `story_sentences(revision_id, id)` |
| `public.word_translations` | `revision_id uuid`, `word_id text`, `lang text`, `translation text` | `(revision_id, word_id, lang)` | `revision_words(revision_id, id)` |
| `public.revision_texts` | `revision_id uuid`, `lang text`, `description text` | `(revision_id, lang)` | `story_revisions(id)` |

Bütün alanlar `not null`; yabancı anahtarların tamamı `on delete cascade` kullanır. Metinlerde `btrim(alan) <> ''` zorunludur. Dil kodu tam olarak `lang ~ '^[a-z]{2}(-[0-9A-Z]{2,3})?$'` kontrolünden geçer: `tr`, `es`, `es-419`, `pt-BR` geçerli; `TR`, `en-us`, `zh-Hant` geçersizdir. Dil kodları otomatik dönüştürülmez.

Geçiş, mevcut **tüm revision'ların** dolu `story_sentences.turkish`, `revision_words.translation`, `story_revisions.description` alanlarını birebir `tr` satırlarına kopyalar. Etkin yayın, eski yayın ve taslak ayrımı yapılmaz; eski metinler ve `edit_version` değişmez. Mevcut şema boş taslaklara izin verdiği için boş/yalnız boşluk içeren eski alanlar yeni tablolarda satır üretmez. Bu seçim boş metin yasağını korur; eksik taslak sonradan tamamlanabilir ve eksikken yayımlanamaz.

**Türkçede kaynak eski kolondur.** Eski alanın eklenmesi veya düzenlenmesi aynı işlemde tetikleyiciyle `tr` satırını ekler/günceller. Eski alan boşaltılırsa ilgili `tr` satırı silinir. Türkçe metni değiştirmek için eski alan düzenlenir; yeni tablodan farklı bir `tr` değeri yazmak `turkish_translation_must_match_legacy` hatasıyla reddedilir. Böylece mevcut panel/RPC ve yayımlanmış eski uygulamaların alanları korunur. Doğrudan silinmiş bir `tr` satırı yayını engeller; eski alanın yeniden kaydedilmesi satırı onarır.

## Okuma ve erişim

Android şu PostgREST sorgularını kullanır; her sayfada mevcut düzene uygun `&limit={limit}&offset={offset}` eklenir:

```text
/rest/v1/sentence_translations?select=sentence_id,text&revision_id=eq.{rev}&lang=eq.{lang}&order=sentence_id.asc
/rest/v1/word_translations?select=word_id,translation&revision_id=eq.{rev}&lang=eq.{lang}&order=word_id.asc
/rest/v1/revision_texts?select=revision_id,description&revision_id=in.(...)&lang=eq.{lang}&order=revision_id.asc
```

RLS bütün yeni tablolarda açıktır. `anon` ve normal `authenticated` okuyucu yalnız `private.can_read_revision(revision_id)` tarafından izin verilen yayımlanmış, arşivlenmemiş revision'ları görür. Önceki yayımlanmış revision'lar da okunabilir; taslak/arşiv/olmayan dil boş sonuç döndürür. Bir dil bulunamadığında sunucu başka dilin metnini otomatik döndürmez. İstemci bir geri dönüş politikası istiyorsa bunu ayrıca uygular.

Anonim role yalnız `select` verilir. Gerçek personel kimliği taşıyan `authenticated` editör/yayıncı, mevcut yönetim yollarından taslak çevirileri düzenler. Normal kullanıcı yazamaz. Yayımlanmış çeviriler ebeveyn içerik gibi değişmezdir. Çeviri değişikliği ebeveyn revision'ı kilitler ve `edit_version` artırır; eski bir sürüm numarasıyla yayın/kayıt reddedilir. Ayrıcalıklı yardımcılar `security definer`, boş `search_path` ve açık execute iptali kullanır.

## Yönetim ve yayın

`admin_revision` eski alanlara ek olarak şunları döndürür:

- Revision belgesinde `descriptions: {lang: description}`.
- Her cümlede `translations: {lang: text}`.
- Her kelimede `translations: {lang: translation}`.

`admin_save_draft` aynı isteğe bağlı haritaları kabul eder. Harita gönderilirse o öğenin **Türkçe dışındaki** çevirilerinin yerini alır; `{}` bunları kaldırır. Harita gönderilmezse aynı kimlikteki mevcut çeviriler korunur. Silinen cümle/kelimenin çevirileri silinir. Haritalardaki `tr` yönetim kaydında kullanılmaz; eski alan kazanır ve yanıt güncel `tr` değerini döndürür. Bu seçim panelin eski `tr` haritasını taşıyarak eski kolonu düzenlemesine izin verir. Ek dil değerleri boş olamaz; satır kaldırmak için anahtar haritadan çıkarılır. Geçersiz harita, dil, bağlantı veya metin bütün kaydı geri alır.

`admin_create_draft` yayımlanmış kaynaktaki tüm dilleri kopyalar. Panelde **Destek dili** seçimi açıklama/çeviri/kelime alanını ve okuyucu önizlemesini değiştirir. **Dil ekle** kodu seçer; ilk dolu alan kaydedildiğinde dil revision'a eklenir. İngilizce metin, kelime, telaffuz ve örnek alanları ortaktır. Yayın kontrolü revision'daki tüm dillerin eksik sayılarını gösterir. Yedek dosyası dil haritalarını taşır.

Yayın koşulları hem `admin_publish` hem `publish_story_revision` için geçerlidir:

1. Her cümle, her kelime ve açıklama için `tr` satırı bulunmalı ve eski alanla birebir eşit olmalıdır.
2. Üç yeni tablodan herhangi birinde en az bir satırı olan her ek dil, **o revision'ın** tüm cümlelerini, kelimelerini ve açıklamasını kapsamalıdır. Hiç satırı olmayan dil yayın koşulu değildir.
3. Eksik veya uyumsuz satırlar `revision_translations_incomplete: lang=es-419, sentences=2, words=1, description=1` biçiminde hata verir. Sayılar eksik/uyumsuz öğelerdir. İşlem mevcut yayını değiştirmez. Eski metadata, metin, kelime bağlantısı ve medya kontrolleri de sürer.

## Paket aktarımı

Mevcut paket yalnız eski Türkçe alanları içerir. Gelecekte aşağıdaki haritalar isteğe bağlıdır:

```json
{
  "sentence": {"turkish": "Sessiz bir gün.", "translations": {"es-419": "Un día tranquilo."}},
  "word": {"translation": "sessiz", "translations": {"es-419": "tranquilo"}},
  "story": {"description": "Kısa açıklama.", "descriptions": {"es-419": "Descripción breve."}}
}
```

Örnek nesne alanların yerini gösterir; paket kökünün biçimini değiştirmez. `tools/export-catalog.mjs` eski alanlardan her zaman `tr` üretir, isteğe bağlı haritaları da SQL'e ekler. Haritada ayrıca `tr` varsa eski alanla eşit olmalıdır; çelişkili Türkçe, geçersiz dil ve boş değer aktarımı reddeder. Kelime satırları eskisi gibi yalnız ilgili revision'da seçilen kelimeler için üretilir. Eksik ek dil taslağa aktarılabilir; yayın kontrolü tamamlanmasını ister. Aktarım mevcut revision'ı değiştirmez ve yayın yapmaz.

## Denetim ve yerel doğrulama

```sh
cd native-android/backend
npm run catalog:export
npm test
npm run test:admin
npm run content:audit -- --require-lang tr
```

`audit.json` içindeki `bundle.translations` ve varsa `live.translations`, dil başına `missingSentences`, `missingWords`, `missingDescriptions`, `complete` alanlarını taşır. Markdown raporunda aynı sayılar bulunur. Her raporda görünen diller, rapordaki **tüm etkin hikâyeler** üzerinden sayılır; bir dilin yalnız birkaç hikâyede tamamlanması bütün katalog için yeterli sayılmaz. `--require-lang <lang>` bu dil iki kaynakta da tam değilse raporu yazdıktan sonra çıkış kodu 1 verir. İstenen dil hiçbir yerde yoksa bütün öğeler eksik sayılır. Seçenek verilmezse önceki yapısal/kapsama/eşitlik kabul davranışı ve özet alanları korunur.

Eski altı tabloluk snapshot'ta `tr` eski alanlardan hesaplanır. Yeni tablolar snapshot'ta varsa üçü de dizi olarak bulunmalıdır ve gerçek satırlar esas alınır; eksik `tr` satırı eski alanla örtülmez. Snapshot toplama aracı bu üç tabloyu ayrıca dahil etmelidir. Bu uyumluluk eski snapshot'ın yeni tabloları doğruladığı anlamına gelmez.

Yerel PostgreSQL testleri gerçek migration, backfill, grant/RLS, anonim sayfalı sorgular, eşitleme, yayın ve yönetim işlemlerini PGlite ile çalıştırır. Exporter SQL'i de aynı motorda uygulanır. Canlı Supabase/PostgREST/Auth/Storage doğrulaması ayrı bir ortam kontrolüdür; bu çalışma canlı servise bağlanmaz.

16 Ekim 2026 yerel kontrolü: `env -u NODE_USE_SYSTEM_CA npm test` ile 87/87 test geçti; exporter 50 taslak/1002 cümle üretti ve Türkçe denetimi eksik bulmadı. Ortamdaki `NODE_USE_SYSTEM_CA=1` macOS anahtarlık hatası ürettiği için test komutunda kaldırıldı. `env -u NODE_USE_SYSTEM_CA npm run test:admin`, ortamın `127.0.0.1` üzerinde dinlemeyi `EPERM` ile engellemesi nedeniyle başlayamadı; HTTP akışı ve tarayıcıdaki panel görünümü burada doğrulanmadı.
