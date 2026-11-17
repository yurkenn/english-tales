"""Cover images (1080x1920) for each part of a story series.

python3 make_cover.py story_fox_crow.json out_dir
Uses the story's cut-out rig for a dramatic pose, the part's hook_big question and a PART badge.
Key text stays inside the Instagram grid crop (centre 1080x1440) and the TikTok safe area.
"""
import importlib, json, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.environ.get("ET_RES", os.path.join(HERE, "..", "..", "native-android", "app", "src", "main", "res"))
W, H = 1080, 1920
YELLOW = (255, 206, 0); INK = (43, 21, 0); WHITE = (255, 255, 255); ORANGE = (255, 138, 0)

def font(name, size):
    return ImageFont.truetype(os.path.join(RES, "font", name), size)

# Per-part pose: (global sentence index, time, speech window, focus x 0..1, sound word)
POSES = {
    "cutout_fox_crow": [
        (2, 0.30, (0.0, 2.0), 0.55, None),        # fox jumps for the meat
        (8, 1.55, (0.0, 2.0), 0.40, "CAW!"),      # crow opens her beak, meat slips
        (10, 1.40, (0.0, 2.0), 0.55, "HA HA!"),   # fox has the meat and laughs
    ]
}

def wrap(draw, text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=f) <= maxw: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return lines

def gradient(h, top_alpha, bottom_alpha):
    g = Image.new("L", (1, h))
    for y in range(h): g.putpixel((0, y), int(top_alpha + (bottom_alpha - top_alpha) * y / (h - 1)))
    return g.resize((W, h))

def pill(d, xy, text, f, fill, fg, pad=(28, 10)):
    x, y = xy; tw = d.textlength(text, font=f); asc, desc = f.getmetrics()
    box = (x, y, x + tw + pad[0] * 2, y + asc + desc + pad[1] * 2)
    d.rounded_rectangle(box, radius=(box[3] - box[1]) // 2, fill=fill)
    d.text((x + pad[0], y + pad[1]), text, font=f, fill=fg)
    return box

NAVY = (14, 34, 66); CREAM = (255, 244, 222); NAVY_INK = (20, 26, 52)
ART_Y = 520          # where the illustration starts
ART_S = 0.9          # illustration scale (2x layer size -> screen)

def duotone(img):
    g = img.convert("L")
    lut = [tuple(int(NAVY_INK[c] + (CREAM[c] - NAVY_INK[c]) * v / 255) for c in range(3)) for v in range(256)]
    r = g.point([l[0] for l in lut]); gg = g.point([l[1] for l in lut]); b = g.point([l[2] for l in lut])
    return Image.merge("RGB", (r, gg, b))

def cover(story, pi, rig, pose):
    part = story["parts"][pi]
    gi, t, sp, fx, sfx = pose
    art = duotone(rig.frame(gi, t, sp))
    art = art.resize((int(art.width * ART_S), int(art.height * ART_S)), Image.LANCZOS)
    img = Image.new("RGBA", (W, H), NAVY + (255,))
    img.paste(art, ((W - art.width) // 2, ART_Y))
    # fade the art's top edge into the navy band, and the bottom (TikTok UI area)
    shade = Image.new("RGBA", (W, H), NAVY + (0,))
    mask = Image.new("L", (W, H), 0)
    mask.paste(gradient(260, 255, 0), (0, ART_Y))
    mask.paste(gradient(300, 0, 230), (0, H - 300))
    shade.putalpha(mask); img = Image.alpha_composite(img, shade)
    d = ImageDraw.Draw(img)

    n = pi + 1; total = len(story["parts"])
    f_badge = font("baloo2_extrabold.ttf", 58)
    label = f"PART {n}" + (" · FİNAL" if n == total else f"/{total}")
    b = pill(d, (70, 262), label, f_badge, YELLOW, INK)
    title_tr = story.get("title_tr", story["title"])
    f_t = font("nunito_extrabold.ttf", 42)
    d.text((b[2] + 22, b[1] + (b[3] - b[1]) // 2), f"{title_tr} · {story.get('level', 'A1')}", font=f_t, fill=WHITE, anchor="lm")

    f_hook = font("baloo2_extrabold.ttf", 118)
    acc = (story.get("hook_accent") or [None] * total)[pi]
    lines = wrap(d, part["hook_big"], f_hook, W - 140)
    y = 372
    for ln in lines:
        x = 70; ws = ln.split()
        for i, w in enumerate(ws):
            word = w + (" " if i < len(ws) - 1 else "")
            col = YELLOW if acc and w.strip("?!.,").lower() == acc.lower() else WHITE
            d.text((x, y), word, font=f_hook, fill=col, stroke_width=6, stroke_fill=NAVY_INK)
            x += d.textlength(word, font=f_hook)
        y += 124

    if sfx:
        f_sfx = font("baloo2_extrabold.ttf", 124)
        layer = Image.new("RGBA", (760, 280), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
        ld.text((380, 140), sfx, font=f_sfx, fill=YELLOW, anchor="mm", stroke_width=12, stroke_fill=INK)
        layer = layer.rotate(-8, resample=Image.BICUBIC, expand=True)
        pos = SFX_POS.get(sfx, (700, 800))
        img.alpha_composite(layer, (pos[0] - layer.width // 2, pos[1] - layer.height // 2))
        d = ImageDraw.Draw(img)

    d.text((W // 2, 170), "@englishtales.app", font=font("nunito_extrabold.ttf", 38), fill=(170, 186, 214), anchor="mm")
    f_sub = font("nunito_extrabold.ttf", 40)
    d.text((W // 2, 1790), "İngilizce masal · Türkçe çeviri", font=f_sub, fill=YELLOW, anchor="mm")
    return img.convert("RGB")

SFX_POS = {"CAW!": (760, 820), "HA HA!": (820, 1300)}

def main():
    story = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    mod = story["cutout"]; sys.path.insert(0, HERE)
    rig = importlib.import_module(mod).Rig()
    base = story.get("slug", story["id"])
    for pi, pose in enumerate(POSES[mod]):
        p = os.path.join(out, f"{base}-part-{pi + 1}-kapak.jpg")
        cover(story, pi, rig, pose).save(p, quality=92); print(p)

if __name__ == "__main__":
    main()
