const DEFAULT_TTL_MS = 30_000;

const cache = new Map();

function getCachedQuote(symbol) {
  const key = String(symbol).toUpperCase();
  const entry = cache.get(key);
  if (!entry) return null;
  return {
    ...entry.quote,
    stale: Date.now() - entry.fetchedAt > DEFAULT_TTL_MS,
    cachedAt: entry.fetchedAt,
  };
}

function setCachedQuote(symbol, quote) {
  const key = String(symbol).toUpperCase();
  const entry = {
    quote: {
      symbol: key,
      price: Number(quote.price),
      changePercent: Number(quote.changePercent ?? 0),
      timestamp: quote.timestamp || new Date().toISOString(),
      source: quote.source || null,
    },
    fetchedAt: Date.now(),
  };
  cache.set(key, entry);
  return { ...entry.quote, stale: false, cachedAt: entry.fetchedAt };
}

function getAllCachedSymbols() {
  return Array.from(cache.keys());
}

function clearPriceCache() {
  cache.clear();
}

module.exports = {
  getCachedQuote,
  setCachedQuote,
  getAllCachedSymbols,
  clearPriceCache,
  DEFAULT_TTL_MS,
};
