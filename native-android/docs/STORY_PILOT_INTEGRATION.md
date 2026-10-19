# Mevcut hikâye pilotu — yerel okuyucu ve tekrar entegrasyonu

19 Ekim 2026 · **Yerel sözleşme doğrulandı; içerik yayımlanmadı.**

Beş mevcut hikâyenin seçilmiş çalışma listesi, sunucudan indirilen revizyonlarda zaten kullanılan `words` ve `links` yapısına çevriliyor. Yeni tablo, RPC, ağ çağrısı, uygulama çalışma zamanı modeli veya bağımlılık eklenmedi. Önceki iki yeni klasik taslağı beklemede ve bu çıktının dışında.

## Hazırlanan akış

1. `story-pilot:preview`, yalnız `pilot-scope.json` içindeki mevcut hikâye revizyonlarını okur. Kaynak katalog özeti değişmişse durur.
2. Hikâyenin seçilmiş 8–15 kelimesini alır. Mevcut bir kelime kimliğine farklı metin/anlam yazılmasını, eksik/tekrarlı kimliği ve metinde bulunmayan çalışma kelimesini reddeder.
3. Mevcut `matchWords` ile uzun ifade önceliğini koruyarak cümle–kelime bağlantılarını üretir. Diğer hikâyelerden global sözlük eşleşmeleri çalışma listesine sızmaz.
4. Açıklama, cümle ve kelime karşılıklarını gerçek alanlardan 11 dilde doğrular. Eksik çeviriyi Türkçe veya İngilizce ile tamamlandı gibi göstermez. Tüm soruların kaynak cümle ve gerekçe kaydı gerekir.
5. Yerel cache biçimindeki önizlemeleri ve kaynak/doküman özetlerini `build/story-pilot-preview/` içine yazar. Bunlar sunucu revizyonu veya yayın payload'ı değildir; yerel UUID'ler içerik değişince değişir. `published_at` tarihi uydurulmaz.
6. Android test varlığı `ContentCodec` ile açılır. Mevcut okuyucu kelime seçicileri, kaydetme, tekrar basamağı, FSRS ve revizyon kimlikli bekleyen olaylar aynı veriyi kullanır.

`--require-reviewed`, gerçek dosyalardaki dolu `reviewedBy` ve tüm destek dillerini içeren dizi biçimindeki `reviewedLanguages` kaydını ister. **Mevcut taslaklarda bu mod beklenen şekilde reddedilir.** Araç inceleyen kişi atamaz veya onay üretmez. Bu yalnız kayıtlı editoryal incelemeyi kontrol eder; yayın yetkisi/rolü vermez ve canlı kabulün yerine geçmez.

## Komutlar

`native-android/backend/` dizininde:

```sh
npm run story-pilot:preview
npm run story-pilot:preview -- --require-reviewed
npm run story-pilot:preview -- --fixture-output ../app/src/androidTest/assets/story-pilot/quiet-morning.json
npm test
```

İkinci komut şu anda `Human editorial/language review pending` hatasıyla çıkmalıdır. Varsayılan komut onaysız taslağı yalnız yerel inceleme için derler. `--apply`/yayın seçeneği yoktur; araç kullanıcı hesabı veya servis anahtarı okumaz. Normal veya sembolik bağlantılı üretim `app/src/main/` hedeflerine çıktı yazılması reddedilir. Test varlığı yalnız `src/androidTest/assets/` içinde; üretim APK'sına dahil değildir. Backend testi, bu varlığın gerçek pilot çıktısıyla aynı kaldığını denetler.

Android testi:

```sh
ANDROID_SERIAL=emulator-5556 bash gradlew :app:connectedDebugAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=com.yurken.englishtales.data.StoryPilotIntegrationTest
```

Bu komut `native-android/` içinden, uygun JDK/SDK ile çalıştırılır. Testte rastgele kimlikli ayrı yerel hesap veritabanı kullanılır ve temizlenir; gerçek hesap oturumu veya bulut eşitlemesi başlatılmaz.

## Doğrulanan sonuç

