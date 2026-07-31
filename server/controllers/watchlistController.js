const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { getQuotesForSymbols } = require('../services/stockApiService');

async function listWatchlist(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, symbol, created_at
       FROM watchlist
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const quotes = await getQuotesForSymbols(rows.map((row) => row.symbol));
    const items = rows.map((row) => {
      const quote = quotes[row.symbol];
      return {
        id: row.id,
        symbol: row.symbol,
        created_at: row.created_at,
        current_price: quote?.price ?? null,
        change_percent: quote?.changePercent ?? null,
        price_stale: quote ? Boolean(quote.stale) : true,
        price_timestamp: quote?.timestamp ?? null,
      };
    });

    res.json({ watchlist: items });
  } catch (err) {
    next(err);
  }
}

async function addWatchlistItem(req, res, next) {
  try {
    const symbol = String(req.body.symbol || '')
      .trim()
      .toUpperCase();
    if (!symbol) {
      throw new ApiError(400, 'Symbol is required');
    }

    try {
      const [result] = await pool.query(
        'INSERT INTO watchlist (user_id, symbol) VALUES (?, ?)',
        [req.user.id, symbol]
      );

      const quotes = await getQuotesForSymbols([symbol]);
      const quote = quotes[symbol];

      res.status(201).json({
        item: {
          id: result.insertId,
          symbol,
          current_price: quote?.price ?? null,
          change_percent: quote?.changePercent ?? null,
          price_stale: quote ? Boolean(quote.stale) : true,
          price_timestamp: quote?.timestamp ?? null,
        },
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new ApiError(409, 'Symbol is already on your watchlist');
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

async function removeWatchlistItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.query(
      'DELETE FROM watchlist WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (result.affectedRows === 0) {
      throw new ApiError(404, 'Watchlist item not found');
    }
    res.json({ message: 'Removed from watchlist' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listWatchlist, addWatchlistItem, removeWatchlistItem };
