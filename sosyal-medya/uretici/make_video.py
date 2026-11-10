"""English Tales story short generator (v2).

python3 make_video.py story.json out.mp4

- Narration: Kokoro-82M (Apache 2.0) via kokoro-onnx. Model files: KOKORO_DIR
  (kokoro-v1.0.onnx + voices-v1.0.bin from github.com/thewh1teagle/kokoro-onnx releases).
- Video: PIL frames, 1080x1920 @30fps, ffmpeg H.264 + AAC.
- Audio: narration + generated sound effects + soft generated music bed (ducked under voice).
Assets (cover, mascots, fonts, app icon) are read from the English Tales repo res/ folder.
"""
import json, math, os, subprocess, sys, shutil
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.environ.get("ET_RES", os.path.join(HERE, "..", "..", "native-android", "app", "src", "main", "res"))
KOKORO_DIR = os.environ.get("KOKORO_DIR", os.path.join(HERE, "..", "kokoro"))
TR_DIR = os.environ.get("TR_TTS_DIR", os.path.join(HERE, "..", "trtts"))
W, H, FPS, SR = 1080, 1920, 30, 24000

# Safe area: TikTok/Reels cover the right rail (x > ~940) and the caption block (y > ~1500).
SAFE_L, SAFE_R = 70, 920

CREAM = (255, 247, 230); INK = (43, 21, 0); ORANGE = (255, 138, 0); YELLOW = (255, 206, 0)
GREEN = (52, 168, 83); NIGHT = (11, 61, 92); MUTED = (120, 96, 70); WHITE = (255, 255, 255)
FAINT = (205, 190, 170)


def font(name, size):
    return ImageFont.truetype(os.path.join(RES, "font", name), size)

F_TITLE = font("baloo2_extrabold.ttf", 100)
F_HOOK = font("nunito_extrabold.ttf", 62)
F_EN = font("nunito_extrabold.ttf", 66)
F_TR = font("nunito_extrabold.ttf", 54)
F_CHIP = font("nunito_extrabold.ttf", 42)
F_SMALL = font("nunito_bold.ttf", 36)
F_APP = font("baloo2_extrabold.ttf", 80)


def ease(t):
    t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3

def back(t):  # overshoot ease for pops
    t = max(0.0, min(1.0, t)); c = 1.70158
    return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2

def lerp(a, b, t):
    return a + (b - a) * t


# ---------------------------------------------------------------- narration
def synth_lines(story):
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(KOKORO_DIR, "kokoro-v1.0.onnx"), os.path.join(KOKORO_DIR, "voices-v1.0.bin"))
    voice, lang = story.get("voice", "af_heart"), story.get("lang", "en-us")
    lines = {"title": story.get("title_say", story["title"] + ".")}
    for i, s in enumerate(story["sentences"]):
        lines[f"s{i}"] = s["en"]
    lines["quiz"] = story["quiz"]["say"]
    if story.get("teaser_en"): lines["teaser"] = story["teaser_en"]
    lines["cta"] = story["next"]["say"] if story.get("next") else story["cta_say"]
    clips = {}
    for key, text in lines.items():
        a, sr = k.create(text.replace("“", '"').replace("”", '"'), voice=voice, speed=story.get("speed", 0.8), lang=lang)
        assert sr == SR
        # trim leading/trailing near-silence so timings match the words
        idx = np.where(np.abs(a) > 0.01)[0]
        if len(idx):
            a = a[max(0, idx[0] - 600): idx[-1] + 1200]
        clips[key] = a.astype(np.float32)
    if story.get("hook_tr_voice") and story.get("hook_big"):
        clips["hook_tr"] = synth_tr(story["hook_tr_voice"], story["hook_big"] + " " + story["hook_small"])
    return clips


def synth_tr(voice, text):
    """Turkish line with Piper (voice files from sherpa-onnx's tts-models GitHub release)."""
    import wave, io
    from piper import PiperVoice, SynthesisConfig
    d = os.path.join(TR_DIR, f"vits-piper-tr_TR-{voice}")
    v = PiperVoice.load(os.path.join(d, f"tr_TR-{voice}.onnx"), config_path=os.path.join(d, f"tr_TR-{voice}.onnx.json"))
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        v.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=1.0))
    buf.seek(0)
    a, sr = sf.read(buf, dtype="float32")
    if a.ndim > 1: a = a.mean(axis=1)
    n = int(len(a) * SR / sr)
    a = np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a).astype(np.float32)
    idx = np.where(np.abs(a) > 0.01)[0]
    return a[max(0, idx[0] - 600): idx[-1] + 1200] if len(idx) else a


# ---------------------------------------------------------------- sound design
def env(n, attack, release):
    e = np.ones(n, np.float32)
    a = min(n, int(attack * SR)); r = min(n - a, int(release * SR))
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[n - r:] = np.linspace(1, 0, r) ** 2
    return e

