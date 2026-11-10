import sys, os, wave
from piper import PiperVoice
D=os.path.dirname(os.path.abspath(__file__))
def say(voice, text, out, length_scale=1.0):
    d=f"{D}/vits-piper-tr_TR-{voice}"
    v=PiperVoice.load(f"{d}/tr_TR-{voice}.onnx", config_path=f"{d}/tr_TR-{voice}.onnx.json")
    from piper import SynthesisConfig
    with wave.open(out,"wb") as w:
        v.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=length_scale))
if __name__=="__main__":
    for v in ["fahrettin-medium","dfki-medium","fettah-medium"]:
        say(v, sys.argv[1], f"{D}/tr_{v}.wav"); print(v)
