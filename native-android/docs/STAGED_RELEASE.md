# Kademeli Android yayını

15 Ekim 2026 · Kalite yol haritası Q2.5.

Bu belge yeni bir sürüm için uygulanan kontrol listesidir. Play Console'da dağıtım yapmaz; yüzdeleri artırma ve durdurma işlemleri uygulama sahibi tarafından yürütülür. 48 / 2.0.0 için önceki inceleme başvurusunun sonucunu değiştirmez.

## 1. Adayı sabitle

- [ ] Ana dalın commit SHA'sını, sürüm adını ve sürüm kodunu kaydet. Sürüm kodu Console'daki en yüksek koddan büyük olmalı; yerel 48 paketini yeni güncelleme olarak tekrar kullanma.
- [ ] Aynı commit için repository, backend, Android ve android-device işleri başarılı. Atlanan cihaz testlerini ve gerekçelerini kaydet.
- [ ] İmzalı APK/AAB üret; `tooling/verify_release.py` başarılı. Rapor ve APK/AAB SHA-256 değerlerini sürüm kaydına ekle; APK < 15 MB.
- [ ] Anahtar/parola ve özel Firebase dosyası yalnız özel makine/CI ayarlarında. R8 mapping yüklemesi ve ilgili Crashlytics sürüm eşleşmesi doğrulanmış.
- [ ] Dahili kanalda Play'in ürettiği paketleri kur; eski üretim sürümünden güncellemede giriş, okuma konumu, kaydedilen kelimeler ve tekrar planı korunuyor.
- [ ] Giriş → katalog → indirme → çevrimdışı okuma → kelime çalışması → sonuç → tekrar açılış kontrolü geçti. Ses odağı ve arka plana geçişte sesin durması kontrol edildi.
- [ ] Play imzasıyla Google girişi ve yeni release'in gerçek 16 KB cihaz kontrolü kaydedildi. Statik hizalama kontrolünü cihaz testi yerine yazma.
- [ ] Gizlilik sayfası ve Play veri güvenliği beyanı gerçek pakete uyuyor. Crashlytics eklenen ilk sürümden önce CRASH_REPORTING.md içindeki açık yayın işleri tamamlandı.

## 2. %20 → %50 → %100

Her basamakta sürüm kodunu, başlangıç/bitiş zamanını, erişilen kullanıcı/oturum sayısını, çökme ve ANR paydalarını ve karar vereni kaydet. Bir önceki üretim sürümünü aynı metrik ve karşılaştırılabilir zaman aralığıyla karşılaştır.

| Basamak | En erken değerlendirme | İlerleme koşulu |
|---|---|---|
| %20 | En az 24 saat | Kontrol listesi tamam; yeni kritik hata yok; çökme/ANR hedefleri sağlanıyor |
| %50 | Bu basamakta en az 24 saat | Aynı kontroller tekrar geçti; önceki basamağa göre bozulma yok |
| %100 | %50 değerlendirmesinden sonra | Uygulama sahibinin kayıtlı kararı; ilk 48 saat izleme sürer |

24 saat otomatik ilerleme kuralı değildir. Payda azsa ya da Play vitals verisi gecikiyorsa süreyi uzat; veri olmamasını %0 hata olarak raporlama. Crashlytics olay sayısını Play'in kullanıcı bazlı çökme oranıyla aynı metrik gibi kıyaslama.

İç kalite hedefleri: kullanıcı tarafından fark edilen çökme oranı < %0,5 ve ANR oranı < %0,2. Bu değerler projenin hedefleridir; güncel mağaza politika eşiği beyanı değildir. ANR görünürlüğü ve açılış ölçümü ayrıca Q2 kapısında doğrulanır.

## 3. Dağıtımı durdur

Aşağıdaki durumlardan birinde yüzdeyi artırma; devam eden kademeli dağıtımı Console'dan durdur ve gerekçeyi kaydet:

- Yeni sürüme bağlı veri kaybı, hesaplar arası veri görünmesi, girişin veya temel öğrenme yolculuğunun engellenmesi: oran beklemeden durdur.
- Çökme oranı ≥ %0,5 veya ANR ≥ %0,2: ilgili sürüm ve veri paydasını doğrula; hedef aşımı giderilene kadar yayını ilerletme.
- Önceki sürüme kıyasla yeni belirgin hata, açılış/paket sorunu veya tamamlanmamış yayın kontrolü: araştırma tamamlanana kadar beklet.

Durdurmak kurulmuş uygulamaları geri almaz. Sorunu daha yüksek sürüm kodlu bir düzeltmeyle gider; aynı kontrol listesinden geçir. Otomatik sürüm düşürme, yerel veriyi silme veya veritabanını eski şemaya zorlama uygulama. Sunucu/içerik değişiklikleri için ayrı geri dönüş kararı ve ilgili veri yedeği gerekir.

## 4. Sürüm kaydı

```text
Commit / versionCode / versionName:
APK SHA-256 / AAB SHA-256:
CI bağlantısı / atlanan testler:
Statik paket raporu / gerçek cihaz kanıtı:
Eski sürümden güncelleme ve ilerleme koruma sonucu:
Gizlilik ve veri güvenliği kontrolü:
Crashlytics sürümü / mapping durumu:
Basamak / zaman aralığı / kullanıcı ve oturum sayısı:
Play çökme oranı / ANR / paydalar / veri gecikmesi:
Yeni kritik hata / önceki sürümle karşılaştırma:
Karar (bekle, artır, durdur) / karar veren / gerekçe:
Düzeltme sürümü (gerekirse):
```

Tamamlanan bir yayın kaydı gerçek Console kanıtı içermelidir. Bu boş şablon, herhangi bir adayın dağıtıldığı veya kontrol listesini geçtiği anlamına gelmez.
