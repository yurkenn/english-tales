"""Render a 9:16 English Tales story short as PNG frames, then encode with ffmpeg.

Usage: python3 render.py [timings.json] [audio.mp3]
timings.json (optional): {"title": [start, end], "sentences": [[start, end], ...]} in seconds of the audio.
Without it, durations are estimated from sentence length.
"""
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 30
OUT = os.path.join(HERE, "frames")

CREAM = (255, 247, 230)
INK = (43, 21, 0)
ORANGE = (255, 138, 0)
YELLOW = (255, 206, 0)
GREEN = (52, 168, 83)
NIGHT = (11, 61, 92)
MUTED = (120, 96, 70)
WHITE = (255, 255, 255)

def font(name, size):
    return ImageFont.truetype(os.path.join(HERE, name), size)

F_TITLE = font("baloo2_extrabold.ttf", 96)
F_HOOK = font("nunito_extrabold.ttf", 64)
F_EN = font("nunito_extrabold.ttf", 70)
F_TR = font("nunito_semibold.ttf", 48)
F_CHIP = font("nunito_extrabold.ttf", 44)
F_SMALL = font("nunito_bold.ttf", 38)
F_BRAND = font("baloo2_extrabold.ttf", 120)

STORY = "The Fox and the Crow"
SENTENCES = [
    ("A crow sits on a branch with a piece of meat.", "Bir karga, gagasında bir parça etle bir dalda oturur.", "branch", "dal"),
    ("A fox sees the meat and wants it.", "Bir tilki eti görür ve onu ister.", "fox", "tilki"),
    ("So he begins to praise the crow.", "Bu yüzden kargayı övmeye başlar.", "praise", "övmek"),
    ("“What beautiful feathers you have!” he says.", "“Ne güzel tüylerin var!” der.", "feathers", "tüyler"),
    ("“You must have a beautiful voice, too.”", "“Sesin de güzel olmalı.”", "voice", "ses"),
    ("She opens her beak and makes a loud sound.", "Gagasını açar ve yüksek bir ses çıkarır.", "beak", "gaga"),
    ("The meat falls to the ground.", "Et yere düşer.", "ground", "yer"),
    ("Flattery is not always friendship.", "Pohpohlamak her zaman dostluk değildir.", "Flattery", "pohpohlama"),
]

cover = Image.open(os.path.join(HERE, "cover_classic_fox_crow.webp")).convert("RGB")
mascot_cel = Image.open(os.path.join(HERE, "mascot_celebrate.webp")).convert("RGBA")
mascot_think = Image.open(os.path.join(HERE, "mascot_thinking.webp")).convert("RGBA")
app_icon_path = "/home/user/english-tales/native-android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png"
app_icon = Image.open(app_icon_path).convert("RGBA") if os.path.exists(app_icon_path) else None


