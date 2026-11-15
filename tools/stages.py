import sys, subprocess, time, os
from playwright.sync_api import sync_playwright
from PIL import Image
root='/home/claude/gedonist'; out=root+'/qa'
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--directory',root+'/docs'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
fr=[0.10,0.42,0.67,0.92]
shots=[]
try:
    with sync_playwright() as p:
        b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        for name,vw,vh in (('d',1440,900),('m',390,844)):
            pg=b.new_page(viewport={'width':vw,'height':vh}); errs=[]
            pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
            pg.goto('http://localhost:8765/'); pg.wait_for_timeout(3200)
            pg.screenshot(path=f'{out}/st_{name}_hero.png'); shots.append(f'{out}/st_{name}_hero.png')
            for i,f in enumerate(fr):
                pg.evaluate("""f=>{const st=ScrollTrigger.getAll().find(s=>s.trigger&&s.trigger.id==='uchastok'); window.scrollTo(0, st.start+(st.end-st.start)*f);}""",f)
                pg.wait_for_timeout(3500 if i==0 else 1500)
                pg.evaluate('f=>window.__plot&&window.__plot.setProgress(f)',f)
                pg.wait_for_timeout(4500)
                pth=f'{out}/st_{name}_{i}.png'; pg.screenshot(path=pth); shots.append(pth)
            print(name,'ready=',pg.evaluate("document.querySelector('.scene3d').dataset.ready"),'errors=',errs[:3])
            pg.close()
        b.close()
finally:
    srv.terminate()
for name,w in (('d',720),('m',300)):
    ims=[Image.open(s).convert('RGB') for s in shots if f'st_{name}_' in s]
    ims=[i.resize((w,round(i.height*w/i.width))) for i in ims]
    cols=3 if name=='d' else 5
    rows=(len(ims)+cols-1)//cols
    sh=Image.new('RGB',(cols*w+(cols-1)*8,rows*ims[0].height+(rows-1)*8),'#333')
    for k,i in enumerate(ims): sh.paste(i,((k%cols)*(w+8),(k//cols)*(ims[0].height+8)))
    sh.save(f'{out}/stages_{name}.jpg',quality=80)
