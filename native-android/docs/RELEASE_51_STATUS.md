# 51 / 2.3.0 — yayın hazırlığı

24 Ekim 2026. Kaynak: `b6ee29180ebb854dd25e36e174c1d274383ab3a1`.

Üretim yayını henüz yapılmadı. Sahibi, hazır olduğunda yayınlama yetkisi verdi; bu yetki tamamlanmamış kabul testlerinin geçtiği anlamına gelmez. Önceki [23 Ekim denetimi](PRE_RELEASE_AUDIT_2026-10-23.md) düzeltme öncesi tarihsel kayıttır.

## Kaynak ve doğrulama

Claude'un [#174](https://github.com/yurkenn/english-tales/pull/174) düzeltmeleri ve [#175](https://github.com/yurkenn/english-tales/pull/175) 13 dilli sürüm notları ana dalda. Yönetilen çalışma alanındaki önceki düzeltmeler ana daldaki dosyalarla byte düzeyinde aynı; yerel kopya ayrıca stash içinde korundu. Aynı düzeltmeler için tekrar PR açılmadı.

[Son ana dal CI](https://github.com/yurkenn/english-tales/actions/runs/40022721392): 376 uygulama cihaz testi, 3 açılış testi, 3 servis cihaz testi; XML sonuçlarında 0 hata/atlama. Backend 212 test, JVM 142 test geçti. Bu sonuçlar fiziksel telefon kabulü değildir.

- R51-01: arkadaş/lig yanıtları hesap ve istek nesline bağlı; hesap değişiminde eski durum temizlenir.
- R51-02: lig açık katılımla başlar. `20261023190101_league_consent.sql` canlıda uygulandı; önceki otomatik katılımcıların görünürlüğü kapatıldı, öğrenme geçmişi korunur. Arkadaş kodu kullanıcı işlemiyle paylaşılır. Gizlilik metni canlıya alındı.
- R51-03: doğrudan ve yeniden başlatılan hesap silme yolu dört hesap tercihi grubunu temizler; diğer hesap ve misafir kayıtları korunur.
- R51-04: bekleyen sandık hesap/gün/istek nesline bağlı. Eşitleme tamamlanması doğru çalışma biletiyle izlenir; çıkış misafir ödülü üretemez.
- R51-05: yeni indirme 11 dil haritasını saklar. Eski eksik indirmeler çevrimiçiyken onarılır; çevrimdışında mevcut dosya korunur ve eksik dil açıklanır.

## Canlı içerik

24 Ekim anonim yedeği: 67 hikâye, güncel sürümlerde 2.839 cümle, 67 doğrulanmış medya dosyası. Kaynakla birebir eşleşen 31 eski hikâyeye toplam 119 anlama sorusu ve yalnız eksik çeviriler yayıncı arayüzünden eklendi. Her kayıtta önceki yayın yedeği, kaynak revision/edit-version koruması ve yayın sonrası belge karşılaştırması kullanıldı.

Tüm 67 hikâyede en az 3 soru var; 11 dilde cümle, kelime ve açıklama eksiği 0. Diğer 36 hikâyenin belge ve revision kimliği aynı. Eski yayımlanmış tablo satırları ile 67 medya hash'i korunmuş. Bu, yapısal ve kaynak eşleşmesi kanıtıdır; AI incelemesi ana dil uzmanı onayı olarak sunulmaz.

## Paket ve Play

Yerel imzalı aday 51 / 2.3.0: APK 14.040.073 bayt, AAB 17.958.711 bayt. Üretim servis bağı, yükleme sertifikası, AAB imzası, baseline profile ve ZIP/ELF 16 KB statik kontrolleri geçti.

- APK SHA-256: `9ab59574075d4dfd21a3120174482b7c7929aeb0a2ea3611f0e044730f221a7b`
- AAB SHA-256: `335911b3814b7189ea79d99bfbd07310647af5497ccd82a8ac3319ae6f3fa3ff`

Yerel adayın kaynak dosyaları ana dalla aynı; CI paketinin hash'i ayrı kaydedilir. İmzalı paket ve mapping herkese açık depoya eklenmez. [Güncel ana daldan yüklemesiz release CI](https://github.com/yurkenn/english-tales/actions/runs/40043274160) başarılı: imzalı derleme, mapping yüklemesi ve paket doğrulaması geçti; Play yükleme adımı kapalı. Eski commit için bekleyen iş iptal edildi. **24 Ekim 03:13 TRT:** yalnız 51 AAB ve 13 dilde yeni notlarla dahili testte yayınlandı: `Available to internal testers`, release `6`. [Test bağlantısı](https://play.google.com/apps/internaltest/4701713728242169635). Geri indirilen orijinal AAB yukarıdaki hash ile birebir aynı. Play imzalı evrensel APK sertifikası Google App Signing sertifikasıyla eşleşti; bu sonuç fiziksel cihaz kabulü değildir. Üretim 50 / 2.2.0, %100 dağıtımda.

Play 51 önizlemesi: desteklenen cihaz kaybı 0, R8 mapping mevcut. Bir uyarı üçüncü taraf native kitaplığın debug sembolleriyle ilgili; mevcut bağımlılık `.so` dosyaları strip edilmiş, R8 mapping bu sembollerin yerine geçmez. Gradle `SYMBOL_TABLE` ayarlı olmasına rağmen paket native sembol içermiyor; uyarı gizlenmedi.

Play paket incelemesi 16 KB desteği, Full Mode/Resource Shrinking ve %94 DEX optimizasyonu gösteriyor. CI ve yerel APK/AAB hash'leri farklıdır (CI APK `07c91b59278e530976ef4858059ac88ea5b759c8b516e5c45e7fc91764dbad5e`, AAB `f422e5555fbe275cb9b13a0be383817ede997d9fc39a46c839b06d37ef6757fb`); yüklenen dosya yerel doğrulanmış adaydır. [Makine okunabilir kayıt](release-evidence/2026-10-24-release-51-status.json).

## Açık kabul ve içerik hedefleri

1. Fiziksel telefonda Play üretim 50 → dahili 51 güncellemesi: oturum, kelimeler, okuma yeri, tekrar planı ve tercihler korunmalı. Google girişi Play imzasıyla; çevrimdışı yeni hikâye/dil geçişi, iki cihaz eşitlemesi, TalkBack/büyük yazı ve uzun hikâye performansı doğrulanmalı. Bu oturumda yalnız emülatör bağlı.
2. Mağazaya yüklenen AAB içindeki mapping dosyası korunmuş kopyayla byte düzeyinde eşleşti. Paketin `81c993fb7ea94fa6b9cd19a88971ecd9` mapping kimliğiyle, yeniden derleme gerektirmeden bu dosyanın Crashlytics yüklemesi başarılı (5 saniye). CI kendi farklı paketinin mapping dosyasını da yükledi. Runtime Crashlytics/izinli Analytics kabulü hâlâ açık. Vitals alanlarında veri yok; %0 çökme iddiası yapılmaz.
3. Tam içerik denetimi `--require-parity --min-coverage 60 --min-questions 3`: sorular, 11 dil ve medya geçti; paket/canlı eşitliği ile A1/A2 seçili çalışma kelimesi %60 hedefi geçmedi. Başlangıç paketi 50 hikâye/1.002 cümle; canlı 67/2.839. Yeni hikâyeler indirme gerektirir. [Yol haritasındaki ölçüm ayrımı](ROADMAP_2026_Q4.md): çalışma kelimesi kapsamı, ek dokunma sözlüğünün kapsaması değildir. Oranı yükseltmek için rastgele alıştırma kelimesi eklenmedi, eşik düşürülmedi. Bu hedeflerin tamamlandığı iddia edilmez.
4. Play veri güvenliği formunun mevcut dışa aktarımı incelendi: ad, e-posta, kullanıcı kimliği, etkileşimler, kullanıcı içeriği, crash/diagnostics ve cihaz kimliği beyanları var; hesap silme URL'si doğru. Sosyal görünürlük açık katılımla sınırlandı. [Google açıklamasındaki kullanıcı tarafından başlatılan aktarım istisnası](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en#sharing) nedeniyle sırf lig/arkadaş var diye otomatik paylaşım beyanı değiştirilmedi. Üretim 50 kaynağında da misafir devamı doğrulandı. Hesaba özel ad/e-posta/kullanıcı kimliği ve kullanıcı içeriği “Optional” olarak düzeltildi; etkileşimlerin App functionality amacı eklendi. Önce/sonra CSV karşılaştırması yalnız 9 planlı yanıt farkını doğruladı; diğer bütün yanıtlar korundu. Yalnız Data safety değişikliği incelemeye gönderildi; Console `Changes in review`, yayımlanmamış ek değişiklik 0. Hızlı kontroller sürüyor; onay verildiği iddia edilmez.
5. Yeni uzun içerik ve 10 destek dilinin ana dil örneklemi kabulü açık; AI denetimi ayrı tutulur. Reklamlar mevcut ürün kararıyla kapalı kalır.

Yerel kanıtlar `native-android/build/release-51-readiness/` altında; anonim içerik yedekleri, UI yayın yedekleri, CI XML'leri, paket doğrulaması ve görseller burada korunur. Kamuya açık durum kaydı özel öğrenme verisi veya kimlik doğrulama bilgisi içermez.
