# Ekran referansları

Kullanıcının son yönlendirmesi: uygulama verilen EWA ekranları gibi görünmeli. Görsel kararların dayanağı `C:/Users/yurken/OneDrive/Masaüstü/EWA` klasöründeki görüntülerdir.

| Uygulama ekranı | Referans dosyaları | Uygulanan düzen |
| --- | --- | --- |
| Sohbet başlangıcı | Screenshot_1749404805.png, Screenshot_1749404812.png | Beyaz zemin, solda avatar ve gri balonlar, sağda mavi cevaplar |
| Kitaplık | Screenshot_1749405117.png, Screenshot_1749405152.png | Üst göstergeler, Arama / Kitaplarım, sarı banner, 130 × 190 dp kapak rafları |
| Kitap detayı | Screenshot_1749405055.png | Solda kapak, sağda yazar/başlık/seviye, altında Oku / Dinle |
| Okuyucu | Screenshot_1749405028.png, Screenshot_1749405032.png | Serif metin, Aa menüsü, cümle çevirisi, metin üstünde kelime kutusu, ince alt çubuk |
| Profil | Screenshot_1749405082.png, Screenshot_1749408227.png | Ortalanmış kullanıcı alanı, mavi eylem, beyaz ilerleme kartları |
| Kelimeler | Screenshot_1749408223.png | Üç aşama kartı ve çerçeveli kelime satırları |
| Kartlar | Screenshot_1749408401.png, Screenshot_1749408415.png | Ortada yüksek kelime kartı, ses düğmesi, alt sayfa noktaları |
| Çeviri soruları | Screenshot_1749408422.png, Screenshot_1749408441.png | Sarı ilerleme, açık gri soru paneli, alt alta cevaplar |
| Eşleştirme | Screenshot_1749408471.png, Screenshot_1749408485.png | İki sütun, ince çerçeve, seçili mavi ve eşleşmiş yeşil durum |
| Harfler | Screenshot_1749408503.png, Screenshot_1749408511.png | Üstte anlam, ortada kurulan kelime, altta harf kutuları |

## Görsel ölçüler

- Ana vurgu `#00A6EC`, zemin beyaz, ikincil yüzey `#EEF2F5`, metin `#17181B`.
- Sarı `#FFCE00` alıştırma ilerlemesi ve seviye etiketlerinde; mor `#AC59F0` banner ve puanda.
- Kitaplık başlığı 20 sp; normal arayüz metni 13–15 sp. Büyük serif tanıtım başlıkları kullanılmıyor.
- Kitaplık kenar boşluğu 16 dp. Alt menü 56 dp + cihazın gezinme alanı; seçili simge ve yazı mavi.
- Okuyucu başlangıç yazısı 17 sp, serif; yazı boyutu ve gece modu Aa menüsünde.
- Alıştırma sırasında ana alt menü gizlenir. Doğru/yanlış cevap kısa geri bildirimden sonra sonraki soruya geçer.

Güncel emülatör görüntüleri `docs/preview-*.png` dosyalarındadır. Altı örnek hikâye nedeniyle katalog ve okuma sayfalarındaki içerik miktarı referans uygulamadan küçüktür. Sosyal hesap, lig ve ödeme akışları bu prototipte uygulanmadı; profil gerçek yerel okuma, kelime ve alıştırma verilerini gösterir.

Büyük yazı ayarında banner, kitap bilgileri ve alt menü içerikle birlikte büyür. Kelime aşamaları 1,4 üzerindeki yazı ölçeğinde üç geniş satır olarak gösterilir. Kapak üstündeki yazı görselin parçası olarak sabit kalır; kart altındaki başlık sistemin yazı boyutuna uyar.
