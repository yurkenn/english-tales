# Ana ekran ve okuma UX paketi

14 Ekim 2026 · Başlangıç `a7c3ff4`. Kullanıcı önerilen ilk paketi “YAP” diyerek onayladı: ana ekran odağı, kalıcı okuma görünümü ve görsel tutarlılık.

## Düzenleme öncesi kaynak ve etki haritası

| Alan | Kanıt / bağımlılık | Değişiklik ve kırılma sınırı |
|---|---|---|
| `ui/CatalogScreens.kt:61`, `ui/LearningJourney.kt:21` | StudyScreen → DailyPlan → onRead/onPractice. DailyPlan mevcut lastStoryId/revision ve dueWordIds ile aday seçiyor. | Aynı aday ve callback korunur; kitap kapağı/ilerleme ve belirgin devam düğmesi öne çıkar, tekrar ikinci eylemdir. LearningStore, öneri algoritması, puan ve session sözleşmesi değişmez. |
| `ui/TalesApp.kt:70` | Mevcut onRead callback'i snapshot readingPositions revision'ını Reader rotasına taşır. | Navigation yeniden yazılmaz. Başka revision/sayfadan başlama riskini devam kartı ve mevcut resume testleri doğrular. |
| `ui/ReaderScreen.kt:110` | dark/fontSize rememberSaveable ekran ömründe; TappableSentence metin yerleşimini belirler. | Ayrı cihaz tercih deposu, kalıcı font/tema/satır aralığı, canlı önizlemeli panel. Sayfa/session ID ve snapshot progress korunur; yazı yerleşimi veya modal büyük yazıda taşabilir. |
| Yeni `ui/ReadingPreferences.kt` / `ui/ReaderAppearancePanel.kt` | SharedPreferences ve IO coroutine/Mutex. | Görsel tercihler cihaz genelidir, owner verisi değildir. Room/cloud migration yok. Yazma başarısızsa hata görünür ve kaydedildi diye gösterilmez. Geçersiz eski değerler güvenli varsayılan/sınırla okunur. |
| `ui/Theme.kt`, `ui/ReferenceComponents.kt` | Tüm Compose ekranları ortak renk/typography/shapes; bazı ekranlar kendi dp/sp değerlerini kullanır. | Renk/şekil değişimi tüm ekranları etkiler; resimlerin kendi paleti değişmez. Kontrast ve fontScale kabulü gerekir. Bütün sabit ölçülerin kaldırıldığı iddia edilmez. |
| Testler | DailyPlan, Reader resume ve fontScale kabulü; yeni tercih ve UI testleri. | Devam hedefi, tamamlanmış hikâyenin tekrar önerilmesi, boş içerik, ardışık tercih değişimi, yeniden açılış ve büyük yazı kontrol edilir. |

Bu harita kaynak okumalarına dayanır. Yeni düzenin kullanıcı davranışına etkisi pilotla ölçülmeden kazanım yüzdesi veya süre vaadi yazılmaz. Ana ekran görsel yoğunluğunun sorun oluşturması ürün hipotezidir. SDK/reklam, veri senkronizasyonu ve canlı hizmet ayarı bu pakette değiştirilmez.

## Sonuç ve doğrulama

- Ana eylem kitap kapağı, seviye/tür ve gerçek ilerlemeyi gösterir; devam düğmesi aynı onRead/revision yolunu kullanır. Tamamlanmış öneri “Yeniden oku” olarak etiketlenir. Tekrar düğmesi gerçekten açacağı en fazla beş kelimeyi ve toplam bekleyen sayıyı ayrı gösterir. Çift kelime defteri kısayolu tek düğmeye indirildi; haftalık özet ve öneriler aşağıda kalır.
- Eski boşta kalan PlanAction helper'ı ve okuyucunun geçici dark/fontSize state'i kaldırıldı. ReadingPreferencesStore, Mutex ile IO commit'lerini sıraya koyar; art arda yazı büyütme kaybolmaz. Font 14–28, sıkı/rahat/geniş satır aralığı ve açık/koyu tema cihazda korunur. Ayar güncellemesi sayfa/session/puan yazmaz. Hesaplar cihazın aynı görünüm tercihlerini kullanır; öğrenme verileri ayrı kalır.
- Modal okuma paneli önizleme, seçili işaretleri, kaydırılabilir kontroller ve sabit görünür “Okumaya dön” düğmesi içerir. Dış görünümün fontScale değeri modal içerikte de korunur. Büyük yazıda StatsHeader iki satıra geçer. Okuma ekranının koyu zemindeki eylem ve yardımcı metinleri için daha açık renkler seçildi.
- Ortak ana mavi/beyaz kontrastı 5.66:1, yardımcı gri/beyaz 5.78:1, mor/beyaz 6.16:1 (sRGB hesap). Bu değerler statik tema renkleri içindir; bütün bitmaps/hardcoded renkler veya ekranlar için erişilebilirlik sertifikası değildir. Ortak Material shapes ve bodyLarge tipi güncellendi; progress bileşenlerine erişilebilir range semantics eklendi.
- Yeni dört Android testi: yeni depo örneğinde kalıcılık + eşzamanlı yazma + eski/geçersiz değer; büyük yazıda doğru devam ve beş kelimelik tekrar hedefi; tamamlanan hikâyenin yarım diye gösterilmemesi; Reader yeniden kurulduğunda ayarların korunması ve 2× yazıda panelden çıkış. Görseller yalnız paket içi fixture verisinden ayrı test emülatöründe üretilir.
- Tam testte eski IconActionsTest yeniden başlatılan alıştırmada aynı ilk kelimenin görüleceğini varsayıyordu; kaynakta yeni beş kelimelik grup rastgele seçiliyor. Test yeni session ID ve gerçek alıştırma başlığını doğrulayacak şekilde düzeltildi; öğrenme/yeniden başlatma davranışı değiştirilmedi.
- 23 JVM + 124 Android cihaz testi geçti; debug/test APK ve lint başarılı. Yeni görseller normal ve 2× fontScale ile incelendi. Repository guard ve 16 KB ELF hizalaması ayrıca doğrulanır; GitHub CI sonuçları PR üzerindedir. TalkBack ile gerçek görev tamamlama, boş uzak katalog için uçtan uca UI kabulü, düşük çözünürlüklü fiziksel cihaz, release/R8 ve kullanıcı pilotu ayrıca kabul işleridir.

Önizlemeler test fixture'ıdır: [ana ekran](preview-home-ux.png), [okuma görünümü](preview-reading-appearance.png). Bunlar canlı hesap, bulut senkronizasyonu veya mağaza yayın kanıtı değildir.