def sfx_pop():
    n = int(0.09 * SR); t = np.arange(n) / SR
    f = np.linspace(950, 320, n)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * 0.5).astype(np.float32)

def sfx_whoosh():
    n = int(0.32 * SR); noise = np.random.default_rng(1).standard_normal(n)
    sm = np.convolve(noise, np.ones(40) / 40, "same")
    return (sm * np.sin(np.linspace(0, np.pi, n)) ** 2 * 0.6).astype(np.float32)

def sfx_hit():
    n = int(0.7 * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(np.linspace(120, 45, n)) / SR) * np.exp(-t * 6) * 0.7
    return (boom + sfx_whoosh()[: n].tolist() + [0] * max(0, n - len(sfx_whoosh()))).astype(np.float32) if False else (boom + np.pad(sfx_whoosh() * 0.5, (0, max(0, n - len(sfx_whoosh()))))[:n]).astype(np.float32)

def sfx_tick():
    n = int(0.03 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 180) * 0.35).astype(np.float32)

def sfx_ding():
    n = int(0.9 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 1318.5 * t) + 0.6 * np.sin(2 * np.pi * 1975.5 * t)
    s[: int(0.09 * SR)] *= 0.0
    s += np.sin(2 * np.pi * 987.8 * t) * (t < 0.09)
    return (s * np.exp(-t * 5) * 0.28).astype(np.float32)

def sfx_sparkle():
    out = np.zeros(int(0.6 * SR), np.float32)
    for i, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
        n = int(0.25 * SR); t = np.arange(n) / SR
        b = np.sin(2 * np.pi * f * t) * np.exp(-t * 14) * 0.22
        o = int(i * 0.07 * SR); out[o:o + n] += b[: len(out) - o]
    return out

def music_bed(seconds):
    """Soft I-vi-IV-V pad + plucked arpeggio, generated so there are no licensing questions."""
    n = int(seconds * SR); out = np.zeros(n, np.float32); t_all = np.arange(n) / SR
    chords = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]]
    bar = 2.4
    for b in range(int(seconds / bar) + 1):
        ch = chords[b % 4]; s0 = int(b * bar * SR); m = min(int(bar * SR), n - s0)
        if m <= 0: break
        t = np.arange(m) / SR
        pad = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) for f in ch) / 3
        out[s0:s0 + m] += pad * env(m, 0.6, 0.8) * 0.10
        for step in range(8):  # eighth-note pluck arpeggio
            f = ch[[0, 1, 2, 1, 0, 2, 1, 2][step]] * 2
            p0 = s0 + int(step * bar / 8 * SR); pm = min(int(0.5 * SR), n - p0)
            if pm <= 0: continue
            pt = np.arange(pm) / SR
            out[p0:p0 + pm] += np.sin(2 * np.pi * f * pt) * np.exp(-pt * 9) * 0.06
    fade = env(n, 1.0, 1.5)
    return out * fade


# ---------------------------------------------------------------- visuals
class Assets:
    def __init__(self, story):
        self.cover = Image.open(os.path.join(RES, "drawable-nodpi", story["cover"])).convert("RGB")
        self.rig = None
        if story.get("cutout"):
            import importlib; self.rig = importlib.import_module(story["cutout"]).Rig()
        self.m_think = Image.open(os.path.join(RES, "drawable-nodpi", "mascot_thinking.webp")).convert("RGBA")
        self.m_cel = Image.open(os.path.join(RES, "drawable-nodpi", "mascot_celebrate.webp")).convert("RGBA")
        self.m_read = Image.open(os.path.join(RES, "drawable-nodpi", "mascot_reading.webp")).convert("RGBA")
        icon = os.path.join(RES, "mipmap-xxxhdpi", "ic_launcher_round.png")
        self.icon = Image.open(icon).convert("RGBA") if os.path.exists(icon) else None
        g = Image.new("L", (1, 340))
        for y in range(340): g.putpixel((0, y), int(255 * ease(y / 339)))
        self.fade = g.resize((W, 340))


IMG_H = 980

def camera(A, shot, shake=0.0, t=0.0, src=None):
    """shot = (cx, cy, zoom) in cover-relative coords; returns the top image band."""
    cx, cy, z = shot
    src = src or A.cover
    cw, chh = src.width, src.height
    vw = cw / z; vh = vw * IMG_H / W
    if vh > chh: vh = chh; vw = vh * W / IMG_H
    x0 = min(max(cx * cw - vw / 2, 0), cw - vw); y0 = min(max(cy * chh - vh / 2, 0), chh - vh)
    if shake:
        x0 += math.sin(t * 60) * shake * vw * 0.01; y0 += math.cos(t * 47) * shake * vh * 0.01
        x0 = min(max(x0, 0), cw - vw); y0 = min(max(y0, 0), chh - vh)
    return src.resize((W, IMG_H), Image.LANCZOS, box=(x0, y0, x0 + vw, y0 + vh))


