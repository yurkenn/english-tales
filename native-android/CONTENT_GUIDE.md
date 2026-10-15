# İçerik yönetimi

Android, ilk açılışta `app/src/main/assets/catalog/v1.json` içindeki çevrimdışı kataloğu okur. Supabase bağlantısı yapılandırılmışsa yayımlanmış uzak katalog yenilendiğinde aktif listeyi onunla değiştirir. Bu nedenle yalnızca APK kataloğunu genişletmek, canlı kullanıcılara yeni hikâyeleri sunmak için yeterli değildir.

## Güncel paket

50 hikâye, 1002 İngilizce/Türkçe cümle çifti ve 359 kelime/ifade (316 klasik paket + 37 kelime ve 6 ifade pilotu, 15 Ekim 2026). A1: 18, A2: 18, B1: 14 hikâye. Bunların 44'ü kaynakları kontrol edilmiş klasiklerin seviyeli kısa uyarlamalarıdır. Mevcut altı özgün hikâyenin kimlikleri, metinleri ve kelime eşlemeleri korundu.

[Klasiklerin kaynak ve uyarlama kaydı](docs/PUBLIC_DOMAIN_CLASSICS.md) · [Makine tarafından okunabilen kaynaklar](backend/content/classic-sources.json).

Bu sayılar paketin içeriğini belirtir. Canlı ortamın yayın durumu, anonim API üzerinden ayrıca doğrulanmalıdır; `catalog:export` yayın yapmaz.

## Yeni içerik hazırlama

1. Yazarın ve kullanılan çevirinin hak durumunu, kaynak metni ve kapak haklarını kontrol et. Kaynak bağlantısını ve kullanılan baskı/çevirmeni kaydet.
2. İngilizce/Türkçe cümleleri sabit kimliklerle hazırla; seviyeli uyarlamayı tam özgün metin gibi sunma. Yazar alanını gerçek yazara ayır.
3. Kalıcı yeni hikâye/cümle/kelime kimlikleri kullan. Eski metni veya yayımlanmış revision'ı üzerine yazarak düzeltme; düzeltmeler yeni revision gerektirir.
4. Kelime ve ifadeler panel, yayın kontrolü, exporter ve Android'de aynı kuralla eşleşir: büyük/küçük harf yok sayılır, harf/rakam dışı her karakter ayırıcıdır, yalnız bütün sözcükler eşleşir. “picked up” ifadesi “picked-up” ile, “lion” kelimesi “lion's” ile eşleşir; “cat” “category” ile eşleşmez. Çakışmada soldan sağa en uzun öğe kazanır. Ortak sözlük köke indirgeme yapmaz. Yeni kelimenin eski metinlerde bulunması eski hikâyelerin kelime çalışmalarını da değiştirebilir. Bu pakette yeni kelimeler eski altı metinde bulunmayan token'lardan seçildi. Yeni bir anlam mevcut kelime ID'sine yazılmamalıdır.
5. Kapak kaynağını PNG olarak `backend/content/covers/` altına ekle, `python3 ../tooling/build_app_images.py` ile uygulamanın WebP kopyasını üret ve `BookCover.kt` eşlemesine dahil et. PNG, Storage yüklemesi ve checksum için kaynak kalır. Görsel, 4096 px ve 6 MB indirme sınırlarına uymalı.
6. `backend` içinde `npm run catalog:export` çalıştır. Bu, sabit kimlikli **taslak** SQL ve kapak checksum/yükleme manifesti üretir; mevcut revision'ı değiştirmez, dosya yüklemez ve hikâye yayımlamaz.
7. `npm test`, `npm run test:admin`, Android derleme/lint ve ilgili emülatör akışlarını doğrula.

## Sunucuda yayın

[İçerik stüdyosu](backend/admin/README.md), gerçek editör/yayıncı hesabı ve mevcut RPC'ler kullanılır. Editör taslak düzenler; yayınlama publisher rolüne aittir.

1. Test ortamında yeni taslağı oluştur veya onaylı seed ile ilk revision'ı hazırla.
2. Cümleleri, çevirileri, kelimeleri ve kelime–cümle bağlantılarını incele.
3. Kapağı Storage API ile yeni bir UUID/hash yoluna `upsert=false` kullanarak yükle; geri indirip boyutunu ve SHA-256 özetini kontrol et. SQL ile `storage.objects` satırı eklemek dosya yüklemek değildir.
4. İncelenen `edit_version` ile `admin_publish` çağrısını gerçek publisher oturumundan yap. Yayın kontrolü eksik çeviri, bozuk sıra, geçersiz kelime bağlantısı ve yüklenmemiş kapağı reddeder.
5. Aynı paketi Production'da yayımla. Eski hikâyeleri ve yayımlanmış revision'ları koru; personel kimliği taklit etme veya RLS'yi kaldırma.
6. Anonim katalogda hikâyelerin görünmesini, yeni içeriğin indirilmesini ve kapak hash'lerini doğrula. Android'de arama, okuma/çeviri, kelime kaydetme, TTS, ilerleme ve ağ kapalı yeniden açmayı kontrol et.

Önceki yayımlanmış sürümler açık okuyucular/öğrenme geçmişi için korunur. Yeni paket uygulama güncellemesinin çevrimdışı başlangıç içeriğine de dahil edilir. Ses dosyası eklenmedi; İngilizce metin mevcut Android TTS ile okunur.

## Bilinen sınırlar

Türler şu an `Günlük yaşam`, `Macera`, `Gizem`; seviyeler A1/A2/B1. Yeni bir tür yalnız JSON'a yazılarak eklenemez; Android ve backend sözleşmeleri birlikte değişmelidir. Kitaplıktaki “Yeni hikâyeler” rafı aktif listenin son üç öğesini alır; gerçek yayın tarihine göre sıralama henüz yoktur.
