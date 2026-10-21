# Haftalık ligler

Kullanıcıları her gün geri getirmek için Duolingo tarzı haftalık ligler. Lig için hesap gerekir; misafir ana sayfada "Hesap aç" kartını görür.

## Kurallar

- Hafta pazartesi 00:00 UTC'de başlar (Türkiye saatiyle 03:00).
- Ligler: 1 Bronz, 2 Gümüş, 3 Altın, 4 Safir, 5 Elmas. Herkes Bronz'dan başlar.
- Haftanın ilk XP'sinde kullanıcı kendi ligindeki, yeri olan en eski 30 kişilik gruba girer; hepsi doluysa yeni grup açılır.
- XP sunucuda, senkronlanan `learning_sessions` kayıtlarından hesaplanır: oyunda her doğru cevap 5 XP (en az 5 saniye aktif süre), sayılan her hikâye okuması 20 XP. Gün başına en fazla 500 XP sayılır. Uygulama puan göndermez.
- Yalnızca o hafta içinde biten oturumlar sayılır; geç senkronlanan eski oturumlar biten haftayı değiştirmez.
- Hafta bitince ilk 5 (XP > 0) bir üst lige çıkar. En az 10 kişilik gruplarda son 5 bir alt lige düşer. Eşitlikte o XP'ye önce ulaşan önde olur.
- Sonuç, kullanıcının bir sonraki lig okumasında veya ilk oturumunda hesaplanır (zamanlanmış iş gerekmez).

## Gizlilik

- Diğer kullanıcılar yalnızca ayarlardaki ad (`learning_profiles.display_name`) ve XP ile görünür; kullanıcı kimliği ve e-posta dönmez.
- "Ligde görün" kapatılırsa kullanıcı bu haftanın grubundan hemen çıkar ve yeni haftalara katılmaz.
- Tablolar RLS ile kapalıdır; erişim yalnızca `get_my_league()` ve `set_league_opt_out(boolean)` üzerindendir. Hesap silinince lig kayıtları da silinir.

## Dosyalar

- Veritabanı: `backend/supabase/migrations/20261021100000_weekly_leagues.sql`, testler `backend/tests/leagues.test.mjs`.
- Uygulama: `data/Leagues.kt`, `data/LeagueViewModel.kt`, `ui/LeagueUi.kt`, metinler `res/values*/leagues.xml`.

## Sonraki adımlar

- Hatırlatma bildiriminde sıralama ("2. sıraya 15 XP kaldı").
- Arkadaşlar ve davet kodu.
