# İçerik yönetimi

Android, ilk açılışta `app/src/main/assets/catalog/v1.json` içindeki çevrimdışı kataloğu okur. Supabase bağlantısı yapılandırılmışsa yayımlanmış uzak katalog yenilendiğinde aktif listeyi onunla değiştirir. Bu nedenle yalnızca APK kataloğunu genişletmek, canlı kullanıcılara yeni hikâyeleri sunmak için yeterli değildir.

## Hazırlanan hikâye pilotu — 19 Ekim 2026

[Beş mevcut hikâyenin aktif iyileştirme pilotu](docs/STORY_QUALITY_PILOT_2026-10-19.md) · [İngilizce/Türkçe okuma önizlemesi](docs/STORY_PILOT_READING_2026-10-19.md). `backend/content/drafts/revisions/` mevcut hikâyelerin kaynak özetli yeni revizyon önerilerini, `drafts/stories/` yeni hikâye taslaklarını tutar. Yeni hikâye ekleme kullanıcı isteğiyle durduruldu; önceki iki klasik taslağı beklemede korunur (`pilot-scope.json`). Beş mevcut revizyonun tamamında 11 destek dilinde metin alanları dolu; insan dil incelemesi ve canlıya aktarım açık. Yerel okuyucu/kaydetme/tekrar entegrasyonu [önizleme aracı ve Android testiyle](docs/STORY_PILOT_INTEGRATION.md) doğrulandı. Bunlar otomatik katalog girdisi veya stüdyoya aktarılmış payload değildir; editör, diğer diller, yeni kapaklar ve yayın kabulü beklenir.

## Güncel paket

50 hikâye, 1002 İngilizce/Türkçe cümle çifti ve 359 kelime/ifade (316 klasik paket + 37 kelime ve 6 ifade pilotu, 15 Ekim 2026). A1: 18, A2: 18, B1: 14 hikâye. Bunların 44'ü kaynakları kontrol edilmiş klasiklerin seviyeli kısa uyarlamalarıdır. Mevcut altı özgün hikâyenin kimlikleri, metinleri ve kelime eşlemeleri korundu.

[Klasiklerin kaynak ve uyarlama kaydı](docs/PUBLIC_DOMAIN_CLASSICS.md) · [Makine tarafından okunabilen kaynaklar](backend/content/classic-sources.json).

Bu sayılar paketin içeriğini belirtir. Canlı ortamın yayın durumu, anonim API üzerinden ayrıca doğrulanmalıdır; `catalog:export` yayın yapmaz.

[Q4 içerik denetimi ve tekrar çalıştırma](docs/CONTENT_QUALITY_AUDIT.md): `npm run content:audit` paket yapısını; anonim snapshot ile çalıştırıldığında etkin canlı revizyonları, kelime bağlantılarını, kapsama oranını ve medya baytlarını denetler. Sıkı yayın kontrolü için `--require-parity --min-coverage 60` kullanılır. Varsayılan yapısal kontrolün geçmesi bu iki hedefin sağlandığı anlamına gelmez.

[Destek dili sözleşmesi](backend/TRANSLATION_CONTRACT.md): Türkçe eski alanlarda korunur ve `tr` çeviri satırlarıyla aynı işlemde eşitlenir. Yeni diller cümlede/kelimede `translations`, hikâyede `descriptions` haritasıyla hazırlanabilir. Exporter eski alanlardan her zaman `tr` üretir; ek haritaları da taslağa aktarır. Panelde destek dili seçilerek açıklama, cümle çevirisi ve kelime karşılığı düzenlenir. İngilizce içerik bütün dillerde ortaktır.

`npm run content:audit -- --require-lang tr` Türkçe bütünlüğünü zorunlu tutar; örneğin `--require-lang es-419` o dilin bütün etkin katalogdaki cümle, kelime ve açıklamalarını ister. Raporda dil başına eksik sayıları bulunur. Yayın kontrolü revision'a eklenmiş her dilin o revision'da tam olmasını ister; hiç eklenmemiş bir dil yayını engellemez. Boş taslak alanı çeviri satırı üretmez ve yayınlanana kadar tamamlanmalıdır.

## İngilizce anlama soruları (Q5.3)

