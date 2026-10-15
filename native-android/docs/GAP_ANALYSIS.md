# English Tales — derin eksik haritası

15 Ekim 2026 · Kaynak: master `8bef30b` (+ açık [#12](https://github.com/yurkenn/english-tales/pull/12)) · Tür: denetim ve öneri; hiçbir madde uygulanmadı.

[Geliştirme haritası](NEXT_PHASE_ROADMAP.md) “sırada ne var” sorusunu yanıtlar. Bu belge daha geniş bir soruyu sorar: **iyi bir okuma-ile-İngilizce uygulamasında olması gerekip burada olmayan ne?** Her madde koddan, katalogdan veya Play verisinden bir kanıta dayanır.

Öncelik: **P0** ürünün ana vaadini zayıflatır · **P1** kaliteyi veya büyümeyi belirgin sınırlar · **P2** sonraki aşama. Boyut: **S** tek PR · **M** birkaç PR / şema etkisi · **L** çok aşamalı.

## Özet: en kritik 6 eksik

| # | Eksik | Kanıt | Öncelik |
|---|---|---|---|
| G1 | **Kelimelerin çoğuna dokunulamıyor.** | Hikâyelerdeki 1.871 benzersiz sözcüğün yalnız 352'si (%19) sözlükte. Okur, metindeki yaklaşık 5 sözcükten 4'üne dokunduğunda hiçbir şey olmuyor. | P0 |
| G2 | **Ürün körlemesine yönetiliyor.** | Çökme/ANR raporlama yok, `Log` çağrısı yok (0), ürün olayı yok; Play vitals “Data unavailable”. | P0 |
| G3 | **Paket ve canlı içerik ayrışıyor.** | #9/#10 kelime ve ifadeleri yalnız APK kataloğunda; canlı kullanıcı uzak katalog okur. Paketten panele yayın elle yapılıyor. | P0 |
| G4 | **Cihaz testleri CI'da çalışmıyor.** | `verify.yml` yalnız `assembleDebugAndroidTest` derliyor; 132 cihaz testi yalnız yerelde koşuyor. | P1 |
| G5 | **Uygulama boyutu gereğinden büyük.** | `drawable-nodpi` 32 MB (56 PNG kapak/maskot); release APK 30,7 MB. | P1 |
| G6 | **Alıştırmalar yalnız kelime düzeyinde.** | 4 mod: kart, çeviri seçme, eşleştirme, harf dizme. Dinleme, cümle, anlama yok. | P1 |

## 1. Okuma deneyimi

| Eksik | Kanıt | Etki | Öneri | Boyut | Öncelik |
|---|---|---|---|---|---|
| Her sözcüğe dokunup anlam görme (G1) | Okuyucu yalnız sözlükteki/editörün bağladığı öğeleri altını çizer (`PhraseMatcher` + `wordsForSentence`). | Okurun en doğal eylemi çoğu zaman sonuçsuz; “bilinmeyen kelimeyi öğren” vaadi kısmen karşılanıyor. | İki katman: (1) içerik hattında her hikâyenin A2+ sözcüklerini sistematik kapsama (hedef ≥%60), (2) bağlanmamış sözcük için çevrimdışı EN→TR lemma sözlüğü (lisans kontrolü) ve “bu kelimeyi listeme ekle”. Çevrimiçi çeviri API'si maliyet/gizlilik kararı ister. | L | P0 |
| Cümle sesi ve vurgu | TTS sayfanın tamamını tek seferde okur; hangi cümlenin okunduğu gösterilmez. | Dinlerken takip zor; A1 okur için önemli. | `UtteranceProgressListener.onRangeStart` ile cümle vurgusu; cümle başına “dinle”. | M | P1 |
| Okuma hızı ve süre bilgisi | Hikâye kartında süre yok; A1 ortalama 97, B1 339 sözcük. | Kullanıcı ne kadar zaman ayıracağını bilmiyor; süre filtresi de bu yüzden yok (#12). | Katalogda cümle/sözcük sayısı alanı (exporter + panel + SQL). | S–M | P1 |
| Ses odağı ve kesintiler | TTS'te `AudioFocusRequest` yok. | Arama/müzik ile çakışma. | #11 üzerine ses odağı. | S | P1 |
| Uygulama geneli koyu tema | Koyu mod yalnız okuyucuda; ui katmanında 80 sabit renk. | Gece kullanımı, erişilebilirlik. | Tema token'larına taşı, `darkColorScheme`. | M | P2 |

## 2. Öğrenme modeli

| Eksik | Kanıt | Etki | Öneri | Boyut | Öncelik |
|---|---|---|---|---|---|
| Alıştırma çeşitliliği (G6) | `PracticeScreen`: card/choice/match/spell. | Kelimeyi tanıma var, kullanma yok; tekrar sıkıcılaşabilir. | Hikâyeden boşluk doldurma (bağlamlı cümle), dinleyip seçme (TTS), cümle sıralama, okuma sonrası 3–5 anlama sorusu. | M–L | P1 |
| Uyarlanabilir aralıklı tekrar | `LearningPolicy.review`: sabit 1/3/7/14/30 gün; yanlışta sıfırlama; kelime zorluğu yok. | Zor kelimeler fazla, kolaylar gereksiz tekrar edilir. | Kelime başına kolaylık katsayısı (SM-2 benzeri) — Android + SQL `apply_word_event` birlikte; geçiş veri taşıma ister. | M | P2 |
| Seviye belirleme | Onboarding'de seviye kullanıcı beyanı (A1/A2/B1). | Yanlış seviye → erken bırakma. | Kısa yerleştirme: 2 cümle okuma + 6 kelime sorusu; sonradan öneri. | S–M | P1 |
| İlerlemenin anlamı | Rozet en fazla 5; “öğrenilen kelime” dışında beceri ölçüsü yok. | Uzun vadeli motivasyon zayıf. | Seviye ilerleme çubuğu (okunan sözcük, bilinen kelime), haftalık özet (F05). | M | P2 |
| Hatırlatıcı içeriği | Bildirim metni sabit: “Bugünkü hikâyen seni bekliyor”. | Kişisel değil; tekrar zamanı gelen kelimeleri kullanmıyor. | Bekleyen tekrar sayısı veya kaldığın hikâye adıyla metin. | S | P2 |

## 3. İçerik

| Eksik | Kanıt | Etki | Öneri | Boyut | Öncelik |
|---|---|---|---|---|---|
| Canlı içerik eşitliği (G3) | Paket 359, canlı 316 kelime; yayın panelden elle. | Her içerik iyileştirmesi kullanıcıya ulaşmadan kalabilir. | Exporter'dan “yeni revision taslağı” üreten araç + publisher onayıyla toplu yayın; yayın sonrası otomatik doğrulama. | M | P0 |
| Tür dengesi | Macera 33 · Günlük yaşam 11 · Gizem 6. Tür listesi SQL'de sabit. | “Gizem” rafı zayıf; masallar çoğunlukla Macera. | Masal/Fabl gibi tür ekle (Android + SQL + panel birlikte) veya etiket modeli. | M | P2 |
| Seviye derinliği | B1'de 14 hikâye; B2 yok. A1 hikâyeleri ortalama 97 sözcük. | İlerleyen okur içerik bitirir. | B1'i 18+'e çıkar, B2 pilotu; A1'e daha uzun “bölümlü” hikâyeler. | L | P1 |
| Kayıtlı ses | Yalnız cihaz TTS'i. | Ses kalitesi cihaza bağlı; dinleme becerisi sınırlı. | 5 hikâyelik pilot (karar: insan sesi / yüksek kaliteli üretilmiş ses). | L | P2 |
| İçerik üretim hızı | Çeviri, kelime ve bağlantılar panelde elle. | Haftalık içerik ritmi zor. | Panelde taslak öneri asistanı (çeviri/kelime önerisi, editör onayıyla); kalite kontrol listesi. | M | P2 |

## 4. Kalite, güvenilirlik ve performans

| Eksik | Kanıt | Etki | Öneri | Boyut | Öncelik |
|---|---|---|---|---|---|
| Gözlemlenebilirlik (G2) | Çökme SDK'sı yok; `Log` 0; analitik yok. | Hatalar ve terk noktaları görünmez. | Sağlayıcı kararı + gizlilik dostu asgari olay seti (ilk hikâye bitti, ertesi gün döndü, tekrar tamamlandı). | M | P0 |
| CI'da cihaz testleri (G4) | `verify.yml` cihaz testi çalıştırmıyor. | Regresyonlar yalnız yerelde yakalanıyor. | GitHub Actions emülatör işi (ör. API 34 x86_64, `connectedDebugAndroidTest`), en azından ana dal birleşmesinde. | S–M | P1 |
| UI test kapsamı | Cihaz testlerinin 119'u veri, 13'ü arayüz. | Onboarding, hesap, alıştırma akışlarında görsel/etkileşim regresyonu riski. | Kritik yolculuk testleri: ilk açılış → ilk hikâye → kelime kaydı → tekrar. | M | P1 |
| İki cihaz eşitlemesi | D05/D08 açık. | Hesaplı kullanıcıda kelime/ilerleme kaybı riski doğrulanmadı. | Test hesaplarıyla iki emülatör kabulü. | M | P1 |
| Uygulama boyutu (G5) | 32 MB PNG; APK 30,7 MB. | İndirme dönüşümü ve depolama. | Kapakları WebP'ye çevir (görsel kontrolle), gerekiyorsa çözünürlüğü sınırla; hedef APK < 15 MB. | S | P1 |
| Açılış performansı | 322 KB `catalog/v1.json` ana iş parçacığında `MainActivity`'de ayrıştırılıyor; uygulamaya ait baseline profile yok. | Düşük donanımda açılış gecikmesi. | Ayrıştırmayı arka plana al; Macrobenchmark + baseline profile. | M | P2 |
| Kod sağlığı | `LearningViewModel` 432 satır; `ClickableText` ve reklam SDK'sında kullanım dışı API; DI yok. | Değişiklik maliyeti artıyor. | Okuyucu dokunma katmanını `LinkAnnotation`'a taşı; ViewModel'i hesap/öğrenme olarak böl. | M | P2 |

## 5. Erişilebilirlik ve yerelleştirme

| Eksik | Kanıt | Etki | Öneri | Boyut | Öncelik |
|---|---|---|---|---|---|
| Metin kaynakları | 163 sabit `Text("…")`; `strings.xml`'de 1 kayıt. | İkinci arayüz dili imkânsız; çeviri/yazım düzeltmesi dağınık. | Ekran ekran `strings.xml`'e taşı. | M | P1 |
| Ekran okuyucu | 18 `contentDescription`; 31 `.clickable`. | TalkBack ile tam yolculuk doğrulanmadı (D12). | Rol/etiket denetimi + TalkBack kabul testi. | M | P1 |
| Arayüz dili | Arayüz yalnız Türkçe; mağaza FR/DE/ES. | FR/DE/ES ziyaretçi Türkçe arayüzle karşılaşır. | Hedef kitle kararı: ya bu mağaza dillerini kaldır ya İngilizce arayüz ekle. | S/M | P1 |

## 6. Yayın ve operasyon

| Eksik | Kanıt | Etki | Öneri | Boyut | Öncelik |
|---|---|---|---|---|---|
| Yayın otomasyonu | İmza yerelde, yükleme Play Console'dan elle, `versionCode` elle. | Her sürüm uzun ve hataya açık. | CI'da imzalı AAB (gizli anahtar deposu) + Play Developer API ile dahili kanala yükleme. | M | P1 |
| Kademeli dağıtım politikası | 48 %100 dağıtımla gönderildi. | Hata tüm kullanıcılara aynı anda ulaşır. | 49'dan itibaren %20 → %50 → %100 ve vitals kontrolü. | S | P1 |
| Uygulama içi güncelleme / değerlendirme | `AppUpdateManager`, `ReviewManager` yok. | Eski sürümde kalan kullanıcı; mağaza puanı yok (“No reviews”). | Esnek güncelleme + 3. hikâye sonrası değerlendirme isteği. | S | P1 |
| Veri yedeği | İçerik yedeği aracı var (`backup_public_content.mjs`); öğrenme verisi yedeği ve Supabase plan kapsamı doğrulanmadı. | Hesap verisi kaybı riski bilinmiyor. | Plan/PITR durumunu doğrula; gerekirse planlı dışa aktarma. | S | P1 |
| Politika eşitliği | Gizlilik sayfasının canlı güncellemesi, UMP mesajları ve dahili test 47 bekliyor. | Reklam açılamaz; AD_ID uyarısı tekrar edebilir. | [Geliştirme haritası §3](NEXT_PHASE_ROADMAP.md) dış adımları. | S | P1 |

## 7. Büyüme ve platform

| Eksik | Kanıt | Etki | Öneri | Boyut | Öncelik |
|---|---|---|---|---|---|
| Keşfedilebilirlik | 28 günde 14 ziyaretçi. | Ürün iyi olsa da kullanıcı gelmiyor. | ASO: anahtar kelime araştırması, mağaza deneyi, kısa tanıtım videosu. | S | P0 |
| Paylaşım bağlantısı | Paylaşım düz metin (başlık + açıklama); uygulama bağlantısı/derin bağlantı yok (manifestte yalnız LAUNCHER). | Paylaşılan hikâye uygulamada açılamıyor. | App Links (`englishtales-app.web.app/story/{id}`) + web önizleme sayfası. | M | P1 |
| Ana ekran widget'ı | Yok. | Günlük geri dönüş fırsatı. | Glance widget: seri + “devam et”. | S–M | P2 |
| Tablet / katlanabilir | `WindowSizeClass` yok; 6.800 tablet destekleniyor. | Büyük ekranda gerilmiş telefon düzeni. | İki sütun okuma/katalog. | M | P2 |
| Gelir | Reklam hazır ama kapalı; abonelik yok. | Sürdürülebilirlik kararı bekliyor. | Ürün kararı (seyrek reklam / premium içerik+ses / ücretsiz). | M–L | P2 |
| Diğer platformlar | Yalnız Android. | iOS/web kitlesi yok. | Önce web okuyucu (destek sitesi altyapısı) ile paylaşım bağlantılarını açmak; iOS ayrı karar. | L | P2 |

## 8. Önerilen sıralama

**Hemen (S, düşük risk):** kapakları WebP'ye çevir (G5) · uygulama içi değerlendirme/güncelleme · kademeli dağıtım politikası · hatırlatıcı metnini kişiselleştir · TTS ses odağı.

**Sonraki 2–3 PR (P0):**
1. **G2 gözlemlenebilirlik** — sağlayıcı kararınla.
2. **G3 içerik yayın hattı** — paketten taslak revizyon üretimi + doğrulama; pilot revizyonları ilk müşteri.
3. **G1 sözlük kapsaması** — önce içerik hattında A1 hikâyelerinde ≥%60 kapsama; çevrimdışı genel sözlük ayrı lisans/boyut kararı.

**Ardından (P1):** CI emülatör testleri · bağlamlı alıştırma (boşluk doldurma + dinleme) · seviye yerleştirme · `strings.xml` + TalkBack · yayın otomasyonu · App Links.

## 9. Kararın gereken yeni konular

| Karar | Seçenekler | Etkilediği maddeler |
|---|---|---|
| Bağlanmamış sözcükler için kaynak | İçerik kapsamasını artır · çevrimdışı açık lisanslı sözlük · çevrimiçi çeviri API'si | G1 |
| FR/DE/ES mağaza kayıtları | Kaldır · İngilizce arayüz ekle · olduğu gibi bırak | §5 |
| Yayın otomasyonu için anahtar saklama | GitHub gizli değişkenleri · yalnız yerel imza | §6 |
| Paylaşım alan adı | `englishtales-app.web.app` · özel alan adı | §7 |

Önceki kararlar (ölçüm sağlayıcısı, gelir modeli, kayıtlı ses, içerik hızı, ikinci dil) [geliştirme haritasında](NEXT_PHASE_ROADMAP.md) duruyor.

## 10. Yöntem ve sınırlar

- Sayımlar 15 Ekim'de master üzerinde statik tarama ve katalog analiziyle alındı: sözcük kapsaması `[a-zA-Z]+` token'larının sözlük öğeleriyle kesişimi; renk/etiket sayıları `grep`.
- Kullanıcı verileri Play Console'un 15 Ekim ekranlarından.
- Erişilebilirlik, performans ve boyut tahminleri cihazda ölçülmedi; uygulama öncesi ölçülmeli. Hiçbir madde için kullanıcı kazanımı vaadi verilmez.
