# Q4 — içerik kalite denetimi

15 Ekim 2026, **23:15:41 Türkiye saati** (`2026-10-15T20:15:41.962Z`) canlı snapshot'ı. İnceleme ayrı `codex/q4-content-audit` worktree'sinde yapıldı. Android arayüzüne ve Claude'un Q3 çalışma dizinine değişiklik yapılmadı.

## Doğrulanan durum

| Kontrol | Paket | Etkin canlı yayın |
|---|---:|---:|
| Hikâye | 50 | 50 |
| İngilizce/Türkçe cümle çifti | 1.002 | 1.002 |
| Genel paket sözlüğü | 359 kayıt | Ayrı bir genel sözlük tablosu yok |
| Hikâye revizyonlarında kullanılan farklı sözlük ID'si | 358 | 315 |
| Revizyonlara dağıtılmış sözlük satırı | 771 | 622 |
| Cümle–kelime bağlantısı | 1.312 | 1.118 |
| Yapısal hata | 0 | 0 |

**Hikâye listesi, temel bilgiler, cümle kimlik/sıra/metin/çevirileri ve kapaklar eşleşiyor.** Elli medya dosyasının boyutu ve SHA-256 özeti iki kez doğrulandı: anonim indirme sırasında ve snapshot dosyaları denetlenirken. Bu, kapakların görsel/telif değerlendirmesini tekrar yapıldığı anlamına gelmez.

Boş İngilizce/Türkçe metin, eksik kelime anlamı, bozuk sıra, yinelenen kimlik veya geçersiz kelime bağlantısı bulunmadı. Canlıda **21 bağlanmamış sözlük geçişi** editör inceleme uyarısıdır; örneğin `lion's` içindeki `lion` mevcut eşleme kuralınca seçilebilirken eski yayında bağlantısı yoktur. Metinlerin anlamsal çeviri doğruluğu otomatik kontrol edilmiş sayılmaz.

Önceki “paket 359 / canlı 316” notu aynı türden iki sayıyı karşılaştırmıyordu: paket genel sözlükteki `kind` kaydı hiçbir hikâyede tam token olarak eşleşmiyor (kelime alıştırmalarında kullanılabilir). Güncel karşılaştırma, **358 paket hikâye sözlük ID'si / 315 etkin canlı sözlük ID'si** üzerinden yapılır. Hiçbir eski kimlik veya kelime bu denetimde silinmedi.

## Paket / canlı farkının kapsamı

- **43 farklı kelime/ifade ID'si** canlıda yok. Ortak paket sözlüğü bütün hikâyelerde eşleştiğinden yalnız beş pilot değil, **39 hikâye** etkileniyor. Beş pilotu tek başına yayımlamak tam eşitlik sağlamaz.
- Revizyon bazında **151 eksik ve 2 fazla sözlük satırı**, **196 eksik ve 2 fazla bağlantı** var. Aynı kelime farklı hikâyelerde tekrarlandığı için 151 satır, 43 farklı ID'den ayrıdır.
- Fazla iki sözlük/bağlantı kaydı, `classic-tortoise-hare` ve `classic-dog-manger` içindeki `asleep` kaydıdır. Paket kuralında uzun `falls asleep` ifadesi kazanır. Bu, eski yayımlanmış revizyonlardan veya öğrenme geçmişinden kayıt silme talimatı değildir.
- 21 bağlanmamış geçiş ile 196 paket bağlantı farkı farklı ölçümlerdir; ayrı ayrı toplanmaz.

Tüm farklar, kaynak snapshot/katalog/tool hash'leri ve örnekler [makine raporunda](content-audit/2026-10-15-summary.json). Bu dosya tarihli bir ölçümdür; canlı değiştikçe yeniden denetim gerekir. `sourceDirty` ölçüm sırasında geliştirme dosyalarının henüz commit edilmediğini belirtir; `toolSHA256` çalıştırılan CLI, denetim kütüphanesi ve ortak eşleyicinin tam baytlarını tanımlar.

