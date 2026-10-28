# English Tales — eksikleri tamamlama planı

27 Ekim 2026. Başlangıç kaynak: `e89f038ac8e27cd81dd23c3f824eb4621a33e6eb`.
Bu dal #180 → #179 üzerine kuruludur. Ana çalışma ağacındaki kayıt dışı denetim dosyaları ve diğer çalışma ağaçları korunur.

## Sıra ve kabul ölçütleri

| Sıra | İş | Tamamlanma ölçütü | Başlangıç durumu |
|---|---|---|---|
| 1 | Bağımsız çeviri dili | EN arayüz + ES/AR çeviri, kalıcılık, çevrimdışı hikâye, kaydet/iptal; gerçek ekran görüntüleri | #180 CI: 151 JVM, 386 uygulama, 3 açılış, 3 servis; görsel kabul açık |
| 2 | Bağımsız kod incelemesi | Claude bulguları kaynak satırlarıyla incelenir; doğrulanan hatalar düzeltilir ve ilgili testler geçer | İnceleme başlatıldı |
| 3 | Öğrenme döngüsü ölçümü | Başarılı kelime kaydından sonra kimlik/metin içermeyen olay; izin başlangıcına göre UTC D7 dönüşü; kapalı izin/yeniden başlatma/geri alma testleri | Kelime kaydı ve D7 olayları eksik |
| 4 | Paket/canlı içerik | Güncel anonim okuma ile hikâye, revizyon, çeviri ve medya farkı kaydı; ilerleme korunarak gereken paket değişikliği | Önceki 50/67 sayıları güncel kabul edilmez |
| 5 | Premium kabulü | Aktif restore, pending, refund, hesap değişimi: UI + sağlayıcı + staging sunucu kanıtı | #179 açık; eski satın alma ve expired restore kanıtı mevcut |
| 6 | İzlenmiş reklam ödülü | Test etiketli gerçek birim reklamı → SDK → imzalı SSV → tam bir kredi; fixture temizliği | Console imzalı callback geçti; izlenmiş reklam açık |
| 7 | Yayın hazırlığı | RTL/büyük yazı/TalkBack, Play beyanları, üretim sürümü ve etkinleştirme planı | Güncel Console kontrolü gerekli; sandbox 56 üretime taşınmaz |
| 8 | Kullanıcı pilotu ve kazanım | 5–8 gönüllü, ilk hikâye/kayıt/tekrar/çevrimdışı görevleri; sonra tek değişkenli mağaza deneyi | Kullanıcı katılımı ve gerçek panel verisi gerekli |

## Uygulama sınırları

- Teknik geliştirme, yerel/CI testleri ve anonim içerik denetimi bu çalışma kapsamında yürütülür.
- Analytics varsayılan kapalı kalır; hesap, içerik, kelime kimliği veya metin eklenmez. Kohort cihazın izin verdiği gün başlar; D1/D7 kurulum tutulumu diye raporlanmaz.
- Ödeme testinde yalnız Play lisans testi ekranı ve test ödeme aracı kullanılır. Aktif restore için süresi dolmamış gerçek sandbox entitlement gerekir.
- Reklam probe'u yalnız emülatör/staging içindir. SDK callback tek başına sunucu ödülü kabulü değildir.
- İnsan dil incelemesi, gerçek kullanıcı pilotu, Analytics panel kabulü ve Play canlı sunumu otomatik test sonucu ile kapatılmaz.
- Üretim aktivasyonu ve mağaza gönderimi ancak somut kanıtlar ve sürüm kapsamı hazır olduğunda ayrı yayın adımı olarak yürütülür.

## Sonuç kaydı

