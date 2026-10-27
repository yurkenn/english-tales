# 26 Ekim — ödeme kabulünden bağımsız ürün işleri

Kaynak: `b061b680a997914b0cfcff577bcff0e043efb5e2`, PR #179 çalışma ağacı. Bu kayıt kaynak ve CI denetimidir; yeni ekran görüntüsü, güncel üretim Console kontrolü veya kullanıcı araştırması değildir. Bilgisayar kilitliyken aktif satın alma geri yükleme ve izlenmiş reklam kabulü açık kalır.

27 Ekim uygulama ilerlemesi: 1 numara `codex/translation-language` dalında uygulandı. Ayarlar'da 11 destek dili veya mevcut davranışı koruyan otomatik seçim var. Açık tercih arayüz dilinden bağımsız saklanır; Activity yeniden oluşturularak mevcut dil yükleme yolu kullanılır. Hesap/öğrenme kayıtları değiştirilmez. Yerel 151 birim testi geçti, cihaz test paketi derlendi; cihaz CI ve lint sonucu ayrıca kaydedilecek. Bu ilerleme aşağıdaki ilk denetimin tarihsel bulgusunu silmez; görsel/gerçek cihaz kabulü ve mağaza yayını anlamına gelmez.

## Öncelik sırası

| Öncelik | Bulgu / yapılacak iş | Neden | Tamamlanma ölçütü |
|---|---|---|---|
| 1 | Arayüz dilinden bağımsız çeviri dili seçimi | `SupportLanguage.configure()` yalnız `AppLanguage.locale()` kullanıyor. İngilizce destek dili olmadığı için İngilizce arayüz Türkçeye düşüyor. `LanguageControls` yalnız arayüz dilini değiştiriyor. | Kullanıcı mevcut 11 destek dilinden birini seçebilir. Eski seçimler korunur; okuyucu, sözlük ve indirmeler aynı tercihi kullanır. EN arayüz + ES/AR çeviri, yeniden açma ve çevrimdışı senaryoları doğrulanır. |
| 2 | İlk hikâye → kelime kaydet → ertesi gün tekrar yolculuğunu ölçmek | Seviye seçimi, önerilen ilk hikâyeye doğrudan yönlendirme ve FSRS zaten var. `ProductMetrics` başlangıç/bitiş ve ertesi gün dönüş olaylarını içeriyor; kelime kaydetme ve yedinci gün dönüş olayı yok. Kodun bulunması panel kabulü değildir. | İzinli üretim kohortunda ilk hikâye bitirme, kaydetme, ilk tekrar, D1 ve D7 tanımları yazılır; olaylar panelde doğrulanır. Kimlik/metin gönderilmez, izin varsayılanı değiştirilmez. Küçük örneklemde sonuç çıkarılmaz. |
| 3 | Çalışma kelimelerini hikâye bazında iyileştirmek | Son CI paket denetiminde 50 hikâye/1.002 cümle, A1 çalışma kelimesi tür kapsamı %32,33, A2 %17,26. Bu oran dokunma sözlüğü kapsaması veya anlam doğruluğu değildir; zamir/bağlaç/özel adlar da paydada. | Mevcut beş pilotta uygun kelime seçimi ve okuma→kaydetme→tekrar bağı kabul edilir; sonra diğer hikâyeler sırayla incelenir. Sırf oranı yükseltmek için her token alıştırmaya eklenmez. |
| 4 | Paket ve canlı içerik farkını yeniden ölçmek | Güncel CI denetimi yalnız paketi okuyor: 50 hikâye. 23–24 Ekim kayıtları canlıda 67 hikâye bildiriyor; bu eski sayı bugün tekrar doğrulanmadı. Çevrimiçi kataloğun çalışması ilk kurulum çevrimdışı paket eşitliği değildir. | Anonim güncel snapshot ile revision/metin/medya/dil karşılaştırması; gerekli paket güncellemesinde ilerleme ve eski indirmelerin korunması. Yayın ve editör kabulü ayrı tutulur. |
| 5 | Gönüllü küçük pilot ve erişilebilirlik kabulü | Otomatik testler okunabilirliği, kelime kaydetmenin keşfedilmesini veya gerçek kullanıcı geri dönüşünü kanıtlamaz. | 5–8 gönüllüyle ilk hikâye, kelime kaydetme, ertesi gün tekrar, bağlantısız devam görevleri. TalkBack, büyük yazı ve RTL kabulü. Katılımcıya mesaj gönderme bu belgeyle yetkilendirilmez. |
| 6 | Mağaza ve kazanım deneyini ölçüme bağlamak | Üründeki ilk öğrenme döngüsünün nerede kayıp verdiği bilinmeden reklam bütçesi için güvenilir karar yok. | Yeterli veriyle iki öncelikli pazar seçilir; mağaza görseli veya kısa açıklamadan tek değişken denenir. Maliyet, ilk hikâye bitirme ve geri dönüş birlikte değerlendirilir. Gelir tahmini gerçekleşmiş gelir diye raporlanmaz. |

Önerilen ilk uygulama işi: **1 numara**. Kaynak/test çalışması kilitli ekrandan bağımsız ilerleyebilir; görsel ve gerçek cihaz kabulü ayrıca yapılır. Bu denetim özellik uygulaması veya tamamlanmış kabul değildir.

## Yeniden yapılmayacak mevcut özellikler

Seviye belirleme, önerilen ilk hikâyeyi açma, FSRS, alıştırmalar, hatırlatıcı, indirmeler ve dil seçimi zaten bulunuyor. Bunların kullanımını iyileştirmek, aynı görevi yapan yeni ekranlar eklemekten önce gelir. Çok dilli indirme hatasının eski raporu güncel hata diye taşınmaz: `RemoteContent` artık tüm etkin dil haritalarını indiriyor, eski dosyalarda `needsLanguageRepair()` ile eksik dili saptıyor.

## Güncel teknik kanıt

- [Başarılı kaynak CI](https://github.com/yurkenn/english-tales/actions/runs/40277870830): indirilen XML sonuçlarında 383 uygulama, 3 açılış ve 3 servis testi; 0 başarısızlık/hata/atlama.
- [Aynı başlığın başarısız koşusu](https://github.com/yurkenn/english-tales/actions/runs/40277868136): emülatör açılışından sonra runner'ın `adb shell input keyevent 82` çağrısı `Broken pipe (32)` / exit 224 ile durdu. Uygulama testleri başlamadı. Android input servisinin neden hazır olmadığı bu kayıttan belirlenemiyor; ürün regresyonu veya kalıcı çözüm iddia edilmez.
- Başarılı koşunun `content-audit` raporu: paket yapısal hata 0, 11 dilde eksik cümle/kelime/açıklama 0, 50/50 hikâyede en az üç anlama sorusu. Rapor kaynak alanı CI merge commit'i `d2cbafaa7f270eca8a7538979d39ec9340092d46`; canlı denetim yapılmadı.
- Güncel Play üretim sürümü bu turda kontrol edilmedi. Son doğrulanmış 52 kaydı Google incelemesine gönderimi kanıtlıyor; canlı sunum yerine kullanılamaz.
