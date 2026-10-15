# İsteğe bağlı ürün ölçümleri — Q2.2

15 Ekim 2026. Kullanıcı seçimi: mevcut Firebase projesinde Analytics ve isteğe bağlı katılım. **Kod ve yerel doğrulama hazır; canlı Analytics kabulü ve mağaza yayını ayrı kapıdır.**

## Katılım ve veri sınırı

- Ayarlar → Kullanım istatistikleri başlangıçta kapalı. Öğrenmek için açılması gerekmez. Tercih cihaz içindir, hesap tercihi olarak eşitlenmez.
- Manifestte collection ve analytics/ad storage, ad user data, ad personalization varsayılanları kapalıdır. Açık katılımdan sonra yalnız analytics storage açılır; reklam rızaları kapalı kalır. Analytics reklam kimliği toplama ve otomatik ekran adı raporlama kapalıdır. Mevcut reklam SDK'sının kendi veri davranışı bu ayardan ayrıdır.
- Debug/test paketinde Analytics kalıcı deactivated ve transport kapalıdır. Testler Firebase'e ölçüm göndermez. Release, mevcut özel `google-services.json` ile derlenir.
- Uygulamanın yedi özel olayına ad/e-posta, hesap/kurulum/oturum kimliği, hikâye/kelime kimliği, metin, cevap, puan veya serbest özellik eklenmez. Tek özel parametre `practice_completed.mode`: `choice`, `card`, `match`, `spell`.
- Bu, anonim veya kimliksiz SDK anlamına gelmez. Firebase kendi app-instance ID'sini, uygulama/cihaz/işletim sistemi bilgilerini, yaklaşık ülke/bölgeyi ve otomatik `first_open`, `session_start`, `user_engagement` gibi olayları işleyebilir. SDK oturum tanımlayıcıları ekleyebilir; uygulamanın öğrenme oturum kimlikleri gönderilmez. Gizlilik kaynağı bu farkı açıklar.
- Kapatma, SDK collection'ı durdurur, consent'i reddeder ve `resetAnalyticsData` ile yerel SDK verisini sıfırlar. Yerel cohort işaretleri temizlenir; eski öğrenme geçmişi sonradan yeniden gönderilmez. Önceden sunucuya ulaşmış olaylar bu işlemle sunucudan silinmiş sayılmaz.
- Başarılı uygulama içi hesap silme bu cihazın katılımını da kapatır. Hesaplar Analytics kullanıcı kimliğiyle bağlanmaz. Çıkış/hesap değişimi cihaz tercihine dokunmaz.

## Olay sözleşmesi

| Olay | Tetik | Tekilleştirme / kapsam |
|---|---|---|
| `learning_visit` | Katılım verildiğinde ve uygulama ön plana döndüğünde | Katılımlı cihaz başına UTC gününde bir |
| `next_day_return` | İlk katılımlı ziyaretin hemen sonraki UTC gününde ön plana dönüş | Katılım dönemi başına bir; D2/D7 dönüşü D1 sayılmaz |
| `learning_onboarding_completed` | Başarılı onboarding kaydı | Yerel öğrenme sahibi başına mevcut kalıcı event anahtarı |
| `story_started` | Başarılı okuma başlangıcı kaydı | Yerel sahip/hikâye/çalışma günü başına bir; hikâye bilgisi payload'a eklenmez |
| `story_completed` | Başarılı okuma tamamlanması | Mevcut öğrenme kaydına uygun olarak sahip/hikâye/çalışma günü başına bir |
| `first_story_completed` | Yerel sahibin ilk kalıcı `reading_completed` olayı | Katılım dönemi başına cihazda en fazla bir; başka hesap ikinci kez üretmez |
| `practice_completed` | Başarılı tam çalışma oturumu kaydı | Kalıcı öğrenme oturumu başına bir; yalnız allowlist `mode` |

Ziyaret cohort'u kurulum günü veya hesap oluşturma günü değildir: **katılımın başladığı UTC günü**dür. Ürün olayları yalnız katılım sırasında üretilir; kapalıyken tamamlanan onboarding/hikâyeler geriye dönük doldurulmaz. İlk hikâye olayı başka cihazdaki kişinin bütün geçmişini kanıtlamaz. Kullanıcı/cihaz farkı, seçime bağlı örneklem ve UTC gün sınırı rapor yorumunda korunmalıdır.

