# Çevrimdışı veri geçişi — analiz ve uygulama planı

10 Ekim 2026

## İnceleme

Mevcut SQLite v3 puanları, kelime tekrarlarını, günleri ve hikâye yüzdelerini koruyor. Kullanıcı ayarları ayrı tercihler dosyasında; cevap geçmişi, gerçek cümle konumu ve gönderilecek değişmez işlem gövdeleri yok. Alıştırma UUID'si yalnızca yerel ödülü ayırıyor; tür, soru sayısı ve aktif süre kayıtlı değil. Bu nedenle eski toplamları sunucuya tam oturum geçmişi gibi göndermek doğru olmaz.

## Bu aşamanın kapsamı

1. Room ile şema doğrulaması ve SQLite 1/2/3 → 4 veri geçişi. Mevcut native verileri silme yok; ayarlar aynı veritabanına taşınır.
2. Misafir için mevcut veritabanı, her hesap için ayrı veritabanı ve değişmeyen sahip bilgisi. Hesap girişi henüz eklenmez.
3. Kelime kaydetme/silme/cevap, cümle konumu ve tamamlanan çalışma için UUID'li kalıcı işlem kuyruğu. Yerel değişiklik ile kuyruk aynı transaction içinde yazılır.
4. Gönderim gövdesi ilk kayıtta sabitlenir; teslim/retry metadata'sı ayrı güncellenir. Misafir kuyruğu buluta gönderilmez. İşlem onayı hesabın sahibiyle eşleşmek zorundadır.
5. Okuma konumunu sürüm ve cümle ile sakla. Eski yüzdeler korunur; olmayan eski cümle/cevap geçmişi uydurulmaz.
6. Oturum başlangıcı, alıştırma türü/soru sayısı ve yalnızca ön plandaki aktif süre. Yarıda bırakılan çalışma ödül veya tamamlama kuyruğu üretmez.

## Kontrol kapıları

- Geçiş sonrası mevcut puan, kelime, tekrar zamanı, hedef, ayarlar ve hikâye yüzdesi korunmalı.
- Kuyruk ve yerel değişiklik hata durumunda birlikte geri alınmalı; uygulama yeniden açıldığında gövde ve UUID aynı kalmalı.
- İkinci tamamlama puan veya yeni kuyruk üretmemeli; başka hesap kendi ilerlemesini ve kuyruğunu görmeli.
- Okuyucu kapanıp açıldığında kayıtlı sayfaya dönmeli; tamamlanmış yüzde düşmeden önceki sayfaya geri gidilebilmeli.
- Derleme, mevcut öğrenme testleri ve yeni veri geçişi/kuyruk testleri geçmeli; emülatörde güncelleme ve okuma/alıştırma denenmeli.

## Sonraki aşama

Canlı Supabase, token yenileme, ağ worker'ı, misafir verisini hesaba bir kez bağlama ve sunucu durumunu yerelde birleştirme ayrıca uygulanacak. Bu aşamadaki kuyruk kurulmuş bir bulut bağlantısı anlamına gelmez. Firebase ölçümü de henüz eklenmez.

## Uygulanan sonuç

- Room 2.8.5 + KSP2 ile sürüm 4 şeması üretildi ve `app/schemas` içinde saklandı. Eski 1/2/3 şemaları için veri koruyan migration var; silerek yeniden oluşturma fallback'i kullanılmadı.
- Tercihler veritabanına taşındı. Kelime, ilerleme, ödül ve kuyruk yazımı birlikte geri alınabilir. ViewModel aynı kullanıcı eylemlerini çağrı sırasıyla işler.
- Okuyucu revision/cümle kaydından sayfasını bulur. Yüzde en yüksek değerini korurken kullanıcı önceki sayfaya dönebilir. Tamamlanan alıştırma türü, soru sayısı ve aktif süre saklanır.
- Kuyruk gövdesi sabit kalır; hesap sahibi doğrulanır, geçici hatalar gecikmeli yeniden denemeye, kalıcı hatalar bloke durumuna ayrılır. Henüz gerçek ağ worker'ı çalışmaz.
- Eski cevap geçmişi uydurulmadı. Hikâye kaynağı olmayan `discover`/`kind` kayıtları yerelde korunup gönderimden tutuldu. Saat geri alınmış veya yedi günden uzun açık kalmış oturum da geçersiz gövdeyle ağ denemesine girmez.

## Doğrulama

**11 birim + 14 emülatör veritabanı testi geçti.** Kontroller; zaman/tekrar politikası, ön plan saati, katalog UUID uyumu, 1/2/3 veri geçişi, kuyrukta değişmeyen gövde, silme geçmişi, yerel değişiklik/kuyruk atomikliği, tek oturum ödülü, konum, hesap ayrımı, yeniden deneme/onay ve geçersiz zaman/kaynak kayıtlarını kapsar.

Mevcut emülatörün v3 kayıtlarıyla güncelleme denendi: 45 puan, iki çalışma, dört kelime, Ada/A2/Macera/3 hedefi ve bitmiş hikâye korundu. The Paper Boat'ta ikinci sayfaya geçildi, uygulama durdurulup açıldı; `pb-9` kaydından ikinci sayfa geri geldi. Okuma ve beş soruluk çalışma tamamlandı: 70 puan, üç alıştırma, dokuz kelime.

Android'in bu yolculukta oluşturduğu **14 gerçek gövde**, hazırlanan migration'ların çalıştığı yerel PostgreSQL motoruna uygulandı. 14'ü de kabul edildi; hepsinin ikinci gönderiminde `applied=false` geldi. Sunucu özeti yalnızca yeni çalışmadan 25 puan gösterdi; eski yerel 45 puan için sahte oturum oluşturulmadı. Bu kontrol Auth/Storage test fixture kullanır; canlı HTTP bağlantısı değildir.

Görüntüler: [yeniden açılan okuyucu](preview-reader-resume.png) · [çalışma sonucu](preview-offline-practice-result.png).

Room sürümü ve geçiş yaklaşımı [Android Room belgeleri](https://developer.android.com/jetpack/androidx/releases/room) ve [veri geçişi rehberi](https://developer.android.com/training/data-storage/room/migrating-db-versions) üzerinden kontrol edildi.
