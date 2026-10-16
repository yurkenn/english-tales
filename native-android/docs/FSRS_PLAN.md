# Uyarlanabilir tekrar (Q5.7) — FSRS-5

## 1. adım: çekirdek ve simülasyon (bu belge)

- `backend/tools/fsrs.mjs` (referans) ve `app/.../data/Fsrs.kt` aynı FSRS-5 modelini, yayımlanmış varsayılan ağırlıklarla uygular. Uygulamadaki yanıtlar ikili olduğu için doğru = Good (3), yanlış = Again (1).
- `backend/tests/fixtures/fsrs-vectors.csv`, 4 dizide 28 adımı sabitler. Node ve JVM testleri aynı kararlılık, zorluk ve aralığı üretir.
- Zamanlama henüz değişmedi: sunucu tekrarları `apply_word_event` içinde SQL ile yeniden oynatır. Geçiş, Android, SQL ve eski kayıt taşıma için tek PR'da yapılacak (2. adım).

## Simülasyon

`node tools/fsrs-simulate.mjs [--seed n] [--days 120]` — 200 kelime (40 gün boyunca günde 5 yeni), 120 gün. Sanal öğrenenin belleği FSRS unutma eğrisini izler; kelime başına zorluk farkı vardır. Her gün zamanı gelen bütün tekrarlar yapılır, yanlış cevap aynı gün 10 dakika sonra tekrar gelir. 20 tohumun ortalaması:

| Takvim | Toplam tekrar | En yoğun gün | Son 30 gün, günlük | Doğru % | 120. günde akılda (R ≥ 0,9) | Akılda kelime başına tekrar |
|---|---:|---:|---:|---:|---:|---:|
| Bugünkü (1/3/7/14/30 gün) | 2.436 | 47 | 13,3 | 74,9 | 189,6 | 12,9 |
| FSRS-5 | 2.170 | 43 | 9,3 | 74,4 | 189,7 | 11,4 |

FSRS aynı akılda tutmayla yaklaşık %11 daha az tekrar ister. Son ayın günlük yükü %30 düşer, çünkü iyi bilinen kelimelerin aralığı 30 günde durmaz.

**Sınır:** Sanal öğrenenin belleği FSRS modeliyle üretildiği için sonuç FSRS lehine eğilimlidir. Bu bir saha ölçümü değildir; geçişten sonra gerçek doğru oranı ve günlük yük izlenmelidir.

## 2. adım: geçiş (plan)

1. `user_word_state` ve yerel `saved_words` tablolarına `stability` ve `difficulty` eklenir; `interval_days` kısıtı kaldırılır.
2. Eski kayıtlar şöyle taşınır: kararlılık = mevcut aralık (en az 0,4), zorluk = 5.
3. `apply_word_event` olay oynatımında FSRS kullanılır. Android `LearningPolicy.review` aynı vektörlerle test edilir.
4. "known" durumu kararlılık ≥ 21 gün olur; Q5.5 ve Q5.8 bu durumu kullanmaya devam eder.
