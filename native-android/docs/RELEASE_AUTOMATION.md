# Sürüm otomasyonu

15 Ekim 2026 · Kalite yol haritası Q2.4.

[`release.yml`](../../.github/workflows/release.yml) seçilen commit'ten imzalı APK ve AAB üretir. Ardından [`verify_release.py`](../../tooling/verify_release.py) ile doğrular ve istenirse AAB'yi Play **dahili test** kanalına yükler. Üretim kanalına, kademeli dağıtıma veya mağaza beyanlarına dokunmaz; onlar [kademeli yayın listesindeki](STAGED_RELEASE.md) elle yapılan adımlardır.

## Ne yapar

1. Girdileri denetler. Sürüm kodu 48'den büyük olmalı, sürüm adı `2.1.0` biçiminde olmalı. Play'e yükleme yalnız `master` dalından yapılır.
2. `release` ortamındaki gizli değerlerden keystore'u, `signing.properties` dosyasını ve `app/google-services.json` dosyasını geçici olarak oluşturur.
3. `-PreleaseVersionCode` / `-PreleaseVersionName` ile `assembleRelease` ve `bundleRelease` derlemelerini çalıştırır. Release derlemesi R8 mapping dosyasını Crashlytics'e de yükler.
4. `verify_release.py --expected-version-code` şunları denetler:
   - istenen sürüm kodu,
   - APK < 15 MB,
   - üretim servis adresi, test adresinin pakette bulunmaması,
   - Play yükleme sertifikası, APK/AAB imzası,
   - 16 KB hizalama, baseline profile ve AD_ID izni.
5. Sürüm kodunu, boyutları ve SHA-256 değerlerini çalışma özetine yazar. Doğrulama raporunu 90 gün saklanan artifact olarak ekler.
6. `upload_to_internal` seçildiyse AAB'yi ve mapping dosyasını dahili kanala `completed` durumuyla yükler.
7. Her durumda özel dosyaları siler.

Depo herkese açık olduğu için imzalı paketler ve mapping dosyası artifact olarak saklanmaz. Paketler Play'de, mapping dosyası Play ve Crashlytics'te kalır.

## Bir kez yapılacak kurulum (uygulama sahibi)

Gizli değerler yalnız GitHub `release` ortamına girilir; depoya veya loglara yazılmaz. Ortama **Required reviewers** eklemek önerilir. Böylece her çalışma, gizli değerler açılmadan önce onay bekler. 16 Ekim kurulumunda ortam yalnız `master` dalını kabul eder; başka dal denemesi için ortam politikasını ayrıca gözden geçirmek gerekir.

| Secret | İçerik |
|---|---|
| `ANDROID_UPLOAD_KEYSTORE_BASE64` | Play'e kayıtlı yükleme keystore'unun base64 hali (SHA-1 `EF:07:C9:73:…:48:30`) |
| `ANDROID_UPLOAD_STORE_PASSWORD` | Keystore parolası |
| `ANDROID_UPLOAD_KEY_ALIAS` | Anahtar adı |
| `ANDROID_UPLOAD_KEY_PASSWORD` | Anahtar parolası |
| `GOOGLE_SERVICES_JSON_BASE64` | `app/google-services.json` dosyasının base64 hali |
| `PLAY_SERVICE_ACCOUNT_JSON` | Play yükleme servis hesabının JSON anahtarı (yalnız yükleme için gerekir) |

```bash
gh api -X PUT repos/yurkenn/english-tales/environments/release
```

```bash
base64 -i /path/to/upload-keystore.jks | gh secret set ANDROID_UPLOAD_KEYSTORE_BASE64 --env release
```

```bash
base64 -i native-android/app/google-services.json | gh secret set GOOGLE_SERVICES_JSON_BASE64 --env release
```

Parolaları ve anahtar adını `gh secret set ANDROID_UPLOAD_STORE_PASSWORD --env release` gibi komutlarla etkileşimli olarak gir. Parolalar Java `.properties` dosyasına yazılır; ters eğik çizgi (`\`) içeren bir parola bozulur.

Servis hesabını kurmak için:

1. Google Cloud projesinde **Google Play Android Developer API**'yi etkinleştir.
2. Bir servis hesabı ve JSON anahtarı oluştur.
3. Play Console → Kullanıcılar ve izinler bölümünde servis hesabının e-postasını davet et. Yalnız bu uygulama için test kanallarına yayınlama iznini ver; üretim yayını izni verme.
4. JSON anahtarını `gh secret set PLAY_SERVICE_ACCOUNT_JSON --env release < key.json` ile kaydet, sonra yerel kopyasını sil.

## Çalıştırma

Workflow, `workflow_dispatch` olduğu için ancak `master`'a birleştikten sonra görünür. İlk çalıştırmayı yüklemesiz yap ve özeti kontrol et:

```bash
gh workflow run release.yml --ref master -f version_code=49 -f version_name=2.1.0
```

Sonra aynı commit için dahili kanala yükle:

```bash
gh workflow run release.yml --ref master -f version_code=49 -f version_name=2.1.0 -f upload_to_internal=true
```

Play aynı sürüm kodunu ikinci kez kabul etmez. Yüklemesiz bir deneme yükleme hakkını harcamaz. Ancak yüklenen her sürüm için kod, Console'daki en yüksek koddan büyük olmalıdır.

## Doğrulama ve sınırlar

- Yerelde `-PreleaseVersionCode=49` ile imzalı APK/AAB üretildi (`-x uploadCrashlyticsMappingFileRelease`). `verify_release.py --expected-version-code 49` geçti: APK 8,0 MB, AAB 11,5 MB. `--expected-version-code 50` beklendiği gibi başarısız oldu. Parametresiz derleme 48 / 2.0.0 olarak kaldı.
- **16 Ekim 2026:** `release` ortamı ve beş zorunlu secret kuruldu. Ortam yalnız `master` dalına açık ve `yurkenn` required reviewer. İlk yüklemesiz [GitHub çalışması](https://github.com/yurkenn/english-tales/actions/runs/38959199613) başarılı: commit `0c7ac02c0551ed3b0edf9297bfdfdd1cf872a9f9`, **49 / 2.1.0**, imzalı APK/AAB, `uploadCrashlyticsMappingFileRelease` ve paket doğrulaması geçti. APK 9.307.385 bayt, AAB 13.387.779 bayt. [Doğrulama raporu](release-evidence/2026-10-16-ci-49.json). Play yükleme adımı atlandı; `PLAY_SERVICE_ACCOUNT_JSON` kurulmadı. Bu sonuç dahili kanal veya üretim yayını değildir. [Güncel hesap adımları](../../senin-adimlarin.md).
- Statik paket denetimi; Play'in ürettiği split APK'lar, gerçek 16 KB cihaz ve eski sürümden güncelleme [kademeli yayın listesinde](STAGED_RELEASE.md) ayrıca doğrulanır.

## İlk dahili kanal yayını — 16 Ekim 2026

Güncel master `a14fa5f` kodunu içeren kaynak commit `6f48040` ile **49 / 2.1.0** yerelde üretildi ve Console’dan elle dahili testte yayımlandı (23:38 TRT, Active / Available to internal testers). Bu, `PLAY_SERVICE_ACCOUNT_JSON` veya workflow’un otomatik yükleme adımını doğrulamaz; onlar isteğe bağlı olarak açık. **49 artık Play’de kullanılmış sürüm kodudur; sonraki farklı paket için en yüksek Play kodunu tekrar kontrol edip en az 50 kullan.** [Paket ve yayın kanıtları](../../senin-adimlarin.md).
