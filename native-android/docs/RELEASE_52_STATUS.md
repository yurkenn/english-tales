# 52 / 2.3.1 — eşitleme devri düzeltmesi

24 Ekim 2026. Uygulama kaynak commit'i: `36b1015`.

Üretim hâlâ 50 / 2.2.0. [51 / 2.3.0](RELEASE_51_STATUS.md) yalnız dahili testte yayımlandı; sonraki bağımsız incelemede bulunan dar eşitleme sorunu nedeniyle üretime gönderilmedi. 52 adayı bu sorunu düzeltir. Fiziksel Play güncelleme, runtime ölçüm ve editör kabulü ayrıca açık.

## Sorun ve düzeltme

A'nın eşitleme isteği ağda beklerken kullanıcı çıkar ve B'ye girer. B'nin sandık isteği eşitlemeyi kuyruğa alır; B'nin normal iki saniyelik zamanlayıcısı da A'yı bekler. A tamamlandığında eski kod yalnız aynı owner kapsamına tekrar deneme planlıyordu. B'nin isteği tüketiliyor, sandık başka bir öğrenme yazımı/yeniden açma işlemine kadar eşitlemede kalabiliyordu. Hesaplar arasında veri görünmesi veya misafir puanı üretme bulgusu değildir.

Kesilen eşitlemenin `finally` dalı artık güncel owner kapsamını alıp o kapsama damgalı bir actor işlemi gönderir. Zamanlayıcı ve yeni eşitleme güncel hesabın kendi store'unu kullanır; kapsam yeniden değişirse eski actor işlemi düşer. Mevcut needsSignIn, disposed ve switching korumaları devam eder.

## Kanıt

`AccountSwitchTest.newAccountChestSyncSurvivesThePreviousAccountsSlowRun`, gerçek ViewModel ve izole yerel hesaplarla A'nın HTTP yanıtını bekletir, B'nin isteğini kuyruğa alır ve A'yı bırakır. Üretim düzeltmesinden önce **1 test / 1 başarısızlık**: B'nin eşitlemesi başlamadı. Düzeltmeden sonra `AccountSwitchTest` ve `LeagueAccountIsolationTest` birlikte **32/32**, **0 hata/atlama**. Canlı hesaba kayıt/puan yazılmaz.

Claude Code, sınırlı salt okunur ikinci incelemede bu düzeltmenin ürettiği somut P1/P2 bulmadı; güncel owner'a devir, eski yanıt koruması ve aynı owner için eşitleme bileti davranışını ayrıca değerlendirdi. Bu AI incelemesi fiziksel telefon veya ana dil onayı yerine geçmez.

## Paket ve yayın

52 / 2.3.1 imzalı derleme, mapping yüklemesi ve paket doğrulaması başarılı. Release JVM testleri 142/142, 0 hata/atlama; lint 0 hata / 105 uyarı. APK 14.040.073 bayt, AAB 17.958.509 bayt. Üretim servis bağı, yükleme sertifikası, baseline profile ve ZIP/ELF 16 KB kontrolleri geçti.

- APK SHA-256: `b54ea619a2c9719e14084beff2f695760f7a4c66d45fc290035a01b260749d32`
- AAB SHA-256: `22d9a9e5940f3095a7f17e489065a444b88e678735a2c838e4c8ae183af9d8ec`
- Paketin mapping kimliği: `b8d9f301d9174a34afa522fd07f9e4d7`; AAB içindeki mapping korunmuş kopyayla aynı ve bu derlemede Crashlytics'e yüklendi.

[Tam kaynak CI](https://github.com/yurkenn/english-tales/actions/runs/40045086635) başarılı: **377 uygulama cihaz testi + 3 açılış + 3 servis testi**, XML sonuçlarında **0 hata/atlama**. Yeni regresyon CI XML'inde ayrıca bulundu ve geçti; backend **212**, JVM **142** geçti. 52 AAB Play tarafından kabul edildi; önizlemede 16 KB desteği, %94 R8 optimizasyonu, mapping eki ve cihaz kaybı 0 doğrulandı. Tek uyarı önceki adayla aynı üçüncü taraf native sembol önerisi. 13 dilde notlar hazır.

**Son UI adımı bekliyor:** Mac kilitlendiği için 52'nin dahili yayın onayı tamamlanamadı. Ekran kilidini açması kullanıcıdan istendi; kilit aşılmadı. Dahili kanalda henüz 51 sunuluyor, üretim 50. [Makine okunabilir kayıt](release-evidence/2026-10-24-release-52-status.json). 51, Play'de kullanılmış bir sürüm kodudur; farklı pakette tekrar kullanılamaz. Son paket hash'leri, kaynak ve Play kanalı doğrulandıktan sonra bu kayda eklenir.

## Üretim öncesi kalan işler

[51 kaydındaki açık kabul işleri](RELEASE_51_STATUS.md) devam eder: Play üzerinden güncelleme/veri koruma, Play imzalı Google giriş ve iki cihaz eşitlemesi, çevrimdışı dil/yeni hikâye, TalkBack/büyük yazı/uzun hikâye performansı, runtime Crashlytics/izinli Analytics ve editör örneklemleri. Paket/canlı eşitliği ve seçili çalışma kelimeleri hedefi geçilmiş sayılmaz. Veri güvenliğinin hesap kullanımına ilişkin isteğe bağlı alanları düzeltildi; yalnız bu beyan Google incelemesine gönderildi.

Yerel kanıtlar `native-android/build/release-52-readiness/` altında. Mağazaya giden imzalı dosyalar, mapping ve özel yapılandırma depoya eklenmez.
