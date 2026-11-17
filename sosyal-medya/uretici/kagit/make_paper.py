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
TR_DIR = os.environ.get("TR_TTS_DIR", os.path.join(HERE, "..", "..", "trtts"))
W, H, FPS, SR = 1080, 1920, 30, 24000
INK = (52, 38, 28); INK_SOFT = (120, 96, 74); CREAM = (250, 243, 228); GREEN = (96, 140, 92); YELLOW = (240, 196, 72)
GAP, TAIL, MIN_SCENE = 0.40, 0.35, 1.9

def font(name, size): return ImageFont.truetype(os.path.join(RES, "font", name), size)
F_EN = font("nunito_extrabold.ttf", 76); F_TR = font("nunito_bold.ttf", 50)
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
    def timed(text):
        """Audio plus (start, end) seconds for each word. Word ends come from synthesising each
        prefix of the sentence: the prefix "w1 .. wk" lasts about as long as the first k words."""
        a = say(text); words = text.split(); total = len(a) / SR
        ends = [len(say(" ".join(words[:j]))) / SR - 0.05 for j in range(1, len(words))] + [total - 0.05]
        ends = [min(max(e, 0.1), total) for e in ends]
        for j in range(1, len(ends)): ends[j] = max(ends[j], ends[j - 1] + 0.08)
        starts = [0.03] + ends[:-1]
        return a, list(zip(starts, ends))
    lines = [timed(s["en"]) for s in story["sentences"]]
    return lines, say(story["quiz"]["say"]), say(story["cta_say"])

def synth_tr(voice, text):
    import wave, io
    from piper import PiperVoice, SynthesisConfig
    d = os.path.join(TR_DIR, f"vits-piper-tr_TR-{voice}")
    v = PiperVoice.load(os.path.join(d, f"tr_TR-{voice}.onnx"), config_path=os.path.join(d, f"tr_TR-{voice}.onnx.json"))
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w: v.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=1.0))
    buf.seek(0)
    with wave.open(buf) as w: sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    if sr != SR:
        a = np.interp(np.arange(0, len(a), sr / SR), np.arange(len(a)), a).astype(np.float32)
    idx = np.where(np.abs(a) > 0.01)[0]
    return a[max(0, idx[0] - 600): idx[-1] + 1200] if len(idx) else a

def load_audio(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32).copy(); idx = np.where(np.abs(a) > 0.01)[0]
    return a[max(0, idx[0] - 300): idx[-1] + 600] if len(idx) else a

FRAME = {}   # story["frame"]: {"type": "card", "band": px of cream space on top for the caption, "cap_y": caption top, "cap_w": wrap width}
CAP_Y, CAP_W = 190, 820

def card(img):
    """Image as a paper card below a caption band, over a soft blurred copy of itself."""
    band = FRAME.get("band", 420); m = 28
    s = min((H - band - m) / img.height, (W - 2 * 40) / img.width)
    cw, ch = round(img.width * s), round(img.height * s)
    bg = fit_cover(img).filter(ImageFilter.GaussianBlur(40))
    bg = Image.blend(bg, Image.new("RGB", (W, H), CREAM), 0.72).convert("RGBA")
    x, y = (W - cw) // 2, band
    sh = Image.new("L", (W, H), 0); ImageDraw.Draw(sh).rounded_rectangle((x + 6, y + 14, x + cw + 6, y + ch + 14), radius=30, fill=110)
    bg.paste((60, 40, 20, 255), (0, 0), sh.filter(ImageFilter.GaussianBlur(18)))
    mask = Image.new("L", (cw, ch), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, cw - 1, ch - 1), radius=30, fill=255)
    bg.paste(img.resize((cw, ch), Image.LANCZOS), (x, y), mask)
    return bg.convert("RGB")

def fit(img):
    if FRAME.get("type") == "card": return card(img)
    return fit_cover(img)

def fit_cover(img):
    s = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    x, y = (img.width - W) // 2, (img.height - H) // 2
    return img.crop((x, y, x + W, y + H))

UPCOMING = (168, 148, 126); HILITE = (255, 214, 92)
F_HOOK = font("nunito_extrabold.ttf", 92); F_BADGE = font("nunito_extrabold.ttf", 42)

def layout_words(en):
    """Positions for each word of the English line: list of (word, x, y, width), centred lines."""
    d = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    space = d.textlength(" ", font=F_EN); out = []; y = CAP_Y
    for ln in wrap(d, en, F_EN, CAP_W):
        ws = ln.split(); widths = [d.textlength(w, font=F_EN) for w in ws]
        x = W / 2 - (sum(widths) + space * (len(ws) - 1)) / 2
        for w, wd in zip(ws, widths):
            out.append((w, x, y, wd)); x += wd + space
        y += 92
    return out, y

