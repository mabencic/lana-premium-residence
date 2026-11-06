# Izrađuje manje WebP verzije fotografija (640, 1200 i 1800 px širine) u mapi images/w/.
# Pokrenite nakon dodavanja ili zamjene fotografija u mapi images/:  python3 slike.py
# Treba Python s paketom Pillow (pip install Pillow).
import glob, os
from PIL import Image

os.chdir(os.path.dirname(os.path.abspath(__file__)))
os.makedirs('images/w', exist_ok=True)
for f in sorted(glob.glob('images/*.jpg') + glob.glob('images/*.jpeg')):
    base = os.path.splitext(os.path.basename(f))[0]
    im = None
    for w in (640, 1200, 1800):
        out = f'images/w/{base}-{w}.webp'
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(f):
            continue
        if im is None:
            im = Image.open(f).convert('RGB')
        o = im if w >= im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        o.save(out, 'WEBP', quality=80, method=6)
        print('izrađeno', out)
