"""Aslan ve Fare: HyperFrames composition with word-by-word highlighted captions + a hook.

Run from anywhere:
  python3 tools/build.py            # writes index.html, assets/hook.wav, assets/kapanis.mp4, assets/timing.json
  npx --yes hyperframes@0.9.20 check
  npx --yes hyperframes@0.9.20 render -o render/raw.mp4
  ffmpeg -i render/raw.mp4 -c:v libx264 -crf 20 -pix_fmt yuv420p -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -movflags +faststart ../../videolar/aslan-ve-fare-v2.mp4

Inputs
  ../../uretici/kagit/story_lion_mouse.json   sentences (display text: en / tr)
  ../../videolar/aslan-ve-fare.mp4             v1 render: its narration (Kokoro af_heart) and its quiz/CTA tail are reused
  assets/transcript.json                       `hyperframes transcribe assets/anlatim.wav -m small -l en`
Word times = whisper word timings, re-fitted inside the real speech segments (ffmpeg silencedetect),
so a highlight never runs ahead of / behind the voice at sentence edges.
"""
import html, json, os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
os.chdir(ROOT)
SM = os.path.join(ROOT, "..", "..")
STORY = json.load(open(os.path.join(SM, "uretici", "kagit", "story_lion_mouse.json")))
V1 = os.path.join(SM, "videolar", "aslan-ve-fare.mp4")
W, H = 1080, 1920

# ---- v1 timeline (scene cuts measured with ffmpeg scene detection on V1) ----
CUTS = [0.0, 2.9, 5.4333, 8.3667, 11.3, 13.5667, 16.2333, 18.9333, 21.2333, 23.3, 26.2667, 28.2667]
QUIZ_AT, V1_END = 30.9667, 39.8

# ---- hook ----
HOOK = 2.6                       # seconds before the story starts
HOOK_IMG = "08.png"              # lion roaring in the net (flash-forward)
HOOK_AUDIO = (18.90, 20.12)      # "Help! Help!" taken from the narration
HOOK_AUDIO_AT = 0.25
HOOK_LINES = [["Minik", "fare", "aslanı"], ["kurtarabilir", "mi?"]]
HOOK_MARK = {"fare", "aslanı"}
HOOK_PILL = "İNGİLİZCE MASAL · A1"


