# Enerji, ödüllü reklam ve Premium — 24 Ekim 2026

Durum: Kullanıcı uygulama geliştirmesini ve Claude ile ortak çalışmayı onayladı. Kod ayrı `codex/energy-premium` dalında hazırlanır. Üretim aktivasyonu gerçek mağaza ürünleri, RevenueCat bağlantısı, AdMob SSV ve sandbox kabulüne bağlıdır. 24 Ekim sahibi onayı: Türkiye aylık 99,99 TL, yıllık 699,99 TL. Fiyatlar uygulamaya mağazadan gelir; diğer ülkelerin fiyatları ayrıca kararlaştırılır.

## Ürün sözleşmesi

- Günlük ücretsiz bakiye UTC 00:00'da 3'e tamamlanır; birikmez. Arayüz yenilenme zamanını cihazın yerel saatinde gösterir. Saat dilimi değiştirerek hak çoğaltılmaz.
- İlk kez bir hikâye açmak 1 enerji tüketir. Aynı hikâyenin tekrar açılması ve sürüm güncellenmesi ikinci ücret doğurmaz. İlk sürümde hikâye başına fiyat uygulanır; bölümlendirme ayrı içerik işi.
- Açılan hikâye kalıcı olarak erişilebilir. Çeviri, sözlük, kaydedilmiş kelime tekrarı ve alıştırmalar enerji tüketmez. Okuma ortasında kesinti yok.
- Önceki sürümden okuma ilerlemesi bulunan hikâyeler korunur. Önceden indirilmiş içeriğe çevrimdışı erişim engellenmez.
- Misafir okumaya devam edebilir; günlük haklar cihazda tutulur. Misafir kotası güvenlik sınırı değildir: yeniden kurulumla sıfırlanabilir. Ödüllü reklam ve premium satın alma, hesap sahipliğini açık tutmak için giriş gerektirir. Misafir ilerlemesinin hesap aktarımı ayrı mevcut akışta korunur.
- Ödüllü reklam isteğe bağlıdır: tamamlanan ve sunucuda doğrulanan her reklam +1 enerji, UTC gününde en fazla 3. Reklam yüklenmezse hak eksilmez. SSV gecikmesinde 'doğrulama bekleniyor' ve tekrar kontrol sunulur. Aynı reklam/işlem ikinci ödül üretemez.
- Premium: aylık/yıllık otomatik yenilenen abonelik; enerji limiti ve geçiş reklamı yok. Premium ile açılan hikâyeler, üyelik bittiğinde kendiliğinden kalıcı ücretsiz hak olmaz. Ücretsiz enerjiyle açılmış ve eski ilerleme nedeniyle korunmuş hikâyeler korunur.
- İlk sürüm enerji paketi satmaz. İade/iptal/sona erme ve satın alma geri yükleme desteklenir. İptal, ödenmiş süreyi hemen bitirmez. Hesap değişimi başka hesabın premium erişimini taşımaz.

## Teknik sorumluluklar

1. Android: merkezi okuyucu kapısı (onboarding, devam, detay, dinleme ve dış bağlantı aynı reader rotasında); kalıcı misafir defteri; hesaba özel erişim önbelleği; enerji/premium ekranı; RevenueCat SDK; isteğe bağlı rewarded formatı. Mevcut öğrenme puanları enerji olarak kullanılmaz.
2. Backend: ayrı erişim cüzdanı, hikâye erişimleri ve ödül biletleri; atomik harcama ve idempotency; yalnız oturum sahibinin RPC'leri. Sunucu saati esastır. Enerji hesabı öğrenme outbox'ından bağımsızdır.
3. RevenueCat: `premium` entitlement; aylık/yıllık offering. Kimlik olarak Supabase kullanıcı UUID'si. Satın alma öncesinde kimlik hazır olmalı. Backend uygulamaya ait API anahtarıyla güncel aboneliği doğrular (v1 subscriber okuması mevcut public SDK anahtarıyla 200 doğrulandı; geniş yetkili secret anahtar oluşturulmaz); istemcinin `premium=true` iddiası kabul edilmez. Transfer/hesap değişimi, iade, expiration, sandbox ve production ayrımı test edilir.
4. AdMob: ayrı rewarded unit ve SSV callback. İmzalı Google callback'i ECDSA ile doğrulanır; ad unit, zaman, kullanıcı, tek kullanımlık bilet ve işlem kimliği kontrol edilir. Mobil callback tek başına sunucuda enerji yazamaz.
5. Güvenli açılış: feature varsayılan kapalı. Eksik ayar ile release etkinleştirilmez. Kısıtlar aktive edildiğinde sunucu hatası premium satışı veya enerji harcaması gibi gösterilmez; önceden açılmış içerik kullanılabilir.

