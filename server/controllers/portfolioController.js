const pool = require('../config/db');
const { formatHolding } = require('../utils/date');
const { getQuotesForSymbols, enrichHoldingWithQuote } = require('../services/stockApiService');

async function getSummary(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, symbol, quantity, buy_price, purchase_date, created_at
       FROM holdings
       WHERE user_id = ?`,
      [req.user.id]
    );

    const holdings = rows.map(formatHolding);
    const quotes = await getQuotesForSymbols(holdings.map((h) => h.symbol));
    const enriched = holdings.map((h) => enrichHoldingWithQuote(h, quotes[h.symbol]));

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
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