[Soru sözleşmesi](backend/QUESTIONS_CONTRACT.md): hikâyede isteğe bağlı `questions: [{id,kind,prompt,options,answer}]` dizisi kullanılır. Soru ve seçenekler İngilizcedir; destek diline göre açıklama/çeviri yoktur. `kind`: `main`, `detail`, `inference`; 2–4 dolu ve farklı seçenek, sıfır tabanlı doğru yanıt indeksi gerekir. Kalıcı soru kimliklerini koru. Dizi sırası exporter tarafından `position=index+1` yapılır. Eski sorusuz revizyonlar geçerlidir.

Panelde **Anlama soruları** sekmesinde listeyi düzenle; doğru seçenek panelde 1–4, API’de 0–3’tür. Yayın kontrolü kesintisiz sıra ister. `content:drafts` soru farkları için yeni taslak üretir; hedef liste paketi izler. Pakette sorular yoksa hedef taslak listesi boştur; eski yayın değişmez. Admin API’sinde alanın verilmemesi ise mevcut listeyi korur, `[]` temizler.

`npm run content:audit -- --min-questions 3` her hikâyede en az üç geçerli soru ister; snapshot verilirse hem paket hem etkin snapshot hikâyeleri denetlenir. Rapor seviye başına ≥3 geçerli sorulu hikâyeleri ve sorusuz hikâye ID’lerini listeler. Varsayılan denetim minimum soru sayısı dayatmaz. Soruların metne uygunluğunu ve İngilizcesini editör ayrıca kontrol eder.

## Yeni içerik hazırlama

1. Yazarın ve kullanılan çevirinin hak durumunu, kaynak metni ve kapak haklarını kontrol et. Kaynak bağlantısını ve kullanılan baskı/çevirmeni kaydet.
2. İngilizce/Türkçe cümleleri sabit kimliklerle hazırla; seviyeli uyarlamayı tam özgün metin gibi sunma. Yazar alanını gerçek yazara ayır.
3. Kalıcı yeni hikâye/cümle/kelime kimlikleri kullan. Eski metni veya yayımlanmış revision'ı üzerine yazarak düzeltme; düzeltmeler yeni revision gerektirir.
4. Kelime ve ifadeler panel, yayın kontrolü, exporter ve Android'de aynı kuralla eşleşir: büyük/küçük harf yok sayılır, harf/rakam dışı her karakter ayırıcıdır, yalnız bütün sözcükler eşleşir. “picked up” ifadesi “picked-up” ile, “lion” kelimesi “lion's” ile eşleşir; “cat” “category” ile eşleşmez. Çakışmada soldan sağa en uzun öğe kazanır. Ortak sözlük köke indirgeme yapmaz. Yeni kelimenin eski metinlerde bulunması eski hikâyelerin kelime çalışmalarını da değiştirebilir. Bu pakette yeni kelimeler eski altı metinde bulunmayan token'lardan seçildi. Yeni bir anlam mevcut kelime ID'sine yazılmamalıdır.
5. Kapak kaynağını PNG olarak `backend/content/covers/` altına ekle, `python3 ../tooling/build_app_images.py` ile uygulamanın WebP kopyasını üret ve `BookCover.kt` eşlemesine dahil et. PNG, Storage yüklemesi ve checksum için kaynak kalır. Görsel, 4096 px ve 6 MB indirme sınırlarına uymalı.
6. `backend` içinde `npm run catalog:export` çalıştır. Bu, sabit kimlikli **taslak** SQL ve kapak checksum/yükleme manifesti üretir; mevcut revision'ı değiştirmez, dosya yüklemez ve hikâye yayımlamaz.
7. `npm test`, `npm run test:admin`, Android derleme/lint ve ilgili emülatör akışlarını doğrula.

## Sunucuda yayın

[İçerik stüdyosu](backend/admin/README.md), gerçek editör/yayıncı hesabı ve mevcut RPC'ler kullanılır. Editör taslak düzenler; yayınlama publisher rolüne aittir.

### Q4.1 — mevcut yayını paketten yeni taslağa taşıma

`content:drafts`, etkin yayın ile paket arasındaki farklar için tekrar çalıştırılabilir inceleme paketi üretir. Varsayılanı **ağ kullanmayan dry-run** işlemidir. `--apply` yalnız taslak oluşturur/kaydeder; aracın RPC izin listesinde `admin_publish` bulunmaz. Yayını insan yayıncı panelde tamamlar.

