# English Tales içerik stüdyosu

## Yerel panel

`native-android/backend` klasöründe:

```powershell
npm ci --ignore-scripts --no-fund --no-audit
npm run admin
```

[Paneli aç](http://127.0.0.1:4178). Bu bilgisayarda Node 22.20 ile doğrulandı. Ek arayüz bağımlılığı veya derleme adımı yoktur.

Proje bağlantısı tanımlı değilse **yerel deneme** açılır. PostgreSQL verisi ve yüklenen dosyalar `backend/test-output/admin-demo/` altında kalır. Örnek yayıncı kimliği gerçek oturum açma değildir. Sunucu yalnızca 127.0.0.1 üzerinde dinler; bu mod dışarıya yayımlanamaz. Android veritabanını/kataloğunu değiştirmez.

## Kullanım

1. Hikâye seçin; yayınlanmışsa **Yeni taslak aç** ile yeni sürüm oluşturun.
2. Başlık, yazar, seviye, tür ve açıklamayı girin. Kapak/ses için yeni dosya seçin.
3. İngilizce/Türkçe cümleleri düzenleyin; ekleyin, silin veya sırasını değiştirin.
4. Kelimeleri, karşılıklarını ve geçtiği cümleleri hazırlayın. Cümleleri kutucuklarla seçin; kelime seçilen her İngilizce cümlede gerçekten geçmelidir.
5. Taslağı kaydedin; telefon önizlemesinde cümlelere dokunarak çeviriyi görün.
6. Yayın kontrolünde eksikleri tamamlayın, metni okuyarak kontrol ettiğinizi işaretleyin ve yayınlayın. Yayın işlemi tekrar ortam/sürüm özeti gösterir. Editör yayınlayamaz.
7. Yayındaki sürümün yayın kontrolü sayfasından arşivleyin veya arşivden çıkarın. Çevrimdışı indirilmiş kopyalar cihazlarda kalabilir.

Kaydetme atomiktir. Başka oturumun düzenlemesi varsa eski kayıt reddedilir ve mevcut form korunur. **Yedek indir** ile metni dışarı alabilir, güncel sürümü açıp yedeği yükleyebilirsiniz. Kimlik/düzenleme sayacı ve medya güncel sunucu kaydından korunur; yedek aktarımı yalnızca aynı proje ve sürüm için çalışır. Kaydedilmemiş metin tarayıcıda proje/hesap/sürüm bazında saklanır; yeniden açıldığında **Yedeği geri getir** teklif edilir. Çıkışta o hesabın tarayıcı yedekleri silinir. Token/parola bu yedeklere yazılmaz. Ortak bilgisayarda çıkış yapın; metin yedekleri şifrelenmiş değildir.

**İşlemler** sekmesi sunucunun kaydettiği taslak, yayın ve arşiv geçmişini gösterir. Eski işlemler 50'lik sayfalar halinde açılır. **Taslağı sil** yalnızca henüz yayınlanmamış ve güncel sürümü incelenmiş taslağı kaldırır; işlem geçmişi korunur. **Kullanılmayan dosyalar** hiçbir kayıtlı sürüme bağlanmayan medyayı listeler. Bu tarayıcının taslak/yedeklerinde seçili dosyalar gizlenir. Diğer editörler yüklemelerini kaydettikten sonra temizleyin. Yarım kalan silme yeniden tamamlanabilir; silme için ayrılmış dosya taslağa bağlanamaz.

## Supabase test projesine bağlama

Önce [backend kurulumunu](../README.md) tamamlayın: dört migration, taslak seed, özel Storage bucket ve gerçek Auth hesabına personel rolü. Tarayıcıda rol atanamaz. Bu bilgisayarda `yurken / English Tales` Frankfurt test projesi kuruldu ve `.env.admin` bağlandı.

`backend/.env.admin` oluşturun:

```dotenv
SUPABASE_URL=https://PROJE_KIMLIGI.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_GERCEK_ANAHTAR
```

Sunucuyu yeniden başlatın. Gerçek yayıncı/editör hesabının e-postası ve parolasıyla giriş yapın. URL ve publishable key tarayıcıya gider; yönetici/secret/service_role anahtarı kabul edilmez. Eski JWT biçimindeki anon anahtar yerine yeni publishable anahtar kullanılır. Oturum ve yenileme token'ı bellektedir; sayfa yeniden yüklenince tekrar giriş gerekir. Eşzamanlı istekler tek yenileme kullanır; çıkış sırasında başlayan yenileme oturumu geri açamaz. Yenileme/süresi dolmuş oturum davranışı kontrollü istemci testinde doğrulandı; gerçek servisle token süresinin dolması beklenmedi.

Dosyalar 6 MB ile sınırlıdır. Yeni UUID/hash yolu ve `upsert=false` kullanılır. Kapak tarayıcıda görsel olarak açılır, yükleme ardından gerçek dosya geri indirilerek SHA-256 ve boyut karşılaştırılır. Yükleme başarısız olursa dosya taslağa bağlanmaz; kayıt oluştuğu doğrulanmışsa otomatik temizlik denenir. Ağ/oturum nedeniyle temizlik yapılamazsa kullanılmayan dosyalar bölümünden tamamlanır. Backend bucket limiti 20 MB olsa da panel büyük ses dosyaları için devam edebilen yükleme sunmaz.

Panel bu bilgisayarda çalışır; internete dağıtılmadı. Gerçek Auth girişi, personel rolü, altı kapağın Storage yükleme/indirme/hash kontrolü, taslak kaydı ve altı hikâyenin yayını test projesinde doğrulandı. Android henüz bu uzak kataloğa bağlı değildir.

## Kontroller

```powershell
npm test
npm run test:admin
```

İlk komut 27 SQL erişim/veri testi ve 8 istemci/kurtarma testini çalıştırır. İkinci komut ayrı yerel süreçte gerçek dosya yükleme/indirme, kayıt, çakışma, yayın, yeni sürüm, arşiv, taslak silme/işlem geçmişi, dosya temizliği ve yeniden başlatma kalıcılığını sınar. `node --env-file=.env.admin tools/verify-hosted.mjs` gerçek projede anon erişim sınırlarını ve katalog durumunu kontrol eder. Deneme Auth fixture'ı bulut JWT doğrulamasını temsil etmez. Ayrıntılar [doğrulama kaydında](../VERIFICATION.md).
