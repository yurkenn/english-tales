# Beş mevcut hikâye — editoryal ve dil tutarlılığı incelemesi

19 Ekim 2026 · Codex tarafından **AI destekli inceleme ve düzeltmeler tamamlandı**. Bu kayıt insan editör, ana dil konuşuru veya bağımsız CEFR onayı değildir. `reviewedBy: null` ve `reviewedLanguages: []` korundu. Canlı yayın yapılmadı.

İnceleme; beş hikâyenin İngilizce anlatısını, Türkçe karşılığını, 10 ek dildeki cümle/açıklama/çalışma kelimesi alanlarını ve 17 anlama sorusunun doğru yanıtı ile kaynak cümlelerini kapsadı. Kontrol edilen konular: olay sırası, eşyanın/karakterin takibi, çeviride eklenen veya kaybolan anlam, kişi/yer adları, yerel dilbilgisel cinsiyet, kelimenin cümledeki isim/fiil kullanımı ve hedef seviyedeki okuma yükü.

Claude masaüstü uygulaması bulundu; Mac kilitli olduğu için erişilemedi. Claude veya bağımsız ikinci model incelemesi yapılmış sayılmıyor.

## Bulunan ve düzeltilen sorunlar

| Hikâye | Bulgu | Düzeltme |
|---|---|---|
| A Quiet Morning | `gave him a smile` içindeki isim, Türkçe çalışma kartında `gülümsemek` fiiliyle veriliyordu. Bazı diğer dillerin kartları da isim/fiil karışımıydı. | `pilot-quiet-morning-smile-noun` kimliğiyle `gülümseme` ve 10 ek dilde isim karşılıkları oluşturuldu. Eski global `smile` kaydı değiştirilmedi. Çalışma listesi hâlâ 10 kelime. |
| A Quiet Morning | Eklenen çıkarım sorusu geçmiş zamanlı anlatıya göre gereksiz bir zaman değişikliği içeriyordu. | `Why did Mia buy a second roll?` ve geçmiş zamanlı seçenekler kullanıldı; doğru yanıt B olarak kaldı. |
| The Paper Boat | Tekne nehre taşındıktan sonra suya nasıl bırakıldığı anlatılmadan rüzgârla hareket ediyordu. | Leo’nun alçak bir basamaktan tekneyi suya bıraktığı kısa cümle, çocukların kenardan uzak durduğu cümleden önce eklendi. 11 dilde karşılığı yazıldı. |
| The Last Train | Sam fotoğraf makinesi ve bileti banka bırakıyordu; devamında yalnız biletin akıbeti açıklanıyordu. | Makinesini alıp bileti orada unuttuğu kısa cümle eklendi. Eski hatırlama cümlesiyle çelişmiyor. 11 dilde karşılığı yazıldı. |
| The Last Train | Üç ek Urduca cümlede Sam adı, eski metindeki `سام` yerine `سیم` olarak yazılmıştı. | Üçü de `سام` olarak düzeltildi. |
| The Tortoise and the Hare | Eklenen yanlış seçeneklerden biri A1 hedefi için gereksiz present perfect yapısı kullanıyordu. | `He is already at the finish.` olarak kısaltıldı; yanıt anahtarı değişmedi. |
| The Lion and the Mouse | Eski Urduca metinde dişi olan fare, yedi ek cümlede eril biçimlere dönüyordu. | Bu yedi cümlede `چوہیا` ve dişil fiil/sıfat biçimleri tutarlı hale getirildi. |
| The Lion and the Mouse | Çıkarım sorusunun doğru seçeneği `even though` yan cümlesi içeriyordu. | `She is small, but she can help him.` olarak sadeleştirildi; doğru yanıt B olarak kaldı. |

