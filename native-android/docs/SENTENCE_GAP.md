# Cümlede boşluk doldurma

15 Ekim 2026. Oyna → “Cümlede boşluk doldur” ile açılan, mevcut hikâye cümlelerini kullanan seçmeli kelime alıştırması. İnternet veya yeni içerik servisi gerektirmez; yalnız metni cihazda bulunan hikâyeler kullanılır.

## Soru üretimi

Her soru seviyeyi, bir boşluk bırakılmış İngilizce cümleyi, Türkçe kelime ipucunu ve dört İngilizce seçeneği gösterir. Kaynak hikâyenin adı, başlık hedef kelimeyi ele vermesin diye yalnız cevap kontrol edildikten sonra görünür. Bu bir serbest dilbilgisi değerlendirmesi değildir: hedef, ipucuna karşılık gelen sözlük kelimesi/ifadesidir. “Kontrol et” sonrası özgün tam cümle ve doğru/yanlış geri bildirimi görünür; kullanıcı sonraki cümleye kendi geçer.

- Yayınlanmış içerikte editörün cümle-kelime bağlantıları kullanılır; paket içerikte mevcut `PhraseMatcher` sözlüğü kullanılır. Yarım kelime eşleşmez; uzun ifadeler önceliklidir ve özgün noktalama korunur.
- 12–240 karakter, en az dört token içeren cümleler seçilir. Hedefin ikinci kez görünerek cevabı ele verdiği cümleler, önceden boşluk işareti içeren metinler ve boş anlamlar dışarıda kalır.
- Seçenekler farklı İngilizce token dizilerine sahiptir; hedefle aynı Türkçe anlama sahip kayıtlar çeldirici olmaz. Üç ayrı çeldirici bulunamazsa soru kullanılmaz. Otomatik sözlük seçenekleri, dilbilgisel olarak başka hiçbir cevabın mümkün olmadığı iddiası taşımaz; Türkçe ipucu hedefi belirler.
- Oturum en fazla beş farklı kelimeden oluşur. Tekrar zamanı gelen/kaydedilen kelimeler, ardından kullanıcının seçtiği seviye önceliklidir. Uygun içerik yoksa mod devre dışı kalır; boş oturum başlatılmaz. Katalog taraması arka plandadır.

## İlerleme ve uyumluluk

Bu, mevcut çoktan seçmeli alıştırmanın yeni sunumudur. Yerel ekran anahtarı `cloze`, kalıcı oturum/bulut/Analytics türü mevcut **`choice`** değeridir. Yeni SQL, tablo, RPC, Analytics olayı veya sağlayıcı eklenmez. Bu yüzden Analytics raporunda çeviri seçme ile cümle soruları ayrı modlar olarak ayrıştırılmaz.

Doğru cevap başına mevcut 5 puan, tamamlanan oturum başına günlük hedefte bir adım uygulanır. Yalnız kaydedilmiş kelimeler için mevcut aralıklı tekrar işlemi çağrılır. Kontrol düğmesi tek başına tekrar kaydı yazmaz; sonraki cümle/sonuç düğmesi yanıtı bir kez işler. Yarım bırakılan alıştırma tamamlanmış oturum sayılmaz; önceki cümlelerin işlenmiş tekrar kayıtları mevcut alıştırmalarla aynı şekilde korunur.

Oturum başında cümle, kaynak revizyonu, hedef ve seçenek sırası dondurulur. `rememberSaveable` ile ekran yeniden oluşturulunca soru, seçili cevap ve geri bildirim aşaması korunur. Katalog değişikliği devam eden soruyu değiştirmez. Tamamlanma mevcut idempotent oturum yolu, aktif süre ve reklam çıkış kapısını kullanır; tekrar başlatma yeni oturum kimliği üretir. Hikâye metni ve cevap seçenekleri yeni bir Analytics/bulut payload alanına eklenmez.

## Doğrulama

JVM testleri token/ifade sınırlarını, noktalama korumasını, tekrar eden cevapların elenmesini, editör bağlantılarını, seçenek benzersizliğini, seviye/tekrar önceliğini ve yetersiz içeriği kapsar. Compose testleri başlıktan cevap sızıntısının engellenmesini, yanlış/doğru cevap, cevap zorunluluğu, durum kurtarma, fontScale 2.0, yarım bırakma, menüden beş soruluk oturum tamamlama/yeniden başlatma ve metni olmayan katalog akışını kapsar. İzole SQLite testi, mevcut `choice` RPC payload'ını ve tekrarlanan tamamlamada tek puan/günlük hedef kaydını doğrular.

Yerel kabul: API 36 ARM64 emülatöründe **22/22 cihaz testi**, **54/54 JVM testi** başarılı. Debug derleme/lint geçti: 0 hata / 30 yerel uyarı. CI bütün cihaz paketini ve mevcut üç Macrobenchmark senaryosunu ayrıca çalıştırır. Play yüklemesi yapılmadı.