## Kapsama hedefi

| Seviye | Paket benzersiz token kapsamı | Canlı benzersiz token kapsamı | Hedef |
|---|---:|---:|---:|
| A1 | 172/532 — **%32,33** | 125/532 — **%23,50** | ≥ %60 |
| A2 | 169/979 — **%17,26** | 151/979 — **%15,42** | ≥ %60 |
| B1 | 184/1.212 — %15,18 | 161/1.212 — %13,28 | Bu kapıda eşik yok |
| Tüm katalog | 362/1.871 — %19,35 | 315/1.871 — %16,84 | — |

Ölçüm Unicode harf/rakam token'larını, uygulamanın `PhraseMatcher` davranışını paylaşan `matchSpans` ile sayar. En uzun ifade önce kazanır; ifadelerin bütün token'ları kapsama eklenir. Canlı için yalnız ilgili cümleye bağlanmış kelimeler kullanılır. Köke indirgeme, durak sözcüğü/özel ad elemesi yoktur; `lion's` iki token'dır. Seviye, hikâyenin seviyesidir; token'ın CEFR sınıfı değildir.

Tür kapsamı bir token türünün en az bir yerde seçilebilir olmasını ölçer. Geçiş kapsamı her tekil kullanımı ölçer; tüm katalogda paket %12,47 / canlı %10,40. Hikâye bazındaki raporlar, toplam tür kapsamının gizleyebileceği yerel açıkları gösterir. Eksik token listesi örnek cümle ve hikâye sıklığıyla üretilir; zamir/bağlaç, çekimli biçim ve özel adlar editörce değerlendirilmelidir. Sırf oranı yükseltmek için otomatik anlam eklenmez.

## Tekrar çalıştırma

Depo kökünde, mevcut üretim **publishable** yapılandırmasıyla salt okunur snapshot:

```sh
node tooling/backup_public_content.mjs
```

Aracın yazdırdığı `<snapshot-dizini>/catalog.json` yolunu kullanarak `native-android/backend/` içinde:

```sh
npm run content:audit
npm run content:audit -- --snapshot <snapshot-dizini>/catalog.json
npm run content:audit -- --snapshot <snapshot-dizini>/catalog.json --require-parity --min-coverage 60 --output ../build/content-audit-strict
```

- İlk komut ağ kullanmadan paket yapısını denetler. İkincisi canlı snapshot'ını, mevcut medya baytlarını ve paket farkını inceler.
- Son komut yayın öncesi sıkı kontroldür: eşitlik veya A1/A2 %60 koşulu sağlanmazsa **exit 1**. Bu snapshot'ta eşitlik ve dört kapsama eşiği beklendiği gibi reddedildi; bunlar test arızası değil, mevcut içerik açıklarıdır.
- `--skip-media` yalnız veri incelemesi içindir; rapor medya kontrolünü “skipped” gösterir ve `--require-parity` ile tam kabul alamaz. Bozuk/eksik medya varsayılan denetimde hata verir.
- Çıktı `native-android/build/content-audit/`: `audit.json`, `report.md`, `revision-proposals.json`. Aynı çıktı dizini yeniden kullanılırsa bu üç dosya yenilenir. Snapshot ve tam çıktılar Git dışındadır; tarihli özet yukarıda kayıtlıdır.
- `revision-proposals.json`, 39 mevcut hikâye için kaynak cümle/kimlikleri ve istenen sözlük/bağlantıları içeren **yerel inceleme paketidir**. Sunucuda taslak oluşturmaz, revision kimliği atamaz ve yayın yapmaz. Yeni hikâyeler ayrıca ele alınır.

CI backend işi paket denetimini çalıştırır ve `content-audit` artefaktını saklar. **Yeşil CI yalnız yapısal kabulü gösterir; Q4 eşitlik/kapsama kapısı geçilmiş sayılmaz.** Canlı sorgu ve anahtar CI'ye eklenmedi.

