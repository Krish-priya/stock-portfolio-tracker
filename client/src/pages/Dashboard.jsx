import { useCallback, useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '../utils/errors';
import * as holdingsApi from '../api/holdings';
import * as portfolioApi from '../api/portfolio';
import Modal from '../components/Modal';
import HoldingForm from '../components/HoldingForm';
import Navbar from '../components/Navbar';
import { AllocationChart, ValueHistoryChart } from '../components/PortfolioCharts';
import useLivePrices from '../hooks/useLivePrices';
import './Dashboard.css';

function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(2)}%`;
}

function formatQuantity(value) {
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

function gainClass(value) {
  if (value == null || Number.isNaN(Number(value)) || Number(value) === 0) return '';
  return Number(value) > 0 ? 'positive' : 'negative';
}

export default function Dashboard() {
  const [holdings, setHoldings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [allocation, setAllocation] = useState([]);
  const [history, setHistory] = useState([]);
  const [topMovers, setTopMovers] = useState({ gainers: [], losers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [editingHolding, setEditingHolding] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { prices, flash, connected } = useLivePrices();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [holdingsData, summaryData, historyData] = await Promise.all([
        holdingsApi.getHoldings(),
        portfolioApi.getPortfolioSummary(),
        portfolioApi.getPortfolioHistory(),
      ]);
      setHoldings(holdingsData);
      setSummary(summaryData.summary);
      setAllocation(summaryData.allocation || []);
      setTopMovers(summaryData.top_movers || { gainers: [], losers: [] });
      setHistory(historyData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const liveHoldings = useMemo(() => {
    return holdings.map((holding) => {
      const live = prices[holding.symbol];
      if (!live?.price) return holding;
      const quantity = Number(holding.quantity);
      const buyPrice = Number(holding.buy_price);
      const invested = quantity * buyPrice;
      const currentValue = quantity * Number(live.price);
      const gainLoss = currentValue - invested;
      return {
        ...holding,
        current_price: Number(live.price),
        current_value: Number(currentValue.toFixed(2)),
        gain_loss: Number(gainLoss.toFixed(2)),
        gain_loss_percent: invested === 0 ? 0 : Number(((gainLoss / invested) * 100).toFixed(2)),
        change_percent: live.changePercent,
        price_stale: Boolean(live.stale),
      };
    });
  }, [holdings, prices]);

  function openCreate() {
    setEditingHolding(null);
    setModalMode('create');
  }

  function openEdit(holding) {
    setEditingHolding(holding);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditingHolding(null);
  }

  async function handleCreate(payload) {
    await holdingsApi.createHolding(payload);
    closeModal();
    await loadDashboard();
  }

  async function handleUpdate(payload) {
    await holdingsApi.updateHolding(editingHolding.id, payload);
    closeModal();
    await loadDashboard();
  }

  async function handleDelete(holding) {
    const confirmed = window.confirm(
      `Delete ${holding.symbol} holding (${formatQuantity(holding.quantity)} shares)?`
    );
    if (!confirmed) return;

    setDeletingId(holding.id);
    try {
      await holdingsApi.deleteHolding(holding.id);
      await loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard-main">
        <div className="dashboard-toolbar">
          <div>
            <h2>My Holdings</h2>
            <p className="dashboard-subtitle">
              {connected ? 'Live prices streaming' : 'Reconnecting to live prices'}
              {summary?.using_demo_prices ? ' · demo market data' : ''}.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={openCreate}>
            Add Holding
          </button>
        </div>

        {summary && !loading && (
          <div className="summary-cards">
            <div className="summary-card">
              <span className="summary-label">Invested</span>
              <strong>{formatMoney(summary.total_invested)}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Current Value</span>
              <strong>{formatMoney(summary.total_current_value)}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Gain / Loss</span>
              <strong className={gainClass(summary.total_gain_loss)}>
                {formatMoney(summary.total_gain_loss)} ({formatPercent(summary.total_gain_loss_percent)})
              </strong>
            </div>
          </div>
        )}

        {!loading && (
          <section className="dashboard-section">
            <div className="section-heading">
              <h3>Analytics</h3>
              <p>Scroll to explore allocation breakdown and portfolio value history.</p>
            </div>
            <div className="analytics-grid">
              <AllocationChart allocation={allocation} />
              <ValueHistoryChart history={history} />
            </div>
          </section>
        )}

        {!loading && (topMovers.gainers?.length > 0 || topMovers.losers?.length > 0) && (
          <section className="dashboard-section">
            <div className="section-heading">
              <h3>Market movers in your portfolio</h3>
              <p>Biggest percentage winners and laggards based on your buy prices.</p>
            </div>
            <div className="movers-grid">
              <div className="movers-card">
                <h3>Top gainers</h3>
                {topMovers.gainers.map((item) => (
                  <div key={`g-${item.symbol}`} className="mover-row">
                    <strong>{item.symbol}</strong>
                    <span className="positive">{formatPercent(item.gain_loss_percent)}</span>
                  </div>
                ))}
              </div>
              <div className="movers-card">
                <h3>Top losers</h3>
                {topMovers.losers.map((item) => (
                  <div key={`l-${item.symbol}`} className="mover-row">
                    <strong>{item.symbol}</strong>
                    <span className="negative">{formatPercent(item.gain_loss_percent)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {error && (
          <div className="dashboard-banner error">
            <span>{error}</span>
            <button type="button" onClick={loadDashboard}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="dashboard-state">Loading holdings...</div>
        ) : liveHoldings.length === 0 ? (
          <div className="dashboard-empty">
            <h3>No holdings yet</h3>
            <p>Add your first stock to start tracking your portfolio.</p>
            <button type="button" className="btn-primary" onClick={openCreate}>
              Add Holding
            </button>
          </div>
        ) : (
          <section className="dashboard-section">
            <div className="section-heading">
              <h3>Holdings detail</h3>
              <p>Edit positions anytime. Rows flash when a live price update arrives.</p>
            </div>
            <div className="holdings-table-wrap">
              <table className="holdings-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Quantity</th>
                    <th>Buy Price</th>
                    <th>Current Price</th>
                    <th>Invested</th>
                    <th>Current Value</th>
                    <th>Gain / Loss</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {liveHoldings.map((holding) => (
                    <tr
                      key={holding.id}
                      className={flash[holding.symbol] ? 'price-flash' : undefined}
                    >
                      <td className="symbol-cell">
                        {holding.symbol}
                        {holding.price_stale ? <span className="stale-tag">stale</span> : null}
                      </td>
                      <td>{formatQuantity(holding.quantity)}</td>
                      <td>{formatMoney(holding.buy_price)}</td>
                      <td>{formatMoney(holding.current_price)}</td>
                      <td>{formatMoney(holding.total_invested)}</td>
                      <td>{formatMoney(holding.current_value)}</td>
                      <td className={gainClass(holding.gain_loss)}>
                        {formatMoney(holding.gain_loss)}
                        <div className="gain-sub">{formatPercent(holding.gain_loss_percent)}</div>
                      </td>
                      <td className="actions-cell">
                        <button type="button" className="link-button" onClick={() => openEdit(holding)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="link-button danger"
                          onClick={() => handleDelete(holding)}
                          disabled={deletingId === holding.id}
                        >
                          {deletingId === holding.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && (
          <>
            <section className="dashboard-section insights-grid">
              <article className="insight-card">
                <h3>Portfolio health</h3>
                <p>
                  You currently track <strong>{summary?.holdings_count || 0}</strong> holdings.
                  Diversification looks strongest when no single symbol dominates allocation.
                </p>
              </article>
              <article className="insight-card">
                <h3>Live market feed</h3>
                <p>
                  Socket status is <strong>{connected ? 'connected' : 'reconnecting'}</strong>.
                  Price cells update automatically when the server broadcasts new quotes.
                </p>
              </article>
              <article className="insight-card">
                <h3>Next actions</h3>
                <ul>
                  <li>Add another holding to refine allocation</li>
                  <li>Open Watchlist to follow tickers you do not own yet</li>
                  <li>Compare value history against your invested capital</li>
                </ul>
              </article>
            </section>

            <section className="dashboard-section tips-panel">
              <div>
                <h3>How to read this dashboard</h3>
                <p>
                  Start with the summary cards for total performance, then use allocation and history
                  charts for context. Holdings detail is your source of truth for each position.
                </p>
              </div>
              <div className="tips-list">
                <div>
                  <strong>Green values</strong>
                  <span>Unrealized gain versus your buy price</span>
                </div>
                <div>
                  <strong>Red values</strong>
                  <span>Unrealized loss versus your buy price</span>
                </div>
                <div>
                  <strong>Stale tag</strong>
                  <span>Showing last known quote while refresh is delayed</span>
                </div>
              </div>
            </section>

            <footer className="dashboard-footer">
              <p>Stock Portfolio Tracker · Scroll for summary, analytics, movers, holdings, and insights</p>
            </footer>
          </>
        )}
      </main>

      {modalMode && (
        <Modal
          title={modalMode === 'create' ? 'Add Holding' : 'Edit Holding'}
          onClose={closeModal}
        >
          <HoldingForm
            initialValues={editingHolding}
            onSubmit={modalMode === 'create' ? handleCreate : handleUpdate}
            onCancel={closeModal}
            submitLabel={modalMode === 'create' ? 'Add Holding' : 'Save Changes'}
          />
        </Modal>
      )}
    </div>
  );
}
