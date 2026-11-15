import sys, subprocess, time
from playwright.sync_api import sync_playwright
from PIL import Image
root='/home/claude/gedonist'
srv=subprocess.Popen([sys.executable,'-m','http.server','8766','--directory',root+'/docs'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
try:
    with sync_playwright() as p:
        b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=b.new_page(viewport={'width':1440,'height':900}); pg.goto('http://localhost:8766/'); pg.wait_for_timeout(3000)
        pg.evaluate("()=>{const st=ScrollTrigger.getAll().find(s=>s.trigger&&s.trigger.id==='uchastok'); window.scrollTo(0, st.start+(st.end-st.start)*0.05);}")
        pg.wait_for_timeout(4000); pg.evaluate("()=>window.__plot.setProgress(0.05)"); pg.wait_for_timeout(1500)
        pg.add_style_tag(content='.hotspot,.plot__text,.bill,.plot__note,.thermo,.scene3d::after{visibility:hidden!important} .scene3d::after{display:none!important}')
        pg.locator('.scene3d__canvas').screenshot(path='/tmp/poster.png'); b.close()
finally: srv.terminate()
im=Image.open('/tmp/poster.png').convert('RGB'); im.save(root+'/docs/assets/img/scene-poster.webp','WEBP',quality=80,method=6); print(im.size)
