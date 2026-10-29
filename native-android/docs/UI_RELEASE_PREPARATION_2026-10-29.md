# UI yayın hazırlığı — 29 Ekim 2026

Play Console aynı gün salt okunur incelendi: üretim **52 / 2.3.1, Available on Google Play, Full rollout**; dahili kanal **56 / 2.4.0-sandbox, Available to internal testers**. All app bundles kataloğundaki en yüksek kod **56**. 53 daha önce yüklenmiş ve inactive olduğundan yeniden kullanılamaz. Yeni aday kodu **57**; yükleme öncesi tekrar kontrol edilmelidir.

Bu PR, `b490d2d0` ana dalındaki yeni oyun görünümünü denetler ve büyük yazı sorunlarını düzeltir. Ana dal, ayrı enerji/Premium ve bağımsız çeviri dili dallarını içermez. Yayın kapsamı bu ayrım dikkate alınarak seçilmelidir; bu PR bu özellikleri sessizce birleştirmez veya yayımlamaz.

- 320 × 640 dp / %200 yazıda eşleştirme ve kelime kartları içerik yüksekliğine göre büyür; uzun kartın ses ve iki cevap düğmesine kaydırarak erişim test edilir.
- Büyük yazıda sonuç istatistikleri ve lig başlığı/süresi alt alta, haftanın günleri iki satıra geçer.
- Seri kutlamasındaki onay işareti metin yerine mevcut vektör ikonu kullanır.
- İlk kurulum → misafir → okuma → kelime kaydetme → tekrar → sonuç yolunun gerçek Activity ekran görüntüleri kaydedilir.
- 13 dilde mağaza notları yeni UI kapsamı için hazırlanmıştır; kapsam genişlerse notlar da güncellenmelidir.

Yerel API 36 doğrulaması: **12 yeni büyük yazı senaryosu + 26 akış/koyu tema/erişilebilirlik/oyun regresyonu**, 0 hata. Debug ve release JVM paketlerinde 142 test, 0 hata/atlama. Güncel kaynak için tam CI, 57 numaralı imzalı paket doğrulaması ve son görsel rapor ayrı kanıtlardır; önceden üretilen 53 yerel paketi Play adayı değildir.

Play üzerinde paket yüklenmedi, taslak sürüm oluşturulmadı ve gönderim yapılmadı. Fiziksel Play güncellemesi/veri koruma, gerçek hesap ve iki cihaz, runtime Crashlytics/izinli Analytics, TalkBack ve editöryel kabul bu UI denetimiyle kapanmış sayılmaz.
