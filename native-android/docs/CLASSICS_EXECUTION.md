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

## Canlı yayın — 14 Ekim 2026

Production (`gtuangjukckpuerczfxd`) ortamında gerçek yayıncı hesabıyla içerik panelinden 44 klasik yayımlandı. Her taslak son katalog paketinin açıklama, EN/TR cümleleri, kelimeleri ve bağlantılarıyla kaydedildi. Kapaklar yeni UUID/hash yollarına `upsert=false` ile yüklendi, geri indirilerek boyut/SHA-256 doğrulandı ve incelenen `edit_version` üzerinden `admin_publish` çalıştırıldı.

- Production: **50 canlı hikâye, 0 taslak, 0 eksik kapak**.
- Anonim API kontrolü: 50 canlı hikâye, 1002 EN/TR cümle çifti; 44 klasiğin metadata, kelime ve cümle bağlantıları gömülü katalogla aynı. 50 kapağın tamamı gerçek Storage üzerinden indirilip hash doğrulandı.
- Mevcut altı hikâyenin revision özeti değişmedi: `65c1291cb82b2739304e9f76e3da7e4a`.
- Yeniden çalıştırılabilir kontrol: panel çalışırken `node tools/verify-classic-publication.mjs`; yalnız anonim/publishable erişim kullanır. Sonuç: `backend/test-output/classic-publication-verification.json`.
- Android canlı kontrolü geçti: Production’dan 50 metadata / 44 klasik yüklendi; Külkedisi ve Karlar Kraliçesi metin/kelime/kapakları indirildi, HTTP istemcisi olmayan yeni repository ile yeniden açıldı. [Canlı katalogdan gelen Külkedisi araması](preview-live-classics-search.png). Geçici doğrulama harness’i test sonrasında kaldırıldı.
- Test ortamı (`jukyylozahikjhtokayw`) bu yayın çalışmasında değiştirilmedi; önceki taslaklar korunur.
- Yayıncı rolü, parola veya RLS değiştirilmedi. Yayın geçmişi gerçek oturumun hesabına bağlıdır.

Önceki “44 klasik taslak” yayın engeli Production için giderildi. PR birleştirme ve mağaza dağıtımı ayrıca yapılmadı. Gerçek cihaz TTS dinlemesi bu çalışma kapsamında yeniden doğrulanmadı.

## İçerik panelinde hatırlanan oturum

İsteğe bağlı “Bu bilgisayarda oturumu açık tut” seçeneği eklendi. Parola ve erişim token'ı kalıcı kayda yazılmaz; yalnız proje bazında yenileme token'ı saklanır. Yenilemede dönen yeni token kaydı günceller. Çıkış veya geçersiz/iptal edilmiş oturum kaydı temizler; geçici ağ hatası kaydı silmez. Yeni özellik için bir kez bu seçenekle giriş yapılması gerekir.

Dört ek otomatik oturum testiyle backend toplam **57/57** geçti: yenileme ve rotasyon, geçersiz oturum, eşzamanlı çıkış ve ağ hatasında tekrar deneme.
