import json, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
exec(open('cut/overlay.py').read().split("o=im.copy()")[0])  # reuse P, im
S=2
big=im.resize((im.width*S, im.height*S), Image.LANCZOS)
masks={}
for k,p in P.items():
    m=Image.new('L',big.size,0); ImageDraw.Draw(m).polygon([(x*S,y*S) for x,y in p],fill=255)
    masks[k]=m
# background: inpaint everything that moves (slightly dilated)
hole=np.zeros((big.height,big.width),np.uint8)
for k in masks: hole|=np.array(masks[k].filter(ImageFilter.MaxFilter(9)))
bgr=cv2.cvtColor(np.array(big),cv2.COLOR_RGB2BGR)
inp=cv2.inpaint(bgr,(hole>0).astype(np.uint8)*255,7,cv2.INPAINT_TELEA)
bg=Image.fromarray(cv2.cvtColor(inp,cv2.COLOR_BGR2RGB))
# soften the inpainted zone toward paper white so smears read as empty paper
paper=Image.new('RGB',big.size,(255,255,255))
soft=Image.fromarray(hole).filter(ImageFilter.GaussianBlur(3))
bg=Image.composite(paper,big,soft)
d=ImageDraw.Draw(bg)
br=[(40,222),(90,214),(140,207),(200,191),(215,187)]
d.line([(x*S,y*S) for x,y in br],fill=(25,20,18),width=7*S,joint='curve')
d.line([(x*S,(y-5)*S) for x,y in br],fill=(70,62,58),width=2*S)
bg.save('cut/bg.png')
for k,m in masks.items():
    if k=='crow':  # crow layer must not include the meat
        m=Image.fromarray(np.array(m)&~np.array(masks['meat']))
    lay=big.convert('RGBA'); lay.putalpha(m.filter(ImageFilter.GaussianBlur(1.2)))
    lay.save(f'cut/{k}.png')
json.dump({'scale':S},open('cut/meta.json','w'))