def ease(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def wrap(draw, text, fnt, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if draw.textlength(test, font=fnt) <= maxw:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def cover_layer(t, height=1100, dim=0.0):
    """Ken Burns pan/zoom on the illustration, filling the top of the frame."""
    z = 1.0 + 0.08 * t
    cw = int(W / z)
    ch = int(height / z)
    scale = max(cw / cover.width, ch / cover.height)
    img = cover.resize((int(cover.width * scale) + 1, int(cover.height * scale) + 1), Image.LANCZOS)
    ox = (img.width - cw) // 2
    oy = int((img.height - ch) * min(0.35, 0.02 * t))
    img = img.crop((ox, oy, ox + cw, oy + ch)).resize((W, height), Image.LANCZOS)
    if dim:
        img = Image.blend(img, Image.new("RGB", img.size, INK), dim)
    return img


def base(t):
    frame = Image.new("RGB", (W, H), CREAM)
    frame.paste(cover_layer(t), (0, 0))
    # soft fade from illustration into cream
    grad = Image.new("L", (1, 320))
    for y in range(320):
        grad.putpixel((0, y), int(255 * ease(y / 319)))
    grad = grad.resize((W, 320))
    frame.paste(Image.new("RGB", (W, 320), CREAM), (0, 1100 - 320), grad)
    return frame


def rounded(draw, box, r, fill, outline=None, width=0):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def brand_pill(draw):
    txt = "English Tales"
    tw = draw.textlength(txt, font=F_SMALL)
    rounded(draw, (40, 70, 40 + tw + 56, 140), 35, (255, 255, 255), outline=INK, width=4)
    draw.text((68, 78), txt, font=F_SMALL, fill=INK)


def draw_intro(t, dur):
    frame = base(t)
    d = ImageDraw.Draw(frame)
    brand_pill(d)
    a = ease(t / 0.5)
    y = 1030 + int(60 * (1 - a))
    # level chip
    rounded(d, (80, y, 300, y + 74), 37, YELLOW, outline=INK, width=4)
    d.text((112, y + 10), "A1 masal", font=F_SMALL, fill=INK)
    d.text((80, y + 100), STORY, font=F_TITLE, fill=INK)
    hook = ["Bu masalı İngilizce", "anlayabilecek misin?"]
    for i, line in enumerate(hook):
        aa = ease((t - 0.4 - i * 0.2) / 0.4)
        if aa > 0:
            d.text((80, y + 260 + i * 84), line, font=F_HOOK, fill=ORANGE if i else INK)
    return frame


def draw_sentence(i, t, dur):
    en, tr, key, key_tr = SENTENCES[i]
    frame = base(t + i * 3)
    d = ImageDraw.Draw(frame)
    brand_pill(d)
    # progress dots
    n = len(SENTENCES)
    for k in range(n):
        x = W - 60 - (n - k) * 44
        fill = ORANGE if k <= i else (230, 214, 190)
        d.ellipse((x, 92, x + 26, 118), fill=fill, outline=INK if k == i else None, width=3)

    # card slides up
    a = ease(t / 0.35)
    top = 960 + int(80 * (1 - a))
    rounded(d, (50, top, W - 50, top + 560), 48, WHITE, outline=INK, width=5)

    # English words reveal across the first ~60% of the clip
    words = en.split()
    lines = wrap(d, en, F_EN, W - 200)
    reveal = ease(t / max(0.6, dur * 0.6)) * len(words) + 0.6
    y = top + 60
    wi = 0
    for line in lines:
        x = 100
        for w in line.split():
            visible = wi < reveal
            clean = w.strip("“”.,!?").lower()
            is_key = clean == key.lower()
            ww = d.textlength(w, font=F_EN)
            if visible:
                if is_key:
                    rounded(d, (x - 10, y + 6, x + ww + 10, y + 92), 18, YELLOW)
                d.text((x, y), w, font=F_EN, fill=INK)
            else:
                d.text((x, y), w, font=F_EN, fill=(236, 226, 210))
            x += ww + d.textlength(" ", font=F_EN)
            wi += 1
        y += 96

    # Turkish line fades in after the English is read
    ta = ease((t - dur * 0.55) / 0.4)
    if ta > 0:
        y += 18
        col = tuple(int(WHITE[c] + (MUTED[c] - WHITE[c]) * ta) for c in range(3))
        for line in wrap(d, tr, F_TR, W - 200):
            d.text((100, y), line, font=F_TR, fill=col)
            y += 64

    # key word chip under the card
    ca = ease((t - 0.5) / 0.35)
    if ca > 0:
        chip = f"{key.lower()} = {key_tr}"
        cw = d.textlength(chip, font=F_CHIP)
        cy = top + 560 + 40 + int(30 * (1 - ca))
        rounded(d, (80, cy, 80 + cw + 70, cy + 84), 42, NIGHT)
        d.text((115, cy + 14), chip, font=F_CHIP, fill=WHITE)
    return frame


QUIZ = ("“flattery” ne demek?", ["dostluk", "pohpohlama", "cesaret"], 1)


def draw_quiz(t, dur):
    frame = Image.new("RGB", (W, H), NIGHT)
    d = ImageDraw.Draw(frame)
    brand_pill(d)
    m = mascot_think.resize((360, 360), Image.LANCZOS)
    frame.paste(m, (W // 2 - 180, 260), m)
    q, opts, ans = QUIZ
    tw = d.textlength(q, font=F_HOOK)
    d.text(((W - tw) / 2, 680), q, font=F_HOOK, fill=WHITE)
    reveal_at = dur - 1.6
    for k, o in enumerate(opts):
        a = ease((t - 0.2 - k * 0.15) / 0.3)
        if a <= 0:
            continue
        y = 840 + k * 150 + int(40 * (1 - a))
        fill, txtc = WHITE, INK
        if t >= reveal_at:
            if k == ans:
                fill, txtc = GREEN, WHITE
            else:
                fill = (200, 210, 218)
        rounded(d, (120, y, W - 120, y + 120), 30, fill, outline=INK, width=4)
        d.text((170, y + 28), f"{'ABC'[k]})  {o}", font=F_HOOK, fill=txtc)
    # countdown bar
    if t < reveal_at:
        p = t / reveal_at
        rounded(d, (120, 1330, W - 120, 1354), 12, (40, 90, 120))
        rounded(d, (120, 1330, 120 + int((W - 240) * (1 - p)), 1354), 12, YELLOW)
        d.text((120, 1380), "Cevabını yorumlara yaz!", font=F_SMALL, fill=(200, 225, 240))
    else:
        d.text((120, 1380), "Doğru cevap: B) pohpohlama", font=F_SMALL, fill=YELLOW)
    return frame


def draw_cta(t, dur):
    frame = Image.new("RGB", (W, H), ORANGE)
    d = ImageDraw.Draw(frame)
    a = ease(t / 0.5)
    bob = int(12 * math.sin(t * 4))
    size = int(460 * (0.8 + 0.2 * a))
    m = mascot_cel.resize((size, size), Image.LANCZOS)
    frame.paste(m, (W // 2 - size // 2, 330 + bob), m)
    lines = [("Her gün 1 kısa masal,", F_HOOK, INK), ("İngilizcen kendiliğinden gelişsin.", F_TR, INK)]
    y = 860
    for txt, f, c in lines:
        tw = d.textlength(txt, font=f)
        d.text(((W - tw) / 2, y), txt, font=f, fill=c)
        y += 90
    # app card
    ba = ease((t - 0.3) / 0.4)
    cy = 1100 + int(60 * (1 - ba))
    rounded(d, (110, cy, W - 110, cy + 300), 48, WHITE, outline=INK, width=6)
    if app_icon:
        ic = app_icon.resize((180, 180), Image.LANCZOS)
        frame.paste(ic, (150, cy + 60), ic)
    d.text((360, cy + 50), "English Tales", font=font("baloo2_extrabold.ttf", 84), fill=INK)
    d.text((362, cy + 170), "Google Play'de ücretsiz", font=F_SMALL, fill=MUTED)
    txt = "Takip et, yarın yeni masal!"
    tw = d.textlength(txt, font=F_SMALL)
    d.text(((W - tw) / 2, cy + 360), txt, font=F_SMALL, fill=INK)
    return frame


def main():
    timings = None
    audio = None
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        timings = json.load(open(sys.argv[1]))
    if len(sys.argv) > 2:
        audio = sys.argv[2]

    # Build a scene list: (kind, index, duration)
    scenes = []
    if timings:
        title_end = timings["sentences"][0][0]
        scenes.append(("intro", 0, max(2.8, title_end)))
        sents = timings["sentences"]
        for k, (s, e) in enumerate(sents):
            nxt = sents[k + 1][0] if k + 1 < len(sents) else e + 1.2
            scenes.append(("sent", k, nxt - s))
    else:
        scenes.append(("intro", 0, 3.0))
        for k, (en, *_rest) in enumerate(SENTENCES):
            scenes.append(("sent", k, 2.4 + 0.045 * len(en)))
    scenes.append(("quiz", 0, 5.5))
    scenes.append(("cta", 0, 4.5))

    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        os.remove(os.path.join(OUT, f))
    n = 0
    for kind, idx, dur in scenes:
        frames = int(round(dur * FPS))
        for fi in range(frames):
            t = fi / FPS
            if kind == "intro":
                img = draw_intro(t, dur)
            elif kind == "sent":
                img = draw_sentence(idx, t, dur)
            elif kind == "quiz":
                img = draw_quiz(t, dur)
            else:
                img = draw_cta(t, dur)
            img.save(os.path.join(OUT, f"f{n:05d}.png"), compress_level=1)
            n += 1
    total = n / FPS
    print("frames", n, "seconds", round(total, 2))
    json.dump([(k, i, d) for k, i, d in scenes], open(os.path.join(HERE, "scenes.json"), "w"))

    out = os.path.join(HERE, "out.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(OUT, "f%05d.png")]
    if audio:
        cmd += ["-i", audio, "-filter_complex", f"[1:a]apad,atrim=0:{total}[a]", "-map", "0:v", "-map", "[a]", "-c:a", "aac", "-b:a", "160k"]
    cmd += ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
    print("wrote", out)


if __name__ == "__main__":
    main()
