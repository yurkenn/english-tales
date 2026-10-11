# Yayın çalışması ve geri dönüş kayıtları

11 Ekim 2026

## Kontrol noktası kuralı

1. Aşama öncesi analiz ve kabul senaryolarını yaz.
2. Bağımsız aşamayı tamamla ve ilgili testleri çalıştır.
3. Git indeksinde gizli bilgi/oluşturulan dosya kontrolünü çalıştır.
4. Açıklayıcı commit ve `checkpoint/` etiketi oluştur; ikisini GitHub'a gönder.
5. Otomatik kontrollerin sonucunu incele; başarısızsa aşamayı tamamlandı sayma.

Çalışma dalı: `codex/native-release-preparation`. GitHub'daki daha yeni React Native geçmişi ana dalda korunur. Ana dalı eski yerel kopyayla zorla değiştirme.

İlk kontrol noktası: `checkpoint/native-local-transfer-20261011` (`b1f0bbd`), çalışan native uygulama/panel ve doğrulanmış yerel misafir aktarımı. 11 birim + 45 cihaz testi; 0 Lint hatası.

## Temizlik analizi

Eski Expo/React Native/Sanity kaynakları yeni Android veya içerik panelinin bağımlılığı değildir. Eski kaynaklar ve yerel bağımlılıklar `C:/projects/english-tales-legacy-20261011/` içine taşındı. Bu arşiv yerel ayarlar içerebilir; GitHub'a yüklenmez. Eski kod ayrıca ilk Git kontrol noktasında korunur.

Android kapakları, katalog, panel kaynakları, şemalar, migration dosyaları ve testler tutulur. İmzalar, servis ayarları, cihaz yedekleri ve derleme önbellekleri Git'e girmez. Native test ve derleme klasörünü gerçek kullanıcı yedeği varken topluca silme.

## Geri dönüş

Kaynak kodu için önce çalışma dalını koru; hedef etiketten ayrı bir dal veya ayrı checkout aç. Henüz doğrulanmamış düzeltme için ilgili commit'i geri alan yeni commit oluştur. Paylaşılmış Git geçmişini zorla geriye taşıma.

Git etiketi veritabanını veya Supabase'i geri döndürmez. Şema değişikliği için önce yedek ve uyumluluk analizi gerekir; canlı migration geri alınırken veriyi kaybetmeyen düzeltme migration'ı tercih edilir. Android'de daha yeni Room verisiyle eski APK açmak downgrade hatası verebilir; kullanıcı verisini silerek geri dönüş yapma.

## Kalan yayın kapıları

- Canlı öğrenme gönderimi, sunucu durumunu alma ve iki cihaz eşitlemesi.
- Yeni hesap/kurtarma/silme; erişilebilir gizlilik ve hesap silme sayfaları.
- Üretim servis/panel dağıtımı, yedek geri yükleme ve güvenlik doğrulaması.
- İçerik/UI/ses/erişilebilirlik ve gerçek cihaz kontrolü.
- Play Console en yüksek sürüm kodu, yükleme anahtarı ve Play App Signing sertifikası.
- İmzalı AAB, mağaza beyanları ve beta; aynı release adayı üzerinde son kontrol.

Bu kapılar kapanmadan uygulama mağazaya hazır sayılmaz.
