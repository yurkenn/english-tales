import sys, json, numpy as np, soundfile as sf, time
from kokoro_onnx import Kokoro
d="/tmp/claude-0/-home-user-english-tales/ac8f0119-fe1d-5823-961f-f4790ffa1c34/scratchpad/kokoro/"
k=Kokoro(d+"kokoro-v1.0.onnx", d+"voices-v1.0.bin")
voice, lang, speed = sys.argv[1], sys.argv[2], float(sys.argv[3])
lines=["The Fox and the Crow.","A crow sits on a branch with a piece of meat.","A fox sees the meat and wants it.","So he begins to praise the crow.","\"What beautiful feathers you have!\" he says.","\"You must have a beautiful voice, too.\"","She opens her beak and makes a loud sound.","The meat falls to the ground.","Flattery is not always friendship."]
out=[]; t=0.0; tim=[]; sr=24000; st=time.time()
for i,l in enumerate(lines):
    a,sr=k.create(l, voice=voice, speed=speed, lang=lang)
    tim.append([t, t+len(a)/sr]); out.append(a); t+=len(a)/sr
    gap = 1.0 if i==0 else 1.3
    out.append(np.zeros(int(gap*sr),dtype=a.dtype)); t+=gap
sf.write(d+f"nar_{voice}.wav", np.concatenate(out), sr)
json.dump({"title":tim[0],"sentences":tim[1:]}, open(d+f"tim_{voice}.json","w"))
print(voice, round(t,1),"s audio in", round(time.time()-st,1),"s")
