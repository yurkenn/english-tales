# Rehber görseli ve ikonlar

## 14 Ekim 2026 görsel yenilemesi

- Araç: yerleşik `image_gen` / imagegen becerisi.
- Dosya: `app/src/main/res/drawable-nodpi/reading_guide.png`.
- Çıktı: 1086 × 1448 şeffaf PNG; mavi hırkalı, kahverengi topuzlu, mor kitap tutan kadın rehber.
- Önceki kullanım: `WelcomeScreen` ve `OnboardingScreen`. Bu ekranlar artık kitap maskotunu kullanır; kadın rehber görseli geçmiş tasarım varlığı olarak tutulur.
- `CatalogScreens:116` içindeki `ChallengeBanner { ... }` çağrısı aktiftir. Önceki “çağrısı yok” notu eksik aramaya dayanıyordu. Mağaza hazırlığında bu kart da kitap maskotuna geçirildi.
- Önceki görsel Git geçmişinde korunur.

## Kullanılan son istem

Use case: illustration-story. Create ONE original production-ready female reading guide illustration for English Tales, an independent English reading app. Genuine transparent background, portrait 3:4 composition, full head and waist-up torso, centered face in upper third, modest transparent padding. A warm friendly adult woman with dark chestnut hair tied in a simple low bun, one soft loose strand, natural adult facial proportions, small welcoming smile and expressive eyebrows. No glasses. Wearing an ocean-blue #006CA8 cardigan over a warm ivory blouse. She holds one small OPEN book with a muted lavender #7846BD cover and ivory pages at chest level; both hands anatomically clear and visible. One small bookmark ribbon. Calm modern flat editorial illustration with clean confident navy outlines, broad solid color shapes, only minimal flat shading. Must remain recognizable at small avatar size. A restrained palette of ocean blue, lavender, warm ivory and natural warm skin tones matching a rounded blue vector icon set. No glowing effects, no gradients, no 3D, no giant eyes, no pink/yellow rainbow stack of books, no other objects, no scenery, no lettering, no text, no logos, no watermark. Entire character silhouette comfortably within canvas. This is a new character design, not an imitation of an existing app mascot.

## Native ikonlar

Onaylanan tasarıma göre `ReferenceComponents.kt` Canvas çizimleri yenilendi: Çalış için onaylı defter, Oku için ayraçlı açık kitap, Oyna ve yazım çalışması için A/B kartları, puan için yıldızlı ayraç, seri için onaylı takvim ve çeviri için harf/ok içeren konuşma balonu.

24 birim koordinatlar tüm boyutlarda ölçeklenir. Mavi ikonlarda mor vurgu; beyaz, pasif ve diğer renklerde tek renk kullanılır. Kesik alanlar arka plan rengini geçirir. Navigasyon ve tıklama davranışları korunur. `fire` ve `diamond` anahtarları tüm çağrılarıyla `streak` ve `points` olarak değiştirildi.

## Kitap maskotunun ekran içi ifadeleri

- Kaynak ve istemler: `brand/english-tales/expressions/`. Yerleşik image_gen ile ikonun ana karakteri referans alınarak dört ayrı şeffaf görsel üretildi.
- `TalesMascot` ortak bileşeni: Welcome (karşılama), Thinking (düşünme), Celebrate (kutlama), Support (destek). Görseller uygulamada 512 px PNG olarak paketlenir.
- WelcomeScreen ve OnboardingScreen kadın rehber yerine kitap maskotunu kullanır. Sohbet avatarı küçük boyutta yüzü okunur tutmak için ana ikon portresidir.
- ReadingResultScreen ve GameResult kutlayan ifadeyi kullanır. SavedWordsScreen boş aşamalarda düşünen ifadeyi kullanır. Çeviri/yazım çalışmasının başlığında düşünen, yanlış cevapta destekleyici ifade görünür.
- Karşılama ve kutlama hareketleri bir kez çalışır; okuma metninde veya cevap beklerken sürekli animasyon yoktur. Açıklayıcı metnin yanındaki görseller dekoratiftir.
- Puan, kayıt, reklam sınırı ve soru ilerleme kuralları değiştirilmez.

## 19 Ekim 2026 ikon seti

- Elle çizilen Canvas ikonlarının yerine [Phosphor Icons](https://phosphoricons.com) 2.1.1 geldi (MIT lisansı, telif: Phosphor Icons). Ek kütüphane yok; kullanılan SVG'ler `res/drawable/ic_ph_*.xml` vektörlerine çevrildi.
- Ağırlıklar: özellik ikonları duotone, yön ve araç ikonları regular, rozet içindeki küçük işaretler bold, seçili alt sekme fill.
- Tek giriş noktası `ReferenceIcon(kind, …)`; yeni ikon için ilgili SVG aynı biçimde vektöre çevrilip eşlemeye eklenir.