def caption_frame(words, ybottom, tr, times, t, alpha=1.0):
    """Caption at time t (seconds from the start of the spoken line): spoken words dark,
    the word being spoken on a yellow marker, the rest lighter; Turkish line below."""
    layer = Image.new("RGBA", (W, 640), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    asc, desc = F_EN.getmetrics()
    for i, (w, x, y, wd) in enumerate(words):
        s0, s1 = times[i] if i < len(times) else (9e9, 9e9)
        if s0 <= t < s1:
            k = ease((t - s0) / 0.12)
            pad = 10; d.rounded_rectangle((x - pad, y + 6, x + wd + pad, y + asc + desc - 8), radius=18, fill=HILITE + (int(255 * k),))
            col = INK
        else:
            col = INK if t >= s1 else UPCOMING
        d.text((x, y), w, font=F_EN, fill=col)
    y = ybottom + 14
    for ln in wrap(d, tr, F_TR, CAP_W):
        d.text((W // 2, y), ln, font=F_TR, fill=INK_SOFT, anchor="mt"); y += 60
    halo = layer.getchannel("A").filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(14))
    bg = Image.new("RGBA", layer.size, CREAM + (0,)); bg.putalpha(halo.point(lambda v: int(v * 0.9)))
    out = Image.alpha_composite(bg, layer)
    if alpha < 1: out.putalpha(out.getchannel("A").point(lambda v: int(v * alpha)))
    return out

def scene_frames(img, s, times, n, lead):
    words, yb = layout_words(s["en"])
    for i in range(n):
        tt = i / FPS; z = 1.0 + 0.04 * (i / max(1, n - 1))
        w, h = round(W * z), round(H * z)
        fr = img.resize((w, h), Image.BICUBIC).crop(((w - W) // 2, (h - H) // 2, (w - W) // 2 + W, (h - H) // 2 + H)).convert("RGBA")
        fr.alpha_composite(caption_frame(words, yb, s["tr"], times, tt - lead, min(1.0, (i + 1) / 4)), (0, 0))
        yield fr.convert("RGB")

def hook_frames(img, story, n):
    hk = story["hook"]; d0 = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    lines = wrap(d0, hk["text"], F_HOOK, 860)
    for i in range(n):
        z = 1.06 - 0.03 * (i / max(1, n - 1)); w, h = round(W * z), round(H * z)
        fr = img.resize((w, h), Image.BICUBIC).crop(((w - W) // 2, (h - H) // 2, (w - W) // 2 + W, (h - H) // 2 + H)).convert("RGBA")
        layer = Image.new("RGBA", (W, 760), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
        label = f'{story.get("title_tr", story["title"])} · {story.get("level", "A1")}'
        tw = d.textlength(label, font=F_BADGE)
        by = CAP_Y; d.rounded_rectangle((W / 2 - tw / 2 - 30, by, W / 2 + tw / 2 + 30, by + 72), radius=36, fill=HILITE)
        d.text((W / 2, by + 36), label, font=F_BADGE, fill=INK, anchor="mm")
        y = by + 110
        for ln in lines:
            ws = ln.split(); x = W / 2 - d.textlength(ln, font=F_HOOK) / 2
            for j, wd in enumerate(ws):
                t = wd + (" " if j < len(ws) - 1 else "")
                col = (214, 96, 40) if hk.get("accent") and hk["accent"] in wd else INK
                d.text((x, y), t, font=F_HOOK, fill=col); x += d.textlength(t, font=F_HOOK)
            y += 104
        halo = layer.getchannel("A").filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(16))
        bg = Image.new("RGBA", layer.size, CREAM + (0,)); bg.putalpha(halo.point(lambda v: int(v * 0.92)))
        fr.alpha_composite(Image.alpha_composite(bg, layer), (0, 0))
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
            d.text((W // 2, y), opt, font=F_OPT, fill=((255, 255, 255) if right else INK), anchor="mm")
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
    global CAP_Y, CAP_W
    FRAME.update(story.get("frame", {})); CAP_Y = FRAME.get("cap_y", CAP_Y); CAP_W = FRAME.get("cap_w", CAP_W)
    lines, quiz_a, cta_a = synth(story)
    imgs = [fit(Image.open(os.path.join(imgdir, s["img"])).convert("RGB")) for s in story["sentences"]]
    audio = []; plan = []
    if story.get("hook"):
        hk = story["hook"]; here = os.path.dirname(os.path.abspath(sys.argv[1]))
        if hk.get("audio"):   # pre-made voice clip (e.g. ElevenLabs), path relative to the story file
            ha = load_audio(os.path.join(here, hk["audio"]))
        else:
            ha = synth_tr(hk.get("voice", "fahrettin-medium"), hk.get("say", hk["text"]))
        at = hk.get("voice_at", 0.05)
        hd = at + len(ha) / SR + 0.45
        seg = np.zeros(int(SR * hd), np.float32); seg[int(SR * at):int(SR * at) + len(ha)] = ha
        if hk.get("sfx"):
            sx = load_audio(os.path.join(here, hk["sfx"])) * hk.get("sfx_gain", 0.5)
            fade = int(SR * at); sx = sx[:len(seg)].copy()
            if fade < len(sx): sx[fade:] *= np.linspace(1, 0, len(sx) - fade) ** 2
            seg[:len(sx)] += sx
        audio.append(seg); plan.append(("hook", hd))
    lead0 = 0.25
    for i, (a, times) in enumerate(lines):
        lead = lead0 if i == 0 else 0.0
        dur = max(MIN_SCENE, len(a) / SR + GAP + TAIL)
        seg = np.zeros(int(SR * (dur + lead)), np.float32); seg[int(SR * lead):int(SR * lead) + len(a)] = a
        audio.append(seg); plan.append(("scene", i, dur + lead, times, lead))
    qd_ask = len(quiz_a) / SR + 2.2; qd_rev = 1.6
    seg = np.zeros(int(SR * (qd_ask + qd_rev)), np.float32); s0 = int(SR * 0.5); seg[s0:s0 + len(quiz_a)] = quiz_a
    print("quiz_at", round(sum(len(x) for x in audio) / SR, 4)); audio.append(seg); plan.append(("quiz", qd_ask, qd_rev))
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
        if p[0] == "hook":
            n = round(p[1] * FPS)
            frames = hook_frames(fit(Image.open(os.path.join(imgdir, story["hook"]["img"])).convert("RGB")), story, n)
        elif p[0] == "scene":
            _, i, dur, times, lead = p; n = round(dur * FPS)
            frames = scene_frames(imgs[i], story["sentences"][i], times, n, lead)
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
