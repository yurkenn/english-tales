# 23 Ekim 2026 — yeni Android sürümü öncesi denetim

> 24 Ekim devamı: R51-01–05 kaynak düzeltmeleri #174 ile, sürüm notları #175 ile birleşti; 31 eski hikâyenin eksikleri canlıda tamamlandı. 51 / 2.3.0 dahili testte yayımlandı. [Güncel sonuç ve açık kabul işleri](RELEASE_51_STATUS.md). Aşağıdaki denetim düzeltme öncesi tarihsel kayıttır.

**Karar: üretim yayınını beklet.** Aday kaynak `336496453bd96cd65d26c00643eb2c039f5d9bb0`. İki P1 ve üç P2 bulgu var. Dört işlevsel sorun izole Android testleriyle yeniden üretildi; lig gizliliği bulgusu canlı şema/fonksiyonlar ve yayımlanmış gizlilik metniyle doğrulandı. Üretim kodu ve canlı öğrenme verisi değiştirilmedi; mağazaya paket yüklenmedi.

Bu rapor hazırlanan bir yayını onaylamaz. Claude Code, yalnız Read/Grep/Glob araçlarıyla bağımsız inceleme yaptı; bulguları Codex tarafından ayrıca incelendi ve gerektiğinde yeniden sınıflandırıldı. Claude'un misafir sandığı aktarımı önerisi kesin hata sayılmadı; ürün kararı olarak aşağıda ayrıldı.

## 1. Yayın öncesi düzeltilmesi gereken bulgular

### R51-01 · P1 — hesap değişince arkadaş bilgileri önceki hesaptan kalıyor

[LeagueViewModel.kt:93](/Users/oguzyurken/Code/english-tales/native-android/app/src/main/java/com/yurken/englishtales/data/LeagueViewModel.kt:93), [TalesApp.kt:69](/Users/oguzyurken/Code/english-tales/native-android/app/src/main/java/com/yurken/englishtales/ui/TalesApp.kt:69).

A hesabının arkadaş listesi yüklendikten sonra çıkış yapılır; aynı cihazda B hesabı açılır ve arkadaşlar yenilemesi ağ hatası alır. `friendsRun` eski `Ready` değerinin hangi kullanıcıya ait olduğunu kontrol etmeden onu korur. Çıkıştaki `refresh(null)` yalnız lig durumunu değiştirir; arkadaş isteğini ve arkadaş önbelleğini temizlemez. B, A'nın arkadaş adları/XP'leri ve davet kodunu görebilir. Bu, B'nin sunucuda A'ya ait verileri sorgulayabildiği iddiası değildir; sorun aynı uygulama sürecindeki yanlış kullanıcıya ait UI durumudur. Compose `key(account.scope)` tek başına Activity'ye bağlı varsayılan `viewModel()` deposunu değiştirmez.

**Doğrulama:** gerçek `LeagueViewModel`, sahte oturum/çevrimdışı taşıma ve izole tercihlerle çalıştırıldı. Çıkıştan sonra ve B'nin başarısız isteğinden sonra A'nın listesi/kodu kaldı. Mevcut JSON ayrıştırma ve genel hesap testleri bu yeni ViewModel durumunu kapsamıyor.

**Düzeltme:** arkadaş durumunu ve bütün bekleyen arkadaş işlemlerini owner/generation ile sınırla; çıkışta ve kullanıcı değişiminde temizle. Aynı kullanıcının ağ hatasında son listesini koruma davranışı devam edebilir. Regresyon: A → çıkış → B çevrimiçi/çevrimdışı; A'nın geciken yanıtı B'ye hiç yerleşmemeli.

### R51-02 · P1 — lige katılma ve profil adının görünürlüğü kullanıcı tercihiyle başlamıyor

[weekly_leagues.sql:9](/Users/oguzyurken/Code/english-tales/native-android/backend/supabase/migrations/20261021100000_weekly_leagues.sql:9), [aynı dosya:88](/Users/oguzyurken/Code/english-tales/native-android/backend/supabase/migrations/20261021100000_weekly_leagues.sql:88), [safe_name:50](/Users/oguzyurken/Code/english-tales/native-android/backend/supabase/migrations/20261021120000_friends_and_name_safety.sql:50).

