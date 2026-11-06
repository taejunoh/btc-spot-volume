import math, random, sys
from PIL import Image, ImageDraw, ImageFont
# Usage: python3 scripts/make_og.py og.png en|ko
out, lang = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else 'en')
COPY = {
    'en': {'title': 'Aggregated BTC Spot Volume', 'title_size': 66,
           'sub': 'From Binance + Coinbase to 11 exchanges, summed in BTC',
           'chips': ['Binance', 'Coinbase', 'OKX', 'Bybit', 'Upbit', 'Bitget'], 'more': '+5 more'},
    'ko': {'title': 'BTC 현물 합산 거래량', 'title_size': 76,
           'sub': '바이낸스 + 코인베이스부터 11개 거래소까지, BTC 단위로 합산',
           'chips': ['바이낸스', '코인베이스', 'OKX', '바이비트', '업비트', '비트겟'], 'more': '외 5곳'},
}[lang]
W, H = 1200, 630
BG, PANEL, LINE, FG, FG2, FG3 = '#0e1116', '#151a21', '#252c36', '#e9ecf1', '#aab2bf', '#737c8a'
COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300']
FONT = '/System/Library/Fonts/AppleSDGothicNeo.ttc'
f = lambda size, idx: ImageFont.truetype(FONT, size, index=idx)
MONO = '/System/Library/Fonts/Menlo.ttc'

img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img)

# Decorative stacked volume bars across the bottom (illustration, not data).
random.seed(21)
n, x0, x1, base, top = 64, 64, W - 64, H - 64, 330
bw = (x1 - x0) / n
for i in range(n):
    wave = 0.5 + 0.2 * math.sin(i / 6.5) + 0.12 * math.sin(i / 2.3 + 1)
    spike = 1.8 if i in (17, 38, 55) else 1.35 if i in (16, 39, 54) else 1.0
    total = max(0.18, min(1.0, wave * spike * random.uniform(0.75, 1.1)))
    h_total = total * (base - top)
    shares = [0.36, 0.14, 0.13, 0.12, 0.05, 0.06]
    y = base
    x = x0 + i * bw
    for k, sh in enumerate(shares):
        h = h_total * sh / sum(shares)
        d.rectangle([x + 2, y - h + 1, x + bw - 2, y], fill=COLORS[k])
        y -= h
d.line([x0, base + 1, x1, base + 1], fill=LINE, width=2)

# Fade the bars under the text block.
fade = Image.new('L', (W, H), 0)
fd = ImageDraw.Draw(fade)
for yy in range(H):
    a = 255 if yy < 300 else max(0, int(255 * (1 - (yy - 300) / 120)))
    fd.line([0, yy, W, yy], fill=a)
img.paste(Image.new('RGB', (W, H), BG), (0, 0), fade)
d = ImageDraw.Draw(img)

d.text((64, 58), 'BTC SPOT VOLUME · 11 EXCHANGES', font=ImageFont.truetype(MONO, 22), fill=FG3)
d.text((64, 100 + (76 - COPY['title_size']) // 2), COPY['title'], font=f(COPY['title_size'], 6), fill=FG)
d.text((64, 200), COPY['sub'], font=f(32, 2), fill=FG2)

x = 64
for name, c in zip(COPY['chips'], COLORS):
    font = f(24, 2)
    tw = d.textlength(name, font=font)
    d.rounded_rectangle([x, 262, x + tw + 44, 304], radius=21, fill=PANEL, outline=LINE, width=2)
    d.rounded_rectangle([x + 14, 276, x + 28, 290], radius=3, fill=c)
    d.text((x + 34, 268), name, font=font, fill=FG)
    x += tw + 56
d.text((x, 268), COPY['more'], font=f(24, 2), fill=FG3)

url = 'btc-spot-volume.vercel.app'
uf = ImageFont.truetype(MONO, 22)
d.text((W - 64 - d.textlength(url, font=uf), 58), url, font=uf, fill=FG3)
img.save(out, optimize=True)
print('saved', out)
