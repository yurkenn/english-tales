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

47 / 2.0.0 APK/AAB üretim bağlantısı, upload sertifikası ve 16 KiB statik kontrollerinden tekrar geçti; SHA256 değerleri PRODUCTION_PACKAGE_PLAN.md ile aynı. Play dahili kanal eski 4 sürümüyle duraklatılmış. Yeni sürüm taslağı ve beş dilde notlar hazırlandı; AAB yüklemesi Chrome eklentisinin yerel dosya izni kapalı olduğu için engellendi. Kullanıcı izni açacağını bildirdi; erişim henüz doğrulanmadı. Paket Play'e yüklenmiş veya test kanalında dağıtılmış sayılmaz. Kanal yeniden başlatılmadan tester listesi ve erişim kapsamı incelenir.
