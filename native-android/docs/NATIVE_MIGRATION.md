# Tam native Android geçişi

13 Ekim 2026. Mobil uygulamanın tek aktif kaynağı `native-android/app/`: Kotlin, Jetpack Compose, Room ve Android platform servisleri. React Native ve Expo mobil kaynakları, bağımlılıkları ve derleme ayarları aktif ağaçtan kaldırıldı. İçerik paneli ve backend araçları web/Node.js olarak kalır; mobil çalışma zamanı değildir.

## GitHub birleştirme kararı

Native başlangıç: `357abedb68c7194aab6b6f652fd5bfc2fe2d8598` (`codex/native-release-preparation`). Eski ana dal: `2c729011cd1204feda77a1e312b0ab9ae923b69a` (`master`). İki dalın geçmişi merge ile korunur; nihai kaynak ağacında native branch esas alınır. Eski ana dalın sonradan eklenen Expo ekranları aktif ağaca taşınmaz. Force push veya geçmiş silme kullanılmaz.

`tooling/verify_repository.py` kökteki Expo/React Native giriş ve bağımlılık dosyalarını, eski mobil klasörleri ve JSX/TSX kaynaklarını reddeder. `backend/package.json` ve panel JavaScript'i geçerlidir. GitHub Actions depo/ELF, backend ve Android derleme/birim/lint kontrollerini çalıştırır. Cihaz testlerini derler; CI içinde emülatörde çalıştırmaz.

## Kullanıcı ve yayın sınırları

- Uygulama kimliği `com.yurken.englishtales`, kaynakta aday sürüm 47 / 2.0.0. Google Play'e bu işlemle paket gönderilmez.
- Eski React Native öğrenme verisini native Room'a taşıyan bir köprü mevcut değildir. Aynı paket kimliği verilerin otomatik taşındığını kanıtlamaz. Eski üretim sürümü üzerine aynı yayın imzasıyla güncelleme ve hesap/yerel veri kabulü ayrı yayın kapısıdır.
- Native veritabanı sürümü 6; native eski SQLite/Room geçişleri ayrı bir mekanizmadır. Bunlar React Native veri geçişi yerine geçmez.
- Release anahtarı ve `signing.properties` bu Mac'te mevcut değildir. Geçmiş release raporları güncel imzalı paket kanıtı sayılmaz.
- Eski ana dalın topluluk hikâyeleri, yorumlar, yazar takibi, referans ve gelir özellikleri birebir taşınmış değildir. Yeni native kapsam [ürün planında](PRODUCT_ROADMAP.md) ayrıca değerlendirilir.
- Git revert kaynak kodunu geri getirir; hesap silme, canlı SQL veya kullanıcı verisini geri yüklemez. Önceki mobil kod Git geçmişinden incelenebilir.

## Geliştirmeye devam

[Android kurulumu](../README.md), [kaynak haritası](CODEBASE_MAP.md), [teknik aşamalar](DEVELOPMENT_ROADMAP.md), [ürün ve UX planı](PRODUCT_ROADMAP.md). Yeni özellikler ayrı, küçük PR'larla uygulanır; bu geçişte ekran veya öğrenme algoritması değiştirilmedi.
