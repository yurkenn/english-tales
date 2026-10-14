# Klasik hikâyeler — kaynak ve uyarlama kaydı

Hazırlanma/kaynak kontrolü: 14 Ekim 2026. İlk paket 12 hikâye, 295 yeni EN/TR cümle çifti, 85 yeni kelime ve 12 özgün kapak içerir. Önceki 6 hikâye/81 cümle/39 kelime ile toplam 18/376/124 olur.

## Seçki

| Seviye | Başlık | Özgün yazar / kullanılan İngilizce kaynak |
|---|---|---|
| A1 | The Tortoise and the Hare | Ezop · George Fyler Townsend |
| A1 | The Lion and the Mouse | Ezop · George Fyler Townsend |
| A1 | The Fox and the Grapes | Ezop · George Fyler Townsend |
| A1 | The Ants and the Grasshopper | Ezop · George Fyler Townsend |
| A2 | Little Red Riding Hood | Jacob ve Wilhelm Grimm · Margaret Hunt |
| A2 | Cinderella | Jacob ve Wilhelm Grimm · Margaret Hunt |
| A2 | The Bremen Town Musicians | Jacob ve Wilhelm Grimm · Margaret Hunt |
| A2 | Hansel and Gretel | Jacob ve Wilhelm Grimm · Margaret Hunt |
| B1 | The Happy Prince | Oscar Wilde · İngilizce aslı |
| B1 | The Selfish Giant | Oscar Wilde · İngilizce aslı |
| B1 | The Gift of the Magi | O. Henry · İngilizce aslı |
| B1 | After Twenty Years | O. Henry · İngilizce aslı |

Bunlar yeni hazırlanmış **kısa, seviyeli İngilizce uyarlamalar ve Türkçe çevirilerdir**; tam özgün metin değildir. Olay örgüsü ve sonlar eski kaynaklara dayanır. CEFR seviyeleri editoryal hedeftir, bağımsız dil uzmanı sertifikası değildir. Türkçe adlar açıklamada bulunduğu için Türkçe aramayla da bulunurlar. “Grasshopper” kelimesi dil öğreniminde doğru karşılığı olan “çekirge” ile çevrildi; Türkçede bilinen farklı “ağustos böceği” anlatısıyla karıştırılmadı.

Cinderella, Grimm'in fındık ağacı, kuşlar ve altın ayakkabı anlatısını izler; modern film uyarlamasından görsel veya metin alınmadı. Little Red-Cap'in ikinci kurt karşılaşması; The Selfish Giant ve The Happy Prince'ın özgün sonları korunmuştur. Grimm metinlerindeki şiddet olayları kısa ve grafik ayrıntılara girmeyen cümlelerle aktarılmıştır. Uygulamanın genel kitle konumlandırması değiştirilmedi.

## Hak değerlendirmesi

[Türkiye Kültür ve Turizm Bakanlığı](https://telifhaklari.ktb.gov.tr/TR-332373/telif-hakki-kac-yil-sureyle-korunur.html), genel koruma süresini yazarın yaşamı ve ölümünü izleyen 70 yıl olarak açıklar; asıl eser ve işlenme/çeviri sürelerinin ayrı olduğunu belirtir. Aşağıdaki kişiler için bu süreler dolmuştur:

- [Three hundred Aesop’s fables](https://www.gutenberg.org/ebooks/21): antik Ezop anlatıları; İngilizce çevirmen George Fyler Townsend (1814–1900).
- [Household Tales](https://www.gutenberg.org/ebooks/5314): Jacob Grimm (1785–1863), Wilhelm Grimm (1786–1859); çevirmen Margaret Hunt (1831–1912). Kaynak kataloğunda “Hunt, Alfred William, Mrs.” olarak geçer; metnin başlık sayfası Margaret Hunt adını verir.
- [The Happy Prince, and Other Tales](https://www.gutenberg.org/ebooks/902): Oscar Wilde (1854–1900), İngilizce metin.
- [The Four Million](https://www.gutenberg.org/ebooks/2776): O. Henry (1862–1910), İngilizce metin.

Kaynak katalogları bu metinleri ABD'de kamu malı olarak belirtir. Türkiye değerlendirmesi, yazar/çevirmen ölüm tarihleri ile Bakanlığın açıkladığı genel süre kuralından çıkarılmıştır. Bu kayıt dünya çapında sınırsız hak garantisi değildir; yeni dağıtım ülkelerinin özel hükümleri ayrıca değerlendirilmelidir. Yazar adları korunur.

Kaynak sitesinin yeni otomatik özetleri, modern çeviriler, site markası, mevcut kapaklar veya ses kayıtları bu pakete alınmadı. [Lisans politikası](https://www.gutenberg.org/policy/license.html), esas metin ile marka/lisans eklerini ayırır; bağlantılı kaynak/teşekkür bölümlerini marka kullanımından ayrı ele alır. Kaynak adı uygulama başlığına, kapağa veya tanıtımına konmadı. Bağlantılar bu referans belgesi ve [kaynak manifestinde](../backend/content/classic-sources.json) tutulur.

Manifest; hikâye kimliğini, kaynak koleksiyonunu/başlığını, yazarları/çevirmeni, ölüm yıllarını, bağlantıları, kontrol tarihini ve okunan kaynak bölümünün SHA-256 özetini kaydeder. Kaynak bölüm özetleri, dış kaynağın ileride değişmesi durumunda araştırma izidir; paket metninin birebir kopya olduğunu iddia etmez.

## Kapaklar ve ilerleme güvenliği

Kapaklar 600×900 PNG, toplam yaklaşık 440 KB. Kaynakları `backend/tools/generate-classic-covers.swift` içindeki yeni geometrik çizimlerdir; dış çizim veya font dosyası kullanılmadı. macOS üzerinde `native-android` klasöründen `swift backend/tools/generate-classic-covers.swift` ile yeniden üretilebilir. Uygulama başlık/seviye yazılarını kapak üzerine kendisi yerleştirir.

Eski altı hikâyenin metin/ID ve ilk 39 kelime kayıtlarının sabit SHA-256 regresyon testleri var. Yeni kelimeler eski İngilizce cümlelerin token'ları arasında bulunmaz; böylece eski kelime eşlemeleri de değişmez. Her yeni hikâyede en az altı çalışılabilir kelime ve eksiksiz EN/TR çiftleri doğrulanır. Yeni kelimeler ortak kelime oyunu/çeldirici havuzunu da genişletir.

## Paket ile canlı yayın ayrımı

`catalog:export` taslak seed ve kapak yükleme manifesti üretir. Tek başına canlı katalog değişmez. Gerçek kapak yüklemesi, geri indirme/hash kontrolü ve gerçek publisher oturumuyla `admin_publish` gerekir. Yayımlanmamış hikâyeler anonim API'ye açılmaz. Canlı yayın tamamlanmadan kütüphanenin sunucuda 18 hikâyeye çıktığı iddia edilmemelidir.
