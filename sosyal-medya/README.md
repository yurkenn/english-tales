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
