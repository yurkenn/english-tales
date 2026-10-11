# Canlı öğrenme eşitlemesi — analiz ve kabul planı

11 Ekim 2026

## Başlangıç durumu

Yerel hesap verisi ve değişmeyen işlem kuyruğu hazır. Yerel misafir aktarımı korunmalı: 70 puanın 45'i eski ölçülmemiş geçmiş, 25'i modern oturumdan geliyor. Eski 45 puan için sahte cevap/süre/oturum oluşturulamaz. Gönderim, sunucu kopyasını uygulama ve arka plan çalıştırıcısı henüz bağlı değildir; UI bunu tamamlanmış göstermiyor.

## Sunucu kopyası — tamamlandı

`get_learning_snapshot()` tek STABLE/MVCC okuma kopyasında `schemaVersion=1`, `userId`, `capturedAt`, `profile`, `sessions`, `words`, `progress`, `badges` döndürür. Oturumlarda sunucunun puanı ve `counted` kararı, kelimelerde `saved=false` mezar taşı ve kaynak revision korunur. Geleneksel PostgREST satır sınırı, JSON içindeki dizileri sessizce kesmez.

Fonksiyon `SECURITY INVOKER`; boş search_path, mevcut RLS ve JWT kimliği kullanılır. Gövdeye hedef kullanıcı eklenemez. Anon çağrı yasaktır. Profil oluşturmayan salt okuma; ilk hesapta profile=null ve boş diziler geçerli sonuçtur. Sınır: 10.000 oturum, 5.000 kelime, 5.000 revision ilerlemesi ve 4 MiB çıktı. Sınır aşılırsa bütün istek `54000 / learning_snapshot_too_large` hatasıdır; istemci mevcut veriyi korur. Limitler gerçek kullanımda izlenmeli, yaklaşıldığında dondurulmuş sayfalı protokol eklenmelidir.

Migration CLI ile oluşturuldu; test projesine uygulanınca yerel dosyanın sürüm kimliği uzak migration geçmişiyle eşlendi: `20261011134638_learning_snapshot.sql`.

38 servis/istemci testi geçti. Yeni üç senaryo: anon/kimliksiz ret ve yazma yan etkisinin olmaması; iki hesap ayrımı, oturum kimliği, kelime silme ve revision/badge; 10.001 oturumun kısmi sonuç yerine reddi. Canlı test projesinde invoker/stable, anon=false, authenticated=true ve boş hesap kopyası doğrulandı. Yeni fonksiyon için advisor uyarısı yok. Eski 19 yetkili yazma RPC uyarısı, private audit INFO ve parola koruma uyarısı ayrı güvenlik incelemesinde kalıyor.

## Android gönderim temeli — tamamlandı

`LearningSyncHttp` yalnızca belirlenen öğrenme RPC'lerine HTTPS üzerinden gider; yönlendirmeleri takip etmez, yanıtı 4 MiB ile sınırlar, eksik/nesne olmayan/arkasında fazladan veri olan başarılı yanıtları reddeder. SQLSTATE sayısal kodları korunur; hata gövdesi ve token tanılama metnine girmez.

`LearningQueueSync` hesap ve çağıranın oturum kapsamını gönderimden önce ve yanıttan sonra kontrol eder. Kalıcı kuyruktaki aynı UUID/gövde gönderilir. `applied` gerçek boolean olmalıdır; false da teslimattır. Ağ/kimlik/bozuk yanıt hatası yeniden denemede kalır; bilinen gövde/veri çakışmaları yerel geçmiş silinmeden blocked olur. Yerel puan değiştirilmez. Çalıştırıcının store'un sıralı IO akışını kullanması ve hesap nesli kontrolünü sağlaması gerekir. Henüz UI/otomatik arka plan işine bağlanmadı.

16 KiB emülatörde 8 yeni test geçti: tekrar teslim, kayıp teslim yanıtı sonrası aynı gövdeyle deneme, kapsam değişimi, çıkış, gövde çakışması, bozuk başarı/401, yanlış hesap ve SQLSTATE ayrıştırma. Debug derleme, mevcut birim testleri ve lint geçti.

## Android kopya ayrıştırma — tamamlandı

`LearningCloudSnapshot` tüm dizileri, protokol/UID, gerçek sayı/boolean tiplerini, UUID/tarih/saat dilimi, aralıkları ve tekrar eden kimlikleri doğrular. Boş yeni hesap, silinmiş kelime ve kaynak revision bilgisi korunur. `LearningSnapshotReader` çağrı ve yanıt çevresinde hesap neslini denetler. Ayrıştırmanın veritabanı yan etkisi yoktur.

