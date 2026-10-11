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

## Android birleştirme sırası — sıradaki uygulama

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
