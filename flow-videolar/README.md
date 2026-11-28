# Flow videoları (Google Flow / Veo)

Bu dal yalnızca Google Flow ile üretilen videoların takibi içindir (Yalancı Çoban, Kuzu Postundaki Kurt, Aslan Postundaki Eşek). **Uygulama koduna dokunmaz, master'a birleştirilmez.**

- `hooks.json`: her video için 5 hook (Claude + Codex yazar, kör oylama), açıklama metni, durum ve izlenme.
- Videolar ve kapaklar git'te tutulmaz; kaynakları `icerik/seriler/english-tales-studio/output/<hikaye>/trials/` altındadır.
- Panel: claude.ai artifact (indirme, kapak, açıklama, durum).

## Hook Lab kuralı
Her video 5 hook ile deneme reeli (Instagram trial) olarak yüklenir. 48 saatte 3 binin altı elenir, 15 binin üstüne yeni varyasyonlar yazılır, hikâyenin kazananı ana profile (@englishtales.app) çıkar.