1. Depo kökünde `env -u NODE_USE_SYSTEM_CA node tooling/backup_public_content.mjs` ile anonim snapshot al. Çıktıdaki `catalog.json` ve yanındaki `media/` dizinini birlikte sakla. Bu komut operatörün canlı ortamda çalıştıracağı salt okunur adımdır; yerel testler canlıya bağlanmaz.
2. `native-android/backend/` içinde aşağıdaki ilk iki komutu çalıştır. `<önce>` snapshot'ın `catalog.json` dosyasıdır. Aynı inceleme için aynı `--output` dizinini kullan.

   ```sh
   env -u NODE_USE_SYSTEM_CA npm run content:audit -- --snapshot <önce> --require-lang tr
   env -u NODE_USE_SYSTEM_CA npm run content:drafts -- --snapshot <önce> --output ../build/content-drafts-q41
   ```

3. Çıktıdaki `review.md`, `manifest.json` ve `stories/*.json` dosyalarını incele. Raporda hikâye başına eklenen/çıkarılan/güncellenen kelimeler, anlam ve örnekleri; eklenen/çıkarılan bağlantılar ve cümleleri; dil farkları bulunur. İki fazla `asleep` satırı yeni taslakta uzun `falls asleep` ifadesi lehine çıkarılır. **Eski yayın ve öğrenme geçmişi korunur.** Çeviri haritaları paketi birebir izler; pakette olmayan ek diller de yalnız yeni taslaktan çıkarılır. Payload'ı elle düzenlemek uygulamanın girdisi değildir; değişiklik gerekiyorsa kaynak paketi düzeltip yeni çıktı dizininde tekrar incele.
4. İnsan editörün geçerli oturumunu **bütün Git çalışma ağaçlarının dışında**, erişimi `chmod 600` olan bir JSON dosyasında hazırla. Dosya en fazla 1 MB olmalıdır. Şema: `{"access_token":"<editörün erişim tokenı>","publishable_key":"sb_publishable_<proje anahtarı>"}`. `publishable_key` yerine `SUPABASE_PUBLISHABLE_KEY` ortam değişkeni de kullanılabilir. Token yalnız dosyadan okunur; komut satırına, rapora veya Git'e yazılmaz. Oturum yenileme/hesaba giriş araç tarafından yapılmaz.
5. İncelenen aynı girdiler ve çıktı diziniyle uygula. URL, snapshot'ın `project` değeriyle eşleşen `https://<project>.supabase.co` kökü olmalıdır. Yerel testler için localhost HTTP desteklenir; özel alan adları desteklenmez.

   ```sh
   env -u NODE_USE_SYSTEM_CA npm run content:drafts -- --snapshot <önce> --output ../build/content-drafts-q41 --apply --url https://<project>.supabase.co --session-file <Git-dışındaki-oturum.json>
   ```

6. Panelde oluşturulan taslakları, kelime/ifade önizlemesini, destek dillerini ve yayın kontrollerini tekrar incele. **Publisher**, panelde incelediği güncel `edit_version` ile yayımlar. `apply-results.json` taslak ID/sürüm numaralarını ve kaydetme/atlama durumunu içerir; yayın kanıtı değildir.
7. Depo kökünden yeniden snapshot al. Ardından backend içinde yeni `<sonra>` dosyasıyla doğrula:

   ```sh
   env -u NODE_USE_SYSTEM_CA npm run content:audit -- --snapshot <sonra> --require-parity --require-lang tr --output ../build/content-audit-after-q41
   ```

   Başarı, etkin yayınların paketle eşitliğini, Türkçe bütünlüğünü ve snapshot medya baytlarını doğrular. `--skip-media` sıkı eşitlik kabulünü geçemez. `--min-coverage 60` ayrı Q4 hedefidir; paket eşitliği bu hedefi sağlamaz.

Manifest snapshot, paket, kapak manifesti ve araç kaynaklarının SHA-256 özetlerini içerir. `--bundle` ve `--asset-manifest` seçenekleri yerel fixture/alternatif kaynak doğrulaması içindir; varsayılanlar depodaki paket ve exporter manifestidir. Girdi/araç özeti değişirse aynı çıktı dizinine uygulama reddedilir; yeni snapshot ve yeni çıktı diziniyle tekrar incele. Taslakların `p_revision_id` ve `p_expected_version` alanları dosyada `null` şablondur; uygulama `admin_create_draft`/`admin_revision` yanıtındaki gerçek ID ve güncel sürümü `admin_save_draft` çağrısına koyar.

