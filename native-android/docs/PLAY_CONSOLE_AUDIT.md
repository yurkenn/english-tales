# Play Console kontrolü

11 Ekim 2026 — Console'da doğrudan okunan durum

- Uygulama: English Tales; paket `com.yurken.englishtales`.
- Geliştirici: Yurken, kişisel hesap; üretim erişimi mevcut.
- En son yüklenmiş ve üretimdeki paket: **46 / 1.1.0**. Yeni native paket kodu **47 / 2.0.0** olarak ayarlandı; yükleme öncesi tekrar kontrol edilir.
- Uygulama listesinde kurulu kitle 21, panelde son 28 gün aktif cihaz 7. Eski sürüm üzerine güncelleme kontrolü zorunlu kabul edilir.
- Play App Signing etkin. App signing SHA-256: `13:EF:59:10:FD:56:B0:A4:3F:5D:65:78:D2:CC:90:27:1F:E0:87:C2:A0:BA:A6:CC:06:A0:B5:F1:05:6A:3B:A8`.
- Upload certificate SHA-1: `EF:07:C9:73:55:FD:F7:63:14:C7:AA:94:6E:FC:A4:44:D7:2D:48:30`.
- Upload certificate SHA-256: `C0:CF:06:80:7F:63:98:BE:57:D7:C4:CA:EA:EC:DF:B5:B8:7A:B2:A7:6F:3C:9B:B3:F8:B2:E3:6B:C8:61:8E:BF`.
- Mağazada kayıtlı destek e-postası: `oguz.yurken@gmail.com`.
- Mağazada kayıtlı web sitesi: `https://englishtales-app.web.app`.

Expo `yurken / english-tales` projesindeki mevcut yükleme anahtarı indirildi. Sertifikası yukarıdaki Play upload SHA-1 değeriyle eşleşiyor; imzalı APK üzerinde ayrıca doğrulandı. Anahtar `C:/Users/yurken/.english-tales-release/upload-keystore.jks`, özel ayarlar ignored `native-android/signing.properties` içinde. Anahtar ve parolalar GitHub'a girmez. Anahtar sıfırlanmadı veya yeniden oluşturulmadı.

Play'den indirilen genel uygulama sertifikası SHA-1: `4C:EE:8C:1D:40:26:8C:97:F4:CB:6B:5B:FE:DB:B1:F0:91:14:66:D1`. SHA-256 yukarıdaki değerle eşleşiyor. Google girişinin mağaza sürümü bu sertifikayla ayrıca yapılandırılmalıdır.

SHA değerleri genel sertifika bilgisidir; özel anahtar değildir. Mağaza imzasıyla Google OAuth native istemcisi tanımlanmalıdır. Debug imza kaydı bunun yerine geçmez.

Console'a yeni paket yüklenmedi; mağaza açıklaması/iletişim veya yayın durumu değiştirilmedi.