def base_frame(A, shot, shake=0.0, t=0.0, dim=0.0, src=None):
    f = Image.new("RGB", (W, H), CREAM)
    img = camera(A, shot, shake, t, src)
    if dim: img = Image.blend(img, Image.new("RGB", img.size, INK), dim)
    f.paste(img, (0, 0))
    f.paste(Image.new("RGB", (W, 340), CREAM), (0, IMG_H - 340), A.fade)
    return f


def wrap(draw, text, fnt, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if draw.textlength(test, font=fnt) <= maxw: cur = test
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines


def chrome(d, progress):
    # thin progress bar across the top (watch-time cue) + brand pill
    d.rectangle((0, 0, W, 10), fill=(235, 222, 200)); d.rectangle((0, 0, int(W * progress), 10), fill=ORANGE)
    txt = "English Tales"; tw = d.textlength(txt, font=F_SMALL)
    d.rounded_rectangle((SAFE_L - 20, 60, SAFE_L + tw + 30, 126), radius=33, fill=WHITE, outline=INK, width=4)
    d.text((SAFE_L + 5, 68), txt, font=F_SMALL, fill=INK)


def word_times(words, start, end):
    w = [len(x.strip("“”.,!?\"")) + 2 for x in words]; tot = sum(w); out = []; t = start
    for x in w:
        d = (end - start) * x / tot; out.append((t, t + d)); t += d
    return out


def shot_at(prev, cur, t, s):
    a = ease(t / 0.9)
    shot = [lerp(prev[i], cur[i], a) for i in range(3)]
    shot[2] *= 1 + 0.025 * max(0, t - 0.9)  # slow push-in
    if s.get("pan_from"):
        pf = s["pan_from"]; b = ease((t - 0.2) / 1.6)
        shot = [lerp(pf[i], cur[i], b) for i in range(3)]
    return shot


def draw_hook(A, story, t, dur, speech, prog):
    """Scroll-stopper: opens on the action, huge question, an English line heard in the first second."""
    shot = list(story["teaser_shot"]); punch = 1 + 0.35 * (1 - ease(t / 0.35))
    shot[2] *= punch * (1 + 0.03 * t)
    f = Image.new("RGB", (W, H), INK)
    band = A.cover.copy()
    full_h = H
    # full-bleed image for the hook (whole frame), darkened so the text pops
    src = A.rig.frame(story["_teaser_gi"], t + 1.0, (0.0, 0.5)) if A.rig else A.cover
    cx, cy, z = shot; cw, chh = src.width, src.height
    vh = chh / max(1.0, z * 0.9); vw = vh * W / full_h
    if vw > cw: vw = cw; vh = vw * full_h / W
    x0 = min(max(cx * cw - vw / 2, 0), cw - vw); y0 = min(max(cy * chh - vh / 2, 0), chh - vh)
    img = src.resize((W, full_h), Image.LANCZOS, box=(x0, y0, x0 + vw, y0 + vh))
    img = Image.blend(img, Image.new("RGB", img.size, (18, 10, 4)), 0.64)
    f.paste(img, (0, 0))
    d = ImageDraw.Draw(f)
    d.rectangle((0, 0, W, 10), fill=(90, 70, 50)); d.rectangle((0, 0, int(W * prog), 10), fill=ORANGE)
    # small series chip (title is secondary now)
    chip = (f"Part {story['_part']}/{story['_parts']}  ·  " if story.get('_parts') else "") + story["title"]
    cwid = d.textlength(chip, font=F_SMALL)
    d.rounded_rectangle((SAFE_L - 20, 60, SAFE_L + cwid + 30, 126), radius=33, fill=YELLOW, outline=INK, width=4)
    d.text((SAFE_L + 5, 68), chip, font=F_SMALL, fill=INK)
    # giant question, words pop in fast
    big = font("baloo2_extrabold.ttf", 118)
    lines = wrap(d, story["hook_big"], big, SAFE_R - SAFE_L)
    layer = Image.new("RGBA", (W, 128 * len(lines) + 60), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
    ly = 20
    for ln in lines:
        lw = ld.textlength(ln, font=big); x = (SAFE_L + SAFE_R - lw) / 2
        for w in ln.split():
            col = YELLOW if w.rstrip("?!").lower() in story.get("hook_accent", []) else WHITE
            ld.text((x, ly), w, font=big, fill=col, stroke_width=8, stroke_fill=INK)
            x += ld.textlength(w + " ", font=big)
        ly += 128
    sc = 1 + 0.3 * (1 - ease(t / 0.25))
    if sc != 1:
        lw2, lh2 = int(layer.width * sc), int(layer.height * sc)
        layer = layer.resize((lw2, lh2), Image.LANCZOS)
    y = 540
    f.paste(layer, ((W - layer.width) // 2, y + (128 * len(lines) + 60 - layer.height) // 2), layer)
    d = ImageDraw.Draw(f)
    y = 540 + 128 * len(lines) + 20
    # the English line, as a speech bubble, appears with the voice
    if t >= speech[0] and not story.get("_no_bubble"):
        a = back((t - speech[0]) / 0.3)
        q = story["teaser_en"]; qf = F_EN
        qlines = wrap(d, q, qf, SAFE_R - SAFE_L - 60)
        bh = 40 + 84 * len(qlines) + 30; by = y + 70 + int(30 * (1 - min(1, a)))
        d.rounded_rectangle((SAFE_L - 10, by, SAFE_R + 10, by + bh), radius=40, fill=WHITE, outline=INK, width=5)
        d.polygon([(SAFE_L + 80, by + bh - 3), (SAFE_L + 140, by + bh - 3), (SAFE_L + 90, by + bh + 50)], fill=WHITE, outline=INK)
        d.line([(SAFE_L + 83, by + bh - 2), (SAFE_L + 137, by + bh - 2)], fill=WHITE, width=6)
        ty = by + 34
        for ln in qlines:
            d.text((SAFE_L + 30, ty), ln, font=qf, fill=INK); ty += 84
    small = story["hook_small"]
    sat = story.get("_small_at", 0.6)
    if t > sat:
        sb = back((t - sat) / 0.3)
        sf_ = font("nunito_extrabold.ttf", max(10, int(70 * (0.7 + 0.3 * min(1.1, sb)))))
        base_f = font("nunito_extrabold.ttf", 70)
        yy = y + 110
        for ln in wrap(d, small, base_f, SAFE_R - SAFE_L):
            sw = d.textlength(ln, font=sf_)
            d.text(((SAFE_L + SAFE_R - sw) / 2, yy), ln, font=sf_, fill=YELLOW, stroke_width=6, stroke_fill=INK); yy += 86
    if False:
        sw = d.textlength(small, font=F_HOOK)
        d.text(((SAFE_L + SAFE_R - sw) / 2, 1440), small, font=F_HOOK, fill=YELLOW, stroke_width=5, stroke_fill=INK)
    return f


def draw_intro(A, story, t, dur, prog):
    shot = list(story["intro_shot"]); shot[2] *= 1 + 0.04 * t
    f = base_frame(A, shot); d = ImageDraw.Draw(f); chrome(d, prog)
    y = 980
    a = back(t / 0.45)
    chip = (f"Part {story['_part']}/{story['_parts']}  ·  " if story.get('_parts') else "") + f"{story['level']} masal"
    cw = d.textlength(chip, font=F_SMALL)
    d.rounded_rectangle((SAFE_L, y, SAFE_L + cw + 50, y + 66), radius=33, fill=YELLOW, outline=INK, width=4)
    d.text((SAFE_L + 25, y + 10), chip, font=F_SMALL, fill=INK)
    # title pops in with a slight scale
    title = story["title"]; s = max(0.01, a)
    tf = font("baloo2_extrabold.ttf", int(100 * (0.85 + 0.15 * s)))
    lines = wrap(d, title, tf, SAFE_R - SAFE_L)
    ty = y + 90
    for ln in lines:
        d.text((SAFE_L, ty), ln, font=tf, fill=INK); ty += 108
    for i, ln in enumerate(story["hook"]):
        aa = ease((t - 0.5 - i * 0.25) / 0.35)
        if aa > 0:
            d.text((SAFE_L + int(40 * (1 - aa)), ty + 20 + i * 80), ln, font=F_HOOK, fill=ORANGE if i else INK)
    return f


def draw_sentence(A, story, i, t, dur, ex, prog, prev_shot):
    s = story["sentences"][i]
    speech = ex["speech"]
    shake = 1.0 if s.get("shake") and speech[0] + (speech[1] - speech[0]) * 0.55 < t < speech[1] + 0.3 else 0.0
    shot = shot_at(prev_shot, s["shot"], t, s)
    src = A.rig.frame(story.get("_offset", 0) + i, t, speech) if A.rig else None
    f = base_frame(A, shot, shake, t, dim=0.12 if s.get("moral") else 0.0, src=src)
    fx = getattr(A.rig, "last_fx", None) if A.rig else None
    if fx and t >= fx[1]:
        k = back((t - fx[1]) / 0.25); fs = max(10, int(120 * (0.6 + 0.4 * k)))
        pos = {"CAW!": (640, 330), "HA HA!": (560, 300), "PLOP!": (540, 560)}.get(fx[0], (540, 400))
        ImageDraw.Draw(f).text(pos, fx[0], font=font("baloo2_extrabold.ttf", fs), fill=YELLOW, anchor="mm", stroke_width=10, stroke_fill=INK)
    d = ImageDraw.Draw(f); chrome(d, prog)
    n = len(story["sentences"])
    # step counter
    lab = f"{i + 1}/{n}"; lw = d.textlength(lab, font=F_SMALL)
    d.rounded_rectangle((SAFE_R - lw - 40, 60, SAFE_R, 126), radius=33, fill=INK)
    d.text((SAFE_R - lw - 20, 68), lab, font=F_SMALL, fill=WHITE)

    a = back(t / 0.4)
    top = 900 + int(70 * (1 - a))
    maxw = SAFE_R - SAFE_L - 40
    lines = wrap(d, s["en"], F_EN, maxw)
    tr_lines = wrap(d, s["tr"], F_TR, maxw - 40)
    tr_h = 70 + 68 * len(tr_lines) + 24
    card_h = 50 + 92 * len(lines) + 30 + tr_h + 36
    d.rounded_rectangle((SAFE_L - 20, top, SAFE_R + 20, top + card_h), radius=46, fill=WHITE, outline=INK, width=5)
    if s.get("moral"):
        d.text((SAFE_L + 10, top - 150), "Hikâyenin dersi", font=F_HOOK, fill=WHITE, stroke_width=6, stroke_fill=INK)

    speech, speech2 = ex["speech"], ex.get("speech2")
    words = s["en"].split()
    times = word_times(words, *speech)
    times2 = word_times(words, *speech2) if speech2 else None
    in2 = bool(speech2) and speech2[0] - 0.15 <= t
    y = top + 50; wi = 0
    key = s["key"].lower()
    for ln in lines:
        x = SAFE_L + 20
        for w in ln.split():
            ws, we = times[wi]
            clean = w.strip("“”.,!?\"").lower()
            ww = d.textlength(w, font=F_EN)
            spoken = t >= ws
            active = ws <= t < we + 0.05
            if in2:
                ws2, we2 = times2[wi]; active = ws2 <= t < we2 + 0.05
            if clean == key and spoken:
                k = back((t - ws) / 0.25)
                pad = 10 * k
                d.rounded_rectangle((x - pad, y + 10 - pad * 0.3, x + ww + pad, y + 86 + pad * 0.3), radius=16, fill=YELLOW)
            col = INK if spoken else FAINT
            if active and clean != key:
                d.rectangle((x, y + 84, x + ww, y + 92), fill=ORANGE)
            d.text((x, y - (6 if active else 0)), w, font=F_EN, fill=col)
            x += ww + d.textlength(" ", font=F_EN); wi += 1
        y += 92
    # Turkish panel: big, own box, appears after the first listen
    y += 30
    ta = back((t - ex["tr_at"]) / 0.4)
    px0, px1 = SAFE_L, SAFE_R
    if t >= ex["tr_at"]:
        off = int(30 * (1 - min(1, ta)))
        d.rounded_rectangle((px0, y + off, px1, y + tr_h + off), radius=30, fill=(255, 236, 205))
        d.text((px0 + 28, y + 16 + off), "TÜRKÇESİ", font=F_SMALL, fill=ORANGE)
        ty = y + 64 + off
        for ln in tr_lines:
            d.text((px0 + 28, ty), ln, font=F_TR, fill=INK); ty += 68
    else:
        d.rounded_rectangle((px0, y, px1, y + tr_h), radius=30, outline=(238, 226, 206), width=4)
        hint = "Ne demek? Bir düşün..."
        d.text((px0 + 28, y + tr_h / 2 - 26), hint, font=F_SMALL, fill=FAINT)
    # "listen again" chip on the card's top-left edge
    if in2:
        ra = back((t - speech2[0] + 0.15) / 0.3)
        lab = "Bir daha dinle"; lw2 = d.textlength(lab, font=F_CHIP)
        cy = top - 42 - int(20 * (1 - min(1, ra)))
        d.rounded_rectangle((SAFE_L - 20, cy, SAFE_L + lw2 + 30, cy + 80), radius=40, fill=ORANGE, outline=INK, width=4)
        d.text((SAFE_L + 5, cy + 14), lab, font=F_CHIP, fill=WHITE)
    # key word chip sits on the card's top-right edge, appears when the word is spoken
    kws = next((times[j][0] for j, w in enumerate(words) if w.strip("“”.,!?\"").lower() == key), speech[0])
    ca = back((t - kws) / 0.35)
    if t >= kws:
        chip = f"{key} = {s['key_tr']}"; cw = d.textlength(chip, font=F_CHIP)
        cx0 = SAFE_R - cw - 40; cy = top - 42 - int(20 * (1 - min(1, ca)))
        d.rounded_rectangle((cx0 - 20, cy, SAFE_R + 20, cy + 80), radius=40, fill=NIGHT, outline=INK, width=4)
        d.text((cx0 + 5, cy + 14), chip, font=F_CHIP, fill=WHITE)
    return f


def draw_quiz(A, story, t, dur, speech_end, reveal_at, prog):
    q = story["quiz"]
    f = Image.new("RGB", (W, H), NIGHT); d = ImageDraw.Draw(f); chrome(d, prog)
    bob = int(10 * math.sin(t * 3))
    m = A.m_think.resize((340, 340), Image.LANCZOS); f.paste(m, ((SAFE_L + SAFE_R) // 2 - 170, 230 + bob), m)
    a = back(t / 0.4)
    qf = font("nunito_extrabold.ttf", int(68 * (0.8 + 0.2 * a)))
    tw = d.textlength(q["q"], font=qf); d.text(((SAFE_L + SAFE_R - tw) / 2, 640), q["q"], font=qf, fill=WHITE)
    for k, o in enumerate(q["options"]):
        aa = back((t - 0.3 - k * 0.15) / 0.35)
        if t < 0.3 + k * 0.15: continue
        y = 800 + k * 150 + int(40 * (1 - min(1, aa)))
        fill, tc = WHITE, INK
        if t >= reveal_at:
            if k == q["answer"]: fill, tc = GREEN, WHITE
            else: fill, tc = (150, 170, 185), (70, 85, 95)
        grow = 12 * back((t - reveal_at) / 0.3) if (t >= reveal_at and k == q["answer"]) else 0
        d.rounded_rectangle((SAFE_L + 30 - grow, y - grow / 2, SAFE_R - 30 + grow, y + 118 + grow / 2), radius=30, fill=fill, outline=INK, width=4)
        d.text((SAFE_L + 80, y + 26), f"{'ABC'[k]})  {o}", font=F_HOOK, fill=tc)
    if t < reveal_at:
        start = speech_end; p = max(0.0, min(1.0, (t - start) / max(0.1, reveal_at - start)))
        d.rounded_rectangle((SAFE_L + 30, 1290, SAFE_R - 30, 1314), radius=12, fill=(40, 90, 120))
        d.rounded_rectangle((SAFE_L + 30, 1290, SAFE_L + 30 + int((SAFE_R - SAFE_L - 60) * (1 - p)), 1314), radius=12, fill=YELLOW)
        if t > start:
            sec = str(max(1, math.ceil(reveal_at - t)))
            sw = d.textlength(sec, font=F_TITLE); d.text(((SAFE_L + SAFE_R - sw) / 2, 1330), sec, font=F_TITLE, fill=YELLOW)
    else:
        txt = "Bildin mi? Yorumlara yaz!"; tw = d.textlength(txt, font=F_HOOK)
        d.text(((SAFE_L + SAFE_R - tw) / 2, 1340), txt, font=F_HOOK, fill=YELLOW)
    return f


def draw_next(A, story, t, dur, prog):
    """Cliffhanger end card for parts 1..N-1."""
    f = Image.new("RGB", (W, H), NIGHT); d = ImageDraw.Draw(f); chrome(d, prog)
    bob = int(12 * math.sin(t * 3))
    a = back(t / 0.5); size = int(400 * max(0.05, a))
    m = A.m_think.resize((size, size), Image.LANCZOS)
    f.paste(m, ((SAFE_L + SAFE_R) // 2 - size // 2, 520 - size // 2 + bob), m)
    l1, l2 = story["next"]["lines"]
    a1 = back((t - 0.2) / 0.4)
    if t > 0.2:
        fn = font("nunito_extrabold.ttf", int(70 * (0.85 + 0.15 * min(1, a1))))
        tw = d.textlength(l1, font=fn); d.text(((SAFE_L + SAFE_R - tw) / 2, 820), l1, font=fn, fill=WHITE)
    a2 = back((t - 0.6) / 0.45)
    if t > 0.6:
        fn = font("baloo2_extrabold.ttf", int(92 * (0.8 + 0.2 * min(1, a2))))
        tw = d.textlength(l2, font=fn)
        d.rounded_rectangle(((SAFE_L + SAFE_R - tw) / 2 - 40, 930, (SAFE_L + SAFE_R + tw) / 2 + 40, 1090), radius=50, fill=YELLOW, outline=INK, width=6)
        d.text(((SAFE_L + SAFE_R - tw) / 2, 935), l2, font=fn, fill=INK)
    if t > 1.0:
        txt = "Takip et, kaçırma!"; tw = d.textlength(txt, font=F_HOOK)
        d.text(((SAFE_L + SAFE_R - tw) / 2, 1140), txt, font=F_HOOK, fill=WHITE)
        txt = "Hikâyenin tamamı English Tales'te"; tw = d.textlength(txt, font=F_SMALL)
        d.text(((SAFE_L + SAFE_R - tw) / 2, 1240), txt, font=F_SMALL, fill=(200, 225, 240))
    return f


def draw_cta(A, story, t, dur, prog):
    f = Image.new("RGB", (W, H), ORANGE); d = ImageDraw.Draw(f); chrome(d, prog)
    # confetti
    rng = np.random.default_rng(7)
    for j in range(40):
        x = rng.uniform(0, W); sp = rng.uniform(250, 520); y = (rng.uniform(-H, 0) + sp * t * 1.0) % (H + 100) - 50
        c = [YELLOW, WHITE, NIGHT, GREEN][j % 4]; r = rng.uniform(8, 16)
        d.rounded_rectangle((x, y, x + r * 1.6, y + r), radius=3, fill=c)
    a = back(t / 0.5); size = int(440 * max(0.05, a)); bob = int(12 * math.sin(t * 4))
    m = A.m_cel.resize((size, size), Image.LANCZOS)
    f.paste(m, ((SAFE_L + SAFE_R) // 2 - size // 2, 470 - size // 2 + 200 + bob), m)
    y = 920
    for txt, fn in [("Her gün 1 kısa masal,", F_HOOK), ("İngilizcen kendiliğinden gelişsin.", F_TR)]:
        tw = d.textlength(txt, font=fn); d.text(((SAFE_L + SAFE_R - tw) / 2, y), txt, font=fn, fill=INK); y += 84
    ba = back((t - 0.35) / 0.45)
    if t > 0.35:
        cy = 1110 + int(60 * (1 - min(1, ba)))
        d.rounded_rectangle((SAFE_L - 10, cy, SAFE_R + 10, cy + 260), radius=46, fill=WHITE, outline=INK, width=6)
        if A.icon:
            ic = A.icon.resize((170, 170), Image.LANCZOS); f.paste(ic, (SAFE_L + 30, cy + 45), ic)
        d.text((SAFE_L + 225, cy + 40), "English Tales", font=F_APP, fill=INK)
        d.text((SAFE_L + 228, cy + 150), "Google Play'de ücretsiz", font=F_SMALL, fill=MUTED)
    return f


# ---------------------------------------------------------------- assemble
def select_part(story, n):
    parts = story.get("parts")
    if not parts: return story
    p = parts[n - 1]; st = dict(story)
    st["sentences"] = story["sentences"][p["from"]:p["to"]]; st["_offset"] = p["from"]
    st["hook"], st["quiz"], st["title_say"] = p["hook"], p["quiz"], p["say"]
    if "teaser" in p:
        ts = story["sentences"][p["teaser"]]
        st["teaser_en"], st["teaser_shot"] = ts["en"], ts["shot"]; st["_teaser_gi"] = p["teaser"]
        st["hook_big"], st["hook_small"] = p["hook_big"], p["hook_small"]
    st["next"] = p.get("next"); st["cta_say"] = p.get("cta_say", story.get("cta_say", ""))
    st["_part"], st["_parts"] = n, len(parts)
    if n > 1:  # open on the shot where the previous part ended
        st["intro_shot"] = story["sentences"][p["from"] - 1]["shot"]
    return st


def main():
    story = json.load(open(sys.argv[1])); out = sys.argv[2]
    story = select_part(story, int(sys.argv[3]) if len(sys.argv) > 3 else 1)
    clips = synth_lines(story)
    dur = lambda k: len(clips[k]) / SR

    # timeline: (kind, idx, start, length, extra)
    tl = []; t = 0.0
    if story.get("teaser_en"):
        if "hook_tr" in clips:  # Turkish voiced hook: question, then the challenge
            d = dur("hook_tr"); hook_len = 0.1 + d + 0.35
            big, small = story["hook_big"], story["hook_small"]
            story["_small_at"] = 0.1 + d * len(big) / (len(big) + len(small) + 1)
            story["_no_bubble"] = True
            tl.append(("hook", 0, t, hook_len, {"voice": ("hook_tr", 0.1), "speech": (0.1, 0.1 + d)})); t += hook_len
        else:
            hook_len = max(2.4, 0.15 + dur("teaser") + 0.6)
            tl.append(("hook", 0, t, hook_len, {"voice": ("teaser", 0.15), "speech": (0.15, 0.15 + dur("teaser"))})); t += hook_len
    else:
        intro_len = max(2.6, dur("title") + 1.4)
        tl.append(("intro", 0, t, intro_len, {"voice": ("title", 0.5)})); t += intro_len
    for i, s in enumerate(story["sentences"]):
        lead = 0.5; sp = dur(f"s{i}")
        tr_at = lead + sp + 0.4
        s2 = tr_at + 1.0 + 0.025 * len(s["tr"])  # time to read the Turkish before the second listen
        length = s2 + sp + 0.6
        tl.append(("sent", i, t, length, {"voice": (f"s{i}", lead), "voice2": (f"s{i}", s2),
                                          "speech": (lead, lead + sp), "speech2": (s2, s2 + sp), "tr_at": tr_at})); t += length
    qlead = 0.5; qsp = dur("quiz"); reveal = qlead + qsp + 3.0
    qlen = reveal + 1.8
    tl.append(("quiz", 0, t, qlen, {"voice": ("quiz", qlead), "speech_end": qlead + qsp, "reveal": reveal})); t += qlen
    clen = dur("cta") + 1.6
    tl.append(("cta", 0, t, clen, {"voice": ("cta", 0.6)})); t += clen
    total = t; story["_total"] = total

    # ---- audio mix
    n = int(total * SR) + SR
    voice = np.zeros(n, np.float32); fx = np.zeros(n, np.float32)
    def put(buf, clip, at):
        s0 = int(at * SR); e = min(n, s0 + len(clip)); buf[s0:e] += clip[: e - s0]
    for kind, idx, st, ln, ex in tl:
        k, off = ex["voice"]; put(voice, clips[k], st + off)
        if "voice2" in ex: k2, off2 = ex["voice2"]; put(voice, clips[k2], st + off2)
        if "tr_at" in ex: put(fx, sfx_pop() * 0.5, st + ex["tr_at"])
        if kind == "sent": put(fx, sfx_whoosh() * 0.5, st); put(fx, sfx_pop() * 0.6, st + 0.12)
        if kind == "intro": put(fx, sfx_pop() * 0.8, st + 0.05)
        if kind == "hook": put(fx, sfx_hit(), st)
        if kind == "quiz":
            put(fx, sfx_whoosh() * 0.6, st)
            for sec in range(3): put(fx, sfx_tick(), st + ex["speech_end"] + sec * 1.0)
            put(fx, sfx_ding(), st + ex["reveal"])
        if kind == "cta": put(fx, sfx_sparkle(), st + 0.2)
    # key-word pops
    for kind, idx, st, ln, ex in tl:
        if kind != "sent": continue
        s = story["sentences"][idx]; words = s["en"].split(); times = word_times(words, *ex["speech"])
        for j, w in enumerate(words):
            if w.strip("“”.,!?\"").lower() == s["key"].lower(): put(fx, sfx_pop() * 0.35, st + times[j][0])
    music = np.zeros(n, np.float32); mb = music_bed(total); music[: len(mb)] = mb
    # duck music under the voice
    envv = np.convolve(np.abs(voice), np.ones(4800) / 4800, "same")
    duck = 1.0 - 0.55 * np.clip(envv / 0.02, 0, 1)
    mix = voice * 1.0 + fx * 0.9 + music * duck * 0.9
    mix = mix[: int(total * SR)]
    mix /= max(1.0, np.abs(mix).max() / 0.95)
    wav = os.path.join(HERE, "mix.wav"); sf.write(wav, mix, SR)

    # ---- frames
    A = Assets(story); fdir = os.path.join(HERE, "frames2")
    shutil.rmtree(fdir, ignore_errors=True); os.makedirs(fdir)
    nf = int(round(total * FPS)); prev_shot = story["intro_shot"]; shots = {}
    p = story["intro_shot"]
    for kind, idx, st, ln, ex in tl:
        if kind == "sent": shots[idx] = p; p = story["sentences"][idx]["shot"]
    for fi in range(nf):
        tt = fi / FPS; prog = tt / total
        for kind, idx, st, ln, ex in tl:
            if st <= tt < st + ln or (kind == "cta"): break
        lt = tt - st
        if kind == "intro": img = draw_intro(A, story, lt, ln, prog)
        elif kind == "hook": img = draw_hook(A, story, lt, ln, ex["speech"], prog)
        elif kind == "sent": img = draw_sentence(A, story, idx, lt, ln, ex, prog, shots[idx])
        elif kind == "quiz": img = draw_quiz(A, story, lt, ln, ex["speech_end"], ex["reveal"], prog)
        else: img = draw_next(A, story, lt, ln, prog) if story.get("next") else draw_cta(A, story, lt, ln, prog)
        img.save(os.path.join(fdir, f"f{fi:05d}.png"), compress_level=1)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(fdir, "f%05d.png"),
                    "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19",
                    "-preset", "medium", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out], check=True)
    json.dump([[k, i, round(s, 2), round(l, 2)] for k, i, s, l, _ in tl], open(os.path.join(HERE, "timeline.json"), "w"))
    print("total", round(total, 2), "s ->", out)


if __name__ == "__main__":
    main()
