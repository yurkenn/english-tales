# Google Play mağaza paketi — 14 Ekim 2026

Uygulama: English Tales (`com.yurken.englishtales`). Yeni paket adayı: 48 / 2.0.0. Console’da Production 46 / 1.1.0 ve Internal testing 47 / 2.0.0 doğrulandı. Yüklemeden önce daha yüksek başka kod bulunmadığı yeniden kontrol edilmeli.

## Dosyalar

- `icon-512.png`: onaylanan kitap maskotu; opak kare 512 × 512 PNG.
- `en-US/` ve `tr-TR/`: başlık, kısa/uzun açıklama, sürüm notları ve 1024 × 500 tanıtım görseli. Yükleme için `feature-graphic.jpg` kullanılır.
- `tr-TR/screenshots/`: gerçek Compose ekranlarından 1080 × 1920 görüntüler; örnek kelime seçimleriyle kontrollü demo verisi. Arayüz Türkçedir. İngilizce varsayılan açıklama bunu belirtir.
- Görsellerde puanlama, kullanıcı sayısı veya indirme iddiası yoktur. Metinler sosyal akış/TOEFL gibi mevcut native sürümde olmayan özellikleri vaat etmez.

## Yayın durumu

Bu klasörün hazırlanması mağazaya yayın yapıldığı anlamına gelmez. İmzalı AAB için eski EAS yükleme anahtarı gerekiyor; bu Mac’te keystore veya signing.properties bulunmadı. Anahtarın bulunduğu `yurken/english-tales` EAS projesine Google geçiş anahtarı doğrulaması bekleniyor. Yeni anahtar oluşturulmadı.

Play Console’daki EN açıklamalar düzenleme formuna girildi; kaydetme/yükleme/doğrulama tamamlanmadan güncellenmiş sayfa veya yayın iddiasında bulunulmaz. Mac kilitli bildirimi alındı; kullanıcıdan kilit açma ve Expo girişi istendi.

Üretim reklamları `config/ads.properties` içinde kapalıdır. Yayın beyanları son imzalı paketin gerçek davranışıyla eşleştirilmeli; test reklamı üretime açılmaz.

## Tanıtım görseli üretimi

Yerleşik image_gen kullanıldı. Referans: `brand/english-tales/expressions/welcome.png`. Tam istemler `imagegen-prompts.md` dosyasında; kaynak çıktılar her dilde `feature-graphic-source.png`. Yalnız ölçü/format uyarlaması için sips kullanıldı.

## Resmî ölçü kaynakları

- https://support.google.com/googleplay/android-developer/answer/9866151
- https://developer.android.com/distribute/google-play/resources/icon-design-specifications

## Son yerel doğrulama

- 128/128 Android cihaz testi ve 23/23 JVM testi geçti; debug derleme ve lint başarılı.
- Depo kontrolü ve 6 ELF doğrulayıcı regresyon testi geçti.
- Kütüphane banner'ı da kitap maskotuna geçirildi; güncel ekran yeniden alındı.
- İkon, 6 ekran görüntüsü ve iki tanıtım görselinin ölçü/boyutları doğrulandı (`asset-verification.json`). Gizlilik ve hesap silme sayfaları HTTP 200 döndü.
- Release imzalama, AAB doğrulaması/yüklemesi, Play tarafından üretilen paket kontrolü ve üretim gönderimi **henüz yapılmadı**.
- Mağaza formunda Save as draft denendi fakat kalıcı kayıt sonucu doğrulanamadı; mevcut canlı ikon/görsellerin değiştiği iddia edilmez.
