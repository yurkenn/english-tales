# Bölgesel abonelik fiyat önerisi — 25 Ekim 2026

Durum: 19 ülkelik tablo 25 Ekim kullanıcı onayıyla uygulama hazırlığına alındı; Play kayıtları henüz yapılmadı. Bu belge veya fiyatlar uygulama runtime yapılandırması değildir. Bu turda Play fiyatı değiştirilmedi. Mevcut Console abonelik ekranı “Your app does not have any subscriptions yet / Upload a new APK” gösterdi; RevenueCat eski ürün kimliklerinin Play'deki güncel varlığı/fiyatı henüz doğrulanamadı. Dahili 53 paketinin yüklenmesi tek başına bu engeli kaldırmamış görünüyor; yayınlanmış Billing destekli test paketi ve doğru ürün kataloğu ayrıca doğrulanmalı.

## Kapsam ve gerekçe

Kaynak `AppLanguage.supported` ve `LanguageControls.appLanguages`: tr, en, es-419, pt-BR, id, ar, vi, hi, ru, bn, ur, th. 12 UI dili mevcut. Desteklenen bir dil bütün konuşulduğu ülkeleri otomatik olarak aynı fiyat grubuna sokmaz. Fiyat mağaza ülkesine; açıklama uygulama diline bağlıdır. Almanca yeni dil olarak eklenmiş değildir; mevcut destekli seçim veya İngilizce yedek kullanılır. İspanya ve Portekiz'de mevcut Latin Amerika İspanyolcası / Brezilya Portekizcesi varyantları gösterilir.

Aşağıdaki rakamlar başlangıç hipotezidir; ülke başına satın alma gücü endeksi veya yerel rakip paneliyle optimize edilmiş sonuç değildir. Geniş kütüphaneli rakipten daha düşük giriş fiyatı ve ülkeler arasında erişilebilirlik denemesi amaçlanır. ABD App Store Beelinguapp listesinde aylık $7.99 ve yıllık $49.90 yanında daha düşük/promosyon ürünleri de var; bu bir Android veya tüm kullanıcılara sunulan fiyat doğrulaması değildir. Bizim ABD önerimiz $3.99 / $24.99; ürün kapsamımız da farklıdır. Yıllık indirim aynı ülkede 12 aylık ödemeye göre hesaplanır; farklı para birimlerini ham rakamla karşılaştırmayız.

## İncelenebilir fiyat tablosu

Hedefler kullanıcıya gösterilecek toplam fiyat içindir. Play düzenleyicide ülkenin vergi uygulaması, para birimi ve izin verilen fiyat adımı kontrol edilerek son kullanıcı toplamı yeniden doğrulanacak; bu tutarlar geliştirici net geliri değildir.

| Ülke kodu | Ülke | Dil örneği (fiyat anahtarı değil) | Para birimi | Aylık | Yıllık | Yıllık tasarruf | Durum |
|---|---|---|---|---:|---:|---:|---|
| TR | Türkiye | Türkçe | TRY | 99.99 | 699.99 | %41.7 | Onaylı |
| US | ABD | İngilizce veya seçilen dil | USD | 3.99 | 24.99 | %47.8 | Uygulama onaylı |
| GB | Birleşik Krallık | İngilizce veya seçilen dil | GBP | 2.99 | 19.99 | %44.3 | Uygulama onaylı |
| CA | Kanada | İngilizce veya seçilen dil | CAD | 4.99 | 29.99 | %49.9 | Uygulama onaylı |
| AU | Avustralya | İngilizce veya seçilen dil | AUD | 5.99 | 34.99 | %51.3 | Uygulama onaylı |
| DE | Almanya | İngilizce yedek veya seçilen destekli dil | EUR | 3.99 | 24.99 | %47.8 | Uygulama onaylı |
| ES | İspanya | İspanyolca (mevcut es-419) | EUR | 3.99 | 24.99 | %47.8 | Uygulama onaylı |
| PT | Portekiz | Portekizce (mevcut pt-BR) | EUR | 2.99 | 19.99 | %44.3 | Uygulama onaylı |
| MX | Meksika | İspanyolca | MXN | 39.00 | 249.00 | %46.8 | Uygulama onaylı |
| BR | Brezilya | Portekizce | BRL | 9.99 | 59.99 | %50.0 | Uygulama onaylı |
| IN | Hindistan | Hintçe / Bengalce / İngilizce | INR | 149.00 | 899.00 | %49.7 | Uygulama onaylı |
| BD | Bangladeş | Bengalce | BDT | 149.00 | 899.00 | %49.7 | Uygulama onaylı |
| PK | Pakistan | Urduca | PKR | 399.00 | 2499.00 | %47.8 | Uygulama onaylı |
| ID | Endonezya | Endonezce | IDR | 19900.00 | 119900.00 | %49.8 | Uygulama onaylı |
| VN | Vietnam | Vietnamca | VND | 39000.00 | 249000.00 | %46.8 | Uygulama onaylı |
| TH | Tayland | Tayca | THB | 59.00 | 349.00 | %50.7 | Uygulama onaylı |
| EG | Mısır | Arapça | EGP | 49.99 | 299.99 | %50.0 | Uygulama onaylı |
| SA | Suudi Arabistan | Arapça | SAR | 9.99 | 59.99 | %50.0 | Uygulama onaylı |
| AE | BAE | Arapça / İngilizce | AED | 9.99 | 59.99 | %50.0 | Uygulama onaylı |

