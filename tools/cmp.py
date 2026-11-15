import sys
from PIL import Image, ImageChops
photo, render, out = sys.argv[1], sys.argv[2], sys.argv[3]
p = Image.open(photo).convert('RGB').resize((900, 600)); r = Image.open(render).convert('RGB').resize((900, 600))
ov = Image.blend(p, r, 0.5)
s = Image.new('RGB', (1810, 1210), 'white'); s.paste(p, (0, 0)); s.paste(r, (910, 0)); s.paste(ov, (455, 610)); s.save(out, quality=82)
