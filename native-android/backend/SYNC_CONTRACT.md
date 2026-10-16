# Android ve servis veri sözleşmesi

Bu sözleşme hazır veritabanı işlemlerini ve Android entegrasyonu için alınan kararları tanımlar. Android'in anonim katalog, metin/kelime ve kapak indirme bağlantısı tamamlandı; [içerik bağlantısı kaydı](../docs/REMOTE_CONTENT_PLAN.md). Hesap oturumları, kalıcı kuyruk, RPC gönderim katmanı, tam kopya ayrıştırma, Room 6 atomik birleştirme ve uygulama çalıştırıcısı/UI bağlıdır. Gerçek hesap/ikinci cihaz, tercih CAS yazımı ve kalıcı arka plan işi açık kapılardır; [çalıştırma kaydı](../docs/LEARNING_SYNC_EXECUTION.md).

## İçerik kimliği ve yayın

- `stories.id`: Hikâyenin değişmeyen kimliği; örneğin `quiet-morning`.
- `story_revisions.id`: Belirli metin sürümünün UUID'si. `revision` her hikâyede artan sayıdır. Paket içi altı hikâyenin ilk UUID'leri katalog aktarımında deterministik üretilir.
- `stories.current_revision_id`: Kitaplıkta sunulan sürüm. Aynı hikâyeye ait olması veritabanında kontrol edilir.
- Cümle kimliği bir sürüm içinde benzersizdir; sıra `position=1..N` olarak tutulur.
- Kelime kimliği aynı öğrenilecek kelime/anlam için sürümler arasında korunur. Anlamı değiştiren yeni bir öğeye yeni kimlik verilir; kullanıcı kelime durumu `word_id` üzerinden ortak tutulur.
- Taslak `published_at=null` olarak saklanır. Yayımlanan sürümün metni, kimliği, kelime bağlantıları ve medya kayıtları değiştirilemez. Düzeltme yeni sürümle yapılır.
- Okuyucu açılırken revision UUID'si sabitlenir. Arka planda yeni yayın gelmesi açık metni değiştirmez. Önceki yayımlanmış sürümler, hikâye arşivlenmedikçe okunabilir.
- Arşivleme yeni katalog, metin ve medya okumalarını gizler. Daha önce indirilmiş çevrimdışı dosyaları anında geri alamaz. Eski yayımlanmış sürümün öğrenme olayları, çevrimdışı kayıt kaybolmasın diye kabul edilmeye devam eder.
- Medya manifestindeki `source` yolları `native-android` klasörüne göredir. Dosya SHA-256 ve boyutla doğrulanıp geçici dosyadan atomik olarak önbelleğe alınmalıdır. Bozuk indirme mevcut çalışan içeriği değiştirmemelidir.

İçerik okunurken önce hikâye listesi ve güncel sürümler alınır; cümleler/kelimeler yalnızca seçilen sürüm için yüklenir. Sonuçlar sayfalanır. API'nin satır sınırına güvenip bütün kataloğun tek yanıtta geldiği varsayılmaz.

## Kullanıcı sahipliği

Öğrenme tabloları yalnızca oturumun `auth.uid()` değeriyle okunur. İstek gövdesinde kullanıcı kimliği kabul edilmez. Normal kullanıcı doğrudan puan, seri, başarı veya ilerleme tablosunu yazamaz; işlemler aşağıdaki fonksiyonlardan geçer.

Misafir kayıtları cihazda tutulur. Android Room katmanı `guest` ve her hesabın yerel verisini ayrı dosyada tutar; dosyanın sahip kaydı açılışta doğrulanır. Gönderim/teslim API'si beklenen hesapla eşleşir; misafir kuyruğunu gönderime açmaz. Hesap ekranından seçilmiş hesaba tek seferlik misafir aktarımı, kalıcı günlük ve makbuzla uygulanmıştır. Bulut temeli oluşturulduktan sonraki aktarım da eski cihaz katkısını aynı transaction içinde günceller.