## Q4.1 — taslak uygulama ve yayın sonrası kontrol

16 Ekim 2026'da `npm run content:drafts` eklendi. Yukarıdaki 15 Ekim ölçümü tarihli canlı kanıttır; bu geliştirme canlı servise bağlanmaz ve o açıkları canlıda kapatmış sayılmaz. `revision-proposals.json` yerel öneri olarak kalır; yeni araç doğrudan snapshot + paket girdilerinden yönetici RPC yükleri üretir.

Tam oturum/dosya biçimi ve hata sonrası devam adımları [içerik kılavuzunda](../CONTENT_GUIDE.md#q41--mevcut-yayını-paketten-yeni-taslağa-taşıma). Operatör sırası:

1. Depo kökünde `env -u NODE_USE_SYSTEM_CA node tooling/backup_public_content.mjs` ile `<önce>/catalog.json` ve medya dosyalarını al.
2. Backend içinde dry-run üret:

   ```sh
   env -u NODE_USE_SYSTEM_CA npm run content:drafts -- --snapshot <önce>/catalog.json --output ../build/content-drafts-q41
   ```

3. `review.md` içindeki hikâye/kelime/bağlantı/çeviri farklarını, örnekleri ve **iki asleep çıkarımını** incele. `manifest.json` girdi/araç SHA-256 özetlerini, kaynak yayın ID/`edit_version` değerlerini ve hikâye dosyalarının yollarını tutar. `stories/*.json` dosyaları `admin_create_draft` kaynağı ve `admin_save_draft` belge şablonudur. Paket cümle/kelime kimlikleri korunur; yeni revizyon UUID'si sunucudan gelir.
4. İnsan editörün Git dışındaki `chmod 600` JSON oturum dosyasıyla aynı girdileri uygula:

   ```sh
   env -u NODE_USE_SYSTEM_CA npm run content:drafts -- --snapshot <önce>/catalog.json --output ../build/content-drafts-q41 --apply --url https://<project>.supabase.co --session-file <oturum.json>
   ```

5. Yayıncı panelde taslakları inceler ve yayımlar. Araç **hiçbir koşulda yayın RPC'sini çağırmaz**. `apply-results.json` kaydedilen/atlanmış taslakları gösterir, etkin yayın değişikliğini göstermez.
6. Yeni anonim `<sonra>` snapshot'ını medya dosyalarıyla al; backend içinde yayın doğrulamasını çalıştır:

   ```sh
   env -u NODE_USE_SYSTEM_CA npm run content:audit -- --snapshot <sonra>/catalog.json --require-parity --require-lang tr --output ../build/content-audit-after-q41
   ```

`--apply` verilmezse araç oturum dosyasını okumaz ve ağ isteği yapmaz. Uygulama öncesi tüm etkin hikâyeler için ID/sürüm/arşiv/içerik kayması kontrol edilir. Paketle eşdeğer açık taslak yazmadan atlanır; kaynak yayının birebir kopyası güvenle tamamlanabilir. Farklı editoryal taslak korunur ve işlem durur. Kaynak, paket veya araç hash'i değişirse aynı çıktı dizini kullanılamaz; yeni bir dizinde yeniden inceleme gerekir. Eksik/fazla hikâye ve medya farkı raporda engeldir; araç bunları otomatik oluşturmaz/silmez/yüklemez. Kayıtlar hikâye bazında atomiktir; bir kesintiden önce kaydedilmiş taslaklar geri alınmaz. Kontroller RPC'ler arasında yayıncıyı kilitlemez; geç fark edilen kaymada kalan taslaklar panelde incelenir ve yeni snapshot ile ilerlenir.

Yeni taslağın kelimeleri, bağlantıları ve çeviri haritaları paketi birebir izler. Pakette olmayan ek dil yalnız yeni taslaktan çıkarılır; eski yayında kalır. `asleep`/`falls asleep` kararı da aynı biçimde yalnız yeni revizyonu etkiler. Eşitlik denetimi artık ek dil haritalarının **metin farklarını ve fazla dilleri** de sayar; yalnız doluluk yeterli değildir. Altı tabloluk eski snapshot Türkçeyi eski alanlardan doğrular; üç yeni çeviri tablosu mevcutsa gerçek satırlar esas alınır. Mevcut snapshot aracı bu üç tabloyu toplamadığı için ek dil tablolarının bağımsız yayın doğrulaması dokuz tabloluk snapshot gerektirir. Kaynakta görünmeyen canlı diller uygulamada içerik kayması olarak reddedilir.

Yerel fixture doğrulaması: eksik kelime, eksik cümle bağlantısı ve iki ifade/kelime değişimi; dry-run'da ağ/RPC yokluğu; snapshot kayması ve editoryal taslak çatışmasında yazmadan ret; kesilmiş kopyadan devam; eşzamanlı sürüm çatışması; eşdeğer taslağı tekrar uygulamada atlama; token'ın yalnız HTTP başlığında taşınması ve hata metinlerinde gizlenmesi test edilir. Gerçek migration/RPC'lerle editör taslağı kaydedilir; publisher fixture yayımladıktan sonra `--require-parity --require-lang tr` denetimi medya kontrolüyle geçer. Ayrıca gerçek 50 hikâyelik pakete eşit bir snapshot fixture'ı aynı seçeneklerle gerçek CLI'dan geçirilir. Bunlar canlı Auth/PostgREST veya gerçek yayın kanıtı değildir.

16 Ekim yerel sonuçları: backend içinde `env -u NODE_USE_SYSTEM_CA npm test` **97/97 geçti** (87 mevcut + 10 yeni test). `--apply` komut giriş noktası, HTTP istek biçimini yerel PostgreSQL RPC'lerine yönlendiren ağsız test adaptörüyle çalıştırıldı; gerçek token doğrulaması yapılmadı. `env -u NODE_USE_SYSTEM_CA npm run test:admin` **exit 1** verdi: sandbox `127.0.0.1` üzerinde dinlemeyi `EPERM` ile engelledi; admin HTTP uçtan uca kontrolü bu ortamda çalıştırılamadı. `git diff --check` geçti. Canlı servise istek, yayın, commit veya push yapılmadı.

## Sonraki içerik işi

1. 39 hikâyenin değişiklik paketini gözden geçir; beş A1 pilotunu ilk yayın grubu olarak ayır. Her mevcut yayın için yeni revizyon taslağı gerekir. `catalog:export` sabit ilk revision mevcutsa atladığı için eski yayını bu yolla güncellemez.
2. Eksik kelime/ifade anlamları, telaffuzları, örnekleri ve çok kelimeli eşleme değişikliklerini editör/publisher akışında kontrol et. Yayımlanmış revizyon ve öğrenme geçmişini koru; `asleep`/`falls asleep` değişimini özellikle incele.
3. Onaylanan yeni revizyonları yayınladıktan sonra yeni anonim snapshot ile sıkı eşitlik kontrolünü tekrarla.
4. Ardından A1/A2 kapsamını %60'a çıkarmak için bağlamlı sözlük genişletmesini ayrı içerik çalışması olarak uygula. Hazır 43 ID'nin yayını dahi paket A1/A2 oranlarını %60'a çıkarmaz.

## 15 Ekim doğrulaması

**74 backend testi** (13 yeni denetim testi dahil) ve admin HTTP uçtan uca kontrolü başarılı. Negatif testler eksik çeviri, bozuk sıra/bağlantı, yanlış revizyon sahibi, eksik revizyon, medya bozulması ve yetersiz kapsamanın reddedildiğini doğruladı. Yerel sıkı kontrol exit 1 verdi; anonim canlı snapshot ve 50 medya dosyası başarıyla okundu. Bu çalışma canlı veri, şema, yayın veya kullanıcı kayıtlarını değiştirmedi. Q4 bütünü henüz tamamlanmadı.
