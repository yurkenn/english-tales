# Kısa seviye belirleme testi

15 Ekim 2026. Onboarding’de seviye seçerken ve Profilim → Ayarlar’da “Seviyemi kısa testle bul” ile açılır. Dokuz soru; süre sınırı yok, yaklaşık 2–3 dakika. Kullanıcı testi atlayıp seviyeyi elle seçebilir.

## Kapsam

A1, A2 ve B1 için üçer özgün soru: cümle tamamlama, açık bilgi bulma, sıralama/neden ilişkisi, zaman hesabı ve kısa çıkarım. Sorular paket içinde; çevrimdışı çalışır. Cevaplar ağ servisine veya Analytics olayına eklenmez. Aktif denemenin soru/cevap durumu ekran yeniden oluşturulunca korunur; testten çıkış onayıyla silinir. Kalıcı test geçmişi tutulmaz.

Sonuç yalnız uygulamadaki hikâyeler için başlangıç önerisidir; standartlaştırılmış veya doğrulanmış bir CEFR yeterlilik sınavı değildir. A1 altını ve B1 üstünü ayırt etmez; dinleme, konuşma ve yazmayı ölçmez. “Bilmiyorum” yanlış cevap gibi sıfır puandır. Eksik veya geçersiz cevap dizisine sonuç üretilmez.

A2 önerisi için A1 ve A2 gruplarında en az 2/3 doğru gerekir. B1 için ayrıca B1 grubunda en az 2/3 gerekir. Diğer sonuçlar A1’den başlatır; üst gruptaki doğru cevaplar alt gruptaki eksikleri telafi etmez. Bu eşikler ürünün başlangıç önerisi kuralıdır, psikometrik geçerlilik iddiası değildir.

## Tercih ve kayıt

Sonuç otomatik uygulanmaz. Onboarding’de öneriyi kabul etmek mevcut tür/günlük hedef adımlarına döner ve onboarding tamamlandığında seviye kaydedilir. Ayarlar’da öneri yalnız yerel formun seviye alanını değiştirir; “Değişiklikleri kaydet” mevcut `updatePreferences` yolunu kullanır. İsim, tür, günlük hedef ve öğrenme ilerlemesi korunur. Sonucu reddetmek veya testten çıkmak önceki seçimi korur; yeni veritabanı veya bulut şeması yoktur.

Yeni arayüz metinleri `res/values/placement.xml`, İngilizce soru bankası ve puanlama `ReadingPlacement.kt` içinde. Test tamamlaması günlük hedef, puan veya kelime tekrar oturumu sayılmaz.

## Doğrulama

JVM testleri tüm 64 grup-puan birleşimini, yanlış/bilinmeyen cevapları, eksik/geçersiz dizileri ve soru bankası bütünlüğünü kontrol eder. Compose cihaz testleri cevap zorunluluğunu, durum kurtarmayı, onboarding ve Ayarlar kayıt yolunu, iptali/sonucu reddetmeyi ve fontScale 2.0 akışını kapsar. Mevcut onboarding Analytics testleri de regresyon kontrolüne dahildir.

Yerel doğrulama: API 36 ARM64 emülatöründe 7 yeni Compose testi + 2 mevcut onboarding Analytics testi, toplam **9/9 başarılı**. **46/46 JVM testi** geçti. Debug derleme başarılı; lint 0 hata / 29 uyarı (bağımlılık güncellik uyarıları yerel ve CI ortamında değişebilir). CI tüm uygulama cihaz testlerini ve üç Macrobenchmark senaryosunu ayrıca çalıştırır. Bu özellik henüz Play sürümüne yüklenmedi.