## İş sırası ve Claude işbirliği

- [x] Claude bağımsız mimari inceleme; bulguları bu plana işle.
- [x] Backend migration, RPC ve callback doğrulayıcıları; gerçek PostgreSQL motorunda erişim/ödül testleri.
- [x] Android enerji/premium katmanı, misafir/offline kayıt ve merkezi okuyucu kapısı.
- [x] RevenueCat satın alma/geri yükleme ve kimlik eşleme; AdMob rewarded bağlantısı.
- [x] Claude bağımsız son değişiklik incelemesi; önemli bulguların düzeltilmesi.
- [x] JVM/backend testleri, debug derleme/lint ve emülatörde gerçek ekran kontrolü.
- [ ] Mevcut RevenueCat hesabı/projesi, Google Play abonelikleri ve gerçek rewarded unit yapılandırması.
- [ ] Play internal üzerinden lisans test hesabıyla satın alma, pending/iptal, restore, hesap değişimi ve sandbox webhook/SSV doğrulaması.
- [ ] Gizlilik/mağaza beyanı, fiyat/yenileme metni, aşamalı açılış ve canlı gözlem.

## Kabul senaryoları

- Üç ayrı yeni hikâye üçüncü enerjiyi tüketir; dördüncüsü açık seçeneklerle durur. Aynı hikâyeye çift tıklama, rotasyon ve yeniden başlatma çift harcama yapmaz.
- Gün sınırı, geri alınmış cihaz saati ve hesap değişimi bakiye çoğaltmaz. İki cihaz aynı hikâyeyi açarsa tek harcama; iki farklı hikâyede son enerji iki kere harcanamaz.
- Eski ilerleme, açılmış hikâyeler, çeviri ve tekrar çevrimdışı çalışır. Yeni hesap önceki hesabın erişim önbelleğini kullanamaz.
- Sahte/tekrarlı/yanlış kullanıcıya ait/gecikmiş reklam callback'i enerji üretmez. Doğru callback tek ödül verir. Günlük ödül sınırı kontrol edilir.
- Premium satın alma, restore, pending, kullanıcı iptali, ağ hatası, üyelik iptali ve süre sonu gerçek Play test akışında denenir. SDK başarı sinyali sunucu doğrulamasıyla tamamlanır.
- Üretim kapalıyken eski uygulama davranışı ve regresyon testleri korunur. Geçiş reklamları premium'a ve yeni enerji deneyimine müdahale etmez.

## Ölçüm ve geri dönüş

Ölçümler mevcut isteğe bağlı analitik iznine bağlıdır: enerji sınırına ulaşma, ödüllü reklam başlatma/tamamlama/doğrulanma, paywall görüntüleme, satın alma/restore ve D1/D7 geri dönüş. Kişisel metin, e-posta, token veya reklam imzası analitiğe/loga yazılmaz. İlk denemede gelirle birlikte okuma tamamlama ve geri dönüş karşılaştırılır; hedefler baseline sonrası belirlenir. Kill switch yeni kısıtları kapatır; satın alınmış premium hakları ve geçmiş erişim kayıtları silinmez. Üretim feature kapatma SDK/backend planıyla birlikte doğrulanır.

## Dayanaklar

- RevenueCat Android: https://www.revenuecat.com/docs/getting-started/installation/android
- Kimlik: https://www.revenuecat.com/docs/customers/identifying-customers
- Satın alma: https://www.revenuecat.com/docs/getting-started/making-purchases
- AdMob rewarded: https://developers.google.com/admob/android/next-gen/rewarded
- İmza doğrulama: https://developers.google.com/admob/android/next-gen/ssv
- Ödüllü reklam kuralları: https://support.google.com/admob/answer/7313578
- Supabase fonksiyon güvenliği: https://supabase.com/docs/guides/database/functions

Not: 24 Ekim Supabase changelog kontrolünde yaklaşan TLS CBC kaldırılması incelendi; yeni kod platformun HTTPS varsayılanlarını kullanır, eski cipher zorlamaz.

## Uygulama ve kabul kanıtları

24 Ekim uygulama, dış servis durumu ve açık kapılar: [MONETIZATION_SETUP_2026-10-24.md](MONETIZATION_SETUP_2026-10-24.md). Tamamlanan kod adımları gerçek mağaza satın alması veya üretim açılışı anlamına gelmez.
