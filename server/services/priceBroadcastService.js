const pool = require('../config/db');
const { getQuote } = require('./stockApiService');
const { getIO } = require('../config/socket');

let intervalId = null;

async function getTrackedSymbols() {
  const [rows] = await pool.query(`
    SELECT DISTINCT symbol FROM (
      SELECT symbol FROM holdings
      UNION
      SELECT symbol FROM watchlist
    ) AS symbols
  `);
  return rows.map((row) => row.symbol);
}

async function broadcastPrices() {
  const io = getIO();
  if (!io) return;

  let symbols = [];
  try {
    symbols = await getTrackedSymbols();
  } catch (err) {
    console.error('Failed to load tracked symbols:', err.message);
    return;
  }

  for (const symbol of symbols) {
    try {
      const quote = await getQuote(symbol, { forceRefresh: true });
      io.emit('price:update', {
        symbol: quote.symbol,
        price: quote.price,
        changePercent: quote.changePercent,
        timestamp: quote.timestamp,
        source: quote.source || null,
        stale: Boolean(quote.stale),
      });
    } catch (err) {
      console.error(`Price broadcast failed for ${symbol}:`, err.message);
    }
  }
}

function startPriceBroadcast() {
  const intervalMs = Number(process.env.PRICE_POLL_INTERVAL_MS || 15000);
  if (intervalId) return;

  console.log(`Starting price broadcast every ${intervalMs}ms`);
  // Initial kick shortly after boot
  setTimeout(() => {
    broadcastPrices().catch((err) => console.error(err.message));
  }, 2000);

  intervalId = setInterval(() => {
    broadcastPrices().catch((err) => console.error(err.message));
  }, intervalMs);
}

function stopPriceBroadcast() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = { startPriceBroadcast, stopPriceBroadcast, broadcastPrices };
