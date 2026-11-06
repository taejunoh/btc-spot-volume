# Aggregated BTC Spot Volume

Spot bitcoin volume from 11 exchanges, summed in BTC. Live at https://btc-spot-volume.vercel.app (Korean: `/ko/`).

## Layout

- `index.html` — the whole page (English markup, Korean via the built-in dictionary). The only file to edit for UI changes.
- `api/proxy.js` — Vercel function in Seoul (`icn1`) that relays Upbit and Bybit candles, which browsers can't call reliably. Allowlisted markets only, cached 30s.
- `scripts/build.mjs` — writes `dist/` (`index.html`, `ko/index.html` with a Korean `<head>` for link previews, og images). Vercel runs it on every deploy.
- `scripts/make_og.py` — regenerates the preview images: `python3 scripts/make_og.py og.png en` and `python3 scripts/make_og.py og-ko.png ko` (needs Pillow, macOS fonts).

## Run and deploy

```bash
node scripts/build.mjs && python3 -m http.server 5178 --directory dist
```

Locally the proxy doesn't exist, so Bybit shows as failed; Upbit may be throttled.

Pushing to `main` deploys to production automatically (Vercel is connected to this repo). Other branches get preview deploys. `vercel deploy --prod` still works for a manual deploy.
