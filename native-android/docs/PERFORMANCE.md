# Performans altyapısı — Q2.3

15 Ekim 2026. Macrobenchmark senaryoları, kaynak Baseline/Startup Profile dosyaları ve release paketleme kontrolü eklendi. Profiller kalıcı depoda `77535d1` commit'inde kayıtlı. **Fiziksel cihazda hızlanma ölçüldüğü veya Q2.3'ün tamamlandığı iddia edilmez.**

## İzole uygulama

`performance` varyantı release optimizasyonlarını (R8/kaynak küçültme) kullanır; debug anahtarıyla imzalanır, `debuggable=false`, `profileable=true`. Uygulama kimliği `com.yurken.englishtales.benchmark`; mevcut uygulamanın öğrenme verisini kullanmaz. Supabase/Google giriş ayarları boş, reklam ve Analytics kapalı, Crashlytics collection/mapping yüklemesi kapalıdır. Yerel katalog kullanılır; canlı indirme/eşitleme performansı ölçülmez.

`:macrobenchmark` test paketi `com.yurken.englishtales.macrobenchmark` kimliğiyle ayrıdır. Üretici yalnız `nonMinifiedPerformance`, ölçümler optimize edilmiş `performance` paketini kullanır. Üretim paketini profil üretimi için kuran test varyantları kapalıdır.

## Senaryolar ve sınırlar

- `BaselineProfileGenerator.startup`: ilk veya geri dönen kullanıcının açılışını Startup Profile'a ekler.
- `returningGuestTabs`: gerekiyorsa misafir onboarding'ini tamamlar, ilk hikâyeden döner; Oku → arama/listede kaydırma → Oyna → Profilim → Çalış yolunu Baseline Profile'a ekler.
- `coldStartupWithoutProfile` / `coldStartupWithProfile`: `CompilationMode.None` ve `Partial(BaselineProfileMode.Require)` ile soğuk açılışın ilk kare süresi (TTID). Katılım/onboarding hazırlığı ölçüm dışında yapılır. Profil gereken koşu, gömülü profil kurulamazsa başarısız olur.
- `tabNavigation`: aynı gerçek UI yolunda `FrameTimingMetric`. Varsayılan 5 tekrar; `performanceIterations` argümanı 1–50 arasında değiştirilebilir.

TTID, marka animasyonunun bitmesi veya içeriğin tamamen görünür olması (TTFD) değildir. Denenen `ReportDrawnWhen` bildirimi API 36 ARM64 emülatöründe tekrarlayan `No RT frame slice ... reportFullyDrawn` eşleştirme hatası ürettiği için uygulamaya eklenmedi. TTFD ayrıca doğrulanmalıdır. UI metinleri bulunmadan test ilerlemez; onboarding seçimi görünür/tıklanabilir olmalı ve tıklamadan sonra seçenek kaybolmalıdır.

## Çalıştırma

JDK 17+ / Android SDK ile `native-android/` içinde, API 33+ bağlı test cihazında:

```sh
bash gradlew :app:generateBaselineProfile
bash gradlew :macrobenchmark:connectedPerformanceAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=com.yurken.englishtales.benchmark.StartupBenchmark
```

Üretilen dosyalar `app/src/main/generated/baselineProfiles/` altına kopyalanır. Üretici bağımlılığı yalnız `performance` varyantındadır; `mergeIntoMain=true` ile aynı namespace'in release koduna da uygulanır ve R8 tarafından uyarlanır. `automaticGenerationDuringBuild=false`: sıradan debug/release derlemeleri cihaz açmaz. Üretilen profilleri kaynakla birlikte commit etmeden, release APK içindeki `assets/dexopt/baseline.prof` / `.profm`, AAB içindeki `BUNDLE-METADATA/com.android.tools.build.profiles/baseline.prof` / `.profm` ve uygulama kurallarının R8 girdilerini doğrulamadan paketleme tamamlandı sayılmaz.