`installationId`, yerel kurulumun rastgele UUID'sidir; reklam kimliği, e-posta veya cihaz seri numarası değildir. Kullanıcı kimliği yerine geçmez. Yeni kurulumda yenilenebilir; bir gönderim denemesinde değiştirilmez.

## İşlem kimliği ve gönderim kuyruğu

1. Eylem ilk gerçekleştiğinde rastgele UUID üret. Yerel ilerleme değişikliği ve outbox kaydını aynı veritabanı işlemiyle sakla.
2. Olayın değişmeyen JSON gövdesini sakla. Yeniden denemede UUID, tarih, kurulum kimliği ve gövde aynı kalır. Anahtarların JSON içindeki sırası önemsizdir; alan ekleme, null alanı çıkarma veya tarihi farklı yazma eşdeğer tekrar sayılmaz.
3. Ağ kesilmesi/zaman aşımında olay kuyruğa geri döner. Sunucunun `applied=false` yanıtı da başarılı teslimattır; kayıt daha önce işlenmiştir.
4. Aynı kullanıcı/UUID farklı gövdeyle gelirse `operation_id_payload_conflict` döner. Bu olay otomatik yeni UUID verilerek tekrarlanmaz; istemci hatası olarak ayrılır.
5. Token süresi dolarsa Auth üzerinden yenilenir. Hesap değişmişse eski kuyruk durdurulur. Kalıcı veri doğrulama hataları sonsuz ağ denemesine dönüşmez.
6. Başarılı gönderimden sonra sunucu durumu alınır ve yerel kayıtla birleştirilir. Tek seferlik istemci puan toplamı gönderilmez.

## RPC çağrıları

JSON olay alanları aşağıdaki gibi kullanılmalıdır. UUID yer tutucuları gerçek değerlerle değiştirilir. Tarihler saat dilimi bilgili ISO-8601 olarak, Android'den UTC `Z` biçiminde gönderilir. Takvim günü için IANA saat dilimi adı ayrıca kaydedilir. Sunucu beş dakikadan ileride olay tarihini kabul etmez.

Supabase RPC parametresi olay fonksiyonlarında **`p_event`** adını taşır: HTTP çağrı gövdesi `{ "p_event": <olay> }` biçimindedir.

### Tercihler

`get_learning_summary()` yoksa varsayılan profili oluşturur; başlangıç sürümü `1`, saat dilimi `UTC` olur. Mevcut çalıştırıcı öğrenme olaylarını özgün `studyTimezone` değeriyle gönderir; profil tercihlerini yazmaz. Kirli yerel tercihler korunur ve hesap ekranında bekleyen ayar olarak gösterilir. Sunucu profil hedefi/saat diliminin cihazdaki tercihlerle aynı olduğu varsayılmamalıdır; tercih CAS/çakışma adımı ve gerçek hesap kontrolü tamamlanmadan bu akış yayına hazır sayılmaz.

`save_learning_preferences` parametreleri:

```json
{
  "p_expected_version": 1,
  "p_name": "Ada",
  "p_level": "A2",
  "p_genre": "Macera",
  "p_goal": 3,
  "p_timezone": "Europe/Istanbul"
}
```

Sonuç güncel profil ve artırılan `preferences_version` değeridir. Başka cihaz ayarı değiştirmişse `preferences_version_conflict` döner. Profil yeniden okunur, kullanıcı değişikliği güncel sürüm üzerine uygulanır; eski sürümle kör tekrar yapılmaz. Hedef 1–3; seviye A1/A2/B1; tür Günlük yaşam/Macera/Gizem'dir.

### Tamamlanan öğrenme oturumu

`submit_learning_session(p_event)`:

```json
{
  "id": "bc8300d0-3468-4b71-8a40-f01a933a12de",
  "installationId": "e18f261a-3300-441e-9f4e-fcb5b7fd40d6",
  "kind": "choice",
  "storyRevisionId": "<published-revision-uuid>",
  "startedAt": "2026-10-10T08:00:00Z",
  "finishedAt": "2026-10-10T08:01:00Z",
  "activeSeconds": 30,
  "correctAnswers": 4,
  "questionCount": 5,
  "studyTimezone": "Europe/Istanbul"
}
```

- Türler: `reading`, `choice`, `card`, `match`, `spell`.
- Alıştırma 1–5 soru içerir; doğru sayısı soru sayısını aşamaz. Ödül sunucuda `correctAnswers × 5` olarak hesaplanır. Genel kelime alıştırmasında `storyRevisionId=null` olabilir.
- Okumada yayımlanmış `storyRevisionId` gerekir; `questionCount=0`, `correctAnswers=0`, puan 0'dır. Aynı hikâye/gün, iki cihazdan tamamlansa da bir günlük adım sayılır. İkinci farklı UUID saklanır ancak `counted=false` olur.
- Başlangıç/bitiş sırası, azami 7 günlük oturum aralığı ve 24 saat aktif süre sınırı kontrol edilir. Aktif süre geçen süreden uzun olamaz (iki saniye yuvarlama payı).
- Aktif süre Android yaşam döngüsünde yalnızca RESUMED durumda monoton saatle ölçülür; beş saniyede bir ve duraklamada yerel taslağa yazılır. Tamamlamada son süre aynı ödül/kuyruk transaction'ına girer. Ani süreç kaybı son checkpoint'in birkaç saniyesini kaybettirebilir. Başlangıçtan önce bitiş veya yedi günden uzun beklemiş taslak sunucuya gönderim için bloke edilir.
- Sonuç `applied`, yeni kayıtta `counted` ve güncel `summary` alanlarıdır. Özet puan, seri, tamamlanan alıştırma, bugünkü adımlar/okumalar, hedef ve hedefin tamamlanmasını içerir.
- Bu sürüm tamamlanan oturumları tutar. Yarıda bırakılan çalışmalar ve ekran geçişleri için Firebase olayları ayrıca gerekir.

Bu doğrulamalar yinelenen ödülleri ve geçersiz sayıları engeller. Cevap sayısı istemciden geldiği için bağımsız bir cevap doğrulama veya hile önleme sistemi değildir; para ya da rekabet ödülleri için yeterli sayılmaz.

### Kelime kaydı ve tekrar cevabı

`apply_word_event(p_event)`:

```json
{
  "id": "b6c9fb8e-214a-4937-8ab8-705c713461cc",
  "installationId": "e18f261a-3300-441e-9f4e-fcb5b7fd40d6",
  "storyRevisionId": "<published-revision-uuid>",
  "wordId": "quiet",
  "action": "review",
  "correct": true,
  "occurredAt": "2026-10-10T08:01:00Z",
  "studyTimezone": "Europe/Istanbul"
}
```

`action`: `save`, `remove`, `review`. Kaydetme/silmede `correct=null` kullanılır; cevapta boolean zorunludur. Kelime, belirtilen yayımlanmış sürümde gerçekten bulunmalıdır. Oyun oturumu için ayrıca bir `submit_learning_session` kaydı gönderilir; kelime cevabı tek başına puan veya günlük adım yazmaz.

Her kelimenin geçmişi `(occurred_at, UUID)` sırasıyla değerlendirilir. Silme bir kayıt olarak korunur; sonradan gelen eski kaydetme olayı kelimeyi geri getirmez. Silmeden sonra gerçekten yeni bir kaydetme olayı yeni öğrenme döngüsü açar. Aynı zaman damgasında UUID sırası belirleyicidir; gönderim sırası belirleyici değildir.

Doğru cevap ancak zamanı geldiyse ve aynı gün daha önce başarılı tekrar yoksa aralığı 1/3/7/14/30 güne çıkarır. Üç başarılı tekrarda `known` olur. Yanlış cevap öğrenme durumunu sıfırlar ve 10 dakika sonra tekrar planlar. Gün aralıkları 24 saatlik sürelerdir; takvim günü kontrolü olayın saat diliminden yapılır. Silinen kelime durumu `saved=false` ile tutulur. Cevapta `applied` ve güncel `wordState` döner.

