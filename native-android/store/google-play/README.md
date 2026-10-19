# Google Play mağaza paketi

## 19 Ekim 2026 — Üretim başvurusu gönderildi

Yeni varsayılan ad **Learn English: Yurken Stories**, Türkçe **İngilizce Hikâyeler: Yurken**. 13 mağaza dili, yeni EN/TR native ekran görüntüleri ve `feature-graphic-v50.jpg`, 50 / 2.2.0 üretim paketiyle birlikte **19:48 TRT’de** gönderildi. Console “Changes in review” gösteriyor; hızlı kontroller sürüyor. %100 dağıtım seçildi, yönetilen yayın kapalı. **Henüz canlı yayın doğrulanmadı.**

İkon, tanıtım görseli ve AI çizimleri içeren native ekran görüntülerinin AI etiketleri kaydedildi. Üretim reklamı kapalı; reklam beyanı “No”. Güncel dosyalar: `en-US/screenshots-v50/01-library.png` ile `04-practice.png` arasındaki dört görüntü; `tr-TR/screenshots-v50/` içindeki üç görüntü. `00-language.png` yalnız referanstır. Diğer mağaza dilleri EN varsayılan görsellerini kullanır. Ana dil konuşuru onayı alındığı iddia edilmez.

[Ayrıntılı yayın durumu](../../docs/RELEASE_50_STATUS.md) · [Araştırma ve ölçüm planı](../aso/2026-10-19/RESEARCH.md) · [Metinler](../aso/2026-10-19/metadata.json). SEO dil sayfaları hâlâ içerik taslağıdır. Aşağıdaki 15 Ekim bilgileri tarihseldir; güncel yayın kanıtı olarak kullanılmamalı.

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
