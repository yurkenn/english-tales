# Güncel çevrimdışı katalog — 28 Ekim 2026

`catalog/v2.json`, anonim üretim snapshot'ındaki 67 etkin hikâyeyi, 2.839 cümleyi ve 11 destek dilini paketler. 864 hikâye-kelime kaydı / 495 farklı etkin kelime ID'si ve 1.868 editör cümle bağlantısı kaynak revizyonlarına aittir. Kütüphane artık ilk açılışta bu metinleri çevrimdışı okuyabilir. Sunucuya yayın veya içerik düzenlemesi yapılmaz.

## Uyumluluk

- `catalog/v1.json` aynen korunur. Önceden hazırlanmış editör taslakları, revizyon-1 seed'i ve yayın araçlarının kaynakları değişmez.
- V2, gerçek UUID revizyonlarını, ilk yayın tarihlerini, hikâye bazlı sözlüğü ve `sentenceWordIds` bağlantılarını taşır. Bu hikâyelerde ortak sözlükten otomatik yeni bağlantı çıkarılmaz.
- Eski 359 ortak kelime ID'si ve sözlük tanımları korunur; yeni kimliklerle toplam 503 olur. Aynı kimliğin hikâyeye özel tanımı ortak sözlükte diğer hikâyeyi ezmez.
- V1'in 50 hikâyesi `legacyCatalog` içinde saklanır ve eski revizyon UUID'leriyle açılabilir. Arşiv bağlantıları yalnız eski sözlükle dondurulur; eklenen yeni kelimeler eski ders revizyonuna sızmaz. Mevcut eski cümle kimliklerinin tamamı güncel metinlerde hâlâ vardır; okuma konumları bu kimliklerle devam eder.
- İndirilen eski revizyon dosyaları yerinde kalır. Metin + Türkçe kaynak eşleşmesiyle çevrimdışı çeviri bulunabilir; aynı kaynak çifti için farklı çeviriler varsa belirsiz eşleşme kullanılmaz. Dosyadaki açık dil haritası önceliklidir.
- Aynı gerçek revizyonun sunucu metadata'sı, paketteki metin ve editör bağlantılarını kullanır. Başka revizyonun yalnız İngilizce metni eşleşiyor diye eski editör sözlüğü ona taşınmaz; o revizyon indirilmelidir.

## Yeniden üretme ve denetim

`tooling/backup_public_content.mjs` anonim okuma ile yayın snapshot'ı ve hash doğrulanmış medya üretir; Auth ve öğrenme kayıtlarını içermez. Güncel çalışma 28 Ekim snapshot'ını kullanır.

```sh
node tooling/import_published_catalog.mjs SNAPSHOT/catalog.json \
  native-android/app/src/main/assets/catalog/v1.json \
  native-android/app/src/main/assets/catalog/v2.json
node native-android/backend/tools/audit-content.mjs \
  --snapshot SNAPSHOT/catalog.json --require-parity --min-questions 3
python3 tooling/verify_localization.py
```

Dönüştürücü yalnız yerel dosya yazar; aynı girdiden byte düzeyinde aynı çıktı üretir. Eksik çeviri, taslak, yanlış proje veya kapak hash hatasında durur. Yeni kapak üretmez: 67 mevcut APK WebP dosyasının hash/boyutunu kaydeder. Eski 50 kapak için özgün PNG kaynağı; yeni 17 için doğrudan aynı WebP bytes'ı yayın medyasıyla doğrulanır. Denetim fiziksel APK kaynaklarını da yeniden okur; yalnız JSON beyanına güvenmez.

Denetim varsayılan V2'yi kullanır; tarihsel fixture için `--bundle .../v1.json` seçilebilir. Eski ihracat/yayın araçları otomatik olarak V2'ye geçirilmez. Yayın kapsamı veya revizyonları bu paket yenilemesiyle değişmez.

## Kabul sınırları

[Paket/canlı eşitliği](release-evidence/2026-10-28-published-catalog-parity.json) snapshot anı için geçti; 67 kapak ve 11 dil tamdır. İnsan anlam/dil incelemesi veya kalıcı canlı eşitlik iddiası değildir. Canlıdaki 18 editör uyarısı korunur; paket ayrıca arşiv kayıtlarını koruyan 8 kullanılmayan sözlük kimliği için uyarı verir. %60 kelime kapsamı hedefi kapatılmadı, denetim gevşetilmedi. Yayın ve üretim aktivasyonu ayrı adımlardır.

## Yerel doğrulama

244 backend testi, 157 JVM testi ve ilk turdaki 48 hedefli API36 cihaz testi hatasız/atlamasız geçti. Cihaz testleri altı V2 geçiş senaryosunu, 11 dilde çevrimdışı sözlüğü, eski indirmeleri, eski metadata’yı, editör bağlantılarını ve tamamlanmış ilerlemenin revizyon geçişinde korunmasını içerir. Lint: 0 hata / 106 mevcut uyarı. Derlenmiş debug APK’da iki katalog dosyası ve 67 kapak ayrıca doğrulandı. [Test kanıtı](release-evidence/2026-10-28-published-catalog-validation.json). Tam CI sonucu PR üzerinde ayrı izlenir.

İlk tam CI’de 398 uygulama testinden 6’sı başarısızdı. Genel sözlükte eş adlı kelime önceliği düzeltildi; V1’e bağlı eski test beklentileri güncellendi. Sonraki 42 hedefli API36 testi altı hatanın tamamını kapsadı ve hatasız geçti. Yeni tam CI sonucu PR üzerinde ayrı izlenir.