`practice_completed` tamamlanan kelime çalışmasını ölçer; yalnız zamanı gelmiş kartların tekrarı olarak yorumlanmaz. İşlem rollback olursa olay çıkmaz; yazma tekrarı veya sonuç ekranına geri dönüş ikinci olay üretmez. Öğrenme veritabanı şeması, puan/tekrar algoritması ve Supabase eşitleme sözleşmesi değişmedi. Analytics hatası başarılı öğrenme kaydını başarısız yapmaz.

Analytics teslimatı en iyi çaba esaslıdır. Kalıcı öğrenme commit'i ile Firebase çağrısı arasında süreç kapanırsa olay kaybolabilir; yerel veri tabanı ile ölçüm sunucusu arasında dağıtık exactly-once garantisi yoktur. SDK kendi çevrimdışı kuyruğunu yönetir; uygulama kişisel öğrenme olaylarını yeni bir sunucu kuyruğuna kopyalamaz.

## Raporlar

- **İlk hikâye:** yeni onboarding olayını veren katılımlı app-instance cohort'unda `first_story_completed` dönüşümü. Mevcut kullanıcıları ve yeni cihazları kurulum sayısı gibi birleştirme.
- **D1 dönüşü:** aynı UTC başlangıç cohort'undaki app-instance'ların `next_day_return` veren oranı. Standart GA kurulum retention'ı yerine bu ürün tanımını kullan; GA Explore cohort'unu ilk katılımlı `learning_visit` gününe göre kur.
- **Çalışma:** `practice_completed` olay ve app-instance sayısı; `mode` ile kırılım. `mode` için event-scoped custom dimension, panelde veri gelmeden önce kaydedilmelidir.
- SDK otomatik olaylarını özel olay sayısına ekleme; metriklerin kullanıcı mı olay mı saydığını belirt. Az veri / gecikmiş veri yüzde sıfır olarak raporlanmaz.

## Doğrulama

- 11 yeni JVM testi: kapalı katılım, yedi olay/parametre sınırı, UTC D1, yeniden açılış, gecikmiş dönüş, saat geriye alma, ilk hikâye tekilleştirme, vazgeçme, başarısız tercih/ziyaret kaydı ve SDK arızası.
- Cihaz testleri: commit sonrası sinyal, rollback/yeniden deneme, tamamlanma tekilleştirme, transport hatasında korunan öğrenme, cihaz tercihinin kalıcılığı, açık/kapalı Switch ve kayıt hatası.
- Manifest testi: debug'da SDK kapalı; default collection, reklam kimliği, ekran raporu ve tüm consent varsayılanları kapalı.
- Güncel derleme/test kanıtları PR'a kaydedilir. Sahte transport testi canlı Firebase alımının kanıtı değildir.

## Açık canlı kabul ve yayın adımları

1. `english-tales-77d32` projesinde GA4 bağlantısını ve `com.yurken.englishtales` Android stream'ini doğrula. Bu çalışmada Console erişimi izin denetiminde reddedildi; başka erişim yoluyla aşılmadı.
2. Yeni sürüm kodlu release'i kontrollü test cihazına kur. Katılım kapalıyken özel olay yok; açıkken yukarıdaki olaylar DebugView/Realtime'da beklenen şekilde görünür. Kapattıktan sonra yeni olay yok. Test debug özelliğini cihazda kapat.
3. GA retention/data-sharing ayarlarını gözden geçir; reklam bağlantısı/personalization açma. `mode` boyutunu ve gerekli dönüşüm/cohort raporlarını kaydet. Bu ayarlar değiştirilmiş veya canlı oranlar ölçülmüş sayılmaz.
4. Güncellenmiş `web/privacy.html` kaynağını yayımla ve URL içeriğini doğrula; Play Data Safety formunu gerçek SDK davranışıyla karşılaştır (product interactions, device/other IDs, approximate location ve isteğe bağlı analytics kullanımı dahil). Mevcut Crashlytics beyan kapısını da tamamla.
5. [Kademeli yayın kontrol listesini](STAGED_RELEASE.md) uygula. İmzalı yerel teknik paket mağaza dağıtımı değildir.

## Birincil kaynaklar

- [Firebase: veri toplama ve reklam kimliği ayarları](https://firebase.google.com/docs/analytics/android/configure-data-collection)
- [Google: basic consent ve kalıcı consent davranışı](https://developers.google.com/tag-platform/security/guides/app-consent?consentmode=basic&platform=android)
- [FirebaseAnalytics API](https://firebase.google.com/docs/reference/android/com/google/firebase/analytics/FirebaseAnalytics)
- [GA Android veri beyanı](https://support.google.com/analytics/answer/11582702?hl=en)
- [Otomatik toplanan olaylar](https://support.google.com/analytics/answer/9234069?hl=en-GB)
