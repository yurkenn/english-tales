# Q5.3 — revizyon başına anlama soruları

Sorular ve seçenekler öğrenilen dil olan İngilizce yazılır. Destek diline bağlı değildir; açıklama/çeviri alanı yoktur. Bu değişiklik Android kaynaklarını veya paket içeriğini değiştirmez. İçerik sonradan pakete eklenir; soru bulunmayan eski revizyonlar geçerlidir.

## Tablo ve okuyucu sözleşmesi

`20261016100000_story_questions.sql`, `public.story_questions` tablosunu ekler:

| Alan | Kural |
|---|---|
| `revision_id uuid` | `story_revisions(id)` dış anahtarı; silmede cascade |
| `id text` | Cümle ID’siyle aynı DB kuralı: 1–100 karakter; revizyon içinde benzersiz |
| `position integer` | Pozitif; revizyon içinde benzersiz; yayın sırasında 1’den başlayarak kesintisiz |
| `kind text` | `main`, `detail`, `inference` |
| `prompt text` | Boş veya yalnız boşluk karakterlerinden oluşamaz |
| `options text[]` | 2–4 dolu, null olmayan metin; tek boyutlu ve PostgreSQL alt sınırı 1 |
| `answer smallint` | **Sıfır tabanlı**; `0 <= answer < array_length(options,1)` |

Bütün alanlar `NOT NULL`; PK `(revision_id,id)`, unique `(revision_id,position)`. Seçenek eşitliği büyük/küçük harf ve kenar boşlukları yok sayılarak denetlenir; metnin kendisi değiştirilmez. Bu, `Yes` ile ` YES ` gibi görsel tekrarları da reddeder.

Android’in sorgusu aynen şöyledir; mevcut `limit`/`offset` sayfalaması eklenir:

```text
/rest/v1/story_questions?select=id,position,kind,prompt,options,answer&revision_id=eq.{rev}&order=position.asc
```

PostgREST, `options` alanını JSON string dizisi olarak döndürür. Alan ve tür adları değiştirilmedi.

RLS ve yetkiler diğer revizyon çocuklarıyla aynıdır: anon yalnız `private.can_read_revision` üzerinden yayımlanmış, arşivlenmemiş hikâyelerin revizyonlarını okur; eski yayımlar da mevcut okuyucular için okunabilir. Anon yazamaz. Staff, `private.can_edit_revision` ile yalnız taslağı düzenler. `guard_revision_child` üst revizyonu kilitler; yayınlı satırlar DB sahibi için bile değiştirilemez. INSERT/UPDATE/DELETE, mevcut `bump_child_version` ile `edit_version` artırır. İki yayın yolu da (`publish_story_revision`, `admin_publish`) üst tablo tetikleyicisiyle soru sırasını doğrular. Sıfır sorulu revizyon yayına engel değildir; ≥3 soru yalnız isteğe bağlı kalite eşiğidir.

## Yönetim ve paket

`admin_revision.questions` her zaman `position` sıralı bir dizidir. `admin_save_draft`:

- `questions` verilmezse mevcut listeyi korur.
- Dizi verilirse listeyi atomik olarak değiştirir; sıra dizideki indeks + 1 olur. İstemcinin gönderdiği `position` kullanılmaz.
- `[]` listeyi temizler; `null`, nesne, geçersiz alan/seçenek/yanıt veya yinelenen ID reddedilir. Hata bütün kaydı geri alır; mevcut sürüm çakışması koruması geçerlidir.

`admin_create_draft` kaynak yayının sorularını aynı kimlik ve sırayla kopyalar. Panelin **Anlama soruları** sekmesi İngilizce metin, tür, seçenekler, doğru yanıt ve sıralamayı düzenler; mesajlar Türkçedir. Seçenekler satır satır girilir. Panelde doğru seçenek 1–4 görünür, kayıtta 0–3 olur. Yedekler soruları taşır; eski yedeklerde alan yoksa güncel liste korunur.

Paket şeması (alan isteğe bağlı, dizi sırası gösterim sırası):

```json
{
  "questions": [
    {"id":"story-q1","kind":"main","prompt":"What is the story mainly about?","options":["Helping a friend.","Finding a treasure."],"answer":0}
  ]
}
```

Exporter `position=index+1` ile taslak satırları üretir; mevcut revizyonu değiştirmez. `content:drafts`, soru kimliği, sıra, tür, metin, seçenek sırası ve yanıt farkını içerik farkı sayar. Yeni taslak paketi izler; pakette olmayan sorular yeni taslaktan kaldırılır. Eski yayın korunur. İnceleme raporunda eski/yeni soru sayısı ve hedef liste görünür. Canlı kayma kontrolüne sorular da dahildir.

## Denetim ve snapshot

```sh
cd native-android/backend
npm run content:audit -- --min-questions 3
npm run content:audit -- --snapshot <catalog.json> --min-questions 3
```

Rapor her seviyede ≥3 geçerli sorulu hikâye sayısını, sorusuz hikâye ID’lerini ve yapısal soru hatalarını gösterir. `--min-questions n`, sıfır veya pozitif tam sayı ister; paket veya verilen snapshot içindeki herhangi bir etkin hikâye n geçerli sorunun altındaysa çıkış kodu 1 olur. Varsayılanda soru sayısı zorunlu değildir. Soru kuralları ve sırası yanlışsa minimumdan bağımsız yapısal hata vardır. Metnin gerçekten İngilizce/anlamsal olarak doğru oluşu insan incelemesidir.

`tooling/backup_public_content.mjs` artık altı temel tabloya ek olarak `sentence_translations`, `word_translations`, `revision_texts`, `story_questions` toplar. Anonim publishable key, 500 satırlık sayfalar, tablo başına 20.000 sınırı, bileşik deterministik sıralama, medya boyutu/SHA-256 kontrolü ve başlangıç/son hikâye imzası korunur. Servis anahtarı veya Auth oturumu kullanılmaz.

Eski altı tabloluk snapshot okunur: Türkçe eski alanlardan, sorular boş listeden hesaplanır. Dokuz tabloluk çeviri snapshot’ı da desteklenir; soru tablosu diğer üçünden bağımsızdır. Çeviri grubunun herhangi biri varsa üçü de bulunmalıdır. Yeni satırlar bulunduğunda gerçek tablolar esas alınır, boş tablo eski alanlarla doldurulmaz.

Snapshot aracı yalnız tablo bulunamadı (`PGRST205`/`42P01`, HTTP 404/400) yanıtında isteğe bağlı eski tabloları atlar; izin, ağ ve diğer hatalarda durur. Çeviri grubunun kısmen bulunması da hatadır. Eski snapshot’ta görünmeyen canlı dil/soru varsa `content:drafts --apply` içerik kayması denetiminde durur; eksik kaynakla mevcut editör içeriği silinmez. Snapshot bütün tablolar için tek DB işlemi değildir; mevcut hikâye imzası kontrolü bütün eşzamanlı taslak/yayın değişiklikleri için kilit sağlamaz.

## Yerel doğrulama sınırı

PGlite SQL/RLS testleri, exporter/draft/audit testleri ve sahte HTTP ile snapshot testleri ağsız çalışır. `npm run test:admin`, localhost dinleme izni ister. Bu çalışma canlı migration, gerçek PostgREST, Android sorgusu veya üretim yayını kanıtı değildir.
