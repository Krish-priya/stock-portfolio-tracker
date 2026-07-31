const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { formatHolding } = require('../utils/date');
const {
  getQuotesForSymbols,
  enrichHoldingWithQuote,
  getQuote,
} = require('../services/stockApiService');

async function listHoldings(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, symbol, quantity, buy_price, purchase_date, created_at
       FROM holdings
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const holdings = rows.map(formatHolding);
    const quotes = await getQuotesForSymbols(holdings.map((h) => h.symbol));
    const enriched = holdings.map((h) => enrichHoldingWithQuote(h, quotes[h.symbol]));

    res.json({ holdings: enriched });
  } catch (err) {
    next(err);
  }
}

async function enrichSingleHolding(holding) {
  try {
    const quote = await getQuote(holding.symbol);
    return enrichHoldingWithQuote(holding, quote);
  } catch {
    return enrichHoldingWithQuote(holding, null);
  }
}

async function createHolding(req, res, next) {
  try {
    const { symbol, quantity, buy_price, purchase_date } = req.body;
    const normalizedSymbol = String(symbol).trim().toUpperCase();

    const [result] = await pool.query(
      `INSERT INTO holdings (user_id, symbol, quantity, buy_price, purchase_date)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, normalizedSymbol, quantity, buy_price, purchase_date]
    );

    const [rows] = await pool.query(
      `SELECT id, symbol, quantity, buy_price, purchase_date, created_at
       FROM holdings WHERE id = ? AND user_id = ?`,
      [result.insertId, req.user.id]
    );

    res.status(201).json({ holding: await enrichSingleHolding(formatHolding(rows[0])) });
  } catch (err) {
    next(err);
  }
}

async function updateHolding(req, res, next) {
  try {
    const holdingId = Number(req.params.id);
    const { symbol, quantity, buy_price, purchase_date } = req.body;
    const normalizedSymbol = String(symbol).trim().toUpperCase();

    const [existing] = await pool.query(
      'SELECT id FROM holdings WHERE id = ? AND user_id = ?',
      [holdingId, req.user.id]
    );
    if (existing.length === 0) {
      throw new ApiError(404, 'Holding not found');
    }

    await pool.query(
      `UPDATE holdings
       SET symbol = ?, quantity = ?, buy_price = ?, purchase_date = ?
       WHERE id = ? AND user_id = ?`,
      [normalizedSymbol, quantity, buy_price, purchase_date, holdingId, req.user.id]
    );

    const [rows] = await pool.query(
      `SELECT id, symbol, quantity, buy_price, purchase_date, created_at
       FROM holdings WHERE id = ? AND user_id = ?`,
      [holdingId, req.user.id]
    );

    res.json({ holding: await enrichSingleHolding(formatHolding(rows[0])) });
  } catch (err) {
    next(err);
  }
}

async function deleteHolding(req, res, next) {
  try {
    const holdingId = Number(req.params.id);

    const [result] = await pool.query(
      'DELETE FROM holdings WHERE id = ? AND user_id = ?',
      [holdingId, req.user.id]
    );

    if (result.affectedRows === 0) {
      throw new ApiError(404, 'Holding not found');
    }

    res.json({ message: 'Holding deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHoldings, createHolding, updateHolding, deleteHolding };