Emülatörde yalnız akış kontrolü için komutlara `-Pandroid.testInstrumentationRunnerArguments.androidx.benchmark.suppressErrors=EMULATOR` ekle; ölçümde `-Pandroid.testInstrumentationRunnerArguments.performanceIterations=1` kullanılabilir. Bu bastırma varsayılan kaynak ayarında yoktur. Tek tekrar veya emülatör sayıları performans kazanımı/eşik olarak kullanılmaz.

CI, mevcut uygulama cihaz testlerinden sonra üç ölçüm senaryosunu birer kez çalıştırır. JSON/Perfetto ve test raporları `android-device-tests` artefaktına eklenir. Yerel çıktılar `macrobenchmark/build/outputs/connected_android_test_additional_output/` altında tutulur. Raporla birlikte commit, cihaz/OS, varyant, iterasyon ve compilation mode kaydedilmelidir.

## Doğrulama kaydı

Kaynak `77535d1`; API 36 ARM64 `English_Tales_Native` emülatörü. Profil üretimi **2/2**, optimize edilmiş `performance` paketinde Macrobenchmark **3/3** başarılı; hata/atlama yok. Her ölçüm senaryosu bir tekrar, `suppressErrors=EMULATOR` ile çalıştı. Profil zorunlu soğuk açılış ve sekme gezinmesi `Partial(Require)`, profilsiz açılış `None` kullanır.

| Kaynak profil | Toplam kural | Uygulama kuralı |
|---|---:|---:|
| `baseline-prof.txt` | 20.988 | 1.122 |
| `startup-prof.txt` | 17.787 | 855 |

Yerel smoke kaydı: profilsiz TTID 1.666,61 ms; profil zorunlu TTID 1.447,20 ms. Gezinmede 73 kare; CPU kare süresi P50 27,75 / P95 80,16 ms. **Tek tekrarlı emülatör sayıları hızlanma veya hedef kabulü değildir.** Ham JSON, Perfetto izleri ve test XML'leri Gradle çıktılarında; cihaz/kaynak özeti ve komut günlükleri Git dışı `native-android/build/performance-evidence/` altında saklanır.

## İmzalı paket doğrulaması

İmzalı `48 / 2.0.0` APK ve AAB yeniden üretildi. `tooling/verify_release.py` kaynak uygulama kurallarını, release R8 profilinde `MainActivity` kuralını, APK/AAB profil başlıklarını, imzaları, üretim adresini/test adresinin dışlanmasını, AD_ID iznini ve statik ZIP/ELF64 16 KB hizalamasını doğruladı. Her iki pakette `baseline.prof` 8.612 bayt, `baseline.profm` 489 bayt. AAB SHA-256: `d8a341d27497870f74089c60a30b654f28af03f8195bbaeb4edb7a86b84d874c`.

Bu yerel paket kontrolü Play yüklemesi değildir; Crashlytics mapping yüklemesi çalıştırılmadı. PR ve güncel CI sonuçları: [#26](https://github.com/yurkenn/english-tales/pull/26/checks). CI cihaz raporları mevcut uygulama testleri ile üç Macrobenchmark senaryosunu ayrı XML/JSON dosyalarında saklar.

## Açık kabul adımları
- Aynı fiziksel cihaz/OS/ısı koşullarında en az varsayılan 5 tekrarla None/Require TTID ve gezinme kare yüzdeliklerini karşılaştır; TTFD doğrulamasını tamamla.

## Kaynaklar

- [Android Macrobenchmark](https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview)
- [Baseline Profile üretimi](https://developer.android.com/topic/performance/baselineprofiles/create-baselineprofile)
- [Profil Gradle yapılandırması](https://developer.android.com/topic/performance/baselineprofiles/configure-baselineprofiles)
- [AndroidX Benchmark 1.4.1](https://developer.android.com/jetpack/androidx/releases/benchmark#1.4.1)
