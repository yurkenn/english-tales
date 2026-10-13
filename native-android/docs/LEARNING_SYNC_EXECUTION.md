# Hesap eşitlemesi: uygulama bağlantısı

## 11 Ekim 2026 analizi ve uygulanan değişiklikler

HTTP isteği artık yerel işlem sırasını bekletmez. Ağ işi ayrı Room bağlantısıyla çalışır; bağlantı yavaşken tercihler kaydedilebilir. Foreground ve WorkManager işleri kullanıcı kimliği başına tek kilitle eşgüdümlenir. Hesap değişimi, çıkış ve misafir aktarımı geç yanıtın uygulanmasını nesil kontrolüyle engeller.

- İlk hesap kopyası yerel temel belirlenmeden önce alınır. Özgün olaylar aynı UUID ve gövdeyle yeniden teslim edilebilir; sonrasında tam kopya atomik uygulanır.
- Profil tercihleri sunucudaki sürümle karşılaştırılarak yazılır. 40001 çakışması kalıcı gösterilir; kullanıcı cihazdaki veya hesaptaki tercihleri seçer. İstek sırasında yeni düzenleme, önceki isteğin onayıyla temizlenmez.
- WorkManager ağ bağlantısı varken çalışır. Tek seferlik ve 15 dakikalık periyodik işler kullanıcıya bağlıdır; artan yeniden deneme kullanılır. Çıkışta o kullanıcının işleri iptal edilir. Android zorla durdurma ve pil kısıtları çalışmayı erteleyebilir; zorla durdurmadan sonra uygulama tekrar açılmalıdır.
- Yerel profil güncellemeleri yalnızca ilgili alanları değiştirir; okuma ipucu veya son hikâye alanlarını ezmez.
- Hesap ekranı son alınan kopyayı, bekleyen/bloke olayları ve tercih çakışması seçeneklerini gösterir. Kanıtı olmayan eski puanlar bu cihazda korunur.

## Doğrulama

96 cihaz testi, 11 birim testi, debug/release Lint ve küçültülmüş imzalı APK/AAB derlemeleri geçti. Cihaz testleri 16 KiB x86_64 emülatörde çalıştırıldı. Yeni senaryolar: geciken HTTP sırasında yerel kaydetme, tercih sürümü/onayı, istek sırasında yeni düzenleme, iki yönde çakışma çözümü ve hesap kapsamlı ağ koşullu WorkManager işleri.

Gerçek Google oturumunun bulunduğu emülatör önce şifre çözmeden yedeklendi; uygulama kaldırılmadan güncellendi. Test hizmetine 2 oturum, 10 kelime olayı ve 2 ilerleme olayı ulaştı. Yerel kuyrukta 14 teslim edilmiş olay, 0 kirli tercih ve 0 tercih çakışması var. Tercih sürümü 2; yerel 70 puan korunuyor. Bu kanıt mevcut cihazdaki gerçek gönderim/alımı kapsar; ikinci cihaz ve mağaza imzası testinin yerine geçmez.

APK SHA256: 505ecbfd152a22623f11854e9b9a3a1412aa0747df78b8f7ee6e95b7356ddfc5.
AAB SHA256: c62e2f84deb7f0caa9935fd704e5bddbe796603b22d95587a8dd64975783b9b6.
Yükleme sertifikası, AAB imzası ve statik 16 KiB ZIP/ELF hizalaması doğrulandı. Paket hâlâ test hizmetine bağlı teknik adaydır.

## Açık kabul kapıları

1. Gerçek hesapla yeniden açılış sonrası aynı durumun korunması ve ikinci cihaz okuması.
2. Bilinmeyen/arşivlenmiş kelime kaynaklarının içerik çözümü.
3. Gerçek düşük sürüm/ARM64 cihaz, Play güncelleme ve mağaza imzalı Google girişi.
4. Üretim kimlik doğrulama, içerik ve panel dağıtımının tamamlanması; bu projeye bağlı yeni adayın tekrar doğrulanması.
