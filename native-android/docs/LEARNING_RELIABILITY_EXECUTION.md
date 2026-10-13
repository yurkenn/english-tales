# İlk güvenilirlik paketi — D03 / D04

13 Ekim 2026. Kapsam: aktif öğrenme hesabına göre hatırlatıcı; kayıt hatasının öğrenme ekranında görünmesi ve güvenli yeniden deneme.

## Doğrulanan başlangıç ve değişiklik haritası

Önceki kaynak `f9099f2`: `LearningReminders.kt:63` alıcısı varsayılan misafir `LearningStore` açıyordu. `LearningViewModel.kt:53` mutation hatasını yalnızca hesap mesajına yazıyor; `TalesApp` okuyucu ve alıştırma ekranlarına bu mesajı taşımıyordu. Mutation sonrası snapshot okuması hata yakalama dışında kalıyordu.

| Kaynak | Değişiklik | Bağımlılık / yan etki |
|---|---|---|
| [LearningReminderOwner](../app/src/main/java/com/yurken/englishtales/data/LearningReminderOwner.kt) | `reminders.learning_owner` ile seçili öğrenme owner'ını saklar. | Başlangıç ve başarılı hesap değişiminde ViewModel günceller. Token sona erse de UI aynı hesap verisini gösteriyorsa hedef hâlâ o hesabındır. İlk güncellemede anahtar yoksa mevcut yerel oturumdan çözülür; yeni ağ çağrısı yok. Bozuk owner misafire düşürülmez. |
| [LearningReminders](../app/src/main/java/com/yurken/englishtales/ui/LearningReminders.kt) | Hedefi seçili owner veritabanından okur; bildirimden önce owner'ı tekrar kontrol eder. | Bildirim saati/izni cihaz tercihi olarak kalır. DB hatasında başka hesaba geçilmez. Arka plan işi ve zamanlama hata verse de broadcast sonucu serbest bırakılır. |
| [LearningWriteRecovery](../app/src/main/java/com/yurken/englishtales/data/LearningWriteRecovery.kt) | Başarısız ve sonraki yazmaları sırayla bekletir; snapshot hatasını yazma hatasından ayırır. | Yalnız ViewModel actor'ü erişir. Başarıyla dönen yazma snapshot hatası nedeniyle tekrar çalıştırılmaz. Tekrar eden hata kuyruk başını korur; başarılı baş kuyruktan çıkar. |
| [LearningViewModel](../app/src/main/java/com/yurken/englishtales/data/LearningViewModel.kt) | Ortak öğrenme hata StateFlow'u, retry eylemi, owner seçimi ve scope değişiminde eski kuyruğun temizlenmesi. | Hesap/auth mesajlarından ayrıdır. Önceki owner'ın başarısız işi yeni hesaba yazılamaz. Oturum başlangıç zamanı çağrı anında yakalanır; retry sırasında yeniden başlatılmaz. Eşitleme zaten kalıcılaşmış outbox üzerinden sürer. |
| [LearningStore](../app/src/main/java/com/yurken/englishtales/data/LearningStore.kt) | Kelime kaydı için açık hedef durumu; session başlangıcı için yakalanmış timestamp. | Aynı save/remove hedefinin tekrarı ikinci event yaratmaz. UI toggle hedefini ilk denemede çözüp retry'da korur. Mevcut Room şeması, cloud RPC ve session UUID sözleşmesi değişmez. |
| [LearningWriteErrorBar](../app/src/main/java/com/yurken/englishtales/ui/LearningWriteErrorBar.kt) / [TalesApp](../app/src/main/java/com/yurken/englishtales/ui/TalesApp.kt) | Bütün öğrenme rotalarını ortak kalıcı hata ve “Tekrar dene” eylemiyle sarar. | Okuyucudan sonuç/alıştırmaya geçince uyarı kaybolmaz; status-bar insets korunur, hata ekran okuyucu için live region'dır. Başarılı retry sonrası uyarı kalkar. |
| [app/build.gradle.kts](../app/build.gradle.kts) | Compose UI test runner/host bağımlılıkları. | `androidTest` ve debug test host kapsamındadır; yeni production SDK yok. Room schema veya backend migration eklenmedi. |

Başlangıç kaynak haritası tarihsel snapshot olarak korunur: [CODEBASE_MAP](CODEBASE_MAP.md). Yukarıdaki tablo bu paketin delta haritasıdır.

## Kabul ve test kanıtı

- Gerçek SQLite trigger ile kelime transaction'ı başarısız bırakılır; ikinci işlem bekler, trigger kalkınca ikisi sırayla kaydedilir. Outbox'ta çift kelime event'i oluşmaz.
- Puan transaction'ı başarısız bırakılır; retry sonrası aynı session UUID için tek tamamlanma, tek session event'i ve 25 puan vardır.
- Snapshot okuması başarısız bırakılır; kaydedilmiş kelime retry'da tersine çevrilmez. Actor çalışmaya devam eder.
- Başlangıç kaydı başarısız olan session'ın gerçek başlangıcı retry'da korunur; aktif çalışma süresi sıfırlanmaz.
- Başarısız misafir işlemi sonrası hesap değiştirilir; eski iş yeni hesaba uygulanmaz, reminder owner yeni hesap olur.
- Hesabın hedefi tamam / misafir eksik ve ters durum ayrı denenir. Owner değişirken eski hesaba göre bildirim gönderilmez. Bozuk owner DB açmadan atlanır. Persisted seçim yeni context'te okunur.
- Compose UI testi gerçek okuyucu ve alıştırmayı ortak host içinde çalıştırır. Kalıcı hata iki ekranda görünür; ilk retry hâlâ başarısızsa kalır, DB düzeltildikten sonra düğmeye basınca kayıt tamamlanır ve uyarı kalkar.

Yeni regresyonlar: 6 JVM, 10 veri/hatırlatıcı cihaz testi, 1 Compose UI testi. Toplam paket: **17 JVM + 117 cihaz testi**. Çalıştırma komutu:

```sh
cd native-android
bash gradlew :app:testDebugUnitTest :app:assembleDebug :app:assembleDebugAndroidTest :app:lintDebug :app:connectedDebugAndroidTest
```

Sonuçlar ve CI bağlantıları bu paketin GitHub PR'ında tutulur. Testsiz özellik veya gerçek Google/iki cihaz doğrulaması bu paket tarafından tamamlanmış sayılmaz.

## Sınırlar ve sonraki işler

Kaydedilemeyen yerel işlemler, disk yazamıyorken kalıcı outbox'a eklenmiş gibi gösterilmez. Retry kuyruğu bellektedir: kullanıcı uygulamayı kapatmadan veya hesap değiştirmeden tekrar denemelidir; uyarı bunu açıkça söyler. Owner değişimi eski bekleyen işlemleri iptal eder. Daha önce başarıyla kalıcılaşan kayıtlar Room/outbox'ta korunur.

Bildirim izin ekranı ve reboot alıcısı mevcut Android mekanizmasını kullanır. Testlerde bildirim kararı fixture callback'iyle ölçülür; OS'nin gerçek saatli bildirim teslimi veya cihaz üreticisinin alarm kısıtları bu testlerle kanıtlanmaz. Cloud kesintisi/gerçek iki cihaz kabulü D08, bilinmeyen kelimeler D05, genel erişilebilirlik D12 kapsamındadır.

Platform referansları: [BroadcastReceiver / goAsync](https://developer.android.com/reference/android/content/BroadcastReceiver), [Compose live-region semantics](https://developer.android.com/develop/ui/compose/accessibility/semantics).
