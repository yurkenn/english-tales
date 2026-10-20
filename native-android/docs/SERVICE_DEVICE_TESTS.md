# Yapılandırılmış servis cihaz testleri

Normal `connectedDebugAndroidTest` paketi yerel fixture testlerini çalıştırır. Önceden servis ayarları eksikken atlanan üç kontrol, `serviceDeviceTest` seçeneğiyle ayrı instrumentation APK'sında çalışır. Eksik yapılandırma derlemeyi veya testi başarısız yapar; `Assume` ile başarıya çevrilmez.

```sh
cd native-android
bash gradlew :app:connectedDebugAndroidTest -PserviceDeviceTest=true
python3 ../tooling/verify_service_device_tests.py app/build/outputs/androidTest-results/connected/debug --report build/service-device-tests.json
```

`android-service-device` CI işi aynı komutları API 34 emülatöründe çalıştırır. XML doğrulayıcısı üç beklenen testin tam birer kez geçmesini ister; atlanan, eksik, yinelenen, beklenmeyen veya başarısız test sonucu kabul edilmez. Raporlar `android-service-device-tests` artifact'ında saklanır. Standart cihaz testleri ve başlangıç ölçümleri ayrı CI işinde devam eder.

Yapılandırma, depodaki `config/production.properties` dosyasının yalnız herkese açık mobil Supabase URL ve publishable key değerlerini kullanır. Yeni secret veya service-role anahtarı gerekmez. Normal debug ayarları, release ve performance yapılandırmaları korunur. Servis seçeneği release/ad probe seçenekleriyle birleştirilemez.

Üç kontrol:

- Farklı hesaba ait iş: sentetik oturumun kimliğini korur; başka hesabın işini başarıyla sonlandırırken iki hesabın veritabanını da oluşturmaz. Geçerli kullanıcı bilgisi veya oturum açma isteği kullanmaz.
- Yinelenen zamanlama: tek ağ bağlantısı gerektiren periyodik iş ve doğru hesap etiketi korunur; kendisine ait işler sonunda iptal edilir.
- Yayınlanmış içerik: anonim HTTP GET ile katalog ve ilk hikâye indirilir; cümleler, kelimeler ve doğrulanmış kapak dosyası kontrol edilir; ardından ağ istemcisi olmadan aynı revision geri yüklenir. Rastgele adlandırılmış test önbelleği temizlenir ve önceki bellek kataloğu geri konur.

Bu kontroller gerçek kullanıcıyla hesap eşitleme, içerik yayınlama veya mağaza yayın kabulü değildir. Canlı servis erişilemezse servis CI işi başarısız olur; yerel fixture paketi bağımsız kalır.

20 Ekim 2026 yerel API 36 sonucu: üç kontrol geçti, sıfır atlama. CI sonucu PR koşularında ayrıca doğrulanır.
