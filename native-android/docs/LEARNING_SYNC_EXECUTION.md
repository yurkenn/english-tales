# Hesap eşitlemesi: uygulama bağlantısı

## Analiz ve kapsam

Gönderici, tam hesap kopyası okuyucusu ve Room 6 atomik birleştirmesi ayrı ayrı hazırdı; uygulama bunları çağırmıyordu. Bu aşama onları tek yerel işlem sırasına bağlar. Şema veya canlı servis değişikliği gerekmez. Yayınlanabilir paket için gerçek hesap/ikinci cihaz kabul kapısı ayrı kalır.

## İşlem sırası

- Giriş, uygulamaya dönüş ve yerel değişiklikten sonra iki saniye bekleyip eşitlemeyi sıraya al. Aynı anda tek eşitleme çalışır.
- Her sıra turunda en fazla bir özgün olay gönder. Son olaydan sonra hesap kopyasını ayrı turda al ve tek transaction içinde uygula. Diğer yerel işlemler ve hesap değişimi istekleri turlar arasında çalışabilir.
- Sunucunun `applied=false` yanıtı teslimattır. Sunucu kabul edip yanıt kaybolursa aynı kimlik ve gövde tekrar gönderilir.
- Hesap değişimi/çıkış/misafir aktarımı isteği, ağ yanıtını beklemeden mevcut eşitleme neslini geçersiz yapar. Geç yanıt yeni hesaba uygulanamaz. ViewModel kapatıldığında da kapsam iptal edilir.
- Ağ hatası kuyruk kaydını korur; olayın mevcut artan bekleme süresine uyulur. Uygulama süreci yaşarken bir dakika sonra kontrol yapılır. 401 gönderim/alım hatası oturum doğrulamasını tetikler.
- Veritabanına yalnızca mevcut IO işlem sırası erişir. HTTP çağrıları bu sırada bloklanır; bağlantı/okuma zaman aşımı sırasıyla 15/20 saniyedir. Zayıf ağda yerel kayıt işlemleri de yanıtı bekleyebilir. Kalıcı arka plan işinden önce ağın yerel işlem sırasından ayrılması değerlendirilmelidir.

## Hesap ekranı

Çalışma durumu, son uygulanan kopya zamanı, bekleyen/bloke kayıt sayısı ve elle tekrar deneme gösterilir. Eski geçmişin olay kanıtı bulunmayan puanı bu cihazda kalır; başka cihazlara taşındığı söylenmez. Profil tercihleri kirliyse veya çatışıyorsa bunun henüz tamamlanmadığı açıkça gösterilir. Hesap durumunun doğrulanması eşitleme alanlarını eski bir ekran kopyasıyla ezmez.

## Açık kabul kapıları

1. Gerçek Google oturumu → test hizmetinde olay → yeniden açılış → ikinci cihaz okuması. İzole fixture testleri bunun yerine geçmez.
2. Tercih yazımı için version/CAS ve kullanıcı tarafından seçilen çakışma çözümü.
3. Bilinmeyen/arşivlenmiş kelime kaynaklarının içerik çözümü.
4. Kalıcı, ağ koşullu, hesap kapsamlı arka plan işinin eklenmesi. Mevcut dakika zamanlayıcısı uygulama öldürülünce devam etmez.
5. Gerçek düşük sürüm/ARM64 cihaz, Play güncelleme ve mağaza imzalı Google girişi.

Yeni testler ayrı cihaz veritabanları ve kontrollü taşıma katmanları kullanır. Gerçek kullanıcının oturum bilgileri okunmaz; verileri silinmez. Yeni hesap ekranı canlı hesapta görsel olarak ayrıca kontrol edilmelidir.