def sh(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def speech_segments(path):
    out = sh(["ffmpeg", "-hide_banner", "-i", path, "-af", "silencedetect=n=-38dB:d=0.18", "-f", "null", "-"]).stderr
    marks = [(m.group(1), float(m.group(2))) for m in re.finditer(r"silence_(start|end): ([0-9.]+)", out)]
    segs, cur = [], 0.0
    for kind, t in marks:
        if kind == "start":
            if t - cur > 0.05:
                segs.append((cur, t))
        else:
            cur = t
    return segs


def fit_words(words, segs, toks=None):
    """Map whisper word times into the true speech segments of one sentence."""
    if not segs:
        return [(w["start"], w["end"]) for w in words]
    a, b = words[0]["start"], words[-1]["end"]
    s0, s1 = segs[0][0], segs[-1][1]
    lin = lambda t: s0 + (t - a) / max(1e-6, b - a) * (s1 - s0)
    # split the sentence at punctuation tokens nearest to each pause between speech segments
    punct = [k for k, w in enumerate(toks[:-1]) if w.rstrip("”\"'")[-1:] in ".,!?;:"] if toks else []
    cuts = []
    for g in range(len(segs) - 1):
        pause = (segs[g][1] + segs[g + 1][0]) / 2
        cand = [k for k in punct if k not in cuts and (not cuts or k > cuts[-1])] or [k for k in range(len(words) - 1) if not cuts or k > cuts[-1]]
        cuts.append(min(cand, key=lambda k: abs(lin(words[k]["end"]) - pause)))
    bounds = [-1] + cuts + [len(words) - 1]
    groups = [list(range(bounds[g] + 1, bounds[g + 1] + 1)) for g in range(len(segs))]
    # keep groups contiguous and non-empty in order
    out = [None] * len(words)
    for (ss, se), idx in zip(segs, groups):
        if not idx:
            continue
        ga, gb = words[idx[0]]["start"], words[idx[-1]]["end"]
        for k in idx:
            f = lambda t: ss + (t - ga) / max(1e-6, gb - ga) * (se - ss)
            out[k] = (round(f(words[k]["start"]), 3), round(f(words[k]["end"]), 3))
    last = segs[0][0]
    for k in range(len(out)):
        if out[k] is None:
            out[k] = (last, last + 0.2)
        last = out[k][1]
    return out


def build_timing():
    tr = json.load(open("assets/transcript.json"))
    segs = speech_segments("assets/anlatim.wav")
    sents, p = [], 0
    for i, s in enumerate(STORY["sentences"]):
        toks = s["en"].split()
        ws = tr[p:p + len(toks)]
        p += len(toks)
        lo, hi = CUTS[i], (CUTS[i + 1] if i + 1 < len(CUTS) else QUIZ_AT)
        ss = [g for g in segs if lo - 0.05 <= g[0] < hi]
        times = fit_words(ws, ss, toks)
        sents.append({"en": s["en"], "tr": s["tr"], "img": s["img"], "start": lo, "end": hi,
                      "words": [{"t": t, "s": a, "e": b, "heard": w["text"]} for t, (a, b), w in zip(toks, times, ws)]})
    return sents


def prep_media():
    import shutil
    os.makedirs("assets/img", exist_ok=True); os.makedirs("assets/fonts", exist_ok=True)
    for s in STORY["sentences"]:
        shutil.copy(os.path.join(SM, "uretici", "kagit", STORY["slug"], s["img"]), "assets/img/")
    res = os.path.join(SM, "..", "native-android", "app", "src", "main", "res", "font")
    for f in ("nunito_extrabold.ttf", "nunito_bold.ttf"):
        shutil.copy(os.path.join(res, f), "assets/fonts/")
    if not os.path.exists("assets/anlatim.wav"):
        sh(["ffmpeg", "-y", "-v", "error", "-i", V1, "-vn", "-ac", "1", "-ar", "44100", "assets/anlatim.wav"])
    a, b = HOOK_AUDIO
    sh(["ffmpeg", "-y", "-v", "error", "-i", "assets/anlatim.wav", "-af", f"atrim={a}:{b},asetpts=N/SR/TB,afade=t=in:d=0.02,afade=t=out:st={b - a - 0.08}:d=0.08", "assets/hook.wav"])
    if not os.path.exists("assets/kapanis.mp4"):
        sh(["ffmpeg", "-y", "-v", "error", "-ss", str(QUIZ_AT), "-i", V1, "-an", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-r", "30", "assets/kapanis.mp4"])


def esc(t):
    return html.escape(t, quote=False)


def build():
    prep_media()
    sents = build_timing()
    json.dump({"hook": HOOK, "sentences": sents}, open("assets/timing.json", "w"), ensure_ascii=False, indent=1)
    total = round(HOOK + V1_END, 3)
    clips, js = [], []

    # ---------- hook ----------
    hook_words = []
    for li, line in enumerate(HOOK_LINES):
        spans = "".join(
            f'<span class="hw{" mark" if w in HOOK_MARK else ""}" id="hw{li}_{k}"><span class="mk"></span><span class="t">{esc(w)}</span></span> '
            for k, w in enumerate(line))
        hook_words.append(f'<div class="hl">{spans}</div>')
    clips.append(f'''
    <div id="hook" class="clip scene" data-start="0" data-duration="{HOOK}" data-track-index="1">
      <div class="cam" id="cam-hook"><img src="assets/img/{HOOK_IMG}" alt="" /></div>
      <div class="cap hookcap">
        <div class="pill" id="hook-pill">{esc(HOOK_PILL)}</div>
        {''.join(hook_words)}
      </div>
    </div>''')
    js.append(f'tl.to("#cam-hook", {{ scale: 1.06, duration: {HOOK}, ease: "power1.out" }}, 0);')
    js.append('tl.set("#hook-pill", { y: -16 }, 0); tl.set("#hook .hw", { y: 30, scale: 0.8 }, 0); tl.set("#hook .mk", { scaleX: 0 }, 0);')
    js.append('tl.to("#hook-pill", { opacity: 1, y: 0, duration: 0.25, ease: "back.out(2)" }, 0.12);')
    t = 0.22
    for li, line in enumerate(HOOK_LINES):
        for k, w in enumerate(line):
            js.append(f'tl.to("#hw{li}_{k}", {{ opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "back.out(2.2)" }}, {t:.2f});')
            if w in HOOK_MARK:
                js.append(f'tl.to("#hw{li}_{k} .mk", {{ scaleX: 1, duration: 0.25, ease: "power2.out" }}, {t + 0.18:.2f});')
            t += 0.09
    # tiny shake on the roar
    js.append('tl.to("#cam-hook img", { x: 6, duration: 0.05, repeat: 7, yoyo: true, ease: "sine.inOut" }, 0.30);')

    # ---------- story scenes ----------
    for i, s in enumerate(sents):
        st, en = HOOK + s["start"], HOOK + s["end"]
        dur = round(en - st, 3)
        spans = "".join(
            f'<span class="w" id="w{i}_{j}"><span class="mk"></span><span class="t">{esc(w["t"])}</span></span> '
            for j, w in enumerate(s["words"]))
        clips.append(f'''
    <div id="s{i}" class="clip scene" data-start="{st:.3f}" data-duration="{dur}" data-track-index="1">
      <div class="cam" id="cam{i}"><img src="assets/img/{s["img"]}" alt="" /></div>
      <div class="cap">
        <p class="en" id="en{i}">{spans}</p>
        <p class="tr" id="tr{i}">{esc(s["tr"])}</p>
      </div>
    </div>''')
        js.append(f'tl.to("#cam{i}", {{ scale: 1.04, duration: {dur}, ease: "sine.inOut" }}, {st:.3f});')
        js.append(f'tl.set("#en{i}", {{ y: 24 }}, {st:.3f}); tl.set("#tr{i}", {{ y: 14 }}, {st:.3f}); tl.set("#s{i} .mk", {{ scaleX: 0 }}, {st:.3f});')
        js.append(f'tl.to("#en{i}", {{ opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }}, {st + 0.04:.3f});')
        js.append(f'tl.to("#tr{i}", {{ opacity: 1, y: 0, duration: 0.32, ease: "power2.out" }}, {st + 0.14:.3f});')
        ws = s["words"]
        for j, w in enumerate(ws):
            a = HOOK + w["s"]
            nxt = HOOK + ws[j + 1]["s"] if j + 1 < len(ws) else HOOK + w["e"] + 0.35
            off = max(min(nxt, en - 0.05), a + 0.12)
            js.append(f'tl.to("#w{i}_{j} .t", {{ color: "#34261C", duration: 0.06, ease: "none" }}, {a - 0.03:.3f});')
            js.append(f'tl.to("#w{i}_{j} .mk", {{ scaleX: 1, duration: 0.12, ease: "power2.out" }}, {a - 0.03:.3f});')
            js.append(f'tl.to("#w{i}_{j}", {{ y: -6, duration: 0.10, ease: "power2.out" }}, {a - 0.03:.3f});')
            js.append(f'tl.to("#w{i}_{j} .mk", {{ opacity: 0, duration: 0.12, ease: "power1.in" }}, {off - 0.04:.3f});')
            js.append(f'tl.to("#w{i}_{j}", {{ y: 0, duration: 0.12, ease: "power1.inOut" }}, {off - 0.04:.3f});')

    # ---------- quiz + CTA (reused from v1) ----------
    qa = HOOK + QUIZ_AT
    clips.append(f'''
    <div class="vwrap"><video id="kapanis" class="clip" src="assets/kapanis.mp4" data-start="{qa:.3f}" data-duration="{round(total - qa, 3)}" data-track-index="2" muted playsinline></video></div>''')

    clips.append(f'''
    <audio id="a-hook" src="assets/hook.wav" data-start="{HOOK_AUDIO_AT}" data-duration="{round(HOOK_AUDIO[1] - HOOK_AUDIO[0], 3)}" data-track-index="5" data-volume="1"></audio>
    <audio id="a-vo" src="assets/anlatim.wav" data-start="{HOOK}" data-duration="{V1_END}" data-track-index="6" data-volume="1"></audio>''')

    page = f'''<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face {{ font-family: "Nunito"; src: url("assets/fonts/nunito_extrabold.ttf") format("truetype"); font-weight: 800; }}
      @font-face {{ font-family: "Nunito"; src: url("assets/fonts/nunito_bold.ttf") format("truetype"); font-weight: 700; }}
      :root {{ --ink:#34261C; --ink-soft:#78604A; --todo:#94806B; --cream:#FAF3E4; --mustard:#F0C448; --terracotta:#C8643C; }}
      * {{ margin:0; padding:0; box-sizing:border-box; }}
      html, body {{ width:{W}px; height:{H}px; overflow:hidden; background:var(--cream); }}
      body {{ font-family:"Nunito", sans-serif; }}
      .clip {{ position:absolute; inset:0; width:{W}px; height:{H}px; }}
      .scene {{ overflow:hidden; background:var(--cream); }}
      .cam {{ position:absolute; inset:0; transform-origin:540px 1150px; }}
      .cam img {{ position:absolute; inset:0; width:{W}px; height:{H}px; object-fit:cover; }}
      .cap {{ position:absolute; left:0; top:0; width:{W}px; height:640px; padding:205px 80px 0; display:flex; flex-direction:column; align-items:center; gap:16px; text-align:center; }}
      .en {{ font-weight:800; font-size:76px; line-height:1.16; color:var(--todo); max-width:900px; opacity:0; }}
      .tr {{ font-weight:700; font-size:46px; line-height:1.25; color:var(--ink-soft); max-width:880px; opacity:0; }}
      .w, .hw {{ position:relative; display:inline-block; white-space:nowrap; }}
      .w .t, .hw .t {{ position:relative; z-index:1; }}
      .w .mk, .hw .mk {{ position:absolute; z-index:0; left:-8px; right:-8px; top:18%; bottom:2%; border-radius:14px; background:var(--mustard); opacity:.85; transform-origin:0 50%; }}
      .hookcap {{ padding-top:95px; gap:4px; }}
      .pill {{ font-weight:800; font-size:34px; letter-spacing:2px; color:var(--cream); background:var(--terracotta); padding:10px 26px; border-radius:40px; margin-bottom:22px; opacity:0; }}
      .hl {{ font-weight:800; font-size:96px; line-height:1.12; color:var(--ink); }}
      .hw {{ opacity:0; }}
      .hw .mk {{ opacity:.9; }}
      .vwrap {{ position:absolute; inset:0; }}
    </style>
  </head>
  <body>
    <div id="main" data-composition-id="main" data-start="0" data-duration="{total}" data-width="{W}" data-height="{H}">
{''.join(clips)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});
      {chr(10).join("      " + l for l in js).lstrip()}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
'''
    open("index.html", "w").write(page)
    print("index.html", total, "s;", len(js), "tweens")


if __name__ == "__main__":
    build()
