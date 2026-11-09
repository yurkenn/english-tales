# Birleşik UI + enerji/Premium yayın hazırlığı — 30 Ekim 2026

Kullanıcının seçtiği kapsam: yeni UI + enerji/Premium birlikte. PR #192, ana dal `b490d2d0` ile `codex/published-offline-catalog` zincirini birleştirir: enerji/Premium, bağımsız çeviri dili, hesap/ödül düzeltmeleri ve 67 hikâyelik çevrimdışı katalog.

Play Console 29 Ekim salt okunur kontrolü: üretim **52 / 2.3.1, Available on Google Play, Full rollout**; dahili **56 / 2.4.0-sandbox, Available to internal testers**. Katalogdaki en yüksek kod **56**. Yeni aday **57**; yüklemeden hemen önce tekrar kontrol edilmeli. Play üzerinde yükleme veya gönderim yapılmadı.

## Düzeltilen UI sorunları

- 320 × 640 dp / %200 yazıda eşleştirme ve kelime kartları içerikle büyür; uzun kartın ses ve iki cevap düğmesine kaydırarak erişilir.
- Büyük yazıda sonuç istatistikleri, lig başlığı/süresi ve haftanın günleri uygun satırlara geçer.
- Seri onay işareti vektör ikon kullanır.
- Enerji/Premium ekranı yeni tasarıma uyarlandı. Gerçek ViewModel/mağaza işlemleri korundu; ekran verisi ile işlem callback'leri ayrılarak tükenen enerji, bekleyen reklam/ödeme ve aktif Premium durumları işlemsiz UI fixture'larıyla test edilebilir hale getirildi. Fiyatlar yalnızca sağlayıcıdan alınır.
- İlk kurulum → misafir → okuma → kelime kaydetme → tekrar → sonuç yolunda gerçek Activity ekran görüntüleri alınır.
- 13 dilde mağaza notları birleşik dahili test kapsamını açıklar. Üretimde enerji/Premium açılmadan önce mağaza notları gerçek son davranışa göre yeniden onaylanmalı.

## Paket ve ortam ayrımı

57 sandbox: test sunucusu, test reklamı, enerji/Premium açık, kalıcı sandbox bildirimi, telemetri kapalı; dahili kabul adayıdır. Doğrudan APK yüklemesi Play satın alma kabulü sayılmaz.

57 release: üretim sunucusu; mevcut güvenlik kapıları nedeniyle enerji/Premium ve reklam **kapalıdır**. Bu paket yeni UI/kataloğu içerir fakat seçilen birleşik canlı kapsamın hazır olduğu anlamına gelmez. `ENABLED`/`PUBLICATION_READY` bayrakları kanıt olmadan değiştirilmedi.

29 Ekim canlı salt okunur Supabase kontrolünde staging enerji migration'ı mevcut; üretimde `public.get_energy_policy()` ve `public.energy_wallets` bulunmadı. Birleşik canlı yayın öncesinde üretim migration/Edge Functions, sağlayıcı sırları ve webhook/SSV bağlantıları hazırlanıp doğrulanmalı. Bu denetim üretim verisini değiştirmez.

## Açık kabul kapıları

1. 57 birleşik adayın tam CI, imzalı paket ve görsel kontrolü.
2. Play dahili 56 → 57 güncellemesi, veri koruma; pending/reddedilen ödeme, iade, hesap geçişi; aynı hesapta geri yükleme. Eski 56 kanıtı 57 kabulü yerine geçmez.
3. Normal uygulama UMP/rewarded akışı → imzalı SSV → tek kredi; önceki izole reklam probu normal akışın kabulünü kapatmaz.
4. Üretim backend/RevenueCat/AdMob hazırlığı, gerçek legacy cutoff ve rewarded birimi; yayın bayraklarının doğrulanmış kabul sonrası açılması.
5. TalkBack, fiziksel cihaz, izinli Analytics/Crashlytics ve editöryel/dil kabulü ayrı kalır.

UI-only önceki denetim 38 cihaz testi ve 142 JVM testi geçti. Bunlar birleşik kaynak doğrulaması olarak sunulmaz; birleşik sonuçlar aşağıya ve PR'a ayrıca kaydedilir.
