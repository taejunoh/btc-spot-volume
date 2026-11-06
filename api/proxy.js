// Read-only proxy for the two candle APIs browsers can't call reliably.
// Only allowlisted markets and intervals pass through; responses are cached at the CDN.
const UPBIT_UNITS = new Set(['minutes/15', 'minutes/60', 'minutes/240', 'days']);
const UPBIT_MARKETS = new Set(['KRW-BTC', 'USDT-BTC']);
const BYBIT_SYMBOLS = new Set(['BTCUSDT', 'BTCUSDC']);
const BYBIT_INTERVALS = new Set(['15', '60', '240', 'D']);

function targetUrl(q) {
  if (q.get('src') === 'upbit') {
    const unit = q.get('unit'), market = q.get('market'), count = q.get('count') || '200', to = q.get('to');
    if (!UPBIT_UNITS.has(unit) || !UPBIT_MARKETS.has(market) || !/^\d{1,3}$/.test(count)) return null;
    if (to && !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(to)) return null;
    return `https://api.upbit.com/v1/candles/${unit}?market=${market}&count=${count}${to ? '&to=' + to : ''}`;
  }
  if (q.get('src') === 'bybit') {
    const symbol = q.get('symbol'), interval = q.get('interval'), limit = q.get('limit') || '300';
    if (!BYBIT_SYMBOLS.has(symbol) || !BYBIT_INTERVALS.has(interval) || !/^\d{1,4}$/.test(limit)) return null;
    return `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${interval}&limit=${limit}`;
  }
  return null;
}

export async function GET(request) {
  const url = targetUrl(new URL(request.url).searchParams);
  if (!url) return Response.json({ error: 'unsupported request' }, { status: 400 });
  try {
    const upstream = await fetch(url, { headers: { accept: 'application/json' } });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        'content-type': 'application/json',
        'cache-control': upstream.ok ? 'public, s-maxage=30, stale-while-revalidate=60' : 'no-store',
      },
    });
  } catch (e) {
    return Response.json({ error: 'upstream unreachable' }, { status: 502 });
  }
}
