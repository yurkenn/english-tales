"""Turkish ending (quiz + app CTA) for a paper-craft video, voiced with ElevenLabs clips.

python3 tr_tail.py story.json images_dir head.mp4 cut_at quiz.mp3 reveal.mp3 cta.mp3 out.mp4 [music.mp3]
  head.mp4  the video up to the quiz (e.g. the HyperFrames render); everything after cut_at is replaced
  *.mp3     Turkish voice lines: quiz question, "Doğru cevap: ...", app CTA (any format ffmpeg reads)
music.mp3 (optional) soft background bed under the whole video, looped, ducked under the voice.
App name shown and spoken is the Turkish store name (APP_NAME_TR).
"""
import os, subprocess, sys, json
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_paper as m

APP_NAME_TR = "Masallarla İngilizce Öğren"

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))

def cta_frames_tr(n):
    mascot = Image.open(os.path.join(m.RES, "drawable-nodpi", "mascot_reading.webp")).convert("RGBA")
    mascot = mascot.resize((560, round(mascot.height * 560 / mascot.width)), Image.LANCZOS)
    size = 80
    while m.font("nunito_extrabold.ttf", size).getlength(APP_NAME_TR) > m.W - 120: size -= 2
    f_name = m.font("nunito_extrabold.ttf", size)
    for i in range(n):
        fr = Image.new("RGBA", (m.W, m.H), m.CREAM + (255,)); d = ImageDraw.Draw(fr)
        k = m.ease(i / 12); my = 340 + round(60 * (1 - k))
        mm = mascot.copy(); mm.putalpha(mm.getchannel("A").point(lambda v: int(v * k))); fr.alpha_composite(mm, ((m.W - mm.width) // 2, my))
        d.text((m.W // 2, 1040), "Masalın devamı ve 60+ masal", font=m.F_TR, fill=m.INK_SOFT, anchor="mm")
        d.text((m.W // 2, 1130), APP_NAME_TR, font=f_name, fill=m.INK, anchor="mm")
        box = (250, 1220, m.W - 250, 1340)
        d.rounded_rectangle(box, radius=60, fill=m.YELLOW, outline=m.INK, width=4)
        d.text((m.W // 2, 1280), "Google Play'de ücretsiz", font=m.F_SMALL, fill=m.INK, anchor="mm")
        d.text((m.W // 2, 1410), "Link profilde", font=m.F_TR, fill=m.INK, anchor="mm")
        yield fr.convert("RGB")

def main():
    story_p, imgdir, head, cut_at, q_a, r_a, c_a, out = sys.argv[1:9]
    music = sys.argv[9] if len(sys.argv) > 9 else None
    story = json.load(open(story_p)); cut_at = float(cut_at)
    bg = m.fit(Image.open(os.path.join(imgdir, story["sentences"][-1]["img"])).convert("RGB"))
    q_d, r_d, c_d = dur(q_a), dur(r_a), dur(c_a)
    ask = 0.4 + q_d + 0.5; rev = 0.2 + r_d + 0.4; cta = 0.3 + c_d + 0.9
    n_ask, n_rev, n_cta = round(ask * m.FPS), round(rev * m.FPS), round(cta * m.FPS)
    tmp = out + ".tail.mp4"
    p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{m.W}x{m.H}", "-r", str(m.FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", tmp], stdin=subprocess.PIPE)
    for fr in m.quiz_frames(bg, story, n_ask, n_rev): p.stdin.write(fr.tobytes())
    for fr in cta_frames_tr(n_cta): p.stdin.write(fr.tobytes())
    p.stdin.close(); p.wait()
    t_rev = cut_at + n_ask / m.FPS; t_cta = t_rev + n_rev / m.FPS
    ms = lambda t: int(t * 1000); total = t_cta + n_cta / m.FPS
    fc = (f"[0:v]trim=0:{cut_at},setpts=PTS-STARTPTS[h];[h][1:v]concat=n=2:v=1:a=0[v];"
          f"[0:a]atrim=0:{cut_at},asetpts=PTS-STARTPTS,afade=t=out:st={cut_at - 0.15}:d=0.15[ha];"
          f"[2:a]aresample=48000,adelay={ms(cut_at + 0.4)}|{ms(cut_at + 0.4)}[q];"
          f"[3:a]aresample=48000,adelay={ms(t_rev + 0.2)}|{ms(t_rev + 0.2)}[r];"
          f"[4:a]aresample=48000,adelay={ms(t_cta + 0.3)}|{ms(t_cta + 0.3)}[c];"
          f"[q][r][c]amix=inputs=3:duration=longest:normalize=0,highpass=f=80[tv];"
          f"[ha][tv]amix=inputs=2:duration=longest:normalize=0,aresample=48000,apad=whole_dur={total:.3f},atrim=0:{total:.3f}[vo]")
    ins = ["-i", head, "-i", tmp, "-i", q_a, "-i", r_a, "-i", c_a]
    if music:   # quiet bed, pushed further down while someone speaks
        ins += ["-stream_loop", "-1", "-i", music]
        fc += (f";[vo]asplit=2[vo1][key];[5:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{total:.3f},volume=0.22,"
               f"afade=t=in:d=0.6,afade=t=out:st={total - 2:.3f}:d=2[mu];[mu][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=500[mud];"
               f"[vo1][mud]amix=inputs=2:duration=first:normalize=0[mix]")
    else:
        fc += ";[vo]anull[mix]"
    fc += f";[mix]loudnorm=I=-14:TP=-1.5,aresample=48000,apad=whole_dur={total:.3f},atrim=0:{total:.3f}[a]"
    subprocess.check_call(["ffmpeg", "-y", "-v", "error"] + ins + ["-filter_complex", fc,
                           "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out])
    os.remove(tmp); print(out, dur(out))

if __name__ == "__main__":
    main()
