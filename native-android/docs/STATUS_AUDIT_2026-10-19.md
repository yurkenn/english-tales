# 19 Ekim 2026 — Yayın öncesi son durum analizi

> Tarihsel başlangıç snapshot’ı: `ec74452` ana dalı. Güncel yayın durumu için [50 sürüm kaydını](RELEASE_50_STATUS.md) kullanın.

Bu kayıt mevcut GitHub, yerel paket ve oturum açık Play Console üzerinden yapılan durum tespitidir. Bu analiz sırasında uygulama kaynakları değiştirilmedi; PR birleştirilmedi veya mağazaya yayın gönderilmedi.

## Yayın durumu

Console'da yeniden doğrulandı:

- Üretim: **48 / 2.0.0**, dağıtım **%100**.
- Dahili test: **49 / 2.1.0**.
- **50 / 2.2.0 henüz Play'e yüklenmedi veya incelemeye gönderilmedi.** Açılmış üretim taslağında yüklenen yeni AAB yok; sürüm adı boş. Console yayın özetinde inceleme bekleyen değişiklik bulunmuyor.
- Yerelleştirilmiş mağaza metinleri ve EN yeni marka görseli mağaza düzenleme taslağına kaydedildi; bunlar yayımlanmış kayıt değildir. Türkçe görsel değişimi ve yeni ekran görüntülerinin seçimi tamamlanmamış durumda. Açık düzenleme sekmesi korunuyor.