`smile` isim kullanımı [Cambridge Dictionary](https://dictionary.cambridge.org/us/dictionary/english/smile) ile kontrol edildi. Sözlük tanımı veya örneği kopyalanmadı; kartın örneği mevcut taslakta korundu.

## Hikâye bazında değerlendirme

| Hikâye | Sözcük / cümle | Anlatı ve soru sonucu | Seviye değerlendirmesi |
|---|---|---|---|
| A Quiet Morning | 164 / 23 | Tanışma → doğum günü → ikram → kızının gelişi tamamlanıyor. Üç yanıtın da metin desteği var. | A1 destekli okuma hedefi; eski metindeki `filled`, `stood`, `rolls`, `act of kindness` ve geçmiş zaman öğrenci denemesinde izlenmeli. |
| The Paper Boat | 229 / 26 | Suya bırakma ve sudan geri alma artık açık. Kız kardeş ile sonradan gelen kız ayrı kişiler; üç çocuk sayısı tutarlı. Dört sorunun tek savunulabilir yanıtı var. | A2 hedefi; `folded`, `shallow`, `riverbank` ve `yours` bağlamla destekleniyor. |
| The Last Train | 263 / 28 | Makine ve bilet ayrı izlenebiliyor; taş, bekleme yeri ve ertesi sabah tren ayrıntıları neden-sonuç kuruyor. Dört soru metinle uyumlu. | A2 hedefi; eski `was due`, `remembered putting` ve `would not ... until` yapıları destekli okuma/pilot kontrolü gerektirir. |
| The Tortoise and the Hare | 192 / 27 | Başlangıç/bitiş, tavşanın kararının nedeni ve kaplumbağanın kazandığı açık. Üç soru metinle uyumlu. | A1 destekli okuma hedefi; `hare`, `tortoise`, `steady` düşük sıklıklı masal sözcükleridir. Bunlar çalışma listesinde. |
| The Lion and the Mouse | 176 / 26 | Önceki iyilik ve sonradan gelen yardım olaylarla bağlanıyor. Üç soru metinle uyumlu. | A1 destekli okuma hedefi; `paw`, `ropes`, `sharp` çalışma listesinde, `hunters` ve `roars` bağlam desteğiyle pilotta izlenmeli. |

A1 metinleri en çok 12, A2 metinleri en çok 18 İngilizce sözcüklü cümlelerden oluşuyor. Bu yerel uzunluk kuralı CEFR sertifikası değildir. [Avrupa Konseyi okuma tanımlayıcıları](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors-search) kısa, basit metinleri ve tanıdık ifadeleri vurgular; yalnız cümle sayısı veya uzunluğu yeterli bir seviye ölçüsü sayılmadı. Hedef seviyeler değiştirilmedi.

## Dillerin kapsamı ve kalan belirsizlik

Türkçe, Latin Amerika İspanyolcası, Brezilya Portekizcesi, Endonezce, Arapça, Vietnamca, Hintçe, Rusça, Bengalce, Urduca ve Tayca alanlarında AI destekli kaynak/çeviri tutarlılığı taraması yapıldı. Doğrudan düzeltme Türkçe `smile` kartında, ona bağlı diğer dil karşılıklarında, yeni iki cümlenin tüm çevirilerinde ve Urduca kişi adı/cinsiyet devamlılığında yapıldı.

Dilbilgisel cinsiyetin diller arasında doğal olarak değişmesi tek başına hata sayılmadı: örneğin Portekizce `a lebre` dişildir; Hintçe `चूहा` erildir. Aynı hedef dil içinde karakterin biçimlerinin tutarlı kalmasına bakıldı. Eski Urduca dişi fare ile eklenen eril fare arasındaki geçiş bu nedenle düzeltildi.

Eski paket cümleleri ve çeviri haritaları birebir korundu. İnceleme, eski kaynak metninin tamamını yeniden yazma veya bütün eski çeviri tercihlerinin kusursuz olduğu iddiası değildir. Örneğin The Last Train’in eski Rusça açılışında `afternoon` daha genel `день` ile karşılanıyor; bu düşük önem dereceli nüans insan dil incelemesi için kaydedildi. Özellikle saygı hitapları ve yerel deyimlerin doğallığı ana dil konuşuru kabulü olmadan kesinleştirilmedi.

## Doğrulama ve korunan sınırlar

- Tam backend paketi: **165/165 geçti**, hata ve atlama yok. Kaynak özetleri, eski cümlelerin birebir korunması, kelime kimlikleri, 11 gerçek dil alanı, soru kaynakları ve üretim çıktı engeli denetlendi.
- Güncellenen Quiet Morning test varlığıyla API 36 emülatöründe **3/3 Android entegrasyon testi geçti**. Test paketi yeniden derlendi; bu bir fiziksel cihaz, tam arayüz yolculuğu veya gerçek hesap eşitleme kabulü değildir.
- `--require-reviewed` mevcut taslakları hâlâ reddeder. AI inceleme kaydı bu engeli kaldırmaz ve insan onayı üretmez.
- Aktif paket kataloğu, uygulama runtime kaynağı ve canlı içerik değiştirilmedi. İki bekleyen yeni klasik taslağına dokunulmadı.
- Güncel toplam: **62 yeni cümle / 620 ek dil çevirisi**, **14 yeni çalışma kelimesi / 140 ek dil karşılığı**, 50 seçili çalışma kartı ve 17 soru. Eski global `smile` anlamı ve öğrenme kimliği korunuyor.

[Okuma önizlemesi](STORY_PILOT_READING_2026-10-19.md) · [Yerel entegrasyon](STORY_PILOT_INTEGRATION.md) · [İçerik ve test özetleri](release-evidence/2026-10-19-story-pilot-editorial.json)