7 yeni kopya testi geçti. Mikro saniyeli sunucu zamanları milisaniye hassasiyetine doğru çevrilir; açık UTC/ofset zorunludur. Android 7 desteğini korumak için resmi core-library desugaring etkinleştirildi, `desugar_jdk_libs:2.1.5` sabitlendi. [Android rehberi](https://developer.android.com/studio/write/java8-support) ve [Google sürüm kaydı](https://github.com/google/desugar_jdk_libs/blob/master/CHANGELOG.md). Android 7 üzerinde cihaz çalışma kontrolü ayrıca yayın kapısıdır.

Son derleme üzerinde bütün 61 cihaz testi 16 KiB emülatörde başarılı; 11 birim testi, debug/release Lint, imzalı APK/AAB ve statik paket doğrulaması da geçti. Gerçek hesaba kuyruk gönderimi veya sunucu verisini yerel tablolara uygulama bu testlerde yapılmadı.

## Atomik yerel birleştirme — tamamlandı

Room sürümü 6; 5→6 migration yalnızca `learning_cloud_state` tablosunu ekler. Önceki 1/2/3/4 sürümleri de veri silmeden bu sürüme gelir. Bu tabloda kaynak proje, tam sunucu kopyası, eski cihaz puan/günlerinin ayrı temeli, tercihler sürümü/çakışması ve uygulama zamanı saklanır. Kuyruk, aktarım makbuzları ve yerel oturum taslakları korunur.

`LearningStore.reconcileCloud` bütün değişiklikleri tek transaction içinde uygular. İlk kopyadan önce yerel toplamdan modern kuyruk katkısı çıkarılarak cihaz geçmişi yakalanır. Toplam = cihaz temeli + sunucu oturumları + sunucuda henüz görülmeyen yerel oturumlar. Aynı oturum UUID'si ikinci ödül olmaz. Okuma aynı hikâye/günde sayılır; bilinen eski okuma anahtarları da tekrar sayılmaz. Günlük sayaçları bulunmayan eski seri, son gün/seri uzunluğu kanıtıyla yalnızca seri hesaplamasında korunur; sahte günlük oturum yazılmaz. Sonradan misafir aktarımı aynı transaction içinde cihaz temelini yeniden hesaplar; makbuz aynı aktarımı ikinci kez eklemez.

Bekleyen/geciktirilmiş/karantinadaki kelime eylemi varsa mevcut yerel görünüm tutulur; gönderim ve yeni tam kopyadan sonra sunucunun zaman/UUID sırasındaki tekrar sonucu uygulanır. Bu ara görünüm iki cihazın nihai birleşimi değildir. Bekleyen silme geri açılmaz. Diğer kelimelerin `saved=false` kayıtları uygulanır; bilinmeyen/arşivlenmiş kelimeler ve kaynakları silinmez. Kaynağı henüz yüklenmemiş kelimenin kullanıcıya gösterilecek içeriğini çözmek hâlâ açık iştir. Aynı revision'da maksimum yüzde ve yeni olay imleci tutulur; farklı revision'a yüzde taşınmaz. Tüm sunucu revision'ları saklanan kopyada korunur. Başarılar birleştirilir. Kirli tercihler ezilmez; sürüm çakışması saklanır, çözüm UI'si/CAS yazımı sıradadır.

Kaynak proje değişimi veya UID/kapsam uyuşmazlığı ret nedenidir. Kopya zamanı ve revision olay sırası karşılaştırmasında mikrosaniyeler ISO değerinde korunur; veritabanı/UI zamanları milisaniyedir. Eski kopya uygulanmaz. Sonraki kopyada önceden kabul edilmiş oturum/kelime/revision/başarı kaydı eksilirse, sabit oturum değişirse veya revision yüzdesi/tercih sürümü gerilerse bütün uygulama reddedilir. Hesap silme/servis sıfırlama için ayrı açık akış gerekir. Yazma hatası veya işlem içindeki kapsam değişimi tüm değişiklikleri geri alır.

Kopyadaki kısa oturum satırı bütün değişmeyen gönderim gövdesini kanıtlamaz. Bu yüzden sadece toplamı tekilleştirir; kuyruğu teslim edildi işaretlemez. Asıl RPC'nin `applied=true/false` yanıtı gerekir. Böylece gövde çakışması kontrolü atlanmaz.

17 yeni birleştirme testi ve mevcut testler dahil **78 cihaz testi** 16 KiB emülatörde geçti; 11 birim testi, debug/release Lint ve imzalı derlemeler başarılı. Senaryolar: 45+25=70, tekrar/reopen, iki cihaz deposu, bekleyen silme/tekrar takvimi, çoklu revision, tercihler çakışması, transaction/kapsam geri alma, eski/eksik/çelişkili kopya, misafir sonrası temel ve bulut silme önceliği, eski seri kanıtı, 5→6 migration. Test sabit saatinde iki oturumun UUID sırası rastgele olduğundan test verisini “son kayıt” ile seçmek yanlış kopya üretti; seçim özgün kimlikle düzeltildi ve bütün 78 test tekrar geçti. Bunlar izole veritabanları ve kontrollü sunucu kopyalarıyla yapıldı. Gerçek Google hesabı, ağ ve ikinci cihaz testi yerine geçmez.

## Entegrasyon sırası — sıradaki uygulama

Önce tek hesap kapsamına bağlı bir çalıştırıcı: doğrulanmış oturum → tam kopya/atomik uygulama → özgün kuyruk RPC'leri → yeni tam kopya/uygulama. Gönderim başarısızsa bekleyen yerel görünüm korunmalı ve kullanıcıya durum gösterilmeli. Cihazda kalan eski puanlar ayrı açıklanmalı. Sonra tercih CAS yazımı ve açık çakışma çözümü, bilinmeyen kelime kaynağı, hesap değişimi/yeniden açılış ve gerçek ağ doğrulaması. Bu kapıdan sonra arka plan işi bağlanabilir.

1. Kendi UID'si, kaynak proje ve protokol sürümü doğrulanmış kopyayı bütünüyle ayrıştır; bozuk/eksik/büyük yanıtta yerel değişiklik yapma.
2. Tercihler için sunucu version değerini sakla; yerel kirli tercihleri koşullu yaz. Çakışmada kullanıcıya gösterilecek karar gerekir; yeni versiyonu alıp sessizce başka cihazın değişikliğini ezme.
3. Kalıcı kuyruğu aynı UUID/gövdeyle gönder. `applied=false` başarılı teslimat; gövde çakışması karantinadır. SQLSTATE kodları Auth hata metnine düşürülmemeli. Oturum değişirse gönderim ve yerel ack durur.
4. Eski yerel puan/günlerin ayrı temel kaydını önce tek işlemde oluştur. Sunucu oturum kimlikleriyle modern yerel kuyruk kimliklerini karşılaştır; alınmış oturumu tekrar toplama. Eksik cevap ve süreleri üretme.
5. Sunucu kelime tombstone'ları ve sürümlü ilerlemeyi uygula; bekleyen yerel eylemleri doğru zaman/UUID sırasıyla koru. Bilinmeyen/arşivlenmiş kelime kaynaklarını silme; kaynak çözümünü ayrı doğrula.
6. Kopya, temel kayıt, tercihler ve UI toplamlarını aynı Room transaction içinde güncelle. Kuyruk ve misafir aktarım makbuzları korunur. Yarım kayıt yeni açılışta uygulanmış sayılmaz.
7. İlk başarılı uçtan uca akıştan sonra hesap başına tek arka plan işi; ağ koşulu, kalıcı yeniden deneme ve UID kapsamı. Hesap değişimi çıkıştaki işlerin yeni hesaba yazmasına yol açamaz.

## Kabul kapısı

- Aynı olayın iki kez teslimi puanı artırmaz; sunucu kabul edip bağlantı koptuktan sonra tekrar gönderim doğru sonuç verir.
- 45 eski + 25 modern yerel puan 95'e çıkmaz; hangi eski verilerin cihazda kaldığı açıkça gösterilir.
- İki cihazda kelime silme/yeniden ekleme, farklı revision okumaları ve tercihler çakışması test edilir.
- Ağ hatası, 401/yenileme, kalıcı RPC hatası ve büyük/bozuk kopya veriyi kaybettirmez.
- A → B değişiminde A olayı veya geciken yanıt B'ye uygulanmaz.
- Gerçek Google hesabıyla gönderim, uygulamayı yeniden açma ve ikinci cihaz okuması görülmeden bulut tamamlandı denmez.

[STABLE snapshot davranışı](https://www.postgresql.org/docs/current/xfunc-volatility.html) · [Supabase yetkili fonksiyon değerlendirmesi](https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0029_authenticated_security_definer_function_executable).