Canlı veritabanında `league_players.opted_out` varsayılanı `false`. Sayılan bir çalışma oturumu tetikleyicisi kullanıcıyı gruba alıyor; `safe_name` normal profil adını diğer grup üyelerine döndürüyor. Bunun öncesinde ayrı bir sosyal görünürlük seçimi/katılım kaydı yok. Eski 50 istemcisi de aynı oturum API'sini kullandığı için backend tetikleyicisi bu kullanıcıları da etkiler; eski uygulamada yeni ligden çıkış arayüzü bulunmaz.

Lig ekranında adın görüneceğini söyleyen metin ve kapatma anahtarı var; ancak bu açıklama otomatik ilk katılımı öncelemiyor. [Canlı gizlilik metni](https://englishtales-app.web.app/privacy) kaynakla byte düzeyinde aynı; profil adı/puanların diğer öğrencilere gösterilmesini ve arkadaş kodunu açıklamıyor. Bu teknik ürün/bilgilendirme uyumsuzluğu bulgusudur; hukuki uygunluk onayı veya ihlal kararı değildir. Gerçek kullanıcı adları okunmadı, iki gerçek hesapla teşhir testi yapılmadı.

**Düzeltme:** ilk katılımı açık kullanıcı seçimine bağla ve önceden katılmış hesaplar için görünürlük geçişini tasarla. Profilin özel adı ile sosyal takma adı ayrılabilir. Canlı gizlilik metni ve Play veri beyanını son davranışla karşılaştır. Yalnız gelecekteki kayıtların default değerini değiştirmek, mevcut katılımcıları tek başına düzeltmez.

### R51-03 · P2 — hesap silme yeni cihaz kayıtlarını bırakıyor

[LearningStore.kt:383](/Users/oguzyurken/Code/english-tales/native-android/app/src/main/java/com/yurken/englishtales/data/LearningStore.kt:383), [DeletedAccountCleanup.kt:16](/Users/oguzyurken/Code/english-tales/native-android/app/src/main/java/com/yurken/englishtales/data/DeletedAccountCleanup.kt:16).

Hem anında silme hem yeniden başlatılan temizleme Room veritabanını kaldırıyor. `quest_chests`, `league_memory`, `game_records` ve `avatar_choice` içindeki hesap kayıtları kalıyor. Son yol, temizleme makbuzunu da tamamlandı diye kapatıyor. Bu davranış, gizlilik metninin başarılı silmede o cihazdaki hesap verisinin kaldırıldığı açıklamasıyla uyuşmuyor. Silinen sunucu hesabının yeniden etkinleştiği veya oturum tokenının kaldığı iddia edilmiyor.

**Doğrulama:** rastgele test owner'ları ve ayrı veritabanı/SharedPreferences namespace'iyle iki yol da çalıştırıldı. Room dosyası yokken dört kayıt grubu duruyordu; gerçek hesap silinmedi.

**Düzeltme:** ortak ve yeniden denenebilir owner temizleyicisi ekle; hem doğrudan silme hem dayanıklı yeniden başlatma yolu kullansın. İlk üç dosyada `$owner:` öneki, `avatar_choice` içinde ise **doğrudan owner anahtarı** silinmeli. Misafir ve diğer hesaplar korunmalı. Temizleme makbuzu bütün adımlar başarıyla tamamlanınca kapansın.

### R51-04 · P2 — bekleyen hesap sandığı çıkıştan sonra misafir ödülüne dönüşebiliyor

[LeagueViewModel.kt:149](/Users/oguzyurken/Code/english-tales/native-android/app/src/main/java/com/yurken/englishtales/data/LeagueViewModel.kt:149), [yerel ödül dalı:124](/Users/oguzyurken/Code/english-tales/native-android/app/src/main/java/com/yurken/englishtales/data/LeagueViewModel.kt:124).

Hesap sandığı oturum eşitlemesini `Syncing` durumunda beklerken çıkış yapılır. `retryChest(snapshot.ownerId, null)` eski `chestDay` ile yerel misafir dalına girebilir. Misafir görevleri tamamlanmadan 20/30/50 yerel puan yazılabilir. Bu, sunucu sandığı/lig XP'sini çoğaltma bulgusu değildir. Bekleyen istekte yalnız gün tutulması, aynı gün içindeki hesap geçişini ayırt etmiyor.

**Doğrulama:** izole uygulama/tercihler ve gerçek ViewModel ile bekleyen hesap durumu → `retryChest("guest", null)` çalıştırıldı; misafir ödülü oluştu. Canlı hesaba puan eklenmedi.

**Düzeltme:** bekleyen istekte `(owner, userId, day, generation)` sakla; kullanıcı geçişinde iptal et. Yeniden deneme ve geciken sunucu sonuçları aynı owner'a ait olmalı. Misafir dalı önceki hesap isteğinin devamı olarak kullanılamamalı.

### R51-05 · P2 — indirilen yeni hikâyenin çevirileri dil değişiminde önbelleğe takılıyor

[RemoteContent.kt:295](/Users/oguzyurken/Code/english-tales/native-android/app/src/main/java/com/yurken/englishtales/data/RemoteContent.kt:295), [çeviri sorguları:301](/Users/oguzyurken/Code/english-tales/native-android/app/src/main/java/com/yurken/englishtales/data/RemoteContent.kt:301).

Yeni Goldilocks hikâyesi Türkçe indirilir. İndirme yalnız o anki dilin çevirilerini saklar. Dil İspanyolcaya değişince pakette bulunmayan bu hikâyenin yeni cümleleri için yerel çeviri geri dönüşü yoktur; İngilizce gösterilir. `download()` aynı revision zaten indirildi diye dönerek çevrimiçiyken bile yeni dil çevirilerini istemez. Sözcük ve açıklama önbellekleri de aynı tek dil modelini kullanıyor.

**Doğrulama:** gerçek `ContentRepository`, yayımlanan yeni hikâyenin tam 11 dilli paketi ve sahte HTTP sunucusu kullanıldı. Türkçe indirme doğruydu; İspanyolca restore'da İngilizceye düştü; yeniden indirme çağrısı tek bir HTTP isteği yapmadı. Gerçek sunucuya yazılmadı. Mevcut çok dil testi, paketteki eski bir hikâyenin yerel çeviri geri dönüşünü kapsıyor; pakette olmayan yeni hikâyeyi kapsamıyor.

**Düzeltme:** indirme durumunu dil kapsamıyla birlikte tut veya bütün dil haritalarını sakla. Eski tek dilli dosyaları da onar; yalnız gelecekteki indirmeyi değiştirmek yetmez. “Zaten indirildi” kararı seçili dilin varlığını kontrol etmeli. Çevrimdışında henüz indirilmeyen dilin ne olacağı açıkça belirtilmeli. Regresyon: yeni hikâye ve uzatılmış cümlelerde TR → ES/AR, çevrimiçi/çevrimdışı ve uygulamayı yeniden açma.

## 2. Gerçekte geçen kontroller

| Kontrol | Sonuç ve sınır |
|---|---|
| Aynı kaynak için ana dal CI | [39942207590](https://github.com/yurkenn/english-tales/actions/runs/39942207590) başarılı: 351 cihaz, 3 açılış, 3 canlı servis testi; 0 hata/atlama. Yeni tanı testleri bu koşuda yok. |
| İmzalı release derlemesi | Yerel 51 / 2.3.0 denetim etiketiyle APK/AAB üretildi. Bu isim sürüm önerisidir; resmî yayın kararı değil. |
| Release JVM testleri | 142/142, 0 hata ve 0 atlama. |
| Lint | 0 hata, 104 uyarı; MissingTranslation uyarısı yok. Uyarılar özellikle plurals, KTX, tipografi ve araç/sürüm önerileri; bir P1 hata olarak sayılmadı. |
| Paket | APK 13,37 MiB, AAB 17,11 MiB. APK projenin 15 MiB sınırının altında. Üretim servis bağı, ZIP/ELF hizalaması ve baseline profile paketlemesi geçti. |
| İmza/R8 | Yükleme sertifikası doğrulandı; AAB içindeki R8 mapping yerel mapping ile aynı. Audit derlemesinde Crashlytics mapping yüklemesi bilinçli olarak atlandı. Bu sonuç Play uygulama imzası veya Play üzerinden güncelleme kabulü değildir. |
| 16 KB native yükleme | Release ile byte düzeyinde aynı ARM64 `.so`, 16 KB emülatörde yüklendi: 1/1. Fiziksel cihaz ve Play split paketlerinin kabulü yerine geçmez. |
| Canlı içerik | 67 hikâyenin güncel revision imzası yeni anonim okumada yedekle aynı. Önceki doğrulamada 67 medya hash'i ve 18 hedef yayın paketi birebir eşleşti. Yapısal içerik hatası 0. |
| Supabase | Lig/arkadaş/sandık migration'ları canlıda mevcut. Anon role açık ayrıcalıklı uygulama RPC'si bulunmadı. Authenticated SECURITY DEFINER uyarıları, izinli RPC tasarımı ve fonksiyon içi owner/staff kontrolleriyle ayrıca değerlendirildi; RLS kapatılmadı. |

**Önemli:** dört tanı senaryosunun PASS olması, hatalı davranışın yeniden üretildiği anlamına gelir. Bunlar yayın onayı veren regresyon testleri değildir. Düzeltme sırasında güvenli davranışı bekleyen kalıcı regresyonlara çevrilmelidir.

## 3. İçerik denetiminin geçmeyen kapıları

Sert içerik denetimi `--require-parity --min-coverage 60 --min-questions 3` ile başarısız oldu. Başarısızlık saklanmadı:

- Paket 50 hikâye/1.002 cümle, canlı 67 hikâye/2.839 cümle. 17 yeni hikâye ilk çevrimdışı kurulum paketinde yok; indirme gerektiriyor. Canlı sürümlerin uzatmaları da paketle birebir değil. Bu fark tek başına veri bozulması değildir; çevrimdışı başlangıç kataloğu için ürün kararı gerekir.
- Canlıda 31 hikâyenin sunucu soru tablosu boş. Bazılarında paketten gelen sorular mevcut olabilir; bu ham sayı, bütün okuyucu ekranlarında hiç soru görünmediğini tek başına kanıtlamaz. İndirilen yeni revizyonun anlama etkinliğinin korunması ayrıca kabul edilmeli.
- Seçili **çalışma kelimesi bağlantıları** bakımından A1/A2 kapsamı pakette %32,33/%17,26; canlıda %24,93/%14,42. Projenin %60 hedefi sağlanmıyor. Bu araç, güncel okuyucunun ek `Glossary` sözlük katmanını ölçmez; oranlar “kullanıcı kelimelerin yalnız bu kadarına dokunabiliyor” diye yorumlanmamalı.
- Sunucuda eski 31 hikâye için bazı dil satırları yok; aynı kaynakla eşleşen paket çevirileriyle etkin çeviri bütünlüğü daha önce kontrol edildi. R51-05 bu genel bütünlükten farklı, **indirildikten sonra dil değişimi** kusurudur.
- Çeviriler ve yeni uzun hikâyelerin pedagojik seviye/kelime seçimleri AI destekli taslak statüsünde. Ana dil uzmanı onayı verilmiş sayılmadı. Ölçümü geçmek için rastgele kelime/çeviri eklenmemeli.

## 4. Kalan yayın ve ürün kararları

1. Önce R51-01/02 gizlilik sınırlarını ve R51-03/04/05 hesap/çeviri davranışlarını düzelt; geciken yanıtlar, ağ hatası ve yeniden başlatma regresyonlarını ekle.
2. Düzeltilen commit'ten yeni hash'li paket üret. Console'da en yüksek kod bu denetimde 50; gerçek yükleme öncesi yeniden kontrol et. Gradle varsayılanı hâlâ 50 / 2.2.0 olduğu için sürüm override'ı gerekli. Bu denetimin 51 / 2.3.0 paketi **üretime uygun değil**.
3. Play internal'a doğru adayı al. Canlı internal hâlâ 49; internal 50 taslağı var. Güncel 51 henüz Play tarafından imzalanıp dağıtılmadı. Eski yerel AAB, kayıtlı üretim 50 AAB hash'iyle eşleşmedi; bu dosya doğrulanmış 50 güncelleme tabanı olarak kullanılmadı.
4. Play üretim 50 → internal aday güncellemesini fiziksel telefonda dene: giriş, kelimeler, okuma yeri, tekrar planı ve tercihler korunsun. Google girişini Play imzasıyla; çevrimdışı yeni hikâye/dil geçişini ve iki cihaz eşitlemesini doğrula. TalkBack, büyük yazı ve en uzun yeni hikâyenin gerçek cihaz performansı açık.
5. Crashlytics mapping son aday için yüklenmeli; yeni sürüm ve izinli Analytics olay kabulü ayrıca doğrulanmalı. Play çökme/ANR alanları bu kontrolde `-`; az/eksik örneklem “%0 hata” değildir.
6. Reklamlar adayda kapalı: `ENABLED=false`, `PUBLICATION_READY=false`. Gelir getiren bir reklamlı sürüm hedefleniyorsa reklam/izin/beyan kabulü ayrı bitirilmeli; bu denetimde reklamlar etkinleştirilmedi.
7. Misafir sandık bonusunun hesaba aktarılmaması bir ürün kararı gerektiriyor. Sunucuda doğrulanmamış toplamı doğrudan aktarmak önerilmiyor; aktarım ekranı puan farkını açıkça anlatmalı. Bu madde kesin veri bozulması diye sınıflandırılmadı.

Ek güvenlik iyileştirmesi: Supabase sızmış parola korumasını kapalı bildiriyor. [Sağlayıcı açıklaması](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Bu tek başına ele geçirilmiş hesap veya mevcut veri sızıntısı kanıtı değildir. 12 indekssiz FK ve 10 çoklu permissive politika uyarısı performans takibine alındı; kullanılmayan indeksler körlemesine silinmedi. 24 saatlik 7 edge 5xx kaydı, 6 çeviri tablosu isteği ve 1 sandık RPC'si olarak ayrılıyor; beklenen `quests_incomplete` reddi ve önceki yüksek-offset yedek hataları kullanıcı çökme oranıyla karıştırılmamalı.

## 5. Kanıtlar

[Makine okunabilir sonuç](release-evidence/2026-10-23-pre-release-audit.json).

Yerel paket, eski dosyaların korunan kopyaları, Claude raporu, test kaynakları ve XML/loglar: [denetim klasörü](/Users/oguzyurken/Code/english-tales/native-android/build/pre-release-audit-2026-10-23).

- [Claude bağımsız incelemesi](/Users/oguzyurken/Code/english-tales/native-android/build/pre-release-audit-2026-10-23/claude-review.md)
- [Üç hesap/ödül kusurunun tanı XML'i](/Users/oguzyurken/Code/english-tales/native-android/build/pre-release-audit-2026-10-23/diagnostic-probes.xml)
- [Dil önbelleği kusurunun XML'i](/Users/oguzyurken/Code/english-tales/native-android/build/pre-release-audit-2026-10-23/translation-cache-probe.xml)
- [16 KB emülatör XML'i](/Users/oguzyurken/Code/english-tales/native-android/build/pre-release-audit-2026-10-23/native-16kb-probe.xml)
- [Release test ve paket kontrolleri](/Users/oguzyurken/Code/english-tales/native-android/build/pre-release-audit-2026-10-23/release-checks.json)
- [Sert içerik denetimi](/Users/oguzyurken/Code/english-tales/native-android/build/pre-release-audit-2026-10-23/content-strict/report.md)
- [Play üretim görünümü](/Users/oguzyurken/Code/english-tales/native-android/build/pre-release-audit-2026-10-23/play-production.png)
- [Play paketler/internal taslak görünümü](/Users/oguzyurken/Code/english-tales/native-android/build/pre-release-audit-2026-10-23/play-bundles.png)

Rapor yerelde tutuldu; kaynak düzeltmesi, canlı şema değişikliği, gerçek hesap silme, canlı öğrenme puanı yazma veya mağaza başvurusu yapılmadı.
