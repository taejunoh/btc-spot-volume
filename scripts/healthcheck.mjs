// Checks that every exchange the page sums still returns usable 1h candles.
// Runs daily from .github/workflows/healthcheck.yml; exits 1 if any exchange fails,
// which makes GitHub email the repo owner. Run locally: node scripts/healthcheck.mjs
//
// Upbit and Bybit go through the site's own proxy, as the page does
// (Upbit throttles browser origins; Bybit blocks some regions, including GitHub's runners).

const SITE = process.env.SITE_URL || 'https://btc-spot-volume.vercel.app';

async function json(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000), headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Each check resolves to the base volume of the latest candle in a 2-candle window.
const CHECKS = {
  Binance: async () => +(await json('https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=2'))[0][5],
  Coinbase: async () => +(await json('https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=3600'))[1][5],
  OKX: async () => +(await json('https://www.okx.com/api/v5/market/candles?instId=BTC-USDT&bar=1H&limit=2')).data[1][5],
  Bybit: async () => +(await json(`${SITE}/api/proxy?src=bybit&symbol=BTCUSDT&interval=60&limit=2`)).result.list[1][5],
  Upbit: async () => +(await json(`${SITE}/api/proxy?src=upbit&unit=minutes%2F60&market=KRW-BTC&count=2`))[1].candle_acc_trade_volume,
  Bithumb: async () => +(await json('https://api.bithumb.com/v1/candles/minutes/60?market=KRW-BTC&count=2'))[1].candle_acc_trade_volume,
  Bitget: async () => +(await json('https://api.bitget.com/api/v2/spot/market/candles?symbol=BTCUSDT&granularity=1h&limit=2')).data[0][5],
  Gate: async () => +(await json('https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=BTC_USDT&interval=1h&limit=2'))[0][6],
  HTX: async () => +(await json('https://api.huobi.pro/market/history/kline?symbol=btcusdt&period=60min&size=2')).data[1].amount,
  Kraken: async () => {
    const j = await json('https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=60');
    if (j.error?.length) throw new Error(j.error.join(', '));
    const rows = j.result[Object.keys(j.result).find(k => k !== 'last')];
    return +rows[rows.length - 2][6];
  },
  Bitstamp: async () => +(await json('https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=3600&limit=2')).data.ohlc[0].volume,
};

const results = await Promise.all(Object.entries(CHECKS).map(async ([name, check]) => {
  try {
    const vol = await check();
    // A completed BTC hour on any of these markets trades more than zero; NaN means the response shape changed.
    if (!Number.isFinite(vol) || vol <= 0) throw new Error(`unexpected volume: ${vol}`);
    return { name, ok: true, detail: `${vol.toFixed(2)} BTC` };
  } catch (e) {
    return { name, ok: false, detail: e.message };
  }
}));

for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name.padEnd(9)} ${r.detail}`);
const failed = results.filter(r => !r.ok);
console.log(failed.length ? `\n${failed.length} of ${results.length} exchanges failed` : `\nall ${results.length} exchanges ok`);
process.exit(failed.length ? 1 : 0);
