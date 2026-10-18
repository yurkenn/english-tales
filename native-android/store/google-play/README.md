# Google Play mağaza paketi

## 19 Ekim 2026 — ASO / SEO taslağı

Önerilen yeni varsayılan ad **Learn English: Yurken Stories**, Türkçe **İngilizce Hikâyeler: Yurken**. 10 yeni dil + EN/TR için 13 mağaza kaydının başlık ve açıklamaları hazırlandı (`es-ES`, `es-419` kopyası). [Kaynaklı araştırma, yayın koşulları ve ölçüm planı](../aso/2026-10-19/RESEARCH.md); [metinler](../aso/2026-10-19/metadata.json); [SEO içerik taslağı](../aso/2026-10-19/seo-copy.json).

**Yayınlanmadı.** Metinler çok dilli üretim paketi ve koordineli yeniden adlandırma için taslaktır. Uygulama içi marka, yerel ekran görüntüleri, gerçek üretim dil desteği ve ana dil incelemesi tamamlanmadan Console'a uygulanmamalı. Web sayfaları henüz oluşturulmadı. Aşağıdaki 15 Ekim notları tarihsel durumdur; güncel üretim sürümü kanıtı olarak kullanılmamalı.

## 15 Ekim 2026 — Önceki paket notları

Uygulama: English Tales (`com.yurken.englishtales`). Yeni paket adayı: 48 / 2.0.0. Console’da Production 46 / 1.1.0 ve Internal testing 47 / 2.0.0 doğrulandı. Yüklemeden önce daha yüksek başka kod bulunmadığı yeniden kontrol edilmeli.

## Dosyalar

- `icon-512.png`: onaylanan kitap maskotu; opak kare 512 × 512 PNG.
- `en-US/` ve `tr-TR/`: başlık, kısa/uzun açıklama, sürüm notları ve 1024 × 500 tanıtım görseli. Yükleme için `feature-graphic.jpg` kullanılır.
- `tr-TR/screenshots/`: gerçek Compose ekranlarından 1080 × 1920 görüntüler; örnek kelime seçimleriyle kontrollü demo verisi. Arayüz Türkçedir. İngilizce varsayılan açıklama bunu belirtir.
- Görsellerde puanlama, kullanıcı sayısı veya indirme iddiası yoktur. Metinler sosyal akış/TOEFL gibi mevcut native sürümde olmayan özellikleri vaat etmez.

## Yayın durumu

Bu klasörün hazırlanması mağazaya yayın yapıldığı anlamına gelmez. İmzalı 48 / 2.0.0 APK ve AAB, `yurken/english-tales` EAS projesinden indirilen eski yükleme anahtarıyla oluşturuldu (SHA-1 önceki Play kaydıyla eşleşti); yeni anahtar oluşturulmadı. AAB henüz Play'e yüklenmedi.

Yeni ikon, altı ekran görüntüsü, EN/TR tanıtım görselleri ve EN/TR açıklamalar Play Console taslağına kaydedildi. AI görsel beyanındaki “Label assets and submit” son adımı tamamlanmadı; yeni görsellerin herkese açık sayfada göründüğü doğrulanmadı. Güncel ayrıntılar: [son durum](../../../README_SON_DURUM.md).

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
- İmzalı release APK/AAB derlemesi ve statik paket/imza kontrolleri başarılı (48 / 2.0.0).
- AAB yüklemesi, Play tarafından üretilen paket kontrolü ve üretim gönderimi **henüz yapılmadı**; mevcut canlı ikon/görsellerin değiştiği iddia edilmez.

## Mağaza dilleri — 17 Ekim 2026

Mağaza kayıtları uygulamanın destek dilleriyle eşleşir: `tr-TR`, `en-US` (varsayılan) ve "10 yeni dil" kapsamındaki `es-419`, `pt-BR`, `id`, `ar`, `vi`, `hi-IN`, `ru-RU`, `bn-BD`, `ur`, `th`. `es-ES`, İspanya için `es-419` ile aynı metni taşır. `de-DE` ve `fr-FR` kaldırıldı; uygulama bu dillerde çeviri sunmuyor.

- Her yeni dilin kaydı, o dilin çeviri içeriği uygulamada açıldığı sürümle birlikte Play Console'a eklenir; önce eklenmez. Metinler o dilde çeviri olduğunu söylediği için erken yayın yanıltıcı olur.
- Yayından önce her metni o dili ana dili olarak konuşan biri okumalı.
- Sınırlar: başlık 30, kısa açıklama 80, uzun açıklama 4000, sürüm notu 500 karakter.
- Ekran görüntüleri şimdilik yalnız `tr-TR` için var; her dil açıldığında o dilin arayüzüyle yeniden alınır.
- 19 Ekim taslağında EN açıklaması 11 hikâye çevirisi dilini listeler; İngilizce arayüzde Türkçe hikâye çevirisi kullanıldığı ayrıca belirtilir. Bu vaatler üretim sürümüyle eşleştirilmelidir.
