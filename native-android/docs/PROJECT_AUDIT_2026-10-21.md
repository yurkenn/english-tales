# Proje ve PR denetimi — 21 Ekim 2026

## Tamamlanan veya birleşik doğrulamaya alınan işler

| Kaynak | Sonuç |
| --- | --- |
| [#157 okuyucu](https://github.com/yurkenn/english-tales/pull/157) | Tüm CI işleri başarılıyken `5b7ea11` ile ana dala birleşti: akıcı paragraflar, sözlüğün karşı yarıda açılması, sepya tema ve mevcut koyu ayarın taşınması. |
| [#154 sözlük](https://github.com/yurkenn/english-tales/pull/154) | 73 ertelenmiş kararın tamamı AI düzeyinde sonuçlanmış; 225 karşılık güncellemesi ve üretilen varlıklar birleşik kaynakta. Ana dil/insan onayı bayrakları korunur. |
| [#156 oyun](https://github.com/yurkenn/english-tales/pull/156) | Combo, yıldızlar, günlük görevler, kart kaydırma ve eşleştirme süresi birleşik kaynakta. `da05afb`, eski kartın geciken cevabının sonraki kartı atlamasını veya tamamlamayı tekrarlamasını engeller. |
| [#1 eski Expo testleri](https://github.com/yurkenn/english-tales/pull/1) | Kapatıldı; hedeflediği React Native dosyaları ve bağımlılıkları native geçişte kaldırılmış. PR/dal tarihçesi korunuyor. |
| Önceki işler #67, #87, #147 | GitHub'da daha önce birleşmiş oldukları doğrulandı; eski yerel worktree başlıkları yeni açık iş sanılmadı. |

Üç güncel PR'ın gerçek commitleri aynı entegrasyon dalında korunur; nihai birleşim bu bütünün CI kabulüyle yapılır. Diğer aktif worktree'lerde kaydedilmemiş değişiklik bulunmadı; bunların dalı veya dosyaları değiştirilmedi. Yereldeki `claude/design-b-tokens` ayrı eski tasarım denemesidir; seçilmiş ürün yönü olduğu varsayılıp uygulanmadı.

## İlk açılış testinin somut hatası

`f66f8a9` başlığının push CI [39570928218](https://github.com/yurkenn/english-tales/actions/runs/39570928218) başarılı; PR CI [39570936929](https://github.com/yurkenn/english-tales/actions/runs/39570936929) 337 testten birinde başarısızdı. XML'deki iç hata `The current thread must have a looper!`: IO'da `LearningViewModel` hazır sinyalini yayımlayınca Compose 1.8.1'in unconfined test devamı `LazyColumn` ön yükleme zamanlayıcısını o iş parçacığında oluşturdu. Hazır modelin yanında kalan yükleme ağacı bu koşuda yanıltıcı zaman aşımı görünümü yarattı. Bu bulgu geçmişteki bütün açılış zaman aşımlarının nedenini kanıtlamaz.

`FirstLaunchReadinessTest` artık Compose'un sanal zamanlayıcısını gerçek Activity'ye kurmaz. Gerçek Android pencere/recomposer döngüsünde erişilebilir yükleme düğümünü ve zaten dışa açılan `language_continue` kimliğini gözler. IO geri yükleme mandalı, hazır değil/hazır ve misafir sahipliği kontrolleri, sistem animasyon ölçekleri 0/1 ve 20 saniyelik dil ekranı sınırı korunur. Uygulama üretim davranışı veya zaman aşımı sınırı değiştirilmedi.

## Yerel doğrulama

- Android 36'da kart regresyonu dahil `PracticeGamesShrinkTest`: 5/5.
- Sözlük, okuyucu hareketleri, görünüm tercihleri ve kartların birleşik testi: 13/13, atlama yok.
- Gerçek pencere döngüsündeki yeni ilk açılış testi: 1/1 JUnit, her animasyon ölçeğinde 10 tekrar, toplam 20 yükleme→dil seçimi döngüsü.
- JVM: 134/134; debug/test APK derlemeleri ve lint başarılı.
- Depo ve yerelleştirme kontrolleri başarılı. Nihai tam CI, entegrasyon PR'ının checks sayfasında doğrulanır; buradaki yerel sonuç tam CI veya fiziksel cihaz kabulü olarak sunulmaz.
- İlk yerel Android 37 önizleme denemesinde Espresso `InputManager.getInstance` bulunmadığından başlamadı. Uygulama sonucu sayılmadı; doğrulama Android 36'da tekrarlandı.

## Yayın ve gerçek kalan işler

Canlı Play Console'da **50 / 2.2.0 Active / %100**; son yayın 20 Ekim, yayımlanmamış değişiklik yok. Dahili kanal 49 / 2.1.0. [Salt okunur kontrol kanıtı](release-evidence/2026-10-21-play-status.json). Yeni PR kaynakları 50'nin başvuru kaynağından sonradır ve otomatik olarak bu mağaza paketine girmez. Yeni yayın yapılmadı. Crash/ANR oranlarında henüz veri yok; sıfır hata iddia edilmez.

1. Fiziksel telefonda Play üzerinden eski sürüm→50 güncellemesi, kelime/ilerleme koruma, TalkBack/büyük yazı, tam bağlantı ve gerçek hesap/iki cihaz eşitlemesi. Bu oturumda yalnız emülatör bağlıydı.
2. Analytics izinli canlı olay kabulü ve fiziksel performans başlangıç ölçümü; eksik örneklem başarı sayılmaz.
3. On sözlük dilinde ana dil örneklemi ve yeni arayüz metinlerinin dil kabulü. AI kararlarının bitmesi insan onayı değildir.
4. Beş canlı pilotun UI/çevrimdışı/gerçek hesap kabulü; diğer 45 hikâyenin çalışma kelimeleri hâlâ inceleme önerisidir.
5. Son kaynak için yeni sürüm/paket kabulü ayrı yayın işi. Sonraki sürüm kodu yüklemeden önce Console'dan tekrar kontrol edilir.

[90 günlük yol haritası](ROADMAP_2026_Q4.md) bu kabul maddeleri için esas plan olarak sürer. Bunları tamamlamak adına yeni hikâye yayını, mağaza başvurusu veya insan onayı uydurulmadı.
