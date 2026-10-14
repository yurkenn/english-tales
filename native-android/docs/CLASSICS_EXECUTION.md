# 50 hikâyelik kütüphane — uygulama kaydı

14 Ekim 2026. Yetkilendirilmiş geliştirmede bağımlılıklar değişikliğin kapsamına göre incelenir; rutin harita için manuel onay kapısı yoktur.

## Hazırlanan içerik

- Paket **50 hikâye / 1002 EN/TR cümle çifti / 316 kelime**: altı mevcut özgün hikâye + 44 tanınmış klasik uyarlaması. Seviye dağılımı A1: 18, A2: 18, B1: 14.
- Önceki 18 hikâyelik pakete bu genişletmede 32 yeni hikâye / 626 cümle çifti / 192 kelime eklendi. İlk altı hikâye ve ilk 39 kelime kayıtları sabit hash regresyonlarıyla korunur.
- Yeni seçki: 12 Ezop fablı, 12 Grimm masalı, 8 Andersen masalı. Önceki dört Ezop, dört Grimm, iki Wilde ve iki O. Henry uyarlaması korunur.
- 42 klasik için gerçek tarihî baskı görseli; iki O. Henry için özgün geometrik kapak. Bazıları kitap içi çizim veya ortak koleksiyonun iç başlık sayfasıdır; bağımsız ilk baskı kapağı diye sunulmaz. Kaynaklar, çizerler, ölüm yılları, kaynak/PNG hash’leri [manifestte](../backend/content/classic-sources.json), açıklama ve hak değerlendirmesi [kaynak kaydında](PUBLIC_DOMAIN_CLASSICS.md).
- Bütün tarihî görseller kırpılmadan PNG’ye dönüştürüldü. Kaynakların tamamı temas sayfalarında incelendi; salt başlık yazısı içeren Grimm dosyaları gerçek hikâye çizimleriyle değiştirildi. `BookCover` tam görseli `Fit` ile gösterir. Yatay resimler boşluk bırakır; küçük kapaklarda bu boşluğu karartan dekoratif gradyan kullanılmaz.

## Bağımlılık ve kontrol kapsamı

`catalog/v1.json` → `LearningContent` → arama/kütüphane/okuyucu → kelime seçimi, sözlük, oyun çeldiricileri → `LearningStore` kuyruğu. Kapak anahtarları → `BookCover` drawable eşlemesi. `catalog:export` → idempotent taslak seed → medya hash manifesti → gerçek Storage yüklemesi ve publisher yayını. Uzak katalog yenilenince gömülü listeyi değiştirir; yalnız APK içeriğini büyütmek canlı yayını tamamlamaz.

Ortak sözlük token tabanlıdır: yeni 192 kelime eski altı metinde bulunmaz; önceki klasiklerde yeni eşlemeler oluşabilir. Bu nedenle daha önce sunucuya aktarılan ilk 12 taslağın görsel/açıklama ve kelime bağlantıları son paketten yeniden incelenmelidir. Kaynağı olmayan geçmiş kelime testi gerçek `discover` kelimesinin sonsuza kadar hikâyesiz kalacağı varsayımından çıkarılıp açık bir geçmiş kelime fixture’ına geçirildi. İşlevsel kuyruk davranışı değiştirilmedi.

## Doğrulama

- 53 backend testi: SQL yetki/işlem, panel istemci, hesap silme ve katalog regresyonları geçti.
- Panel HTTP entegrasyonu: gerçek dosya yükleme/indirme/hash, sürümlü kayıt/yayın, rol/sınır ve yeniden başlatma kalıcılığı geçti; yerel Auth fixture’ıdır, canlı yayın değildir.
- 23 JVM ve ayrı `English_Tales_Native` emülatöründe 126 Android testi geçti; başarısız/atlanmış test yok. Derleme ve lint geçti. Son küçük kapak gradyan düzeltmesinden sonra ilgili iki klasik UI testi ve lint yeniden geçti.
- Klasik UI akışları Türkçe Külkedisi, Mutlu Prens, Pamuk Prenses, Rapunzel, Karlar Kraliçesi ve Çirkin Ördek Yavrusu aramasını/doğru hikâye seçimini; çeviriyi, kelime kaydetmeyi, sabit sentence ID ile devam/tamamlanmayı doğrular.
- Depo kontrolü, altı ELF doğrulayıcı testi ve APK’daki iki native kütüphanenin hizalaması geçti.
- [Grimm araması](preview-classics-search.png), [Andersen araması](preview-classics-andersen-search.png), [okuyucu](preview-classics-reader.png): hesap gerektirmeyen fixture ekranları, canlı yayın kanıtı değildir.

## Sunucular ve yayın kapısı

Test (`jukyylozahikjhtokayw`) ve Production (`gtuangjukckpuerczfxd`) ortamlarına 32 yeni hikâye + 626 cümle **taslak** olarak aktarıldı. Her iki ortamda 50 hikâye kaydı ve altı canlı hikâye var; 44 klasik taslak. Production toplam 1002 cümle. Testte ayrıca önceden var olan ilave revision taslağı korunur.

Bu genişletme öncesi ve sonrası altı canlı revision’ın `md5(string_agg(current_revision_id::text,',' order by id))` özeti aynı: `65c1291cb82b2739304e9f76e3da7e4a`. Önceki çalışmanın farklı birleştirme biçimindeki MD5’i ile kıyaslanmaz. Yeni seed ilk 18 revision’ı değiştirmez.

İçerik paneli `http://127.0.0.1:4178` adresinde Production’a bağlı; bu çalışma sırasında giriş ekranında olduğu doğrulandı. Gerçek publisher oturumu yok. Yeni kapaklar henüz Storage’a yüklenmedi. Kimlik taklidi, parola/rol değişikliği veya RLS gevşetmesi yapılmadı.

Kalan işlemler:

1. Gerçek editör/yayıncı hesabıyla panel girişi.
2. İlk 12 klasik taslağını son paketin açıklama, kapak ve kelime bağlantılarıyla güncelle; 32 yeni taslağı da incele. Mevcut altı yayını değiştirme.
3. Manifestteki 45 farklı kapak yolunu incele; eksik gerçek PNG’leri yeni dosya olarak yükle, geri indirip hash kontrolü yap. Eski kapağı kullanan yayımlanmış içerik korunur.
4. Her klasiği incelenen `edit_version` ile gerçek publisher RPC’sinden yayımla.
5. Anonim API’de 50 yayın, gerçek görsel indirme, Android’de yeni içerikle ağ kapalı yeniden açma ve gerçek TTS dinlemesini doğrula.

**PR taslak kalır; 44 klasiğin canlı revision’ları ve dosyaları hazır olmadan yeni APK dağıtılmamalı veya ana dala birleştirilmemeli.** Uzak katalog gömülü listeyi değiştirir; yayımlanmamış kelimeler sunucuda kullanılabilir kaynak revision bulamaz. Gömülü 50 hikâyenin hazır olması canlıda 50 hikâyenin yayımlandığı anlamına gelmez.
