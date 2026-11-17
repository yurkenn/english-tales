"""Cut-out animation for The Fox and the Crow cover (Arthur Rackham illustration).

Layers (2x cover size, made by cut/layers.py): bg, crow, meat, fox.
frame(gi, t, speech) -> RGB image of the animated illustration for global sentence gi.
"""
import math, os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
CUT = os.path.join(HERE, "cut")
FONT = os.path.join(os.environ.get("ET_RES", os.path.join(HERE, "..", "..", "native-android", "app", "src", "main", "res")), "font", "baloo2_extrabold.ttf")

def ease(t):
    t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3

def ease_io(t):
    t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)


class Layer:
    def __init__(self, path, pad=220):
        im = Image.open(path).convert("RGBA")
        x0, y0, x1, y1 = im.getbbox()
        x0, y0 = max(0, x0 - pad), max(0, y0 - pad); x1, y1 = min(im.width, x1 + pad), min(im.height, y1 + pad)
        self.img = im.crop((x0, y0, x1, y1)); self.ox, self.oy = x0, y0

    def place(self, canvas, pivot, angle=0.0, dx=0.0, dy=0.0, scale=1.0, alpha=1.0):
        im = self.img
        px, py = pivot[0] - self.ox, pivot[1] - self.oy
        if scale != 1.0:
            im = im.resize((int(im.width * scale), int(im.height * scale)), Image.BICUBIC)
            px, py = px * scale, py * scale
        if angle:
            im = im.rotate(angle, center=(px, py), resample=Image.BICUBIC)
        if alpha < 1.0:
            a = im.getchannel("A").point(lambda v: int(v * alpha)); im = im.copy(); im.putalpha(a)
        canvas.alpha_composite(im, (int(round(pivot[0] - px + dx)), int(round(pivot[1] - py + dy))))


