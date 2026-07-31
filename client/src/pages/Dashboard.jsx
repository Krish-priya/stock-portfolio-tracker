import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';
import * as holdingsApi from '../api/holdings';
import * as portfolioApi from '../api/portfolio';
import Modal from '../components/Modal';
import HoldingForm from '../components/HoldingForm';
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
  const { user, logout } = useAuth();
  const [holdings, setHoldings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [editingHolding, setEditingHolding] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [holdingsData, summaryData] = await Promise.all([
        holdingsApi.getHoldings(),
        portfolioApi.getPortfolioSummary(),
      ]);
      setHoldings(holdingsData);
      setSummary(summaryData.summary);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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
      <header className="dashboard-header">
        <h1>Stock Portfolio Tracker</h1>
        <div className="dashboard-user">
          <span>{user?.name}</span>
          <button onClick={logout} className="logout-button" type="button">
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-toolbar">
          <div>
            <h2>My Holdings</h2>
            <p className="dashboard-subtitle">
              Live prices {summary?.using_demo_prices ? '(demo mode — add a Finnhub API key for real quotes)' : 'from market data'}.
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
        ) : holdings.length === 0 ? (
          <div className="dashboard-empty">
            <h3>No holdings yet</h3>
            <p>Add your first stock to start tracking your portfolio.</p>
            <button type="button" className="btn-primary" onClick={openCreate}>
              Add Holding
            </button>
          </div>
        ) : (
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
                {holdings.map((holding) => (
                  <tr key={holding.id}>
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
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => openEdit(holding)}
                      >
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
