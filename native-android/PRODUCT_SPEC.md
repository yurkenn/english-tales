# English Tales ürün taslağı

Kullanıcının paylaştığı 49 EWA ekranı, yerleşim ve görsel ölçüler için doğrudan referanstır. Beyaz zemin, canlı mavi vurgu, küçük sans serif arayüz yazıları, yatay kitap rafları, sohbet başlangıcı, kompakt kitap detayı ve kelime alıştırmaları bu referansa göre uygulanır. English Tales metinleri, kapakları ve rehber çizimi özgündür. Ekran eşleştirmeleri UI_REFERENCE.md içindedir.

## Ana yolculuk

```text
Sohbet başlangıcı → seviye / tür / günlük hedef → ilk hikâye → okuyucu
→ okuma sonucu → hikâyenin kelimelerini çalış → günlük plan → zamanlı tekrar
```

## Ekran davranışları

| Ekran | Temel davranış | Bu aşamadaki durum |
| --- | --- | --- |
| Başlangıç | Kısa diyalogla seviye ve ilgi alanı seçimi, öneriye yansıması | Uygulandı |
| Günlük plan | Günlük adımlar, zamanı gelen kelimeler, devam eden hikâye, haftalık etkinlik | Uygulandı |
| Kitaplık | Kapaklı yatay raf, tüm kitaplar, arama, tür filtresi | Uygulandı; gerçek katalog büyütülecek |
| Kitap detayı | Özgün kapak, seviye, özet, okuma ve devam etme | Uygulandı |
| Okuyucu | Serif metin, cümle çevirisi, kelime kartı, ses, yazı boyutu, gece modu, kaldığı yer | Uygulandı; ses ve erişilebilirlik iyileştirilecek |
| Kelime defteri | Öğreniyorum / tekrar ediyorum / biliyorum durumları | Uygulandı; 1/3/7/14/30 günlük tekrar ve yanlış cevapta 10 dakika |
| Alıştırmalar | Kart, çoktan seçme, eşleştirme, kelime oluşturma | Dört alıştırma uygulandı; zamanlı tekrar ve tekil oturum ödülü |
| Profil | Hikâye ve kelime ilerlemesi, seri, puan, gerçek başarılar ve ayarlar | Uygulandı |

## Görsel dil

- Beyaz zemin, referanstaki canlı mavi vurgu (#00A6EC), okunabilir koyu metin. Öğrenme ekranlarında daha hareketli renk; okuma ekranında daha sessiz bir düzen.
- Kapaklarda özgün illüstrasyonlar; uygulamada eklenen kitap başlığı, yayıncı ve sarı seviye etiketi. Raf ölçüsü 130 × 190 dp; kitap detayı 140 × 200 dp.
- Arayüzde sans serif; okuyucuda rahat satır aralıklı serif. Büyük yazı ve gece modu desteklenir.
- Kitap detayında yan yana Oku / Dinle düğmeleri. Okuyucuda üstte Aa menüsü, cümle yanında çeviri, metin üzerinde kelime kutusu ve altta ince okuma çubuğu. Alıştırmalarda sarı ilerleme çubuğu ve cevapları gösteren ince renkli çerçeveler.

## İçerik ve veri

Şu anki altı hikâye ve 39 kelime akışı göstermek içindir. Yayın öncesinde özgün ve dil kontrolünden geçmiş bir katalog gerekir. İçerik modeli; hikâye, bölüm, cümle, Türkçe çeviri, kelime, seviye, tür, kapak ve ses kaynağını ayrı alanlar olarak taşımalıdır. Uygulama başlangıç içeriğiyle çevrimdışı açılır. Okuma ve öğrenme ilerlemesi cihazda saklanır.

Uzak içerik ve isteğe bağlı hesap için Supabase; ürün ölçümü ve çökme takibi için Firebase seçildi. Supabase veri modeli, erişim kuralları ve taslak aktarımı hazır. Android'de Room geçişi, sürüm/cümle konumu, oturum/aktif süre ve kalıcı kuyruk uygulandı; canlı servis, hesap ekranı ve ağ eşitlemesi henüz yok. [Servis planı](backend/README.md).

## İlk sürümün kabul ölçütü

Yeni kullanıcı seviye seçip uygun kitapları görür; bir kitabı internet olmadan okuyup dinler, kelime kaydeder, alıştırma yapar, uygulamayı kapatıp açtıktan sonra kaldığı yerden devam eder. Bu yolculuk küçük ve büyük ekranda, büyük yazıyla ve ses motoru olmayan cihazda anlaşılır biçimde çalışmalıdır.