Console: [kanal özeti](https://play.google.com/console/u/0/developers/7726521495392867100/app/4972425450856153810/test-and-release).

## Claude'un ana dala ekledikleri

Önceki yayın adayının tabanı `c27582f` idi. Ana dal şu anda `ec74452c0b25b645a0949c58ee92be2666c4074a`. Arada **23 PR** birleştirildi; 32 dosyada 1023 ekleme / 96 silme var. Bu fark yalnız bu iki ana dal noktası arasındadır; bizim henüz birleşmeyen ASO/marka değişikliklerini silinmiş gibi yorumlamamak gerekir.

- Veri güvenilirliği: hesap değişiminde bekleyen yazıların korunması (#120), eski hesap işçisinin iptali (#130), yazma tekrar testinin sabitlenmesi (#132), tekrar kaldırmada tutarlılık (#123).
- Senkronizasyon/pil: çevrimdışı yeniden denemeye bekleme (#122), ön planda gereksiz arka plan işi oluşturulmaması (#124/#135), widget'ın 30 dakikada bir cihazı uyandırmasının kaldırılması (#134).
- İçerik/indirme: yenileme sırasında indirme isteğinin korunması (#125), indirilmiş içerik haritasının eşzamanlı erişim güvenliği (#131), sayfa boyutu düzeltmesi (#126), paket metni uyumsuzluğunun tekrar tekrar indirilmemesi (#136).
- Okuma/alıştırma: tamamlanan hikâyenin ilk sayfadan açılması (#133), içerik hazırlanırken paylaşılan bağlantının beklemesi (#128), değişen kelime listesinde oyunların toparlanması (#119), sekme değişiminde alıştırmanın korunması (#129), tekrar oturumunun içerik/ses hazırlığını beklemesi (#137), oturum sayısının doğru zamanda duyurulması (#138).
- Hesap deneyimi: geri gelen kullanıcının tekrar onboarding görmemesi (#127), e-posta kodu adımının süreç kapanınca korunması (#139), tercihler geri yükleme düzeltmesi (#121).
- Tam veri görünümünü her okuma kontrol noktasında tekrar okumanın kaldırılması (#112) ve Q2 karar belgesi (#92).

[Son ana dal CI](https://github.com/yurkenn/english-tales/actions/runs/39220193259) başarılı: repository, backend, Android ve android-device işlerinin tamamı yeşil. Backend 149/149. Cihaz çalışmasında 3 atlanan test var; ayrıca 3 makro test tamamlanmış. Bu CI sonucu mağaza yayını veya gerçek cihaz kabulü anlamına gelmez.

## Açık PR'lar

| PR | Kapsam | Doğrulanan durum |
|---|---|---|
| [#117](https://github.com/yurkenn/english-tales/pull/117) | 10 dil ASO araştırması ve mağaza metinleri | Taslak; cihaz kontrollerinden biri başarısız, diğeri başarılı. Başarısız çalışmada AccountSwitchTest zamanlama hatası. Yeni ana dalla güncellenip yeniden doğrulanmalı. |
| [#118](https://github.com/yurkenn/english-tales/pull/118) | 50 / 2.2.0, yerel uygulama adları ve sürüm notları | Tüm mevcut kontroller yeşil; birleşebilir. Fakat 23 yeni ana dal PR'ını içermiyor. |
| [#140](https://github.com/yurkenn/english-tales/pull/140) | Süresi dolmuş oturumdan sonra hatırlanan hesabın açılması | Cihaz testi başarısız: FirstLaunchJourneyTest, 20 saniye zaman aşımı. Flaky olduğu kanıtlanmış sayılmaz. |
| [#141](https://github.com/yurkenn/english-tales/pull/141) | Otomatik dinlemenin her ziyarette yalnız bir kez başlaması | Tüm kontroller yeşil. |
| [#142](https://github.com/yurkenn/english-tales/pull/142) | Hikâye başına çalışma kelimesi önerileri | Tüm kontroller yeşil; editör önerisi, uygulamaya bağlı değil. İncelenmemiş öneriler canlı içerik gibi yayımlanmamalı. |
| [#143](https://github.com/yurkenn/english-tales/pull/143) | Kelime kartları/eşleştirmede geri tuşunun Alıştırma içinde kalması | Tüm kontroller yeşil. |
| [#144](https://github.com/yurkenn/english-tales/pull/144) | Yeniden oluşturulan okuyucunun süren indirmeye katılması | İki cihaz testi başarısız: readerDownloadDuringRefreshWaitsInsteadOfBeingDropped ve readerRecreatedMidDownloadStillOpensTheStory. İkisinde de beklenen 1, görülen 2. |

Eski açık kayıtlar da var: #71 (SQL yayın testi/belge, yeşil) ve #1 (eski test ortamı taslağı). Güncel sürümün zorunlu özelliği oldukları bu analizde varsayılmadı. #90 artık açık PR listesinde değil; 10 dil desteği #115 üzerinden zaten ana dalda.

## Bizim hazırlığın sınırı

- #115 (10 dil), #116 (ilk açılış dil seçimi) ve #114 (çalışan eşitlemeden sonra yeniden deneme) birleştirilmiş durumda.
- Çalışma dalı `codex/store-release-50`, kod başı `d7e94798b25b96e044c633436efd4fb41e09e0a9`.
- Güncel ana dalla çalışma dalının üç yönlü deneme birleşimi çakışmasız; çalışma dosyaları veya dal değiştirilmedi.
- Bu daldan 50 / 2.2.0 imzalı APK/AAB derlendi. Release 120 birim testi başarısızlıksız; lint 0 hata (67 uyarı).
- Son AAB yeniden statik doğrulandı. SHA-256: `5c84991d58c35790cbc61de2c45e667c0c4df79fe8d10862ee2524371ac8fff7`. APK SHA-256: `977f156a8873f39b9cbf853f7d6bc36da2c9bd9d66c693ab1fcedb6fa4ac0467`.
- İmza, servis ayarı ve APK/ELF 16 KB hizalaması geçti. Bu rapor **eski yayın adayı kodunu** doğrular; yeni ana dalı içeren paket kanıtı değildir. Play split paketleri/gerçek 16 KB cihaz ayrıca test edilmelidir.
- Önceki manuel test, ilk yerel 50 paketiyle dil seçimi → misafir → onboarding → hikâye/cümle çevirisine ulaştı. Son yeniden derlemeye veya yeni Claude koduna tam uçtan uca kabul kanıtı taşınmamalı.
- Yeni tanıtım görseli ve iki EN ekran görüntüsü henüz Git'e eklenmemiş: `store/google-play/feature-graphic-v50.jpg`, `store/google-play/en-US/screenshots-v50/`. Yerel dosyalar korunuyor. Diğer çalışma alanındaki kaynaklar değiştirilmedi.

## Yayına devam ederken sıra

1. Yeni ana dalı #118'e al; yeşil #141/#143 düzeltmelerini değerlendir. #140/#144 başarısızlıklarını inceleyip çözmeden o PR'ları yayına katma. #142 editör aracı ayrı kapsamdır; önerileri otomatik yayınlama.
2. #117'nin eski cihaz başarısızlığını yeni ana dal üzerinde yeniden doğrula. ASO/marka metinlerini güncel kodla birleştir.
3. **Yeni birleşik commit'ten** 50 / 2.2.0 adayını yeniden üret. Kod 50 Console'da henüz kullanılmadı; yüklemeden önce en yüksek kodu tekrar denetle.
4. Aynı pakette güncellemede veri koruma, dil seçimi, misafir/giriş, indirme/çevrimdışı okuma, kelime kaydetme/tekrar ve yeniden açılış yolculuğunu doğrula.
5. Yerel görselleri ve mağaza kaydını tamamla; AAB ve eşleşen mapping dosyasını yükle, güncel notlarla üretim incelemesine gönder. İncelemeye gönderildi ve kullanıcıya yayımlandı durumlarını ayrı kaydet.

Mevcut eski AAB'yi olduğu gibi yayınlamak yeni Claude düzeltmelerini dışarıda bırakır. Bu nedenle sıradaki iş yeni birleşik yayın adayını hazırlamaktır.
