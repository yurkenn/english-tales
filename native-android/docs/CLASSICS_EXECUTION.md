# Klasik hikâye paketi — uygulama kaydı

14 Ekim 2026. Kullanıcı 12 klasik ve seviyeli kısa uyarlama haritasını onayladı; bu çalışma için ek manuel harita kapısı yok.

## Hazırlanan içerik

- 12 yeni hikâye, 295 EN/TR cümle çifti, 85 yeni kelime ve 12 özgün geometrik kapak.
- Paket toplamı 18 hikâye / 376 cümle çifti / 124 kelime. Her seviyede altı hikâye.
- Eski altı hikâye, ilk 39 sözlük kaydı ve eski kelime eşlemeleri sabit regresyon kontrolleriyle korundu.
- Gerçek yazarlar ve kısa uyarlama/çeviri kredileri uygulama açıklamalarında var. Kaynak metin ve çevirmen kayıtları [kaynak belgesinde](PUBLIC_DOMAIN_CLASSICS.md).
- Kapak eşlemeleri ve taslak seed/medya manifesti güncellendi. Küçük kapaklarda bitişik başlık zaten bulunduğundan, görsel üzerindeki çok küçük ve kelimeyi bölen başlık kaldırıldı.
- `CONTENT_GUIDE.md` aktif uzak katalog davranışına göre düzeltildi. “Yeni” rafının tarih yerine liste sırasına dayanması mevcut sınırlama olarak kaydedildi.

## Gerçek kontrol sonuçları

- 53 backend testi geçti: 33 SQL, 8 panel istemci, 9 hesap silme, 3 katalog regresyon/içerik/kapak testi.
- Yerel HTTP panel testi geçti: dosya yükleme/geri indirme/hash, sürümlü kayıt/yayın, rol/sınır ve yeniden başlatma kalıcılığı.
- 23 JVM testi; debug uygulama/test APK derlemesi ve lint geçti.
- Ayrı `English_Tales_Native` emülatöründe 126 Android testi geçti, sıfır başarısız/atlanmış test. Son küçük kapak düzeltmesinden sonra ilgili iki klasik akış testi ve lint yeniden geçti.
- Yeni akış testleri: Türkçe “Külkedisi” ve “Mutlu Prens” araması, doğru hikâyeye geçiş, İngilizce cümleyi Türkçeye çevirme, hare kelimesini seçip kaydetme, yeni sabit sentence ID ile ikinci sayfadan devam, tamamlanma.
- Depo kontrolleri, altı ELF doğrulayıcı testi ve APK'daki iki 64-bit native kütüphanenin hizalaması geçti.
- [Arama görüntüsü](preview-classics-search.png) · [Okuyucu görüntüsü](preview-classics-reader.png). Bunlar hesapsız test fixture ekranlarıdır; canlı yayının kanıtı değildir.

## Sunucu durumu ve kalan iş

Test (`jukyylozahikjhtokayw`) ve Production (`gtuangjukckpuerczfxd`) ortamlarına onaylı idempotent seed ile 12 yeni **taslak** hikâye ve 295 yeni cümle aktarıldı. Mevcut altı yayının revision kimlik özeti değişmedi: `ccbdb737f8ad7b512e7437bc7f5d1ef9`. Test ortamında ayrıca önceden var olan bir taslak korunuyor.

Production anonim HTTP kontrolü hâlâ **6 yayımlanmış hikâye** görüyor. Taslaklar kamuya açılmadı. Yönetici ve öğrenme uçları anonim isteği, katalog ise sahte tokenı reddetti.

Mevcut panel `http://127.0.0.1:4178` adresinde Production'a bağlı ve gerçek publisher girişi bekliyor. Kimlik/rol taklidi, parola değiştirme, RLS gevşetme veya SQL ile sahte Storage dosyası oluşturma yapılmadı. Kapak dosyaları sunucuya henüz yüklenmedi; yalnız metadata/yerel manifest hazır. Kullanıcı mevcut yayıncı hesabıyla giriş yaptıktan sonra 12 gerçek PNG yüklenmeli, geri indirilen hash'leri kontrol edilmeli ve `admin_publish` çağrıları incelenen sürümlerle tamamlanmalı.

Canlı yayın sonrası anonim katalogda 18 hikâye, gerçek kapak indirmeleri ve Android'de yeni içeriğin ağ kapalı yeniden açılması doğrulanmalı. Bu pakette yeni metinlerle gerçek TTS dinleme kabulü henüz yapılmadı; mevcut TTS kodu değişmedi.

**Yayın kapısı:** Klasiklerin canlı revision'ları yayımlanmadan yeni APK kullanıcılara dağıtılmamalı ve PR ana dala birleştirilmemeli. Uzak katalog gömülü listeyi değiştirir; yayımlanmamış yeni yerel kelimelerin sunucu kaynak revision'ı henüz kullanılamaz. Bu yüzden paketin kod ve testleri hazır olsa da canlı yayına hazır olduğu iddia edilmez.
