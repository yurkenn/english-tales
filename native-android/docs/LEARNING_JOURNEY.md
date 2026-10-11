# İlk açılıştan düzenli öğrenmeye — ürün planı

10 Ekim 2026

## Amaç

Kullanıcı ilk oturumda bir hikâyeyi tamamlayabilmeli, kelimeleri hatırlamayı denemeli ve ertesi gün ne yapacağını bilmelidir. Başarı ölçüsü yalnızca uygulamada geçirilen süre değildir: tamamlanan okumalar, zamanı gelen tekrarlar ve farklı günlerde hatırlanan kelimeler de izlenmelidir. Bu özelliklerin geri dönüş oranını artırdığı henüz kendi kullanıcılarımızla doğrulanmadı.

## Bu sürümde çalışan yolculuk

| Aşama | Kullanıcıya sunulan deneyim | Gerçek kayıt |
| --- | --- | --- |
| İlk açılış | Sohbetle seviye, tür ve günlük 1–3 adım seçimi | Tercihler ve kurulum tamamlanması |
| İlk değer | Tercihlere uygun ilk hikâyeye doğrudan geçiş | İlk okuyucu açılışı |
| Okuma | Tek seferlik kelime/çeviri/ses rehberi, kaldığı sayfadan devam | Okuma ilerlemesi ve son açılan hikâye |
| Tamamlama | Günlük hedefin güncellenmesi, hikâyeden 5'e kadar kelime | Bir hikâye aynı gün yalnızca bir okuma adımı sayılır |
| Hatırlama | Açık “kaydet ve çalış” eylemiyle hikâyenin kelimelerine geçiş | Kelime kayıtları, cevaplar ve tekil çalışma kimliği |
| Yanlış cevap | Doğru cevap gösterilir; kullanıcı hazır olunca ilerler | Kelime 10 dakika sonra tekrar edilebilir |
| Günlük plan | Zamanı gelen kelimeler, kaldığı hikâye ve hedef | Bugünkü adımlar, sonraki tekrar tarihi |
| Geri dönüş | Yedi günlük etkinlik, gerçek çalışma serisi, kazanılan başarılar | Gün bazında kayıt; kaçırılan gün sonrası seri sıfırlanır |
| Hatırlatıcı | Kullanıcının seçtiği saatte isteğe bağlı yerel bildirim | Tamamlanan günlük hedef için bildirim gönderilmez |
| Kontrol | İsim, seviye, tür ve hedef değiştirilebilir | Bu cihazda kalıcı tercihler |

Bir adım, **tamamlanan bir hikâye veya kelime çalışmasıdır**. Dakika sayacı kullanılmadığı için süre hedefi veya ölçülmeyen çalışma süresi gösterilmez. Hedef tamamlandıktan sonra devam etmek isteğe bağlıdır.

## Kelime tekrarının kuralları

- Yeni kaydedilen kelime hemen çalışılabilir.
- Zamanında doğru cevaplarla tekrar aralığı sırasıyla 1, 3, 7, 14 ve 30 güne çıkar.
- Üç ayrı zamanlı başarılı tekrardan sonra kelime “Biliyorum” aşamasına geçer. Tekrar listesinde görünmeye devam edebilir.
- Yanlış cevap kelimeyi “Öğreniyorum” aşamasına döndürür ve 10 dakika sonraya planlar.
- Erken veya aynı gün art arda doğru cevap vermek kelimenin öğrenilme aşamasını yükseltmez.
- Bir oyun oturumunun ödülü benzersiz kimlikle yazılır. Aynı tamamlama bildirimi iki kez gelirse puan ve günlük adım artmaz.
- Kart ve eşleştirme durumları ekran dönüşünde saklanır; çeviri ve harf oyununda soru, seçenekler ve cevap durumu saklanır.

