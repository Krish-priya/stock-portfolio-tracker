const { ApiError } = require('../middleware/errorHandler');
const { getCachedQuote, setCachedQuote, DEFAULT_TTL_MS } = require('./priceCache');

function hasRealApiKey() {
  const key = process.env.STOCK_API_KEY;
  return Boolean(key && key !== 'your_api_key_here');
}

function demoQuote(symbol) {
  // Deterministic demo prices so the UI is stable without an API key.
  const seed = String(symbol)
    .toUpperCase()
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const price = Number((50 + (seed % 400) + (seed % 97) / 100).toFixed(2));
  const changePercent = Number((((seed % 21) - 10) / 10).toFixed(2));
  return {
    symbol: String(symbol).toUpperCase(),
    price,
    changePercent,
    timestamp: new Date().toISOString(),
    source: 'demo',
  };
}

async function fetchFinnhubQuote(symbol) {
  const baseUrl = process.env.STOCK_API_BASE_URL || 'https://finnhub.io/api/v1';
  const apiKey = process.env.STOCK_API_KEY;
  const url = `${baseUrl}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(502, `Stock API request failed (${response.status})`);
  }

  const data = await response.json();
  const price = Number(data.c);

  if (!price || Number.isNaN(price)) {
    throw new ApiError(404, `No quote available for symbol ${symbol}`);
  }

  return {
    symbol: String(symbol).toUpperCase(),
    price,
    changePercent: Number(data.dp || 0),
    timestamp: data.t ? new Date(data.t * 1000).toISOString() : new Date().toISOString(),
    source: 'finnhub',
  };
}

async function getQuote(symbol, { forceRefresh = false } = {}) {
  const normalized = String(symbol).trim().toUpperCase();
  if (!normalized) {
    throw new ApiError(400, 'Symbol is required');
  }

  if (!forceRefresh) {
    const cached = getCachedQuote(normalized);
    if (cached && !cached.stale) {
      return cached;
    }
  }

  try {
    const quote = hasRealApiKey()
      ? await fetchFinnhubQuote(normalized)
      : demoQuote(normalized);

    return setCachedQuote(normalized, quote);
  } catch (err) {
    const cached = getCachedQuote(normalized);
    if (cached) {
      return { ...cached, stale: true };
    }
    throw err;
  }
}

async function getQuotesForSymbols(symbols) {
  const unique = [...new Set(symbols.map((s) => String(s).trim().toUpperCase()).filter(Boolean))];
  const quotes = {};

  await Promise.all(
    unique.map(async (symbol) => {
      try {
        quotes[symbol] = await getQuote(symbol);
      } catch (err) {
        console.error(`Failed to fetch quote for ${symbol}:`, err.message);
        quotes[symbol] = null;
      }
    })
  );

  return quotes;
}

function enrichHoldingWithQuote(holding, quote) {
  const quantity = Number(holding.quantity);
  const buyPrice = Number(holding.buy_price);
  const invested = quantity * buyPrice;

  if (!quote || quote.price == null) {
    return {
      ...holding,
      current_price: null,
      current_value: null,
      gain_loss: null,
      gain_loss_percent: null,
      change_percent: null,
      price_stale: true,
      price_timestamp: null,
      price_source: null,
      total_invested: Number(invested.toFixed(2)),
    };
  }

  const currentValue = quantity * Number(quote.price);
  const gainLoss = currentValue - invested;
  const gainLossPercent = invested === 0 ? 0 : (gainLoss / invested) * 100;

  return {
    ...holding,
    current_price: Number(quote.price),
    current_value: Number(currentValue.toFixed(2)),
    gain_loss: Number(gainLoss.toFixed(2)),
    gain_loss_percent: Number(gainLossPercent.toFixed(2)),
    change_percent: Number(quote.changePercent ?? 0),
    price_stale: Boolean(quote.stale),
    price_timestamp: quote.timestamp || null,
    price_source: quote.source || null,
    total_invested: Number(invested.toFixed(2)),
  };
}

module.exports = {
  getQuote,
  getQuotesForSymbols,
  enrichHoldingWithQuote,
  hasRealApiKey,
  demoQuote,
  DEFAULT_TTL_MS,
};
