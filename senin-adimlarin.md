# English Tales — hesap ve yayın adımları

16 Ekim 2026, Türkiye saati. Bu kayıt gerçek CLI, Play Console ve canlı servis kontrollerini ayırır.

## 1. Yayın otomasyonu — zorunlu kurulum tamamlandı

- [x] GitHub `release` ortamı oluşturuldu; `yurkenn` required reviewer, izin verilen dal yalnız `master`.
- [x] Mevcut Play yükleme anahtarının SHA-1 değeri doğrulandı: `EF:07:C9:73:55:FD:F7:63:14:C7:AA:94:6E:FC:A4:44:D7:2D:48:30`.
- [x] Beş zorunlu ortam secret'ı kaydedildi: `ANDROID_UPLOAD_KEYSTORE_BASE64`, `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD`, `GOOGLE_SERVICES_JSON_BASE64`. Özel değerler kaynaklara veya rapora eklenmedi.
- [x] İlk yüklemesiz [GitHub çalışması](https://github.com/yurkenn/english-tales/actions/runs/38959199613) başarılı: **49 / 2.1.0**, commit `0c7ac02c0551ed3b0edf9297bfdfdd1cf872a9f9`. İmzalı APK/AAB, Crashlytics mapping yükleme görevi ve statik paket doğrulaması geçti.
- [ ] İsteğe bağlı `PLAY_SERVICE_ACCOUNT_JSON` ve otomatik dahili kanal yüklemesi kurulmadı. Kullanıcı amacı hakkında açıklama istedi; kurulum tercihi henüz verilmedi. Bu çalışma Play'e APK/AAB yüklemedi.

APK **9.307.385 bayt**, AAB **13.387.779 bayt**. APK SHA-256 `6edd637535ad6d99746720918842ca451b668b05116dd0a6970bd536bdfae07c`; AAB SHA-256 `ad787b1a715462a9fe9fb63e1bb4b4c0ce4fbe80327793b599a6f07dbe5e8e39`. [Rapor](native-android/docs/release-evidence/2026-10-16-ci-49.json), [kurulum ve kullanım](native-android/docs/RELEASE_AUTOMATION.md).

## 2. Play Data safety — incelemeye gönderildi

- [x] Crash logs ve Diagnostics: toplanıyor, paylaşılmıyor, geçici işlenmiyor, zorunlu; amaç App functionality. Eski formdaki geçici işleme seçimi düzeltildi.
- [x] App interactions: toplanıyor, paylaşılmıyor, geçici işlenmiyor, isteğe bağlı; amaç Analytics.
- [x] Approximate location: Analytics'in bağlantıdan türettiği yaklaşık bölge verisi için aynı isteğe bağlı Analytics beyanı eklendi. [Google SDK açıklaması](https://support.google.com/analytics/answer/11582702?hl=en).
- [x] Device or other IDs, hesap bilgileri ve Other user-generated content beyanları korundu. Öğrenme kayıtları, favoriler, kişisel kelimeler ve bilinen kelime geçmişi hesapla saklanır; Analytics'e içerik/cevap gönderilmez.
- [x] Tek Data safety değişikliği kaydedildi ve Google incelemesine gönderildi. Console **Changes in review** gösterdi; hızlı kontroller sürüyordu.
- [ ] Google inceleme onayı ve mağazadaki yeni beyanın görünürlüğü bekleniyor.

Gizlilik URL'si [englishtales-app.web.app/privacy](https://englishtales-app.web.app/privacy). Eski “Firebase Analytics kullanılmaz” ifadesi düzeltildi, yeni eşitlemeler açıklandı. Canlı kaynak eşleşmesi doğrulandı: SHA-256 `7e476c602964e1b77d558a997cb7806e594ecf2002d7c4dd275f31161c89c9ae`. Analytics canlı olay kabulü ve GA ayarları bu beyan çalışmasıyla tamamlanmış sayılmaz.

## 3. Supabase migration'ları — altısı canlıda

Kullanıcının bu sohbette verdiği açık onaydan sonra üretim projesi `gtuangjukckpuerczfxd` güncellendi. Kaynak commit yukarıdakiyle aynı. MCP'nin ürettiği geçmiş numaraları yerel dosya numaralarından farklıdır; tekrar uygulamak yerine isim ve bu eşlemeyi kontrol et.

| Kaynak dosya sürümü | Migration | Canlı geçmiş sürümü |
|---|---|---|
| 20261016090000 | translation_tables | 20261016200645 |
| 20261016100000 | story_questions | 20261016200653 |
| 20261016110000 | story_tags | 20261016200655 |
| 20261016120000 | story_favorites | 20261016120000 |
| 20261016130000 | personal_words | 20261016200723 |
| 20261016140000 | known_words | 20261016200746 |

Favoriler uygulamasında MCP'nin saniye bazlı geçmiş sürümü önceki migration ile çakıştı. SQL dosyasındaki `COMMIT` nedeniyle favori şeması oluşmuştu. Tablo, RPC ve iki policy doğrulandı; SQL tekrar çalıştırılmadan kaynak SQL ile eksik geçmiş kaydı eklendi. Son iki uygulamada dış `BEGIN/COMMIT` çıkarılarak MCP transaction'ı kullanıldı. Altı kayıt da canlı geçmişten tekrar okundu.

Doğrulama:

- Backend **144/144** test geçti; bütün migration'lar ve kullanıcılar arası erişim sözleşmeleri yerel PGlite testlerinde denetlendi.
- Uygulama öncesi yayın yedeği: **50 hikâye, 1.002 cümle, 50 medya**. Ayrı yerel PGlite geri yüklemesinde altı temel tablo ve medya SHA-256 değerleri eşleşti.
- Önceki RPC tanımları ve öncesi/sonrası bütünlük raporları çalışma kopyasının ignored `native-android/build/release-setup/` dizinine kaydedildi. Yayın yedeği `native-android/build/content-backups/2026-10-16T20-05-55.843Z/` altında. Bu yedek Auth/öğrenme/taslak verilerinin tam felaket kurtarma yedeği değildir.
- `story_revisions` 50, `story_sentences` 1.002, `revision_words` 622, `word_events` 4 ve `user_word_state` 4: hem satır sayıları hem sıralı satır içerik özetleri öncesi/sonrası aynı.
- Türkçe çeviri backfill'i: 1.002 cümle, 622 kelime, 50 açıklama; 5 etiket ve 92 revision–etiket bağlantısı.
- Yeni **13 tabloda RLS açık** ve policy var. Kişisel tabloları `anon` okuyamaz. `apply_favorite_event`, `apply_lemma_event`, `apply_word_event`, `admin_tags` ve snapshot için anonim EXECUTE kapalı. Kullanıcı kimliği olmayan authenticated oturumda kişisel kayıtlar görünmüyor; üç yazma RPC'si ve snapshot çağrısı reddediliyor (rollback edilen canlı kontrol, test hesabı oluşturulmadı).
- Advisor'da yeni RLS eksikliği yok. Authenticated SECURITY DEFINER uyarısı 19 → 22: yeni `admin_tags`, `apply_favorite_event`, `apply_lemma_event` kasıtlı RPC'lerdir; staff/kullanıcı kontrolü ve boş search_path vardır. [Advisor açıklaması](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Önceden var olan private tablo policy bilgi kayıtları ve [leaked password protection uyarısı](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) değişmedi.

## 4. App Links alan adı — web ilişkilendirmesi hazır

- [x] Kullanıcı `englishtales-app.web.app` seçti.
- [x] [assetlinks.json](https://englishtales-app.web.app/.well-known/assetlinks.json) Play Console'un **app signing** SHA-256 sertifikasıyla yayımlandı; upload/debug anahtarı kullanılmadı.
- [x] HTTPS doğrudan HTTP 200, `application/json`, kaynak baytları aynı. Google Digital Asset Links kontrolü **linked: true** döndürdü.

Uygulama: `com.yurken.englishtales`; SHA-256 `13:EF:59:10:FD:56:B0:A4:3F:5D:65:78:D2:CC:90:27:1F:E0:87:C2:A0:BA:A6:CC:06:A0:B5:F1:05:6A:3B:A8`. Web dosyası SHA-256 `83893eac84a07fc7f664021a444a6e6529d0847c344fa4ec592b6354b3fe1bf7`.

Planlanan paylaşım adresi `https://englishtales-app.web.app/story/{id}`. Android manifest intent-filter, gelen bağlantıyı hikâyeye yönlendirme ve uygulama kurulu değilken web karşılığı bu çalışmada eklenmedi; uçtan uca paylaşım tamamlandı sayılmaz. [Android ilişkilendirme belgesi](https://developer.android.com/training/app-links/configure-assetlinks).

## 5. TalkBack — kullanıcı testi sorunsuz, paket sürümü bekleniyor

- [x] 16 Ekim 2026: kullanıcı telefonda TalkBack ile açılış → kitaplık → hikâye → okuma → kelime kaydetme → alıştırma yolunu denediğini ve sorun görmediğini bildirdi. Kaynak: bu sohbetteki “Denedim, sorun yok” yanıtı.
- [ ] Denenen paket sürümü/commit henüz belirtilmedi. Yeni erişilebilirlik değişikliklerini içeren 49 adayı veya güncel geliştirme APK’sıyla yapıldığı doğrulanınca **Q3 kapısı kapatılabilir**; mağazadaki 48 için sonuç tek başına yeterli değildir. Cihaz/Android/TalkBack sürümü kaydedilmedi; bağımsız test kaydı varmış gibi sunulmaz.

## Play sürümü

16 Ekim canlı Console kontrolü: **48 / 2.0.0**, “Available on Google Play Production”, dağıtım **%100**, yayın tarihi 15 Ekim. **49 / 2.1.0 yalnız CI'da doğrulanmış adaydır; Play'e yüklenmedi.** Data safety incelemesi uygulama sürümü yayınıyla karıştırılmamalıdır.
