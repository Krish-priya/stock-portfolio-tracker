const DEMO_USER = {
  id: 1,
  name: 'Alex Morgan',
  email: 'alex@demo.com',
  created_at: '2024-01-15T10:00:00.000Z',
};

const DEMO_PASSWORD = 'password123';

const DEFAULT_HOLDINGS = [
  {
    id: 1,
    symbol: 'AAPL',
    quantity: 15,
    buy_price: 148.5,
    purchase_date: '2024-03-12',
    created_at: '2024-03-12T12:00:00.000Z',
  },
  {
    id: 2,
    symbol: 'MSFT',
    quantity: 8,
    buy_price: 320,
    purchase_date: '2024-05-20',
    created_at: '2024-05-20T12:00:00.000Z',
  },
  {
    id: 3,
    symbol: 'GOOGL',
    quantity: 12,
    buy_price: 135.25,
    purchase_date: '2024-07-08',
    created_at: '2024-07-08T12:00:00.000Z',
  },
  {
    id: 4,
    symbol: 'TSLA',
    quantity: 6,
    buy_price: 210.75,
    purchase_date: '2024-09-01',
    created_at: '2024-09-01T12:00:00.000Z',
  },
  {
    id: 5,
    symbol: 'AMZN',
    quantity: 10,
    buy_price: 175.4,
    purchase_date: '2024-11-15',
    created_at: '2024-11-15T12:00:00.000Z',
  },
];

const DEFAULT_WATCHLIST = [
  { id: 1, symbol: 'NVDA', created_at: '2024-12-01T12:00:00.000Z' },
  { id: 2, symbol: 'META', created_at: '2024-12-01T12:00:00.000Z' },
  { id: 3, symbol: 'AMD', created_at: '2024-12-01T12:00:00.000Z' },
];

const STORAGE_KEYS = {
  token: 'demo_token',
  holdings: 'demo_holdings',
  watchlist: 'demo_watchlist',
  nextHoldingId: 'demo_next_holding_id',
  nextWatchId: 'demo_next_watch_id',
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeeded() {
  if (!localStorage.getItem(STORAGE_KEYS.holdings)) {
    writeJson(STORAGE_KEYS.holdings, DEFAULT_HOLDINGS);
    localStorage.setItem(STORAGE_KEYS.nextHoldingId, '6');
  }
  if (!localStorage.getItem(STORAGE_KEYS.watchlist)) {
    writeJson(STORAGE_KEYS.watchlist, DEFAULT_WATCHLIST);
    localStorage.setItem(STORAGE_KEYS.nextWatchId, '4');
  }
}

function demoQuote(symbol) {
  const seed = String(symbol)
    .toUpperCase()
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const jitter = Math.sin(Date.now() / 15000 + seed) * 2;
  const price = Number((50 + (seed % 400) + (seed % 97) / 100 + jitter).toFixed(2));
  const changePercent = Number((((seed % 21) - 10) / 10 + jitter / 10).toFixed(2));
  return {
    symbol: String(symbol).toUpperCase(),
    price,
    changePercent,
    timestamp: new Date().toISOString(),
    source: 'demo',
    stale: false,
  };
}

function enrichHolding(holding) {
  const quote = demoQuote(holding.symbol);
  const quantity = Number(holding.quantity);
  const buyPrice = Number(holding.buy_price);
  const invested = quantity * buyPrice;
  const currentValue = quantity * quote.price;
  const gainLoss = currentValue - invested;
  return {
    ...holding,
    current_price: quote.price,
    current_value: Number(currentValue.toFixed(2)),
    gain_loss: Number(gainLoss.toFixed(2)),
    gain_loss_percent: invested === 0 ? 0 : Number(((gainLoss / invested) * 100).toFixed(2)),
    change_percent: quote.changePercent,
    price_stale: false,
    price_timestamp: quote.timestamp,
    price_source: 'demo',
    total_invested: Number(invested.toFixed(2)),
  };
}

function buildHistory(totalInvested) {
  const dailyMoves = [
    0.008, -0.012, 0.015, 0.006, -0.009, 0.011, 0.004, -0.017, 0.013, 0.009,
    -0.006, 0.018, -0.004, 0.007, 0.012, -0.015, 0.01, 0.005, -0.008, 0.014,
    0.003, -0.011, 0.016, 0.008, -0.005, 0.009, -0.013, 0.011, 0.006, 0.01,
  ];
  let value = totalInvested * 0.94;
  const history = [];
  for (let i = 0; i < dailyMoves.length; i += 1) {
    value *= 1 + dailyMoves[i];
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (dailyMoves.length - 1 - i));
    history.push({
      date: date.toISOString().slice(0, 10),
      total_value: Number(value.toFixed(2)),
    });
  }
  return history;
}

