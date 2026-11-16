# Тайлящаяся текстура гибкой черепицы «соты» (1,32 × 1,32 м): diff / normal GL / rough -> 3d/interior/tex
import numpy as np
from PIL import Image
from scipy import ndimage
N=1024; TABS=4; ROWS=8           # tile 1.32 m x 1.32 m: tab w=0.33, row pitch 0.165
w=1.0/TABS; p=1.0/ROWS; d=0.55*p  # point depth
rng=np.random.default_rng(7)
ys,xs=np.mgrid[0:N,0:N]/N
xs=xs; ys=1.0-ys                 # y up
best_r=np.full((N,N),-99); B_best=np.zeros((N,N)); tab_id=np.zeros((N,N),int); sdist=np.zeros((N,N))
for r in range(0,ROWS+1):
    off=(r%2)*0.5*w
    # nearest tab centre in row r for each x (periodic)
    k=np.floor((xs-off)/w)
    xc=off+(k+0.5)*w
    s=np.abs(xs-xc)/(w/2)
    B=r*p - d*(1-s)              # bottom outline
    ok=ys>=B
    upd=ok & (r>best_r)
    best_r=np.where(upd,r,best_r); B_best=np.where(upd,B,B_best)
    tab_id=np.where(upd,(r%ROWS)*TABS+(k.astype(int)%TABS),tab_id); sdist=np.where(upd,s,sdist)
# distance above own bottom edge (in metres-ish units of tile)
above=(ys-B_best)
# edge between neighbouring tabs in the same row (vertical cut)
cut=np.clip((1-sdist)*w/2/(0.004),0,1)    # 0 at cut
# height: each row a bit higher; tab thickness taper
h=best_r*0.0+np.clip(above/0.01,0,1)*0.6+np.clip(above/0.08,0,1)*0.4
h=h*(0.35+0.65*cut)
# granules
g=rng.random((N,N)); g=ndimage.gaussian_filter(g,0.7)
h=h+ (g-0.5)*0.25
# per-tab tone
tone=rng.normal(0,0.035,TABS*ROWS)[tab_id]
# shadow under edges: pixels just below an edge of the row above are darker -> use above small? we approximate: distance to next row's bottom edge from below
# compute distance to the covering edge above via scanning: easier: AO from height blur
hb=ndimage.gaussian_filter(h,6,mode='wrap')
ao=np.clip(1-(hb-h)*1.6,0.45,1.0)
ao=np.clip(ao*(0.55+0.45*np.clip(above/0.012,0,1)),0,1)
base=np.array([0.075,0.078,0.085])
col=base[None,None,:]*(1+tone[...,None])*(0.85+0.3*g[...,None])*ao[...,None]
# a few lighter granules
sp=(rng.random((N,N))>0.985)
col[sp]*=1.9
col=np.clip(col,0,1)
srgb=np.where(col<=0.0031308,col*12.92,1.055*np.power(col,1/2.4)-0.055)
Image.fromarray((srgb*255).astype(np.uint8)).save('tex/hex_shingle_diff.jpg',quality=92)
# normal map (GL)
gy,gx=np.gradient(ndimage.gaussian_filter(h,0.8,mode='wrap'))
strength=6.0
nx=-gx*strength; ny=gy*strength; nz=np.ones_like(h)
n=np.stack([nx,ny,nz],-1); n/=np.linalg.norm(n,axis=-1,keepdims=True)
Image.fromarray(((n*0.5+0.5)*255).astype(np.uint8)).save('tex/hex_shingle_nor_gl.png')
rough=np.clip(0.82+ (g-0.5)*0.2 - sp*0.25,0,1)
Image.fromarray((rough*255).astype(np.uint8)).save('tex/hex_shingle_rough.jpg',quality=92)
prev=Image.open('tex/hex_shingle_diff.jpg'); 
big=Image.new('RGB',(2048,1024)); big.paste(prev,(0,0)); big.paste(prev,(1024,0))
from PIL import ImageEnhance
ImageEnhance.Brightness(big).enhance(3.0).resize((1024,512)).save('/tmp/hex_prev.jpg')
print('ok')
