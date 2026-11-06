// Builds the static site into dist/. Vercel runs this on every deploy (see vercel.json).
//
// The page switches its text by path (/ko/ -> Korean), but link previews are read
// from static <head> tags, so the Korean copy gets its own head here.
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://btc-spot-volume.vercel.app';
const TITLE = 'BTC 현물 합산 거래량';
const DESC = '바이낸스·코인베이스·OKX·바이비트·업비트 등 11개 거래소의 비트코인 현물 거래량을 BTC 단위로 합산해 실시간으로 보여줍니다.';

const KO_HEAD = `<title>${TITLE}</title>
<meta name="description" content="${DESC}">
<link rel="canonical" href="${SITE}/ko/">
<link rel="alternate" hreflang="en" href="${SITE}/">
<link rel="alternate" hreflang="ko" href="${SITE}/ko/">
<meta property="og:type" content="website">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="${TITLE}">
<meta property="og:title" content="${TITLE}">
<meta property="og:description" content="${DESC}">
<meta property="og:url" content="${SITE}/ko/">
<meta property="og:image" content="${SITE}/og-ko.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="거래소별 색으로 쌓은 비트코인 현물 거래량 막대 그래프">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${TITLE}">
<meta name="twitter:description" content="${DESC}">
<meta name="twitter:image" content="${SITE}/og-ko.png">
`;

const src = readFileSync(join(ROOT, 'index.html'), 'utf8');
// Everything from <title> up to the favicon link is the language-specific head.
const head = /<title>[\s\S]*?(?=<link rel="icon")/g;
if ((src.match(head) || []).length !== 1) throw new Error('expected one <title>…<link rel="icon"> block in index.html');
if (!src.includes('<html lang="en">')) throw new Error('index.html must start with <html lang="en">');
const ko = src.replace(head, () => KO_HEAD).replace('<html lang="en">', '<html lang="ko">');

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'ko'), { recursive: true });
writeFileSync(join(DIST, 'index.html'), src);
writeFileSync(join(DIST, 'ko', 'index.html'), ko);
for (const f of ['og.png', 'og-ko.png']) copyFileSync(join(ROOT, f), join(DIST, f));
console.log('built dist/ (index.html, ko/index.html, og images)');