function ok(data, status = 200) {
  return Promise.resolve({ data, status });
}

function fail(message, status = 400) {
  const error = new Error(message);
  error.response = { status, data: { error: message } };
  return Promise.reject(error);
}

export function isDemoApiEnabled() {
  if (import.meta.env.VITE_USE_DEMO_API === 'true') return true;
  if (import.meta.env.VITE_USE_DEMO_API === 'false') return false;

  const configured = import.meta.env.VITE_API_BASE_URL || '';
  const pointsToLocal =
    !configured ||
    configured.includes('localhost') ||
    configured.includes('127.0.0.1');

  if (typeof window === 'undefined') return false;
  const hosted =
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('netlify.app');

  return hosted && pointsToLocal;
}

function normalizeUrl(rawUrl = '') {
  try {
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      const parsed = new URL(rawUrl);
      return parsed.pathname.replace(/^\/api/, '') || '/';
    }
  } catch {
    // fall through
  }
  return rawUrl.replace(/^\/api/, '') || '/';
}

function normalizeBody(data) {
  if (data == null) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

export async function demoRequest(config) {
  ensureSeeded();

  const method = (config.method || 'get').toLowerCase();
  const url = normalizeUrl(config.url || '');
  const body = normalizeBody(config.data);

  if (url === '/health' && method === 'get') {
    return ok({ status: 'ok', message: 'Demo API mode' });
  }

  if (url === '/auth/signup' && method === 'post') {
    return fail('Create account is disabled in hosted demo. Use Continue as guest.', 400);
  }

  if (url === '/auth/login' && method === 'post') {
    if (body.email !== DEMO_USER.email || body.password !== DEMO_PASSWORD) {
      return fail('Invalid email or password', 401);
    }
    const token = 'demo-jwt-token';
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem('token', token);
    return ok({ token, user: DEMO_USER });
  }

  if (url === '/auth/me' && method === 'get') {
    const token = localStorage.getItem('token');
    if (!token) return fail('Missing or invalid authorization header', 401);
    return ok({ user: DEMO_USER });
  }

  if (url === '/holdings' && method === 'get') {
    const holdings = readJson(STORAGE_KEYS.holdings, DEFAULT_HOLDINGS).map(enrichHolding);
    return ok({ holdings });
  }

  if (url === '/holdings' && method === 'post') {
    const holdings = readJson(STORAGE_KEYS.holdings, []);
    const nextId = Number(localStorage.getItem(STORAGE_KEYS.nextHoldingId) || '100');
    const holding = {
      id: nextId,
      symbol: String(body.symbol || '').trim().toUpperCase(),
      quantity: Number(body.quantity),
      buy_price: Number(body.buy_price),
      purchase_date: body.purchase_date,
      created_at: new Date().toISOString(),
    };
    writeJson(STORAGE_KEYS.holdings, [holding, ...holdings]);
    localStorage.setItem(STORAGE_KEYS.nextHoldingId, String(nextId + 1));
    return ok({ holding: enrichHolding(holding) }, 201);
  }

  if (url.startsWith('/holdings/') && method === 'put') {
    const id = Number(url.split('/')[2]);
    const holdings = readJson(STORAGE_KEYS.holdings, []);
    const index = holdings.findIndex((h) => h.id === id);
    if (index < 0) return fail('Holding not found', 404);
    holdings[index] = {
      ...holdings[index],
      symbol: String(body.symbol || '').trim().toUpperCase(),
      quantity: Number(body.quantity),
      buy_price: Number(body.buy_price),
      purchase_date: body.purchase_date,
    };
    writeJson(STORAGE_KEYS.holdings, holdings);
    return ok({ holding: enrichHolding(holdings[index]) });
  }

  if (url.startsWith('/holdings/') && method === 'delete') {
    const id = Number(url.split('/')[2]);
    const holdings = readJson(STORAGE_KEYS.holdings, []);
    writeJson(
      STORAGE_KEYS.holdings,
      holdings.filter((h) => h.id !== id)
    );
    return ok({ message: 'Holding deleted' });
  }

  if (url === '/portfolio/summary' && method === 'get') {
    const enriched = readJson(STORAGE_KEYS.holdings, DEFAULT_HOLDINGS).map(enrichHolding);
    const totalInvested = enriched.reduce((sum, h) => sum + h.total_invested, 0);
    const totalCurrentValue = enriched.reduce((sum, h) => sum + h.current_value, 0);
    const totalGainLoss = totalCurrentValue - totalInvested;
    const allocationMap = new Map();
    for (const holding of enriched) {
      allocationMap.set(
        holding.symbol,
        (allocationMap.get(holding.symbol) || 0) + holding.current_value
      );
    }
    const allocation = [...allocationMap.entries()]
      .map(([symbol, value]) => ({
        symbol,
        value: Number(value.toFixed(2)),
        percent:
          totalCurrentValue === 0
            ? 0
            : Number(((value / totalCurrentValue) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);

    const ranked = [...enriched].sort(
      (a, b) => Number(b.gain_loss_percent) - Number(a.gain_loss_percent)
    );

    return ok({
      summary: {
        total_invested: Number(totalInvested.toFixed(2)),
        total_current_value: Number(totalCurrentValue.toFixed(2)),
        total_gain_loss: Number(totalGainLoss.toFixed(2)),
        total_gain_loss_percent:
          totalInvested === 0
            ? 0
            : Number(((totalGainLoss / totalInvested) * 100).toFixed(2)),
        holdings_count: enriched.length,
        using_demo_prices: true,
      },
      allocation,
      top_movers: {
        gainers: ranked.slice(0, 3).map((h) => ({
          symbol: h.symbol,
          gain_loss_percent: h.gain_loss_percent,
          gain_loss: h.gain_loss,
        })),
        losers: ranked
          .slice()
          .reverse()
          .slice(0, 3)
          .map((h) => ({
            symbol: h.symbol,
            gain_loss_percent: h.gain_loss_percent,
            gain_loss: h.gain_loss,
          })),
      },
    });
  }

  if (url === '/portfolio/history' && method === 'get') {
    const enriched = readJson(STORAGE_KEYS.holdings, DEFAULT_HOLDINGS).map(enrichHolding);
    const invested = enriched.reduce((sum, h) => sum + h.total_invested, 0);
    return ok({ history: buildHistory(invested) });
  }

  if (url === '/watchlist' && method === 'get') {
    const items = readJson(STORAGE_KEYS.watchlist, DEFAULT_WATCHLIST).map((item) => {
      const quote = demoQuote(item.symbol);
      return {
        ...item,
        current_price: quote.price,
        change_percent: quote.changePercent,
        price_stale: false,
        price_timestamp: quote.timestamp,
      };
    });
    return ok({ watchlist: items });
  }

  if (url === '/watchlist' && method === 'post') {
    const watchlist = readJson(STORAGE_KEYS.watchlist, []);
    const symbol = String(body.symbol || '').trim().toUpperCase();
    if (watchlist.some((item) => item.symbol === symbol)) {
      return fail('Symbol is already on your watchlist', 409);
    }
    const nextId = Number(localStorage.getItem(STORAGE_KEYS.nextWatchId) || '100');
    const item = {
      id: nextId,
      symbol,
      created_at: new Date().toISOString(),
    };
    writeJson(STORAGE_KEYS.watchlist, [item, ...watchlist]);
    localStorage.setItem(STORAGE_KEYS.nextWatchId, String(nextId + 1));
    const quote = demoQuote(symbol);
    return ok(
      {
        item: {
          ...item,
          current_price: quote.price,
          change_percent: quote.changePercent,
          price_stale: false,
          price_timestamp: quote.timestamp,
        },
      },
      201
    );
  }

  if (url.startsWith('/watchlist/') && method === 'delete') {
    const id = Number(url.split('/')[2]);
    const watchlist = readJson(STORAGE_KEYS.watchlist, []);
    writeJson(
      STORAGE_KEYS.watchlist,
      watchlist.filter((item) => item.id !== id)
    );
    return ok({ message: 'Removed from watchlist' });
  }

  return fail(`Demo API route not implemented: ${method.toUpperCase()} ${url}`, 404);
}

export function createDemoPriceTicker(onUpdate) {
  const symbols = () => {
    ensureSeeded();
    const holdings = readJson(STORAGE_KEYS.holdings, DEFAULT_HOLDINGS);
    const watchlist = readJson(STORAGE_KEYS.watchlist, DEFAULT_WATCHLIST);
    return [...new Set([...holdings, ...watchlist].map((item) => item.symbol))];
  };

  const tick = () => {
    symbols().forEach((symbol) => onUpdate(demoQuote(symbol)));
  };

  tick();
  const id = setInterval(tick, 5000);
  return () => clearInterval(id);
}