- Backend: **165 test, 0 hata, 0 atlama**. Yedi yeni test; kaynak kayması, yanlış kimlik, eksik çeviri, inceleme kaydı, üretim çıktı koruması, deterministik önizleme ve fixture eşleşmesini kapsar.
- Android: **3 test, 0 hata, 0 atlama**, API 36 `English_Tales_Language_Test` emülatörü. Android tarafında A Quiet Morning test varlığı, cihazın seçili destek diliyle kullanıldı; 5 hikâye/11 dilin yapısal kapsamı backend testindedir. Test varlığında yalnız 10 bağlı kelime seçiliyor; seçilmemiş global kelime eklenmiyor.
- Pilot kelimesi kaydediliyor, tekrar basamağı seçiliyor, doğru yanıttan sonra sonraki FSRS zamanı ileriye gidiyor. Kaydet/tekrar olayları yakalanan revizyon kimliğini koruyor.
- Yeni cümleler eklendiğinde eski cümle konumu taşınabiliyor; önceki kayıtlı kelime ve eski revizyon korunuyor.
- Debug ve Android test paketleri derlendi. Bu sonuç arayüzde tam okuma yolculuğu, gerçek bulut eşitlemesi, fiziksel telefon kabulü veya üretim yayını değildir.

[Makine okunabilir kanıt](release-evidence/2026-10-19-story-pilot-integration.json) · [İngilizce/Türkçe okuma önizlemesi](STORY_PILOT_READING_2026-10-19.md).

## Canlıya geçmeden önce

[AI destekli editoryal/dil tutarlılığı incelemesi](STORY_PILOT_EDITORIAL_REVIEW_2026-10-19.md) ile [Claude ikinci incelemesinin](STORY_PILOT_CLAUDE_REVIEW_2026-10-19.md) düzeltmeleri tamamlandı; insan editör ve ana dil konuşuru kabulü hâlâ açık. Önizleme kaynağı **paket kataloğudur**; güncel canlı revizyon ile eşitliği kanıtlamaz. Yayın kapsamına geçildiğinde güncel snapshot, gerçek kaynak revizyonu/`edit_version`, mevcut kapak ve ses referansları korunarak stüdyo kontrolleri gerekir. Yerel önizleme UUID'si gerçek sunucu revizyonu yerine kullanılmaz. Ardından anonim katalog, indirme/çevrimdışı okuma, arayüz ve hesap eşitlemesi gerçek yayımlanmış revizyonda doğrulanır.

## Canlıya alma — taslak oluşturma ve yayın

`npm run story-pilot:drafts`, beş pilot revizyonunu `content:drafts` ile aynı güvenli yoldan **editör taslağı** olarak Supabase'e yazar. Araç `admin_publish` çağırmaz; yayın panelde yayıncı hesabıyla yapılır. Mevcut kapak/ses korunur, eski revizyonlar ve öğrenme geçmişi yerinde kalır, pilot dışındaki 45 hikâyeye dokunulmaz.

Engeller (biri bile varsa `--apply` hiçbir oturum veya ağ isteği açmadan durur):

- Taslakta `reviewedBy` ve 11 dilin tamamını içeren `reviewedLanguages` kaydı yok.
- Canlıdaki cümle kimlik/metinleri, başlık veya seviye pilotun yazıldığı paket metninden farklı (canlıda sonradan düzenleme yapılmış).
- Canlı yayın/`edit_version` snapshot alındıktan sonra değişmiş veya panelde farklı bir açık taslak var (`content:drafts` korumaları).

Sıra, depo kökünden:

1. `env -u NODE_USE_SYSTEM_CA node tooling/backup_public_content.mjs` ile güncel anonim snapshot al.
2. `native-android/backend/` içinde dry-run: `npm run story-pilot:drafts -- --snapshot <snapshot>/catalog.json`. `../build/story-pilot-drafts/review.md` her hikâyenin cümle, soru, eklenen/çıkan kelime ve dil sayısını, engelleri ve payload özetini gösterir.
3. İnsan onayı verildiğinde beş taslağa `reviewedBy` ve `translationReadiness.reviewedLanguages` yazılır (bu kayıt onayın kendisidir; araç üretmez).
4. Editör/yayıncı oturum dosyasıyla (biçim: [içerik kılavuzu](../CONTENT_GUIDE.md#q41--mevcut-yayını-paketten-yeni-taslağa-taşıma)) aynı snapshot ve yeni bir çıktı diziniyle: `npm run story-pilot:drafts -- --snapshot <snapshot>/catalog.json --output ../build/story-pilot-drafts-apply --apply --url https://<project>.supabase.co --session-file <Git-dışındaki-oturum.json>`. Tekrar çalıştırmak güvenlidir; eşdeğer taslak atlanır.
5. Yayıncı panelde beş taslağı açıp yayımlar. Ardından yeni snapshot ile uygulamada katalog, indirme ve çevrimdışı okuma kontrol edilir.

Yerel PostgreSQL testinde gerçek 50 hikâyelik katalog yayımlanır, pilot taslakları RPC'lerle kaydedilir, yayıncı yayımlar ve anonim katalog beş hikâyeyi 11 dilde sunar; diğer hikâyelerin revizyonu değişmez (`tests/story-pilot-drafts.test.mjs`).
