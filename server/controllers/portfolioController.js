const pool = require('../config/db');
const { formatHolding } = require('../utils/date');
const { getQuotesForSymbols, enrichHoldingWithQuote } = require('../services/stockApiService');

async function getEnrichedHoldings(userId) {
  const [rows] = await pool.query(
    `SELECT id, symbol, quantity, buy_price, purchase_date, created_at
     FROM holdings
     WHERE user_id = ?`,
    [userId]
  );

  const holdings = rows.map(formatHolding);
  const quotes = await getQuotesForSymbols(holdings.map((h) => h.symbol));
  return holdings.map((h) => enrichHoldingWithQuote(h, quotes[h.symbol]));
}

async function getSummary(req, res, next) {
  try {
    const enriched = await getEnrichedHoldings(req.user.id);

    const totalInvested = enriched.reduce((sum, h) => sum + Number(h.total_invested || 0), 0);
    const totalCurrentValue = enriched.reduce(
      (sum, h) => sum + Number(h.current_value != null ? h.current_value : h.total_invested || 0),
      0
    );
    const totalGainLoss = totalCurrentValue - totalInvested;
    const totalGainLossPercent =
      totalInvested === 0 ? 0 : (totalGainLoss / totalInvested) * 100;

    const allocationMap = new Map();
    for (const holding of enriched) {
      const value = Number(
        holding.current_value != null ? holding.current_value : holding.total_invested || 0
      );
      allocationMap.set(holding.symbol, (allocationMap.get(holding.symbol) || 0) + value);
    }

    const allocation = [...allocationMap.entries()]
      .map(([symbol, value]) => ({
        symbol,
        value: Number(value.toFixed(2)),
        percent: totalCurrentValue === 0 ? 0 : Number(((value / totalCurrentValue) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);

    const ranked = [...enriched]
      .filter((h) => h.gain_loss_percent != null)
      .sort((a, b) => Number(b.gain_loss_percent) - Number(a.gain_loss_percent));

    const topMovers = {
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
    };

    res.json({
      summary: {
        total_invested: Number(totalInvested.toFixed(2)),
        total_current_value: Number(totalCurrentValue.toFixed(2)),
        total_gain_loss: Number(totalGainLoss.toFixed(2)),
        total_gain_loss_percent: Number(totalGainLossPercent.toFixed(2)),
        holdings_count: enriched.length,
        using_demo_prices: enriched.some((h) => h.price_source === 'demo'),
      },
      allocation,
      top_movers: topMovers,
    });
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT snapshot_date, total_value
       FROM portfolio_snapshots
       WHERE user_id = ?
       ORDER BY snapshot_date ASC`,
      [req.user.id]
    );

    res.json({
      history: rows.map((row) => ({
        date:
          row.snapshot_date instanceof Date
            ? row.snapshot_date.toISOString().slice(0, 10)
            : String(row.snapshot_date).slice(0, 10),
        total_value: Number(row.total_value),
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getHistory };