Uygulama, **bütün etkin snapshot hikâyelerinin** canlı `current_revision_id`, `edit_version`, arşiv ve içerik durumunu ilk yazmadan önce kontrol eder; kayma varsa durur. Açık taslak hedef paketle eşitse yazmadan atlanır. Kaynak yayının birebir kopyasıysa (kesilmiş uygulamadan kalan kopya dahil) kaydedilir; farklı bir editoryal taslak veya birden çok açık taslak varsa hiçbirini ezmez. Eksik/fazla hikâye ve kapak farkı otomatik giderilmez; raporda uygulama engelidir. Kapak ve ses ID'leri korunur; medya yüklenmez.

Her hikâyenin kaydı mevcut RPC içinde atomiktir; tüm hikâyeler birlikte tek işlem değildir. Kontrol oluşturma/kayıt çevresinde tekrarlanır ve taslak kaydı `edit_version` ile korunur. Ayrı RPC'ler yayıncıyı bütün çalışma boyunca kilitlemez: eşzamanlı yayın nedeniyle geç fark edilen kayma veya ağ kesintisi daha önce kaydedilmiş/yeni kopyalanmış taslak bırakabilir. `apply-results.json` tamamlanan adımları tutar; hata halinde paneli inceleyip aynı komutu tekrar çalıştır. İlk kontrolde bulunan kayma/çatışma hiç yazma yapmaz. Eski snapshot ile yayın sonrası yeniden uygulama reddedilir; yeni snapshot gerekir.

Snapshot’ın altı eski tablosu desteklenir; Türkçe eski alanlardan, eksik soru tablosu boş listeden hesaplanır. `tooling/backup_public_content.mjs` artık üç çeviri tablosunu ve `story_questions` tablosunu da anonim sayfalama ile toplar (toplam 10 tablo). Çeviri grubunda üç tablo birlikte bulunmalıdır; sorular bağımsız isteğe bağlı uzantıdır. Mevcut tablolarda gerçek satırlar esas alınır ([çeviri sözleşmesi](backend/TRANSLATION_CONTRACT.md), [soru sözleşmesi](backend/QUESTIONS_CONTRACT.md)). Araç eski sunucuda yalnız tablo-bulunamadı yanıtında uzantıyı atlar; izin/ağ hatalarını gizlemez. Eski snapshot’ta görünmeyen canlı ek dil veya soru varsa uygulama içerik kayması olarak durur; eksik kaynakla editör içeriği silinmez.

1. Test ortamında yeni taslağı oluştur veya onaylı seed ile ilk revision'ı hazırla.
2. Cümleleri, çevirileri, kelimeleri ve kelime–cümle bağlantılarını incele.
3. Kapağı Storage API ile yeni bir UUID/hash yoluna `upsert=false` kullanarak yükle; geri indirip boyutunu ve SHA-256 özetini kontrol et. SQL ile `storage.objects` satırı eklemek dosya yüklemek değildir.
4. İncelenen `edit_version` ile `admin_publish` çağrısını gerçek publisher oturumundan yap. Yayın kontrolü eksik `tr` veya ek dil çevirisini, eski alanla uyuşmayan Türkçeyi, bozuk sırayı, geçersiz kelime bağlantısını ve yüklenmemiş kapağı reddeder. Her dilin bütün cümle, kelime ve açıklamalarını tamamla.
5. Aynı paketi Production'da yayımla. Eski hikâyeleri ve yayımlanmış revision'ları koru; personel kimliği taklit etme veya RLS'yi kaldırma.
6. Anonim katalogda hikâyelerin görünmesini, yeni içeriğin indirilmesini ve kapak hash'lerini doğrula. Android'de arama, okuma/çeviri, kelime kaydetme, TTS, ilerleme ve ağ kapalı yeniden açmayı kontrol et.

Önceki yayımlanmış sürümler açık okuyucular/öğrenme geçmişi için korunur. Yeni paket uygulama güncellemesinin çevrimdışı başlangıç içeriğine de dahil edilir. Ses dosyası eklenmedi; İngilizce metin mevcut Android TTS ile okunur.

## Bilinen sınırlar

Türler şu an `Günlük yaşam`, `Macera`, `Gizem`; seviyeler A1/A2/B1. Yeni bir tür yalnız JSON'a yazılarak eklenemez; Android ve backend sözleşmeleri birlikte değişmelidir. Kitaplıktaki “Yeni hikâyeler” rafı aktif listenin son üç öğesini alır; gerçek yayın tarihine göre sıralama henüz yoktur.
