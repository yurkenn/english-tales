# English Tales — geliştirme iş listesi

> Başlangıç incelemesi: 13 Ekim 2026, native `357abed`. Satır numaraları bu snapshot içindir. GitHub geçişi sonrası güncel kaynak ve doğrulama durumu için [geçiş kaydı](NATIVE_MIGRATION.md) ve [ürün planı](PRODUCT_ROADMAP.md). Aşağıdaki inceleme sırasında test çalıştırılmadığına ilişkin ifadeler tarihsel inceleme kapsamını belirtir; yeni test sonuçları geçiş PR'ında kayıtlıdır.

24 iş paketi · Durum: planlandı · Kaynak: 357abed · 13 Ekim 2026

[Ayrıntılı geliştirme haritası](DEVELOPMENT_ROADMAP.md) kabul ölçütlerini, dosya alanlarını ve dış kapıları içerir. Bağımlılık sırası yürütme planıdır; paketler bu görevde uygulanmadı.

| ID | Aşama | Öncelik | İş paketi | Bağımlılık | Durum |
|---|---|---|---|---|---|
| D00 | A0 | P0 | Ortam, ürün sınırları ve başlangıç kanıtı | yok | Planlandı |
| D01 | A0 | P1 | Dokümantasyonu mevcut sisteme eşitleme | D00 | Planlandı |
| D02 | A0 | P0 | İzole ve gerçekten çalışan regresyon temeli | D00 | Planlandı |
| D03 | A1 | P1 | Hesaba uygun günlük hatırlatıcı | D02 | Planlandı |
| D04 | A1 | P1 | Başarısız kalıcı işlemi doğru ekranda gösterme | D02 | Planlandı |
| D05 | A1 | P0 | İkinci cihazdaki bilinmeyen ve arşivlenmiş kelimeler | D00, D02 | Planlandı |
| D06 | A1 | P1 | Çok sözcüklü ifade ve kelime eşleştirme tutarlılığı | D02, D05 | Planlandı |
| D07 | A1 | P1 | Okuma/oyun oturumu ve TTS yaşam döngüsü | D02 | Planlandı |
| D08 | A2 | P0 | Gerçek iki cihaz ve arka plan eşitlemesi | D02, D05 | Planlandı |
| D09 | A2 | P0 | Bu ortam ve release için gerçek hesap kabulü | D00, D02 | Planlandı |
| D10 | A2 | P0 | Hesap silme ve yayıncı medyası için uçtan uca güvenlik | D09 | Planlandı |
| D11 | A3 | P1 | Ana öğrenme yolculuğunu UI testlerine bağlama | D03, D04, D05, D06, D07 | Planlandı |
| D12 | A3 | P1 | Küçük ekran, büyük yazı ve erişilebilirlik | D11 | Planlandı |
| D13 | A3 | P1 | Katalog sıralaması ve devam/öneri doğruluğu | D05, D11 | Planlandı |
| D14 | A4 | P1 | Gerçek editör/yayıncı çalışma akışları | D02 | Planlandı |
| D15 | A4 | P1 | İçerik kalite ve düzenli yayın üretimi | D00, D05, D06, D14 | Planlandı |
| D16 | A4 | P2 | Kayıtlı ses desteği — kapsam seçilirse | D00, D07, D14 | Planlandı |
| D17 | A5 | P0 | Üretim schema/yetki/config eşleşmesi | D05, D09, D10, D14 | Planlandı |
| D18 | A5 | P0 | Tam yedek ve hosted geri yükleme hazırlığı | D00, D09 | Planlandı |
| D19 | A5 | P1 | Performans, dayanıklılık ve minimum tanılama | D08, D11, D12 | Planlandı |
| D20 | A6 | P0 | Mağaza kapsamı, ikon ve veri beyanları | D00, D12, D15, D17, D19 | Planlandı |
| D21 | A6 | P0 | Son imzalı aday, Play güncelleme ve beta | D08, D09, D10, D11, D12, D13, D15, D17, D18, D19, D20; D16 yalnız scope'a alınmışsa | Planlandı |
| D22 | A6 | P0 | Kontrollü üretim yayını ve ilk işletim | D21 | Planlandı |
| D23 | A7 | P2 | Yayın sonrası öğrenme ve özellik keşfi | D22 | Planlandı |

## Kanıt kaydı şablonu

Her iş için: başlangıç commit/build, ortam, kabul senaryosu, değişen dosyalar/sözleşme, run/pass/fail/skip, sonuç kanıtı, kalan sınır ve geri dönüş adımı. D16 kapsam seçilmeden zorunlu yayın işi değildir.
