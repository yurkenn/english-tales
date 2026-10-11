# Play üzerinden üretim paketi testi

## Analiz — 11 Ekim 2026

Kullanıcı yalnızca emülatör kullanabiliyor. Üretim bağlantısı ve yükleme imzası yerel pakette doğrulandı; Play imzasıyla Google girişinin ve Play tarafından üretilen split APK'ların kontrolü açık. Bu nedenle teknik aday 47 / 2.0.0 önce dahili testte hazırlanır. Yeni ikon son aşamada eklenir; 47 Play'e yüklenmişse son paket için sürüm kodu artırılır.

## Kabul adımları

1. APK/AAB üretim projesi, yükleme sertifikası, imza ve 16 KiB kontrollerini tekrar doğrula.
2. Play'deki en yüksek sürüm kodunu kontrol et. AAB'yi dahili test taslağına yükle; doğrulama uyarılarını oku.
3. Test erişimini kişisel hesabıyla sınırlı tut; herkese yeni erişim açma. Gereken erişim değişikliklerinde tarayıcı kuralına göre işlem anında onay iste.
4. Google Play cihaz raporlarını ve mağaza imzalı paket girişini değerlendir. Eski 46 üzerine güncelleme ve veri korunmasını ayrı kontrol et.
5. Yeni ikon, nihai mağaza beyanları ve son AAB tamamlanınca üretim incelemesini gönder. Dahili test taslağı, canlı yayın veya Google onayı değildir.

Fiziksel ARM64 telefon testi yapılmadı. Emülatör testini fiziksel cihaz kanıtı olarak göstermeyiz.

## Hazırlık sonucu

47 / 2.0.0 APK/AAB üretim bağlantısı, upload sertifikası ve 16 KiB statik kontrollerinden tekrar geçti; SHA256 değerleri PRODUCTION_PACKAGE_PLAN.md ile aynı. İlk Chrome dosya erişimi engelinden sonra kullanıcı eklenti ayarını değiştirdi; yeniden bağlanan tarayıcıyla AAB yüklendi ve Play 47 / 2.0.0, min 24, target 36 olarak kabul etti. ReTrace mapping pakete bağlı görünüyor. Beş dilde sürüm notları kaydedildi.

Önizlemede engelleyici hata yok, iki uyarı var: önceki dahili 4 sürümüne göre 1.999 cihaz kapsam dışına çıkıyor ve native debug symbols bulunmuyor. Android 24 minimumu ve kütüphane sembollerinin bulunabilirliği üretim öncesinde ayrıca değerlendirilecek. Bu karşılaştırma üretimdeki 46 ile güncelleme testi değildir. Yeni kurulum Play boyutu 17,9 MB.

Eski tester listesinde 26 hesap vardı. Liste silinmeden bu kanaldaki seçimi kaldırıldı; kullanıcının üretimde kullandığı Google hesabını içeren tek kişilik ayrı liste kaydedildi. 47 dahili testte Save and publish ile yayımlandı ve duraklatılan kanal yeniden açıldı. Console Active ve Available to internal testers gösteriyor. Genel üretim kanalı hâlâ 46; üretime native yayın yapılmadı. Google görünürlüğün genellikle bir saat içinde oluştuğunu, daha uzun sürebileceğini bildiriyor. Son ikonlu paket yeni sürüm koduyla oluşturulmalı; 47 artık yüklenmiştir.

## Ayrı Play emülatörü

Mevcut iki emülatörde kişisel oturumlar var; debug ve Play sertifikaları farklı olduğu için bunlar kaldırılarak değiştirilmedi. `English_Tales_Play_16K` adlı ayrı boş AVD oluşturuldu; yalnızca cihaz konfigürasyonu mevcut Play Store 16 KiB sistem imajına bağlandı. Kullanıcı verisi veya oturum dosyası kopyalanmadı. Eski avdmanager Java 17 ile çalışmadığı için yeni SDK/lisans kurulumuna geçilmeden mevcut emulator konfigürasyonu kullanıldı. Google hesabını kullanıcı bu yeni cihazda eklemeli. Bu cihaz fiziksel ARM64 testi değildir.

Yeni cihaz emulator-5558 üzerinde açıldı: sys.boot_completed=1, PAGE_SIZE=16384 ve English Tales paketi henüz kurulu değil. Play Store başlatıldı; hesabın eklenmesi, test katılımı, Play kurulumu ve uygulama Google girişinin kullanıcı tarafından tamamlanması istendi. Eski iki cihazın verileri temizlenmedi. Pre-launch report ekranında henüz rapor yok; ayarda test kimlik bilgileri sağlanmıyor. Misafir akışı test edilebilir; kişisel yayıncı parolası Google'ın crawler'ına verilmedi.

Test katılım adresi: `https://play.google.com/apps/internaltest/4701713728242169635`. Bu adres herkese erişim vermez; seçili Google tester hesabı gerekir.