Kelimeyi başka cihazda göstermek için metin kaynağı, o kelimenin geçmişindeki yayımlanmış revision ile eşlenmelidir. Sadece kelime kimliğini ekrana yazmak yeterli değildir. Arşivlenen kaynak daha önce indirilmemişse uygulama anlaşılır bir içerik durumu sunmalıdır.

### Okuma konumu

`apply_progress_event(p_event)`:

```json
{
  "id": "b11de92c-8804-460b-a727-727f70e7619e",
  "installationId": "e18f261a-3300-441e-9f4e-fcb5b7fd40d6",
  "storyRevisionId": "<published-revision-uuid>",
  "sentenceId": "qm-8",
  "percent": 88,
  "occurredAt": "2026-10-10T08:02:00Z"
}
```

Cümle belirtilen sürüme ait olmalıdır. Tamamlanma yüzdesi 0–100 arasındadır ve gerilemez. Devam konumu en yeni `(tarih, UUID)` olayından gelir; kullanıcı bilinçli olarak önceki cümleye dönebilir, bu yüzden konum ile en yüksek yüzde ayrı tutulur. Geç ulaşan eski olay devam konumunu değiştiremez. Yeni yayın için önceki sürümün yüzdesi körlemesine taşınmaz.

İlk uygulamada görünür cümle değiştiğinde yazılmalı; gereksiz her piksel kaydırması için ağ kaydı oluşturulmamalıdır. Tekrar teslimatta yalnızca `applied=false`, yeni kayıtta `applied=true` ve `progress` döner.

### Favoriler (F09b)

`apply_favorite_event(p_event)` · alanlar: `id`, `installationId`, `storyId`, `favorite` (boolean), `occurredAt`.

- Aynı `id` aynı içerikle tekrar gelirse `applied=false` döner; farklı içerikle `operation_id_payload_conflict`.
- Her hikâyenin durumu, `(occurred_at, id)` sırasına göre en son olaydır. Geç yüklenen eski bir ekleme, daha yeni bir çıkarmayı geri getirmez.
- `get_learning_snapshot` `favorites` alanında `{story_id, favorite, updated_at}` döner; çıkarılan favori `favorite=false` olarak kalır (tombstone).
- İstemci gönderilmemiş favori işlemlerini korur; sunucu oynatınca anlık görüntü yerel durumu belirler. `favorites` alanı olmayan eski sunucularda yerel favorilere dokunulmaz. Hikâye arşivlense de favori kaydı kalır; ekranlar yalnız açılabilen hikâyeleri listeler.

### Kişisel kelimeler (Q4.3a)

Okuyucuda sözlükten kaydedilen kelimeler `apply_word_event` ile gider; kimlikleri `glossary:<lemma>` biçimindedir (lemma yalnız harf/rakam).

- `storyRevisionId` `null` olmalıdır; bu kelimeler bir hikâye revizyonuna bağlı değildir.
- `save` olayı ek olarak `word` (1–100 karakter) ve `gloss` (1–1000 karakter) taşır. `review` ve `remove` olayları ile öğrenme kelimesi olayları bu alanları taşıyamaz (`invalid_word_payload`).
- Tekrar planı öğrenme kelimeleriyle aynıdır. Metin `user_personal_words` tablosunda tutulur; geç yüklenen eski bir kayıt daha yeni anlamın üzerine yazmaz.
- `get_learning_snapshot` `words` satırında bu kelimeler için `word` ve `gloss` alanlarını da döner. İstemci metni olmayan bir kişisel kelimeyi yok sayar; kaldırılan kelimenin yerel metnini siler.
- Sunucu bu sözleşmeden önceki sürümdeyse kişisel kelime olayları reddedilir; bu yüzden migration, uygulama sürümünden önce yayımlanmalıdır.

