import math, random
from PIL import Image, ImageDraw, ImageFilter
OUT='/mnt/user-data/outputs/tex/'
def pine_cluster(seed, W=512, H=512):
    rnd=random.Random(seed); S=2; w,h=W*S,H*S
    im=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(im)
    base=(w*0.5,h*0.97)
    greens=[(30,52,32),(40,66,38),(52,78,44),(36,62,46),(62,86,50),(28,46,36)]
    twigs=[]
    for k in range(7):
        a=-math.pi/2+(k-3)*0.32+rnd.uniform(-0.1,0.1); L=h*rnd.uniform(0.55,0.8)
        pts=[(base[0]+math.cos(a)*L*t+math.sin(t*3+k)*w*0.02, base[1]+math.sin(a)*L*t) for t in [i/20 for i in range(21)]]
        twigs.append(pts); d.line(pts, fill=(96,64,42,255), width=int(5*S))
    for pts in twigs:
        for n in range(260):
            t=0.25+0.75*rnd.random()**0.6; i=min(19,int(t*20)); (x0,y0),(x1,y1)=pts[i],pts[i+1]
            dirn=math.atan2(y1-y0,x1-x0); side=rnd.choice((-1,1)); ang=dirn+side*rnd.uniform(0.25,1.0)
            L=rnd.uniform(0.07,0.12)*h; c=rnd.choice(greens); f=rnd.uniform(0.75,1.2)
            col=tuple(int(min(255,v*f)) for v in c)+(255,)
            d.line([(x0,y0),(x0+math.cos(ang)*L,y0+math.sin(ang)*L)], fill=col, width=int(2.0*S))
    return im.resize((W,H),Image.LANCZOS)
def spruce_frond(seed, W=512, H=1024):
    rnd=random.Random(seed); S=2; w,h=W*S,H*S
    im=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(im)
    axis=[(w*0.5+math.sin(i/39*1.5+seed)*w*0.03, h*0.99-i/39*h*0.95) for i in range(40)]
    d.line(axis, fill=(84,58,40,255), width=int(8*S))
    greens=[(24,44,32),(32,54,38),(40,62,42),(28,50,42),(48,70,48)]
    subs=[]
    for k in range(34):
        t=0.05+0.95*k/33; px,py=axis[min(39,int(t*39))]
        for side in (-1,1):
            L=(0.42*(1-t)+0.12)*w*rnd.uniform(0.8,1.1); ang=-math.pi/2+side*(1.05+rnd.uniform(-0.15,0.15))
            pts=[(px+math.cos(ang)*L*u, py+math.sin(ang)*L*u+L*0.18*u*u) for u in [s/7 for s in range(8)]]
            subs.append(pts); d.line(pts, fill=(80,58,42,255), width=int(3*S))
    for pts in subs+[axis]:
        for i in range(len(pts)-1):
            (x0,y0),(x1,y1)=pts[i],pts[i+1]
            for n in range(10 if pts is not axis else 3):
                t=rnd.random(); x=x0+(x1-x0)*t; y=y0+(y1-y0)*t
                for side in (-1,1):
                    ang=math.atan2(y1-y0,x1-x0)+side*rnd.uniform(0.6,1.2); L=rnd.uniform(0.025,0.045)*w
                    c=rnd.choice(greens); f=rnd.uniform(0.8,1.15); col=tuple(int(min(255,v*f)) for v in c)+(255,)
                    d.line([(x,y),(x+math.cos(ang)*L,y+math.sin(ang)*L)], fill=col, width=int(2.4*S))
    return im.resize((W,H),Image.LANCZOS)
def birch_twigs(seed, W=512, H=512):
    rnd=random.Random(seed); S=2; w,h=W*S,H*S
    im=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(im)
    def br(x,y,a,L,wd,lvl):
        pts=[(x,y)]
        for i in range(1,9):
            a+=rnd.uniform(-0.12,0.12); x+=math.cos(a)*L/8; y+=math.sin(a)*L/8; pts.append((x,y))
        d.line(pts, fill=(58,40,34,255), width=max(1,int(wd)))
        if lvl<4:
            for k in range(rnd.randint(2,4)):
                p=pts[rnd.randint(3,8)]; br(p[0],p[1],a+rnd.choice((-1,1))*rnd.uniform(0.3,0.8),L*rnd.uniform(0.45,0.65),wd*0.6,lvl+1)
    br(w*0.5,h*0.98,-math.pi/2,h*0.6,9*S,0)
    return im.resize((W,H),Image.LANCZOS)
pine_cluster(1).save(OUT+'pine_clump.png'); pine_cluster(4).save(OUT+'pine_clump2.png')
spruce_frond(5).save(OUT+'spruce_frond.png'); birch_twigs(9).save(OUT+'birch_twigs.png'); birch_twigs(12).save(OUT+'birch_twigs2.png')
import os
for f in ('pine_clump_snow.png','spruce_frond_snow.png'):
    p=OUT+f
    if os.path.exists(p): os.remove(p)
imgs=[Image.open(OUT+f) for f in ('pine_clump.png','pine_clump2.png','spruce_frond.png','birch_twigs.png','birch_twigs2.png')]
sheet=Image.new('RGB',(5*260,520),(120,140,170))
for i,im in enumerate(imgs):
    t=im.copy(); t.thumbnail((256,512)); sheet.paste(t,(i*260,0),t)
sheet.save('/tmp/treetex2.jpg')
