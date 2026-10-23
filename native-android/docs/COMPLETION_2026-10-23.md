# 23 Ekim 2026 — yarım kalan içerik ve görev kabulü

İstenen tamamlama kapsamı kapatıldı: Claude PR #172 ana dala birleştirildi; 14 mevcut hikâyenin uzatması ve dört yeni kısa hikâye üretimde yayınlandı. Önceki turdaki 13 yeni hikâyeyle katalog toplam **67 hikâye** içeriyor. Bu tur güncel hikâyelere **487 cümle** ekledi; güncel revizyonlarda 2.839 cümle var. Tarihsel revizyonlarla tablo toplamı 3.157 cümle.

## Yayın ve veri doğrulaması

Yalnız belirlenen 18 hikâye authenticated `admin_create_draft` → `admin_save_draft` → sunucudan geri okuma → `admin_publish` akışıyla işlendi. 14 uzatmada önceki İngilizce, Türkçe ve mevcut diğer dil çevirileri birebir korundu. Önceki tüm okuyucuya açık tablo satırları korundu; yalnız yetkili 14 hikâyenin güncel revizyon işaretçisi değişti. Yeni dört hikâye Goldilocks, Three Little Pigs, First Big Order ve Night Library için cümleler, çalışma kelimeleri ve açıklamalar 11 dilde tam; 17 anlama sorusu mevcut.

Yayın sonrası anonim API yedeğinde 67 hikâye, 86 yayınlanmış revizyon ve SHA-256 ile doğrulanmış 67 medya dosyası var. 18 hedefin tüm metinleri, çevirileri, soruları, kelimeleri, bağlantıları, etiketleri ve kapakları yayın paketleriyle birebir karşılaştırıldı. [Makine okunabilir kanıt ve yedek konumları](release-evidence/2026-10-23-completion.json).

Sahibin açık yayın talimatı kaydedildi. Çeviriler AI destekli taslaktır; ana dil uzmanı onayı verilmedi. `reviewedBy: null` ve `reviewedLanguages: []` korundu. Kaynak dosyalarda yayınlanan revizyon kimliği ve zamanı ayrıca kayıtlıdır.

## Görev sandığı canlı kabulü

Hesap sahibi mevcut hesabında test görevi ve puan eklenmesini açıkça kabul etti. İki test oturumu kaydedildi: bir okuma ve beş doğru cevaplı oyun. 25 oyun puanı + 20 sandık puanı eklendi; okumanın 20 XP ödülüyle lig toplam artışı 65 XP oldu. Eksik görev reddi, günlük hedef, aynı oturumun yeniden gönderilmesinde idempotency, sandığın tekrar açılmasında aynı ödül ve yeni kayıt eklemeden kalıcılık kontrolü geçti. Kimlik, e-posta, oturum tokenı ve diğer üyelerin verileri kanıta alınmadı.

İlk canlı testte lig beklentisi yalnız oyun + sandık olarak kurulmuştu. Sunucunun mevcut `session_xp` kuralındaki okuma ödülü 20 XP hesaba katılarak beklenti düzeltildi; yeni oturum veya ek puan oluşturmadan yeniden doğrulandı.

## Kod ve testler

- Backend 201/201, 0 hata, 0 atlama. Dört kısa hikâyenin çeviri, kelime, soru kanıtı ve insan onayı sınırları için regresyon testleri eklendi.
- Android `QuestChestsTest`: 4/4, 0 hata, 0 atlama; bağlı emülatörün gerçek XML sonucu kontrol edildi.
- Tam yayın yedeğinde yüksek offset sorguları PostgreSQL `57014` zaman aşımına giriyordu. CLI artık bileşik anahtar imleciyle sayfalar; yüksek offset taraması yapmaz. Okuma zaman aşımı yalnız bir kez yeniden denenir; yetki hataları gizlenmez. 20.000 üzeri çeviri ve bileşik imleç regresyonları mevcut; canlı yedek 24.707 cümle çevirisinin tamamıyla başarıyla alındı.
- Kaynak ve yayın kanıtı [PR #173](https://github.com/yurkenn/english-tales/pull/173) içinde. Son başlık ve birleşik ana dal CI sonuçları PR/GitHub Actions üzerinde izlenir; bu belge henüz tamamlanmamış bir koşuyu başarılı göstermez.

Bu çalışma yeni APK/AAB veya mağaza paketi yayınlamaz. Android CI ve canlı servis kabulü, fiziksel cihazda Play güncellemesi/TalkBack veya ana dil incelemesi yerine geçmez. Önceki tarihli yol haritası kayıtları tarihsel kanıt olarak korunur.

Geri dönüş gerekirse dört yeni hikâye güncel revizyon eşleşmesi denetlenerek yayıncı panelinden arşivlenebilir. 14 uzatma için önceki revizyon kaynak alınarak yeni bir taslak oluşturulup karşılaştırılarak yayınlanır. Yayınlanmış geçmiş revizyonlar ve kullanıcı öğrenme verileri silinmez.
