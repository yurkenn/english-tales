# Haftalık ligler

Kullanıcıları her gün geri getirmek için Duolingo tarzı haftalık ligler. Lig için hesap gerekir; misafir ana sayfada "Hesap aç" kartını görür.

## Kurallar

- Hafta pazartesi 00:00 UTC'de başlar (Türkiye saatiyle 03:00).
- Ligler: 1 Bronz, 2 Gümüş, 3 Altın, 4 Safir, 5 Elmas. Herkes Bronz'dan başlar.
- Kullanıcı önce açıklamayı okuyup "Ligde görün" ayarını açar; varsayılan kapalıdır. Katılım sonrasındaki ilk XP'de kullanıcı kendi ligindeki, yeri olan en eski 30 kişilik gruba girer; hepsi doluysa yeni grup açılır.
- XP sunucuda, senkronlanan `learning_sessions` kayıtlarından hesaplanır: oyunda her doğru cevap 5 XP (en az 5 saniye aktif süre), sayılan her hikâye okuması 20 XP. Gün başına en fazla 500 XP sayılır. Uygulama puan göndermez.
- Yalnızca o hafta içinde biten oturumlar sayılır; geç senkronlanan eski oturumlar biten haftayı değiştirmez.
- Hafta bitince ilk 5 (XP > 0) bir üst lige çıkar. En az 10 kişilik gruplarda son 5 bir alt lige düşer. Eşitlikte o XP'ye önce ulaşan önde olur.
- Sonuç, kullanıcının bir sonraki lig okumasında veya ilk oturumunda hesaplanır (zamanlanmış iş gerekmez).

## Gizlilik

- Diğer kullanıcılar yalnızca ayarlardaki ad (`learning_profiles.display_name`) ve XP ile görünür; kullanıcı kimliği ve e-posta dönmez.
- "Ligde görün" kapatılırsa kullanıcı bu haftanın grubundan hemen gizlenir ve yeni haftalara katılmaz. Aynı haftadaki XP ve yer korunur; yeniden açınca aynı yere döner. Kapalıyken kazanılan XP sonradan lige eklenmez, günlük sınır sıfırlanmaz.
- Önceden otomatik katılmış bütün hesaplar gizlilik geçişiyle kapalı duruma alınır; geçmiş ve puanlar silinmez. Arkadaşlara da varsayılan ad ve 0 XP görünür. Açık katılım tarihi `consented_at` ile tutulur.
- Tablolar RLS ile kapalıdır; erişim yalnızca `get_my_league()` ve `set_league_opt_out(boolean)` üzerindendir. Hesap silinince lig kayıtları da silinir.

## Dosyalar

- Veritabanı: `backend/supabase/migrations/20261021100000_weekly_leagues.sql`, testler `backend/tests/leagues.test.mjs`.
- Uygulama: `data/Leagues.kt`, `data/LeagueViewModel.kt`, `ui/LeagueUi.kt`, metinler `res/values*/leagues.xml`.

## Geri getiren dokunuşlar

- Uygulama son lig okumasını hesap başına saklar (`LeagueMemory`). Günlük hatırlatma bu haftaya ait bir sıra varsa genel metin yerine sırayı yazar: üst sıraya kalan XP, zirve ya da düşme bölgesi uyarısı.
- Lig yeniden okunduğunda sıra yükseldiyse "N. sıraya yükseldin", yalnız XP arttıysa "+X XP" bildirimi çıkar.
- Yeni haftanın ilk okumasında geçen haftanın sonucu bir kez gösterilir. Terfide konfeti ve paylaşma düğmesi vardır.
- Ad hâlâ varsayılan "Okuyucu" ise lig ekranı takma ad seçtirir (2–20 karakter). Ad, ayarlar senkronuyla sunucuya gider.

## Arkadaşlar ve davet kodu

- Lig ekranında "Arkadaşlar" sekmesi var. Herkes bir kez 6 karakterlik bir davet kodu oluşturur (0/O, 1/I gibi karışan harfler yok) ve paylaşır.
- Kodu giren kişi ile kod sahibi aynı anda arkadaş olur; kodu paylaşmak onay sayılır. Kişi başına en çok 50 arkadaş.
- Arkadaş listesi bu haftanın lig XP'sine göre sıralanır; ligden çıkmış ya da bu hafta çalışmamış arkadaş 0 XP görünür.
- Sunucu fonksiyonları: `get_my_friends`, `get_friend_code`, `add_friend` (hatalar: P0002 kod yok, 22023 kendi kodun, 54000 sınır), `remove_friend`.
- Uygulama kullanıcı kimliği görmez: her üye, bakan kişiye göre değişen 20 karakterlik bir belirteçle (`id`) gelir.

## Ad bildirme ve filtre

- Lig ya da arkadaş listesinde bir ada dokunup "Adı bildir" denebilir (`report_name`). Bildiren kişi o adı hemen "Okuyucu" olarak görür.
- Aynı ad 3 farklı kişi tarafından bildirilirse herkese "Okuyucu" görünür. Ad değişince sayım yeni ad için baştan başlar.
- `private.blocked_name_terms` listesindeki (İngilizce ve Türkçe küfür ve nefret sözleri) bir kelimeyi içeren ad herkese "Okuyucu" görünür. Liste SQL ile genişletilebilir.
- Kişi kendi adını her zaman olduğu gibi görür.

## Canlıya alma

- Eski lig/arkadaş migration'larının ardından `20261023190101_league_consent.sql` uygulanır. Son migration mevcut katılımları gizler; yalnız açık kullanıcı seçimi görünürlüğü açar.
- Fonksiyonlar yokken uygulama lig kartını ve arkadaşlar sekmesini gizler.