## Diğer pazarlar ve Rusça

Diğer satışa açık ülkelerde USD 3.99 / 24.99 referansından Play'in güncel yerel dönüşümü başlangıç taslağı olarak üretilebilir; 178 ülkeye otomatik yayın onayı değildir. Latin Amerika'nın diğer ülkeleri ve Kuzey Afrika için yerel sonuçlar ayrıca gözden geçirilmeli. Yeni ülkeler/bölgeler ayarı bilinçli seçilmeli; istemeden yeni pazarda satış başlatılmamalı.

Rusça arayüz desteği devam eder. Rusya Google Play faturalandırma kısıtı nedeniyle başlangıç satış listesine eklenmez; ücretsiz okuma devam eder. Rusça kullanan başka bir satışa açık ülke hesabı, o ülkenin mağaza fiyatını görür. Play'in o anki ülke/ödeme uygunluğu esastır.

## Uygulama ve kabul adımları

1. Aynı aylık/yıllık ürünleri ve `premium` entitlement'ını koru; her dil için yeni ürün oluşturma. Play base plan ülke fiyatlarını yönetir, RevenueCat eşler.
2. Play'de ürün kataloğunu açıp mevcut fiyat/aboneleri dışarıdan doğrula; eski abonelerin fiyat cohort migration'ını yeni fiyat girişine dahil etme.
3. 29 Premium/enerji metni, Türkçe ve İngilizceye ek 10 dilde Claude taslaklarından eklendi; Türkçe mirror dahil tüm kaynak/format kontrolleri geçti. Ana dil incelemesi, RTL Arapça/Urduca ve uzun metin görsel QA açık.
4. RevenueCat mağazadan biçimlendirilmiş fiyatı gösterir; dil veya IP'den fiyat hesaplama. Yıllık toplam tek seferde tahsil edilir; aylık eşdeğer varsa ikincil gösterim ve açık açıklama kullan.
5. Her öncelikli pazarda lisans test hesabıyla görünen fiyat = Play ödeme ekranı toplamı kontrolü. Dil değiştirmek mağaza ülke fiyatını değiştirmemeli. Gerçek para harcamadan test yöntemi doğrulanmalı.
6. Teklif/Premium görüntülenmesi → satın alma dönüşümü, ücretli aktiflik, yenileme, iade ve D7 okumayı ülke bazında yeterli örneklemle değerlendir. Küçük örneklemlerle fiyat kazananı ilan etme. Gelir hesabında vergi, mağaza komisyonu, iade ve servis giderlerini ayrıca çıkar.

## Doğrulanan kaynaklar

- [Google Play abonelik ve ülke bazında fiyat düzenleme](https://support.google.com/googleplay/android-developer/answer/140504?hl=en)
- [Google Play çoklu para birimi ve yeni ülkeler ayarı](https://support.google.com/googleplay/android-developer/answer/1169947?hl=en)
- [RevenueCat mağazadan yerelleştirilmiş fiyat gösterimi](https://revenuecat.github.io/codelabs/guides/get-products-and-prices.html)
- [Beelinguapp ABD App Store satın alma listesi](https://apps.apple.com/us/app/beelinguapp-language-learning/id1225056371)
- [Google Play Rusya faturalandırma durumu](https://support.google.com/googleplay/android-developer/answer/11950272?hl=en)