- **Yayın durumu kapandı:** [canlı Console kontrolü](release-evidence/2026-10-27-play-production.json), 52 / 2.3.1 Production kullanılabilir, %100; yayımlanmamış değişiklik yok. Fiziksel güncelleme/ölçüm kabulü ayrı.
- **Bağımsız inceleme yapıldı:** [Claude ilk ve ikinci incelemesi](CLAUDE_COMPLETION_REVIEW_2026-10-27.md). Restore sırasında pending işaretinin erken temizlenmesi ve günlük bakiye yenilenmesinin reklam doğrulaması sayılması düzeltildi. Claude'un sonraki uygulama çağrısı oturum limitine ulaştı; bu çağrı kod üretmedi.
- **Ölçüm uygulandı:** parametresiz `word_saved`, yeni kaydedilen kelime başına commit sonrasında; `seventh_day_return`, izin verilen ilk UTC gününden tam 7 gün sonra ve dönem başına bir kez. Yeni tercih alanı varsayılan false; mevcut kohort günü korunur. Firebase panel kabulü açık.
- **Yerel teknik kontroller:** 156 JVM testi, 0 hata/atlama; debug lint 0 hata, 106 uyarı; debug APK ve cihaz test APK derlendi. Depo ve yerelleştirme kontrolleri geçti. 18 hedefli API36 cihaz testi hatasız geçti. [Yerel doğrulama](release-evidence/2026-10-27-completion-validation.json).
- **İçerik denetimi yapıldı, eşitlik kapanmadı:** [anonim kanıt](release-evidence/2026-10-27-content-parity.json). 17 yalnız-canlı hikâye, 44 farklı ortak hikâye. `--require-parity` beklenen şekilde `bundle_live_parity` ile başarısız; yapısal kontroller ve 67 medya hash'i geçti.
- **Aktif sandbox restore doğrulandı:** kullanıcı geri yükleme sonrasında Premium gördüğünü bildirdi. Aynı hesapta staging kontrol zamanı 19:03:01 UTC olarak yenilendi; RevenueCat öncesi/sonrası sorguları süresi dolmamış Play sandbox aylık Premium gösterdi. UI kullanıcı beyanıdır; ajan ekran görüntüsü değildir. [Kanıt](release-evidence/2026-10-27-active-restore-provider.json). Pending/iade/hesap geçişi ayrı açık testlerdir.
- **CI tamamlandı:** kaynak `3408f084`, [40564259744](https://github.com/yurkenn/english-tales/actions/runs/40564259744): 156 JVM, 392 uygulama, 3 açılış, 3 servis testi; hata/atlama yok. Tüm beş iş başarılı.

## İçerik paketini eşitlemenin somut kapsamı

Bu adım yalnızca 17 JSON hikâyesi eklemek değildir. `LearningContent.parse` şu anda bütün paket hikâyelerini ortak sözlükten otomatik eşler; canlı katalog editörün revizyon bazlı kelime ve cümle bağlantılarını kullanır. Paket/canlı eşitliği için:

1. Doğrulanmış anonim snapshot'tan etkin revizyonları seçen, ağda yazma yapmayan ve aynı girdiden aynı çıktıyı üreten dönüştürücü ekle.
2. Paket formatına geriye uyumlu hikâye bazlı vocabulary/`sentenceWordIds` ve kaynak revizyonu desteği ekle. Aynı ID'nin hikâyeye özel anlamını ortak sözlükte ezme; mevcut kayıtlı kelime ID'lerini koru.
3. `LearningContent.parse` ve `bundledDocuments` açık editör bağlantılarını kullansın; eski format otomatik eşleme davranışını sürdürsün. Denetim eşitliği gevşetilmesin.
4. `RemoteContent.publish` paket optimizasyonunu yeni gerçek revizyon/kelime bağlantılarıyla doğrula. Bugünkü `vocabulary=null,sentenceWordIds=null` optimizasyonunu yeni editör verisini kaybettirmeden güncelle.
5. 67 kapak için hash doğrulanmış kaynakları ve kaynak-manifest eşlemesini kullan; yeni kaynakları çevrimdışı APK'dan okunabilir hale getir. Rastgele eski kapak eşlemesi yapılmasın.
6. Eski kaydedilmiş kelimeler, cümle ID'sine bağlı okuma konumu, eski indirilen revizyonlar, dil değişimi ve çevrimdışı yeniden açılış regresyonlarını çalıştır.
7. Son adayda `--require-parity`, 11 dil yapısal denetimi ve kapak kontrolleri geçsin. İnsan anlam/dil kabulünü otomatik eşitlikten ayrı tut.

Canlı sözlüğün 7 eski kelime ID'si paketteki biçimiyle etkin revizyonlarda yok. Bu ID'ler kişisel kayıtları kırmamak için korunmalıdır; kullanılmıyor diye silinmez. Yapısal denetimdeki 18 canlı uyarı editör incelemesine ayrılır; her token'ı çalışma kelimesi yaparak oran artırılmaz.

## Çeviri seçicisi görsel kanıtı

Gerçek API36 ekranlarından 6 özgün PNG incelendi: İngilizce, Arapça RTL ve İngilizce 1,5× yazı; her biri başlangıç ve son dile kaydırılmış durumda. Başlık, kaydet/kapat ve son dil seçimi görünür. Bunlar izole seçici bileşeni görüntüleridir; tam uygulama akışı, TalkBack veya fiziksel telefon kabulü değildir.

- [İngilizce](release-evidence/2026-10-27-translation-visual/english.png), [son seçenek](release-evidence/2026-10-27-translation-visual/english-scrolled.png).
- [Arapça RTL](release-evidence/2026-10-27-translation-visual/arabic.png), [son seçenek](release-evidence/2026-10-27-translation-visual/arabic-scrolled.png).
- [Büyük yazı](release-evidence/2026-10-27-translation-visual/english-large.png), [son seçenek](release-evidence/2026-10-27-translation-visual/english-large-scrolled.png).

## 28 Ekim reklam kabul sonucu

Ayrı API36 emülatöründe yerel opt-in sandbox ile test etiketli gerçek rewarded birimi izlendi; SDK probe 1/1 geçti. İmzalı callback staging’de tek işlem ve tam 1 enerji oluşturdu; ikinci sorguda kredi 1 kaldı. Sentetik fixture kullanıcı/cüzdan/biletleri temizlendi ve sıfır kayıt doğrulandı. [Kanıt](release-evidence/2026-10-28-rewarded-ssv.json). Bu callback için yeni replay yapılmadı; önceki Console replay kanıtı ayrı. Normal reklam ekranı/UMP, pending/iade/hesap geçişi, içerik paketi eşitleme ve insan kabul adımları açık.

## 28 Ekim çevrimdışı paket yenilemesi

[İçerik paketi V2](CONTENT_BUNDLE_V2_2026-10-28.md), güncel anonim snapshot ile 67 hikâye / 2.839 cümle / 11 dil / 67 kapak eşitliğini sağladı. Eski 359 kelime kimliği ve 50 revizyon arşivi korunur. Eski editör araçlarının V1 kaynağı değişmez. 48 hedefli API36 testi geçti; yeni geçiş testleri; eski yüzde/kayıtlar, yeni revizyon, çevrimdışı eski metadata ve editör bağlantılarını kapsar. [Snapshot ve APK kanıtı](release-evidence/2026-10-28-published-catalog-parity.json). [Claude incelemesi ve kararlar](CLAUDE_CONTENT_BUNDLE_REVIEW_2026-10-28.md). Kelime kapsamı hedefi, dil/editör kabulü, pending/iade/hesap geçişi ve normal reklam/UMP akışı açık kalır.
