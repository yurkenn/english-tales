# Sosyal medya videoları (Instagram / TikTok)

@englishtales.app hesabı için üretilen kısa İngilizce masal videoları ve onları üreten araçlar. Bu dal uygulama koduna karışmasın diye ayrı tutuluyor.

## Klasörler

- `videolar/tilki-ve-karga/` – Tilki ve Karga, 3 part (yayına hazır son sürüm: Türkçe seslendirilmiş hook, cut-out animasyon).
- `videolar/eski-ornekler/` – ilk denemeler (v1–v3).
- `profil/` – profil fotoğrafı seçenekleri (seçilen: `profil-1-okuyan-maskot.png`).
- `ses-ornekleri/` – İngilizce (Kokoro) ve Türkçe (Piper) ses örnekleri.
- `uretici/` – video üretici:
  - `make_video.py` – ana üretici (1080x1920, 30 fps).
  - `story_fox_crow.json` – hikâye: cümleler, çeviriler, anahtar kelimeler, kamera, 3 part, hook, quiz.
  - `cutout_fox_crow.py` + `cut/` – kapak resminin katmanları ve her cümlenin animasyonu.
  - `tr_say.py` – Türkçe hook sesi (Piper).
  - `render.py`, `tts.py` – ilk sürüm (v1).

## Çalıştırma

```
pip install kokoro-onnx piper-tts pillow numpy opencv-python-headless
export KOKORO_DIR=/yol/kokoro      # kokoro-v1.0.onnx + voices-v1.0.bin
export TR_TTS_DIR=/yol/trtts       # vits-piper-tr_TR-fahrettin-medium vb.
cd sosyal-medya/uretici
python3 make_video.py story_fox_crow.json part-1.mp4 1
```

Model dosyaları büyük olduğu için repoda yok:
- Kokoro: github.com/thewh1teagle/kokoro-onnx, release `model-files-v1.0`
- Türkçe Piper sesleri: github.com/k2-fsa/sherpa-onnx, release `tts-models` (`vits-piper-tr_TR-*-medium`)

Kapak, maskot ve fontlar `native-android/app/src/main/res` klasöründen okunur (`ET_RES` ile değiştirilebilir). Yeni bir hikâye için kendi JSON'u, katman çokgenleri ve animasyon modülü gerekir.

## Aslan ve Fare (kâğıt kesme, kelime kelime vurgu)

- `videolar/aslan-ve-fare.mp4`: son sürüm (51 sn). Görüntü HyperFrames ile Mac'te (`hyperframes/aslan-ve-fare/`, komutlar `tools/build.py` başında), kelime zamanlaması whisper.
- Türkçe sesler ElevenLabs, kadın sesi "Gülsu" (voice_id bGmbiluBMaeupKCFxoOk, model eleven_v3, `[excited]` etiketiyle). Dosyalar `ses-ornekleri/`.
- Açılış: aslan kükremesi (ElevenLabs ses efekti) + 0,45 sn'de "Minik fare... aslanı kurtarabilir mi?!"; hook'un son karesi 0,4 sn bekletilip masal başlıyor.
- Kapanış Türkçe: "Sence free ne demek?" sorusu, "Doğru cevap: özgür!", uygulamanın Türkçe adı "Masallarla İngilizce Öğren" ile CTA. `uretici/kagit/tr_tail.py` herhangi bir videonun quiz'den sonrasını bu Türkçe kapanışla değiştirir (kullanım dosyanın başında).
- `uretici/kagit/make_paper.py`: aynı formatı Mac'siz üreten Python yolu (Kokoro + Piper, karaoke vurgu).

## Tilki ve Karga (kâğıt kesme, tek video)

- `videolar/tilki-ve-karga-kagit.mp4` (59 sn): görseller oguz'un ChatGPT ile ürettiği 14 kare (`uretici/kagit/tilki-ve-karga/`, promptlar `story_fox_crow_paper.json` sahnelerinden). Altyazı alt-orta güvenli alanda (Instagram/TikTok üst menü, alt açıklama şeridi ve sağ butonların dışında), arka plan kutusu yok: beyaz yazı + koyu kontur (`"frame": {"type": "cover", "cap_style": "outline", "cap_bottom": 1430, "cap_x": 485, "cap_w": 820, "hook_y": 1060}`). Kapanışta "Link profilde" yazar.
- Açılış karga gaklaması + Gülsu "Karga... bu tuzağa düşecek mi?!" (story JSON `hook.audio` / `hook.sfx`), İngilizce anlatım Kokoro + kelime kelime vurgu, kapanış `tr_tail.py` ile Türkçe.
- Komut: `KOKORO_DIR=... python3 make_paper.py story_fox_crow_paper.json tilki-ve-karga base.mp4` (çıktıdaki `quiz_at` değerini) `python3 tr_tail.py story_fox_crow_paper.json tilki-ve-karga base.mp4 <quiz_at> ../../ses-ornekleri/tk-quiz-praise-gulsu.mp3 ../../ses-ornekleri/tk-cevap-ovmek-gulsu.mp3 ../../ses-ornekleri/kapanis-gulsu.mp3 out.mp4`