class Rig:
    CROW_PIVOT = (330, 410)     # crow's feet on the branch
    FOX_PIVOT = (900, 1730)     # fox's base
    MEAT_C = (480, 262)         # meat centre in the beak
    GROUND = (720, 1610)        # where the meat lands
    MOUTH = (612, 1212)         # fox's mouth

    def __init__(self):
        self.bg = Image.open(os.path.join(CUT, "bg.png")).convert("RGBA")
        self.crow = Layer(os.path.join(CUT, "crow.png"))
        self.meat = Layer(os.path.join(CUT, "meat.png"), pad=60)
        self.fox = Layer(os.path.join(CUT, "fox.png"))
        self.size = self.bg.size
        self.font = ImageFont.truetype(FONT, 110)

    # ---- pose helpers
    @staticmethod
    def rot(p, c, ang):
        a = math.radians(-ang); x, y = p[0] - c[0], p[1] - c[1]
        return (c[0] + x * math.cos(a) - y * math.sin(a), c[1] + x * math.sin(a) + y * math.cos(a))

    def bubble(self, canvas, text, xy, t_in, t):
        if t < t_in: return
        a = ease((t - t_in) / 0.25); s = 0.6 + 0.4 * a
        f = ImageFont.truetype(FONT, int(95 * s))
        d = ImageDraw.Draw(canvas)
        d.text(xy, text, font=f, fill=(255, 206, 0), anchor="mm", stroke_width=10, stroke_fill=(43, 21, 0))

    def sparkles(self, canvas, center, t):
        d = ImageDraw.Draw(canvas)
        for k in range(6):
            ang = k * 1.047 + t * 1.5; r = 150 + 25 * math.sin(t * 4 + k)
            x, y = center[0] + r * math.cos(ang), center[1] + r * 0.7 * math.sin(ang)
            s = 14 + 8 * math.sin(t * 6 + k * 2)
            if s <= 2: continue
            d.polygon([(x, y - s * 2), (x + s * 0.5, y - s * 0.5), (x + s * 2, y), (x + s * 0.5, y + s * 0.5),
                       (x, y + s * 2), (x - s * 0.5, y + s * 0.5), (x - s * 2, y), (x - s * 0.5, y - s * 0.5)],
                      fill=(255, 206, 0), outline=(43, 21, 0))

    # ---- the story, one pose per sentence
    def frame(self, gi, t, speech):
        s0, s1 = speech; sp = max(0.1, s1 - s0); u = (t - s0) / sp  # 0..1 across the spoken line
        crow = dict(angle=0.0, dx=0.0, dy=0.0, scale=1.0)
        fox = dict(angle=0.0, dx=0.0, dy=0.0)
        meat = "beak"; meat_pos = None; meat_ang = 0.0
        fx_text = None; spark = False
        bob = 5 * math.sin(t * 2.6)

        if gi == 0:   # crow sits with the meat
            crow["dy"] = bob
        elif gi == 1:  # fox appears and looks up
            fox["dx"] = 260 * (1 - ease(t / 0.9)); fox["angle"] = 3 * math.sin(t * 2)
        elif gi == 2:  # he cannot climb: hops and fails
            hop = abs(math.sin(max(0, t - s0) * 5.5)) if s0 <= t <= s1 + 0.6 else 0
            fox["dy"] = -110 * hop
        elif gi in (3, 5, 11):  # fox talking
            talk = 1 if s0 <= t <= s1 else 0
            fox["dy"] = -10 * abs(math.sin(t * 11)) * talk; fox["angle"] = 2 * math.sin(t * 5) * talk
            crow["dy"] = bob * 0.5
        elif gi == 4:  # feathers: crow puffs up, sparkles
            crow["scale"] = 1 + 0.035 * (1 + math.sin(t * 5)) / 2; spark = True
            fox["dy"] = -8 * abs(math.sin(t * 11)) * (1 if s0 <= t <= s1 else 0)
        elif gi == 6:  # proud: head up, chest out
            crow["angle"] = 8 * ease_io(t / 0.8); crow["scale"] = 1 + 0.05 * ease_io(t / 0.8)
        elif gi == 7:  # wants to show her voice
            crow["angle"] = 8 + 2 * math.sin(t * 3); crow["scale"] = 1.05
        elif gi == 8:  # opens beak: CAW, meat slips
            open_t = s0 + 0.55 * sp
            k = ease((t - open_t) / 0.18)
            crow["angle"] = 8 + 12 * k; crow["scale"] = 1.05
            if t >= open_t:
                fx_text = ("CAW!", (470, 470), open_t)
                meat = "free"
                pivot = self.CROW_PIVOT
                start = self.rot(self.MEAT_C, pivot, 8)
                lift = math.sin(min(1, (t - open_t) / 0.5) * math.pi) * 40
                meat_pos = (start[0] + 40 * ease((t - open_t) / 0.5), start[1] - lift)
                meat_ang = -25 * ease((t - open_t) / 0.5)
        elif gi == 9:  # meat falls to the ground
            crow["angle"] = 20 - 14 * ease(t / 1.2); crow["scale"] = 1.05 - 0.05 * ease(t / 1.2)
            start = self.rot(self.MEAT_C, self.CROW_PIVOT, 8); start = (start[0] + 40, start[1])
            ft = max(0.0, t - 0.15); dur = 1.1
            p = min(1.0, ft / dur)
            y = start[1] + (self.GROUND[1] - start[1]) * p * p
            x = start[0] + (self.GROUND[0] - start[0]) * p
            if p >= 1:  # little bounce
                b = max(0.0, ft - dur); y -= abs(math.sin(b * 9)) * 50 * math.exp(-b * 4)
            meat = "free"; meat_pos = (x, y); meat_ang = -25 - 400 * min(p, 1) + (0 if p < 1 else 0)
            if p >= 1: fx_text = ("PLOP!", (self.GROUND[0] - 40, self.GROUND[1] - 190), 0.15 + dur)
        elif gi == 10:  # fox picks it up and laughs
            k = ease_io((t - 0.2) / 0.7)
            meat = "free"
            meat_pos = (self.GROUND[0] + (self.MOUTH[0] - self.GROUND[0]) * k, self.GROUND[1] + (self.MOUTH[1] - self.GROUND[1]) * k)
            meat_ang = -425 + 15 * k
            fox["angle"] = -6 * math.sin(k * math.pi)
            if t > 0.9:
                fox["dy"] = -14 * abs(math.sin(t * 10)); meat_pos = (meat_pos[0], meat_pos[1] + fox["dy"])
                fx_text = ("HA HA!", (830, 945), 0.9)
            crow["angle"] = 6; crow["scale"] = 1.0
        elif gi == 12:  # crow watches him leave
            crow["angle"] = 6 - 16 * ease_io(t / 1.2); crow["dy"] = 10 * ease_io(t / 1.2)
            fox["dx"] = 900 * ease_io((t - 0.3) / 2.5)
        elif gi == 13:  # moral: calm wide shot
            crow["angle"] = -6; fox["dx"] = 0

        if gi in (11, 12, 13):
            meat = "fox"
        if gi in (10, 11, 12, 13) and gi != 12:
            pass
        if gi >= 9 and gi not in (8,):
            crow.setdefault("angle", 0)

        c = self.bg.copy()
        self.fox.place(c, self.FOX_PIVOT, fox["angle"], fox["dx"], fox["dy"])
        if meat == "fox":
            mp = (self.MOUTH[0] + fox["dx"], self.MOUTH[1] + fox["dy"])
            self.meat.place(c, self.MEAT_C, -410, mp[0] - self.MEAT_C[0], mp[1] - self.MEAT_C[1])
        self.crow.place(c, self.CROW_PIVOT, crow["angle"], crow["dx"], crow["dy"], crow["scale"])
        if meat == "beak":
            # meat rides with the crow's pose
            p = self.rot(self.MEAT_C, self.CROW_PIVOT, crow["angle"])
            p = (self.CROW_PIVOT[0] + (p[0] - self.CROW_PIVOT[0]) * crow["scale"], self.CROW_PIVOT[1] + (p[1] - self.CROW_PIVOT[1]) * crow["scale"] + crow["dy"])
            self.meat.place(c, self.MEAT_C, crow["angle"], p[0] - self.MEAT_C[0], p[1] - self.MEAT_C[1], crow["scale"])
        elif meat == "free" and meat_pos:
            self.meat.place(c, self.MEAT_C, meat_ang, meat_pos[0] - self.MEAT_C[0], meat_pos[1] - self.MEAT_C[1])
        if spark: self.sparkles(c, (420, 230), t)
        self.last_fx = (fx_text[0], fx_text[2]) if fx_text else None
        return c.convert("RGB")
