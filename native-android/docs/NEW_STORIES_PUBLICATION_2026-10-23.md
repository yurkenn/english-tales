# 23 Ekim 2026 — 13 yeni hikâye yayında

Üretim kataloğu 50 → 63 hikâye oldu. 13 yeni B1 hikâye, 1.287 cümle, 65 anlama sorusu ve 11 destek dili yayınlandı. Önceki 50 hikâyenin tüm okuyucuya açık tablo satırları yayın öncesi yedekle aynı.

Kaynak: [Claude PR #172](https://github.com/yurkenn/english-tales/pull/172), commit ac2ef3ca7031aba41b8a9b713bbaee02fce06f96. Bu ilk yayın sırasında 14 mevcut hikâye uzatması uygulanmadı. PR #172 sonraki tamamlama turunda 1dd2422 ile birleştirildi; uzatmaların yayını ayrı tamamlama kaydında tutulur. Yayın sahibinin 23 Ekim sohbet talimatıyla yapıldı; ana dil incelemesi onayı iddia edilmez. Kaynak dosyaların reviewedBy/reviewedLanguages değerleri değiştirilmedi.

Yayıncı oturumu normal Auth yenilemesiyle kullanıldı; kimlik bilgileri dışarı alınmadı, rol veya erişim politikası değiştirilmedi. Her hikâye admin_create_draft → kapak yükleme → admin_save_draft → geri okuma karşılaştırması → admin_publish adımlarından geçti. Canlı sunucu kaydı, anonim okuyucu API'si, tüm çeviri/metin/soru/kelime/bağlantı/etiket değerleri ve 13 kapak SHA-256 değeri doğrulandı. Backend 196/196 test geçti. Cihaz üzerinde görsel kabul bu kaydın kapsamında değil.

| Hikâye | Cümle |
|---|---:|
| The Picture of Dorian Gray | 108 |
| The Financier | 92 |
| The Great Gatsby | 82 |
| The Hound of the Baskervilles | 98 |
| The Invisible Man | 88 |
| Jane Eyre | 109 |
| Little Women | 118 |
| Moby Dick | 86 |
| The Phantom of the Opera | 91 |
| Pride and Prejudice | 115 |
| Romeo and Juliet | 112 |
| A Scandal in Bohemia | 100 |
| The Woman in White | 88 |

[Makine okunabilir yayın kanıtı](release-evidence/2026-10-23-new-stories-publication.json). Yayın zamanı: 23 Ekim 2026, 12:53 Türkiye saati.

Geri dönüş: gerekirse yalnız kanıttaki 13 storyId, mevcut revisionId eşleşmesi doğrulanarak yayıncı panelinden arşivlenir. Eski 50 hikâyeye müdahale gerekmez. Yedek konumları kanıt JSON'unda; kullanıcı/öğrenme verisi içermez.
