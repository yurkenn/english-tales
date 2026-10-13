# 16 KB yayın paketi kontrolü

11 Ekim 2026

## Analiz ve düzeltme

Önceki kontrol RELRO son adresinin her durumda 16 KB sınırında olmasını istedi ve yanlış hata verdi. `graphics-path` 1.1.0 için RELRO aralığı `0x5b40..0x6000`, aynı LOAD bölümünün tamamıdır; sonraki yazılabilir bölüm `0x9ed8` adresindedir. Bu düzen Android Studio'nun resmi prefix/suffix kontrolünden geçer.

[Resmi Android Studio kontrol kodu](https://android.googlesource.com/platform/tools/base/+/f8b1f24565f2769ac07c5b6ea4b10d3c826757d2/sdk-common/src/main/java/com/android/ide/common/pagealign/PageAlignUtils.kt) incelendi. `tooling/elf_alignment.py` LOAD hizalaması/adres eşleşmesi, RELRO başlangıcı, sonu ve sonraki LOAD taşması kontrollerini yapar. Tam LOAD sınırında bitme istisnası eklendi. Gerçekten yazılabilir bölümün ortasında biten RELRO, yanlış başlangıç, sonraki LOAD'a taşma ve 4 KB LOAD örnekleri başarısız kalır. Altı regresyon testi geçti. Section eşdeğerliği istisnası uygulanmadığı için araç bu konuda resmi araçtan daha sıkıdır.

## İmzalı aday üzerinde sonuç

- Paket: `com.yurken.englishtales`, 47 / 2.0.0.
- APK upload sertifikası Play ile eşleşti; AAB imzası doğrulandı.
- ZIP hizalaması ve ARM64/X86_64 ELF kontrolleri geçti; APK/AAB kütüphaneleri aynı.
- APK SHA-256: `465a84b6b74ea7bb42d49c7748852ddb6c9d90da49d60272936a0cb0c113353a`.
- AAB SHA-256: `24217679a80075855c9da1258ee2fa3dcf131e0e3bb1eab706319db0139a5f41`.
- Ayrı `Medium_Phone_2`, Android API 37.2 x86_64 emülatöründe `getconf PAGE_SIZE = 16384`.
- İmzalı, küçültülmüş release APK kuruldu; başlangıç ekranı açıldı. Android `pageSizeCompat=0` gösterdi.
- Aynı imzalı test APK'sındaki framework instrumentation kütüphaneyi doğrudan yükledi: **Native path library loaded successfully at 16384 bytes**. Test paketi app sınıflarını değiştirmez ve normal AndroidX test bağımlılıklarını kullanmaz. Yeni Android'in platform Path API'sini kullanıp kütüphaneyi hiç yüklememesi sonucu gizleyemez.

## Tekrar çalıştırma

Özel imza ve genel servis ayarları yerelde bulunmalıdır:

```powershell
.\gradlew.bat -PreleaseDeviceTest=true :app:assembleReleaseAndroidTest
adb -s emulator-5556 install -r app/build/outputs/apk/release/app-release.apk
adb -s emulator-5556 install -r app/build/outputs/apk/androidTest/release/app-release-androidTest.apk
adb -s emulator-5556 shell am instrument -w com.yurken.englishtales.test/com.yurken.englishtales.data.NativeAlignmentInstrumentation
```

Normal 46 cihaz testi ayrı debug göreviyle çalışır. Aynı 16 KB test emülatöründe tüm 46 test ayrıca başarılı tamamlandı; 11 birim testi ve debug/release Lint de başarılı. Gerçek kullanıcı oturumunun bulunduğu emülatöre farklı imzalı APK kurulmaz, uygulama kaldırılmaz. İmzalı probe sonrası sadece yeni test emülatöründeki kişisel veri içermeyen teknik aday debug test paketiyle değiştirildi.

Bu sonuç x86_64 emülatöründe runtime ve iki ABI'de statik doğrulamadır. ARM64 gerçek cihaz, Play'den oluşturulmuş split APK'lar, mağaza imzasıyla Google girişi ve eski sürümden güncelleme hâlâ ayrı yayın kapılarıdır. Diğer servis/hesap kapıları tamamlanmadan bu teknik aday yayınlanmaz.
