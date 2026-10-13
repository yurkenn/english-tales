# Misafir ilerlemesini hesaba aktarma

11 Ekim 2026 — uygulama öncesi analiz

## Bu paketin kapsamı

Kullanıcı hesap ekranından mevcut cihazın misafir geçmişini açıkça seçtiği hesaba taşır. Giriş kendi başına aktarım yapmaz. Aktarım yerel kayıt ve gönderim kuyruğunu hazırlar; bulut eşitlemesi ayrı adımdır. Mevcut Google hesabı ve diğer hesabın kayıtları değiştirilmez; kullanıcı hangi hesapta aktarımı başlatırsa hedef odur.

Eski native kayıtların bir kısmında toplam puan/çalışma vardır ama ölçülmüş cevap/süre yoktur. Sunucunun olay sözleşmesi yalnızca ölçülmüş oturumlardan ödül hesaplar. Eski toplamlar için cevap veya süre uydurulamaz. Bu nedenle import kaydı, geçmişin sunucuya gönderilemeyen puan/çalışma/gün kısmını ayrıca tutar. Sonraki eşitleme bu cihaz geçmişini sunucu özetiyle çift saymamalıdır. Eski toplamlar diğer cihaza aktarılmış sayılmaz.

## Kesinti ve tek seferlik sahiplik

Room v5 iki kalıcı tablo ekler: misafir aktarım günlüğü ve hedef hesabın import makbuzu. İki ayrı veritabanı tek transaction değildir; üç adımlı kalıcı işlem gerekir:

1. Misafir veritabanındaki transaction değişmez snapshot + hedef UID + aktarım UUID'sini yazar; aynı transaction eski öğrenme kayıtlarını misafir alanından çıkarır. Tercihler korunur, sonraki misafir kullanımı yeni bir öğrenme geçmişidir.
2. Hedef hesap transaction'ı snapshot'ı birleştirir ve hash/UUID ile import makbuzu yazar. Makbuz varsa aynı aktarım tekrar uygulanmaz. UUID/gövde çakışması tüm transaction'ı reddeder.
3. Misafir günlüğü tamamlandı olarak işaretlenir. Son adım öncesi süreç kapanırsa aynı hedef hesap, aynı UUID ve snapshot ile devam eder. Başka hesaba bu bekleyen snapshot verilmez. Yeni misafir öğrenmesi bekleyen aktarım tamamlandıktan sonra ayrı aktarılabilir.

Misafir kayıtları birinci adım sonrasında canlı misafir alanında görünmez; kesinti halinde snapshot günlükte korunur ve hedef hesaptan tekrar deneme sunulur. Başka hesabı kullanmak bu snapshot'ın hedefini değiştirmez.

## Birleştirme kararı

- Hesap seviye/tür/hedef/isim tercihleri korunur; hesabın başlangıcı tamamlanmamışsa misafir başlangıç ayarları kullanılır.
- Aynı kelime için mevcut hesap kaydı veya silme geçmişi önceliklidir; yalnızca hesapta geçmişi olmayan kelimeler eklenir. Silinmiş kelime eski misafir kopyasından dirilmez. Çakışan misafir kelime işlemleri gövdeleri korunarak `account_word_precedence` ile bloke edilir; sonraki gönderim eski kaydı diriltemez.
- Aynı metin sürümünde en yüksek okuma yüzdesi korunur; devam cümlesi daha yeni kayıttan alınır. Farklı sürümlerin yüzdesi birleştirilmez; daha yeni konum kazanır.
- Puan/alıştırma toplamları bir defa eklenir. Aynı hikâye/gün okuma tamamlaması tek günlük adım sayılır. Günler birleştirilir ve seri takvimden tekrar hesaplanır; seriler toplanmaz.
- Tamamlanmış oturumların değişmez UUID/gövdeleri aynen taşınır; kuyruk satırının sahibi hedef UID olur. Bloke edilmiş kayıtların hata durumu korunur. Yarım çalışmalar tamamlanmış sayılmaz.
- Beklenmedik aynı oturum/işlem kimliği hedefte zaten varsa sessizce puan eklemek yerine aktarım reddedilir. Makbuz sayesinde normal yeniden denemeler başarıdır.
- Snapshot boyutu sınırlandırılır; sınır veya kayıt doğrulaması başarısızsa kaynak transaction geri alınır.

## Kabul kontrolleri

Room 4 → 5 geçişinde eski kayıtlar korunur. Yeni ve dolu hesaba aktarım, tekrar deneme, farklı hedefin reddi, her iki kesinti noktası, yeni misafir geçmişi, silinen kelime, sürümlü konum, aynı gün okuma, eski toplam/kuyruk ayrımı ve transaction geri alma test edilir. Gerçek cihaz hesabında kullanıcı aktarımı başlatmadıkça misafir geçmişi taşınmaz.

## Uygulama ve sonuç — 11 Ekim 2026

- Room v5 şeması ve 4 → 5 migration; kaynak günlüğü, hedef makbuzu ve atomik birleştirme uygulandı.
- Hesap ekranı misafir geçmişini gösterir; hedef hesapta açık seçim ve son onay sunar. Yarıda kalan aktarım aynı hesapta sürdürülebilir; diğer hesapta engellenir.
- **11 birim + 45 cihaz testi geçti.** Yeni 11 cihaz testi: yeni/dolu hedef tercihleri, değişmez işlemler, tekrar, kaynak/hedef kesintileri, başka hesap, yeni misafir geçmişi, silme önceliği, gün/seri, ölçülmemiş toplam, geri alma/hash çakışması, sürümlü konum ve migration.
- Derleme ve Lint başarılı: **0 hata / 19 uyarı**. APK, gerçek oturumun Keystore anahtarını koruyarak güncellendi; testler ayrı dosyalarda çalıştırıldı.
- Kullanıcı açık Google hesabını seçti; gerçek arayüzden aktarım tamamlandı. Zorla kapat/aç sonrası 70 puan / 9 kelime korundu. Google hesabının A1 / Günlük yaşam / 1 hedefi değişmedi; diğer e-posta hesabı 20 puan / 4 kelime olarak ayrı kaldı. Misafir canlı alanı 0 puan / 0 kelime; günlük tamamlandı, hedefte tek makbuz var. Eski ölçülmemiş 45 puan / 2 çalışma ayrıca saklandı.
- Öğrenme kuyruğunun canlı gönderimi, sunucu özetiyle geçmişin uzlaştırılması ve ikinci cihaz kontrolü sonraki pakettir. Bu aşama bulut eşitlemesi değildir.
- Kaydedilmiş kelime kalmasa bile silme işlemlerinden oluşan kuyruk aktarılabilir; işlem gövdeleri korunur. Bu sınır durumu 11. aktarım testiyle doğrulandı.