### Bilinen kelime geçmişi (Q5.5)

`apply_lemma_event(p_event)` · alanlar: `id`, `installationId`, `kind` (`read` | `lookup`), `storyId` (yalnız `read`), `lemmas` (1–3000 sözlük biçimi; `lookup`'ta tam 1), `occurredAt`.

- Bir hikâye ilk kez bittiğinde içindeki sözlük biçimleri `read` olarak, okurken açılan kelime `lookup` olarak gider. Uygulama yalnız ASCII (`[a-z0-9]`) biçimleri gönderir.
- Aynı `id` aynı içerikle tekrar gelirse `applied=false`; farklı içerikle `operation_id_payload_conflict`.
- `user_lemma_reads (lemma, story_id)` ve `user_lemma_lookups (lemma)` yalnız büyüyen kümelerdir; silme yoktur. Bakılma zamanı en erken olanıdır.
- `get_learning_snapshot` `lemmaReads` (`{lemma, story_id}`) ve `lemmaLookups` (dizi) döner. İstemci bunları yerel kümeye ekler (birleşim). Alanları olmayan eski sunucuda yerel geçmişe dokunulmaz.

## Seri, hedef ve saat dilimi

Seri yalnızca sayılan, tamamlanan öğrenme günlerinden hesaplanır. Son etkin gün bugün veya dün değilse seri 0'dır. Sadece uygulamayı açmak öğrenme adımı değildir. Geç ulaşan çevrimdışı günler ardışık gün geçmişini tamamlayabilir. Kazanılan başarılar daha sonra serinin düşmesiyle silinmez.

Profil saat dilimi bugünün özetini belirler; olayın saat dilimi geçmiş çalışma gününü belirler. Android, bir olayı oluştuktan sonra saat dilimi değişti diye yeniden tarihlememelidir. Saat dilimi değişikliği geçmiş günlerin yeniden yazılması anlamına gelmez.

## Erişim ve hesap silme

| İşlem | Misafir okuma | Normal hesap | Editör | Yayıncı |
| --- | --- | --- | --- | --- |
| Yayımlanmış içerik/medya okuma | Evet | Evet | Evet | Evet |
| Taslak görme/düzenleme | Hayır | Hayır | Evet | Evet |
| Yayınlama/arşivleme | Hayır | Hayır | Hayır | Evet |
| Öğrenme verisi okuma | Hayır | Kendi hesabı | Kendi hesabı | Kendi hesabı |
| Öğrenme verisi yazma | Hayır | Kendi hesabıyla RPC | Kendi hesabıyla RPC | Kendi hesabıyla RPC |
| Editör/yayıncı rolü verme | Hayır | Hayır | Hayır | Hayır |

Auth hesabı güvenilir sunucu işleminden silinince ona bağlı öğrenme tabloları ve personel rolü cascade ile silinir; hikâyeler silinmez. Bu, henüz uygulamada hesap silme ekranı veya sunucu silme ucu olduğu anlamına gelmez. Firebase verilerinin saklama/silme süreci ayrıca tanımlanmalıdır.

Native SQLite v3 tüm eski cevapları ve cümle konumlarını saklamaz. Room v4 geçişi eski toplamları ve tekrar tarihlerini korur; eski kayıtlar için işlem geçmişi üretmez. İlk hesap aktarımında eski toplamların nasıl korunacağı sunucu birleştirme aşamasında ayrıca uygulanmalıdır.

Paket içindeki `discover` ve `kind` örnek kelimeleri henüz bir hikâyenin yayımlanabilir kelime kaynağına bağlı değildir. Yerel kayıtları korunur; bu iki kelimenin olayları `content_revision_unavailable` gerekçesiyle bloke edilir ve ağ gönderimine girmez. Genel kelime kataloğu/yayımlanmış kaynak tamamlanmadan geçersiz bir revision üretilmemelidir.
