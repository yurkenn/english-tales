"""Paper-craft story video: one illustration per sentence, caption in the cream sky.

python3 make_paper.py story.json images_dir out.mp4
Each sentence: its image (slow 4% push-in), English line in the sky, small Turkish line below,
narrated once by Kokoro, hard cut to the next. Ends with a one-question quiz and the app CTA.
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.environ.get("ET_RES", os.path.join(HERE, "..", "..", "..", "native-android", "app", "src", "main", "res"))
KOKORO_DIR = os.environ.get("KOKORO_DIR", os.path.join(HERE, "..", "..", "kokoro"))
W, H, FPS, SR = 1080, 1920, 30, 24000
INK = (52, 38, 28); INK_SOFT = (120, 96, 74); CREAM = (250, 243, 228); GREEN = (96, 140, 92); YELLOW = (240, 196, 72)
GAP, TAIL, MIN_SCENE = 0.40, 0.35, 1.9

def font(name, size): return ImageFont.truetype(os.path.join(RES, "font", name), size)
F_EN = font("nunito_extrabold.ttf", 76); F_TR = font("nunito_bold.ttf", 44)
F_Q = font("nunito_extrabold.ttf", 80); F_OPT = font("nunito_extrabold.ttf", 64); F_SMALL = font("nunito_bold.ttf", 40)

def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3

def wrap(d, text, f, maxw):
    out, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= maxw or not cur: cur = t
        else: out.append(cur); cur = w
    out.append(cur); return out

def synth(story):
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(KOKORO_DIR, "kokoro-v1.0.onnx"), os.path.join(KOKORO_DIR, "voices-v1.0.bin"))
    def say(text):
        a, sr = k.create(text.replace("“", '"').replace("”", '"'), voice=story.get("voice", "af_heart"), speed=story.get("speed", 0.88), lang="en-us")
        idx = np.where(np.abs(a) > 0.01)[0]
        return a[max(0, idx[0] - 600): idx[-1] + 1200].astype(np.float32) if len(idx) else a
    return [say(s["en"]) for s in story["sentences"]], say(story["quiz"]["say"]), say(story["cta_say"])

def fit(img):
    s = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    x, y = (img.width - W) // 2, (img.height - H) // 2
    return img.crop((x, y, x + W, y + H))

def caption_layer(en, tr):
    layer = Image.new("RGBA", (W, 640), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    lines = wrap(d, en, F_EN, 900); y = 190
    for ln in lines:
        d.text((W // 2, y), ln, font=F_EN, fill=INK, anchor="mt"); y += 92
    y += 14
    for ln in wrap(d, tr, F_TR, 880):
        d.text((W // 2, y), ln, font=F_TR, fill=INK_SOFT, anchor="mt"); y += 54
    # soft cream halo so text stays readable if the art has detail behind it
    halo = layer.getchannel("A").filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(14))
    bg = Image.new("RGBA", layer.size, CREAM + (0,)); bg.putalpha(halo.point(lambda v: int(v * 0.75)))
    return Image.alpha_composite(bg, layer)

def scene_frames(img, cap, n):
    for i in range(n):
        t = i / max(1, n - 1); z = 1.0 + 0.04 * t
        w, h = round(W * z), round(H * z)
        fr = img.resize((w, h), Image.BICUBIC).crop(((w - W) // 2, (h - H) // 2, (w - W) // 2 + W, (h - H) // 2 + H)).convert("RGBA")
        if i < 4:  # caption pops in over the first frames
            c = cap.copy(); c.putalpha(c.getchannel("A").point(lambda v, a=(i + 1) / 4: int(v * a))); fr.alpha_composite(c, (0, 0))
        else:
            fr.alpha_composite(cap, (0, 0))
        yield fr.convert("RGB")

def quiz_frames(bg, story, n_ask, n_reveal):
    q = story["quiz"]; base = bg.filter(ImageFilter.GaussianBlur(10)).convert("RGBA")
    veil = Image.new("RGBA", (W, H), CREAM + (205,)); base = Image.alpha_composite(base, veil)
    total = n_ask + n_reveal
    for i in range(total):
        fr = base.copy(); d = ImageDraw.Draw(fr)
        d.text((W // 2, 430), "Mini quiz", font=F_SMALL, fill=INK_SOFT, anchor="mm")
        d.text((W // 2, 540), q["q"], font=F_Q, fill=INK, anchor="mm")
        for k, opt in enumerate(q["options"]):
            appear = ease((i - 8 - k * 6) / 8)
            if appear <= 0: continue
            y = 760 + k * 170; right = (k == q["answer"]) and i >= n_ask
            box = (190, y - 62, W - 190, y + 62)
            d.rounded_rectangle(box, radius=62, fill=(GREEN if right else (255, 252, 244)), outline=INK, width=4)
            d.text((W // 2, y), opt + ("  ✓" if right else ""), font=F_OPT, fill=((255, 255, 255) if right else INK), anchor="mm")
        if i < 6:
            fr = Image.blend(bg.convert("RGBA"), fr, (i + 1) / 6)
        yield fr.convert("RGB")

def cta_frames(story, n):
    mascot = Image.open(os.path.join(RES, "drawable-nodpi", "mascot_reading.webp")).convert("RGBA")
    mascot = mascot.resize((560, round(mascot.height * 560 / mascot.width)), Image.LANCZOS)
    for i in range(n):
        fr = Image.new("RGBA", (W, H), CREAM + (255,)); d = ImageDraw.Draw(fr)
        k = ease(i / 12); my = 420 + round(60 * (1 - k))
        m = mascot.copy(); m.putalpha(m.getchannel("A").point(lambda v: int(v * k))); fr.alpha_composite(m, ((W - m.width) // 2, my))
        d.text((W // 2, 1120), "Masalın devamı ve 60+ masal", font=F_TR, fill=INK_SOFT, anchor="mm")
        d.text((W // 2, 1210), "English Tales", font=F_Q, fill=INK, anchor="mm")
        box = (250, 1300, W - 250, 1420)
        d.rounded_rectangle(box, radius=60, fill=YELLOW, outline=INK, width=4)
        d.text((W // 2, 1360), "Google Play'de ücretsiz", font=F_SMALL, fill=INK, anchor="mm")
        yield fr.convert("RGB")

def main():
    story = json.load(open(sys.argv[1])); imgdir = sys.argv[2]; out = sys.argv[3]
    lines, quiz_a, cta_a = synth(story)
    imgs = [fit(Image.open(os.path.join(imgdir, s["img"])).convert("RGB")) for s in story["sentences"]]
    audio = []; plan = []
    t = 0.25
    audio.append(np.zeros(int(SR * 0.25), np.float32))
    for i, a in enumerate(lines):
        dur = max(MIN_SCENE, len(a) / SR + GAP + TAIL)
        seg = np.zeros(int(SR * dur), np.float32); seg[:len(a)] = a
        audio.append(seg); plan.append(("scene", i, dur + (0.25 if i == 0 else 0)))
    qd_ask = len(quiz_a) / SR + 2.2; qd_rev = 1.6
    seg = np.zeros(int(SR * (qd_ask + qd_rev)), np.float32); s0 = int(SR * 0.5); seg[s0:s0 + len(quiz_a)] = quiz_a
    audio.append(seg); plan.append(("quiz", qd_ask, qd_rev))
    cd = len(cta_a) / SR + 1.0
    seg = np.zeros(int(SR * cd), np.float32); seg[int(SR * 0.3):int(SR * 0.3) + len(cta_a)] = cta_a
    audio.append(seg); plan.append(("cta", cd))
    wav = np.concatenate(audio); wpath = out + ".wav"
    import wave
    with wave.open(wpath, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(wav, -1, 1) * 32767).astype(np.int16).tobytes())
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-i", wpath, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium",
                           "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    total_frames = 0
    for p in plan:
        if p[0] == "scene":
            _, i, dur = p; n = round(dur * FPS)
            s = story["sentences"][i]
            frames = scene_frames(imgs[i], caption_layer(s["en"], s["tr"]), n)
        elif p[0] == "quiz":
            n = round((p[1] + p[2]) * FPS); frames = quiz_frames(imgs[-1], story, round(p[1] * FPS), round(p[2] * FPS))
        else:
            n = round(p[1] * FPS); frames = cta_frames(story, n)
        for fr in frames:
            ff.stdin.write(fr.tobytes()); total_frames += 1
    ff.stdin.close(); ff.wait(); os.remove(wpath)
    print(out, round(total_frames / FPS, 1), "s")

if __name__ == "__main__":
    main()
