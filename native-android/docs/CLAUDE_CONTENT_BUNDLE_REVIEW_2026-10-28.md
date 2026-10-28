# Claude katalog V2 incelemesi — 28 Ekim 2026

Claude CLI ile gerçek, salt okunur kod incelemesi yapıldı. Claude dosyaları okudu; testleri veya build'i çalıştırmadı ve içerik JSON'unun tamamını doğrulamadı. İnceleme sırasında değişen satırlar olduğu için bulgular son kaynakta yeniden değerlendirildi.

| Bulgu | Karar ve doğrulama |
|---|---|
| `Instant.parse` + `+00:00` eski Android/desugaring uyumluluğu | Ortam sürümü iddiası doğrulanmış kabul edilmedi; var olan ağ codec'iyle aynı `OffsetDateTime.parse(...).toInstant()` kullanıldı. |
| Revizyonsuz eski yüzde yeni UUID yüzünden 0 görünür | Düzeltildi. Eski hikâyenin cümle kimlikleri güncel metinde korunuyorsa eski yüzde görünür; tümüyle değişmiş metne yanlış yüzde aktarılmaz. Entegrasyon testi eklendi. |
| Tamamlanmış eski revizyonu yeniden açmak 100'ü azaltır | Düzeltildi. Önceki konum yeni revizyonda devam ediyorsa yerel ve kuyruktaki sunucu yüzdesi korunur. Tamamen değişen cümle kimliği için sıfırlama testi de var. |
| Gelecekte yeniden yayımlanan revizyon için eski metin optimizasyonu çalışmaz | Bilinçli sınır. Yalnız İngilizce metin eşitliği editör kelimelerini, çevirileri veya soruları kanıtlamaz. Henüz pakette olmayan yeni revizyon indirilir; eski editör bağlantıları ona ödünç verilmez. İleride tüm revizyon içeriğini karşılaştıran bir optimizasyon eklenebilir. |
| Eski metadata önbelleği / fingerprint | Bilinen eski 50 revizyon da doğrudan revizyon UUID'siyle paket indeksine dahil edildi. Böyle bir metadata önbelleği internet olmadan arşivdeki metni açar. Bilinmeyen gelecek revizyona salt fingerprint ile ders verisi aktarılmaz. |
| Eksik revision tag tablosu / bilinmeyen tag | Dönüştürücü artık eksik tabloyu, bilinmeyen kimliği ve eksik 11 dil tag adlarını reddeder. |
| Başlangıçta `retain` phrase index'i eşzamanlı kurar | Açık vocabulary olan hikâyeler index'i gereksiz yere kurmadan işlenir. Arşiv kelimeleri özgün V1 sözlüğüyle dondurulur; genişleyen ortak sözlük eski revizyona sızmaz. |
| V2 validator alan ve eski taslak kontrolleri | Benzersiz revizyonlar, zaman dilimli tarih, kapak, tag ve bağlantılar doğrulanır. V1'in 10 tarihsel dil taslağı ayrıca yeniden doğrulanır; V2'nin sunucudan gelen dil haritaları eski taslaklarla ezilmez. Python kontrolleri mevcut depo sözleşmesine uygun `assert` kullanır; CI `-O` ile çalışmaz. |
| Kapak kaynağı ile WebP bağlantısı ve gerçek APK içeriği | 50 PNG aynı cwebp dönüşümüyle geçici dizinde yeniden üretildi; 50/50 WebP byte eşitliği. Diğer 17 WebP snapshot ile doğrudan aynı. Derlenmiş APK'da V1/V2 JSON ve 67 fiziksel kapak hash/boyutu ayrıca doğrulandı. Paket kontrolü CI'ye eklendi. |
| Ağ kurulumu sonrası global sözlükte anlam değişebilmesi | Mevcut `install` davranışı ayrı konudur. Bu snapshot'taki paylaşılan eski kelime kimliklerinin Türkçe anlamı değişmiyor; kaynak karşılaştırmasında böyle bir fark yok. Hikâyeye özel sözlük desteği artık paket tarafında da var. Kimlikler silinmez. |

Ajan ek kontrolünde aynı İngilizce + Türkçe kaynağa farklı destek çevirileri atanmış bir eski/yeni cümle çifti bulundu. Haritasız eski önbellekte bu belirsiz eşleşme artık kullanılmaz; açık sunucu dil haritası öncelikli kalır. Tam içerik ve dil doğruluğunun insan kabulü bu incelemeyle kapatılmaz.

## Tam CI ile bulunan ek sınırlar

İlk tam API34 çalışması 398 testi çalıştırdı; 6 başarısızlık vardı. V1’e bağlı 44 klasik / sabit iki sayfa / revision-1 kuyruk kimliği beklentileri V2 verisine göre güncellendi. Uyumlu revizyon geçişinde yüzdeyi 20’ye düşürmeyi bekleyen eski test artık 100’ü korumayı doğrular. Tüm hikâyeleri tamamlanmış sayan ana ekran fixture’ı yeni 17 hikâye için gerçek revizyon/konum bilgisini de taşır. Bu testlere atlama eklenmedi.

Gerçek bir sözlük çakışması da bulundu: eski `smile` fiili ile yeni isim kimliği aynı İngilizce yüzeye sahip. Genel lookup ve `wordByText` artık ilk kanonik sözlük girdisini korur; hikâyeye özel isim anlamı kendi vocabulary kaydında kalır. Böylece yeni eş adlı kelime önceki kayıtların genel lookup anlamını ezmez. Ayrı JVM regresyonu eklendi.
