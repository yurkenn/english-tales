# Dil desteği — L0 devam kaydı

17 Ekim 2026 · Başlangıç: Claude'un [#87](https://github.com/yurkenn/english-tales/pull/87) çalışması (`bdf8197`).

## Mevcut kapsam

Uygulama arayüzü Türkçe ve İngilizce sunulur. Android 13 ve üzerindeki uygulama dili seçimi sistem ayarlarındadır; desteklenmeyen cihaz dilleri İngilizceye döner. Hikâye, sözlük ve kategori içeriğinin destek dili hâlâ Türkçedir (`SupportLanguage.code == "tr"`). İngilizce arayüz, İngilizce açıklama/kelime çevirisi kataloğu bulunduğu anlamına gelmez.

Claude'un PR açıklamasındaki açık iş, Kotlin içinde kalan kullanıcı mesajlarıydı. Devam çalışması:

- Hesap giriş/çıkış, doğrulama/kurtarma, misafir aktarımı, hesap silme ve Google giriş mesajlarını dil kaynaklarına taşır.
- Ön ve arka plandaki eşitleme, indirme ve reklam gizliliği sonuçlarını yerelleştirir.
- Kalıcı kayıt hatalarını ekrandaki güncel dilde çözülen kaynak kimlikleriyle gösterir.
- Günlük hedef seçimini çevrilmiş metnin biçimine bağlamaz; İngilizcede tekil “1 step” varsayılan olarak doğru seçilir ve hedef seçenek sırasından kaydedilir.
- Onboarding, ayarlar ve günlük plandaki tür adlarını; kütüphane okuma filtrelerini çevirir. Veritabanındaki tür değerleri değişmez.
- Hesap ekranındaki son eşitleme tarihini arayüz diliyle biçimlendirir.
- Türkçe öncelikli dil listesinde ikinci sıradaki İngilizcenin `values-en` kaynakları üzerinden Türkçeyi geçersiz kılmasını önler; kaynak çözümü tek seçili arayüz diliyle yapılır.
- `values/status_messages.xml` ve `values-en/status_messages.xml` dosyalarına eşleşen 88 metin ekler.

İçerik doğrulamasındaki teknik istisnalar kullanıcıya doğrudan gösterilmez; indirme/güncelleme hatası yerelleştirilmiş genel mesajla sunulur. Veritabanı değerleri, sunucu alanları ve hikâye metinleri arayüz metni gibi çevrilmez.

## Doğrulama

`AppLocalizationTest` Türkçe/İngilizce kaynak seçimini, İspanyolca cihaz için İngilizce geri dönüşünü ve gerçek hesap ViewModel'inin yapılandırılmamış bağlantı hatasını kontrol eder. `EnglishUiTest`, İngilizce “Mystery” seçiminin mevcut “Gizem” kayıt değerini kaydettiğini doğrular. Mevcut Türkçe arayüz, kayıt güvenilirliği ve eşitleme testleri regresyon kapsamındadır. `TalesTestRunner`, eski testlerin Türkçe beklentilerini cihazın sistem dilinden bağımsız olarak sabitler; uygulamanın dil seçimini yalnız test kurulumu sırasında Türkçe yapar. İngilizce testler kendi yerel kaynak bağlamını kullanır. Bu, #87 ilk CI turunda İngilizce emülatörde görülen dil kaynaklı test hatalarını da kapsar.

## Sonraki dil aşaması

L0 yalnızca İngilizce arayüz temelidir. On yeni dil tamamlanmış değildir. [Öğrenme ve dil planındaki](LEARNING_QUALITY_PLAN.md#5-dil-genişlemesi-l-hattı) L1, İspanyolca pilotunu öngörür: arayüzün yanında cümle/kelime çevirileri, açıklamalar, kategori adları, sözlük ve mağaza metinleri gerekir. Çeviri taslakları ile editör incelemesi ayrı aşamalardır; bu çalışma canlı içerik veya mağaza yayını yapmaz.
