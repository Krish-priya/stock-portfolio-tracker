import { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getErrorMessage } from '../utils/errors';
import * as watchlistApi from '../api/watchlist';
import useLivePrices from '../hooks/useLivePrices';
import './Watchlist.css';

function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
}

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { prices, connected } = useLivePrices();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await watchlistApi.getWatchlist());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const item = await watchlistApi.addWatchlistSymbol(symbol);
      setItems((prev) => [item, ...prev]);
      setSymbol('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id) {
    try {
      await watchlistApi.removeWatchlistItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="watchlist-page">
      <Navbar />
      <main>
        <div className="watchlist-header">
          <div>
            <h1>Watchlist</h1>
            <p>Follow tickers without owning them. Prices stream while you stay {connected ? 'live' : 'offline'}.</p>
          </div>
          <form onSubmit={handleAdd} className="watchlist-form">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Add symbol (e.g. AMD)"
              required
            />
            <button type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>

        {error && <div className="watchlist-error">{error}</div>}

        {loading ? (
          <div className="watchlist-empty">Loading watchlist...</div>
        ) : items.length === 0 ? (
          <div className="watchlist-empty">No symbols yet. Add a ticker to start watching.</div>
        ) : (
          <div className="watchlist-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Price</th>
                  <th>Day change</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const live = prices[item.symbol];
                  const price = live?.price ?? item.current_price;
                  const change = live?.changePercent ?? item.change_percent;
                  return (
                    <tr key={item.id}>
                      <td className="symbol">{item.symbol}</td>
                      <td>{formatMoney(price)}</td>
                      <td className={Number(change) >= 0 ? 'positive' : 'negative'}>
                        {formatPercent(change)}
                      </td>
                      <td>
                        <button type="button" onClick={() => handleRemove(item.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