Bu, ilk sürüm için sabit aralıklı bir tekrar politikasıdır. Kişiye özel, bilimsel olarak kalibre edilmiş hafıza modeli değildir. Aralıklı kelime tekrarının araştırma temeli için [Duolingo araştırması](https://research.duolingo.com/papers/settles.acl16.pdf).

## Bildirim yaklaşımı

Başlangıçta bildirim izni istenmez. İlk tamamlamadan sonra veya ayarlardan kullanıcı hatırlatmayı açarsa Android izin ekranı gösterilir. İzin vermemesi öğrenme akışını engellemez. Saat seçilebilir, hatırlatıcı kapatılabilir. Cihaz yeniden açıldığında veya saat dilimi değiştiğinde plan yeniden kurulur.

Bildirim dakikası kesin garanti değildir; Android'in enerji tasarrufu ve uygulama bildirim ayarları teslimatı etkileyebilir. Günlük hatırlatma için kesin alarm izni kullanılmaz. Yaklaşım [Android bildirim izni rehberi](https://developer.android.com/develop/ui/compose/notifications/notification-permission) ve [Android alarm rehberi](https://developer.android.com/develop/background-work/services/alarms) ile uyumludur.

## Ölçüm planı

Bu sürümde olaylar yalnızca cihazdaki veritabanına yazılır; uzaktaki bir analiz servisine veri gönderilmez.

Room v4 artık tamamlanan oturumun türünü, soru sayısını ve ön plandaki aktif süreyi kalıcı tutar. Değişmez gönderim gövdeleri yerel kuyrukta hazırlanır; bu kuyruk henüz canlı servise gönderilmez. Önceki sürümün ölçmediği eski süreler doldurulmadı. [Yerel veri aşaması](OFFLINE_DATA_PLAN.md).

| Olay | Şu anki anlamı |
| --- | --- |
| onboarding_started / onboarding_completed | İlk kurulumun başlaması / tamamlanması |
| app_open | Yerel tarih başına tek etkin açılış |
| reader_started | Hikâye ve yerel tarih başına okuyucu açılışı |
| reading_completed | Hikâye ve tarih başına bir tamamlama |
| word_saved | Yeni kelime kaydı; kelime ve tarih başına tek olay |
| practice_completed | Benzersiz tamamlanan çalışma |
| daily_goal_reached | Tarih başına hedefe ilk ulaşılması |

Uzak ölçüm için Firebase Analytics ve Crashlytics seçildi; Android bağlantısı henüz kurulmadı. Kalıcı öğrenme oturumları Supabase'de tutulacak. İşlem/kurulum UUID'leri, saat dilimi, içerik revision bilgisi ve Android gönderim kuyruğu hazır; ağ bağlantısı, veri saklama ve gizlilik akışları tamamlanmalıdır. Mevcut yerel olaylar toplu D1/D7 raporu sağlamaz. [Servis aşama durumu](../backend/README.md).

Takip edilecek göstergeler:

1. **İlk değer:** İlk gün en az bir hikâye ve bir kelime çalışması tamamlayan yeni kurulum oranı.
2. **Akış kaybı:** Kurulum → hikâye → okuma tamamlama → kelime çalışması geçişlerindeki bırakma oranı.
3. **D1, D7, D30 geri dönüş:** Kurulumdan sonraki ilgili günde en az bir anlamlı öğrenme eylemi yapan kullanıcı oranı. Sadece açılış ayrı raporlanır.
4. **Öğrenme:** Planlanan tekrarların tamamlanma oranı ve farklı günlerde verilen doğru cevaplar. Kartlardaki “Hatırladım” öz bildirimi, doğru cevap seçimiyle ayrı raporlanmalıdır.
5. **Kalite:** Çökmesiz oturumlar, okuma/oyun yükleme süresi, bildirim reddi/kapatılması ve içerik hatası bildirimleri.

İlk sürüm için kanıtsız başarı yüzdesi hedefi koymak yerine başlangıç değerleri ölçülmeli, sonraki değişiklikler bunlarla karşılaştırılmalıdır.

## Sıradaki ürün işleri

### Yayından önce

- Her seviyede düzenli içerik sağlayacak editör süreci ve yeterli hikâye/kelime hacmi. Şu an toplam altı hikâye vardır; uzun süreli öğrenme ihtiyacını karşılamaz.
- Paket içi katalogdan bağımsız içerik yayını ve çevrimdışı önbellek. Supabase seçildi; sürümlü içerik ve kullanıcı erişim modeli 19 yerel testle doğrulandı. Canlı yayın, yönetim paneli ve Android bağlantısı tamamlanmalı.
- Gerçek cihazlarda düşük bellek, çevrimdışı kullanım, ses kalitesi, Android 24–36, TalkBack, büyük yazı ve bildirim teslimatı kontrolleri.
- Birleşik analiz sistemi, gizlilik metni, mağaza imzası ve Play Console sürüm doğrulaması.

### İlk kullanıcı geri bildiriminden sonra

- İsteğe bağlı kısa seviye değerlendirmesi ve seviyeyi tekrar ayarlama önerisi.
- Yalnızca hatırlanması zor kelimeler için ek örnek cümle, dinleme ve yazma görevleri.
- Hikâye sonunda bir–iki anlama sorusu; tamamlama düğmesinin ötesinde okuduğunu anlama kontrolü.
- İsteğe bağlı hesabın ve cihazlar arası eşitlemenin kullanılabilirlik iyileştirmeleri; giriş zorunluluğu ilk değeri görmeyi geciktirmemeli. Temel altyapı güncel servis planında yer alır.
- Haftalık kişisel özet ve içerik takvimi. Yeni hikâye sözü ancak yayın süreci gerçekten sağladığında verilmeli.

Liderlik tablosu, sosyal rekabet ve ödeme akışı bu sürüme eklenmedi. İlk kullanıcıların okuma ve kelime döngüsünü tamamlayıp geri dönmesi ölçüldükten sonra kapsamı belirlenecek.
