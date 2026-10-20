# PR ve Claude iş kontrolü — 20 Ekim 2026

Kontrol edilen ana dal: `01defbe` (#151). GitHub PR/CI, kayıtlı worktree durumları, son iki yerel Claude oturumu ve anonim canlı içerik okuması karşılaştırıldı. Bu inceleme uygulama kodu veya sunucu verisi değiştirmedi. Play Console bu tur açılmadı; 50'nin bugünkü yayın durumu doğrulanmadı.

## PR durumu

| PR | Durum | Sonuç / kalan |
|---|---|---|
| [#146](https://github.com/yurkenn/english-tales/pull/146) | Açık taslak | Aktif 90 günlük plan; bu güncelleme mevcut PR üzerinden sürer. |
| [#1](https://github.com/yurkenn/english-tales/pull/1) | Açık taslak, 8 Ocak | Eski Expo/TypeScript testleri; bugünkü native Android ağacıyla ilgili değil. Birleştirilmedi veya kapatılmadı. |
| [#147](https://github.com/yurkenn/english-tales/pull/147) | Birleşti | Beş mevcut hikâyenin iyileştirilmiş taslakları ve yerel okuyucu/FSRS entegrasyonu. |
| [#148](https://github.com/yurkenn/english-tales/pull/148) | Birleşti | İnceleme ve kaynak kayması korumalı canlı editör taslağı aracı; sahibin pilot onayı kaydedilmiş. |
| [#149](https://github.com/yurkenn/english-tales/pull/149) | Birleşti | Türkçe sözlük örneklem onayı ve 1.098 maddelik paket varlığı. |
| [#150](https://github.com/yurkenn/english-tales/pull/150) | Birleşti | Diğer 10 dilde 1.098'er sözlük maddesi; `machine-draft`, ikinci model ve ana dil incelemesi açık. |
| [#151](https://github.com/yurkenn/english-tales/pull/151) | Birleşti | Okuyucu hareketleri, sade kitaplık, tema seçimi, boş ekranlar, Phosphor ikonlar ve büyük yazıda tema satırı düzeltmesi. PR CI başarılı; birleşmiş ana dalın CI sonucu aşağıda. |

## İlk öncelik: ana dal cihaz testi kırmızı

[20 Ekim ana dal CI çalışması](https://github.com/yurkenn/english-tales/actions/runs/39386537157): repository, backend ve android işleri başarılı; `android-device` başarısız. `FirstLaunchJourneyTest.guestReadsSavesAWordAndReviewsItOnAFreshInstall` 20.000 ms beklemeden sonra `ComposeTimeoutException` ile düşüyor. Günlük bir başarısız test bildiriyor; üç test atlanmış. Bunun zamanlama sorunu mu, yeni arayüzün test beklentisini değiştirmesi mi, gerçek kullanıcı hatası mı olduğu henüz ayrıştırılmadı. İlk iş hedefli yeniden üretim, nedenin düzeltilmesi ve aynı birleşik kaynakta tam cihaz CI doğrulamasıdır. PR'ın daha önce yeşil olması bu kapıyı kapatmaz.

## Claude'da yarım kalanlar

Son yerel arayüz oturumunun 20 Ekim kaydı: bekleyen kod değişikliği yok. Emülatörde `c229250` var; #151'in son `8c188f1` büyük yazı/tema düzeltmesini içermiyor. Emülatör sürümü bu tur yeniden sorgulanmadı. Son iki yerel oturumun kapsamı dışında, erişilmeyen bulut oturumlarında başka iş bulunmadığı garanti edilmez.

Kayıtlı dokuz worktree'nin tamamı kontrolde temizdi. `claude/project-thread-4hpn7r` uzak dalında ana dala girmemiş commit bulunmadı. Asıl kalanlar:

1. Ana dal ilk kullanım cihaz testi hatası.
2. On dilin dokunma sözlüğünde bağımsız ikinci model/geri çeviri ve dil örneklemi; özellikle Arapça, Hintçe, Urduca, Bengalce ve Tayca. #151'in TR/EN dışındaki yeni metinleri de dil incelemesi bekliyor.
3. Yayımlanmış beş pilotta tam arayüz, çevrimdışı okuma, eski ilerleme/kelime koruma ve gerçek hesap eşitlemesi kabulü.
4. Sözlük ve #151 arayüzünü içeren yeni paket: mevcut varsayılan hâlâ 50 / 2.2.0; Console'daki en yüksek kod kontrol edilerek yeni kod seçilmeli. Bu özellikler 19 Ekim'de başvurulan 50 paketine sonradan eklenmiş sayılmaz.
5. Canlı çevirisi eksik 45 hikâyenin durumu: mevcut uygulamada kaynak birebir eşleşirse paket çevirisi kullanılır. Bu nedenle “45 hikâye uygulamada çevrilemez” sonucu çıkarılmaz; sunucu çevirisi ve paket geri dönüşü ayrı kabul edilir.

## Canlı içerik: eski not düzeltildi

Anonim REST okumasıyla güncel 50 hikâyenin revizyonları filtrelendi: **1.065 cümle**, 1.065 Türkçe çeviri satırı; diğer 10 dilin her birinde **131** cümle çevirisi. Beş pilotun 131 cümlesi 11 dilde tam; cümle kimlikleri ve İngilizce kaynak metinleri depodaki onaylı taslakla karşılaştırıldı. Eski revizyon satırları güncel toplama katılmadı.

| Pilot | Güncel cümle |
|---|---|
| A Quiet Morning | 23 |
| The Paper Boat | 27 |
| The Last Train | 28 |
| The Tortoise and the Hare | 27 |
| The Lion and the Mouse | 26 |

Bu yayın doğrulaması, ana dil incelemesi veya gerçek cihaz/eşitleme kabulü değildir. Kelime bağlantıları, sorular, medya ve tüm canlı/paket eşitliği bu dar okumada yeniden denetlenmedi. Ana kaynak paket kataloğu 1.002 cümlede kalıyor; güncel pilot revizyonlarının paketle eşit olduğu iddia edilmez. İki yeni klasik taslağı ertelenmiş durumda; yeni hikâye ekleme önceliği açılmadı.

[Makine okunabilir sonuç ve revizyon kimlikleri](release-evidence/2026-10-20-project-audit.json) · [Aktif öncelik sırası](ROADMAP_2026_Q4.md) · [Tarihsel 50 başvuru kaydı](RELEASE_50_STATUS.md).
