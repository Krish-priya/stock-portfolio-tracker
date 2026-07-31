import { useEffect, useState } from 'react';
import { getErrorMessage } from '../utils/errors';
import './HoldingForm.css';

function toDateInputValue(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const emptyForm = {
  symbol: '',
  quantity: '',
  buy_price: '',
  purchase_date: '',
};

export default function HoldingForm({ initialValues, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setForm({
        symbol: initialValues.symbol || '',
        quantity: String(initialValues.quantity ?? ''),
        buy_price: String(initialValues.buy_price ?? ''),
        purchase_date: toDateInputValue(initialValues.purchase_date),
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialValues]);

  function updateField(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const symbol = form.symbol.trim().toUpperCase();
    const quantity = Number(form.quantity);
    const buy_price = Number(form.buy_price);
    const purchase_date = form.purchase_date;

    if (!symbol) {
      setError('Symbol is required');
      return;
    }
    if (!(quantity > 0)) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (!(buy_price > 0)) {
      setError('Buy price must be greater than 0');
      return;
    }
    if (!purchase_date) {
      setError('Purchase date is required');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ symbol, quantity, buy_price, purchase_date });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="holding-form" onSubmit={handleSubmit}>
      {error && <div className="holding-form-error">{error}</div>}

      <div className="form-field">
        <label htmlFor="symbol">Symbol</label>
        <input
          id="symbol"
          value={form.symbol}
          onChange={updateField('symbol')}
          placeholder="AAPL"
          autoComplete="off"
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="quantity">Quantity</label>
        <input
          id="quantity"
          type="number"
          min="0"
          step="any"
          value={form.quantity}
          onChange={updateField('quantity')}
          placeholder="10"
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="buy_price">Buy price</label>
        <input
          id="buy_price"
          type="number"
          min="0"
          step="any"
          value={form.buy_price}
          onChange={updateField('buy_price')}
          placeholder="150.00"
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="purchase_date">Purchase date</label>
        <input
          id="purchase_date"
          type="date"
          value={form.purchase_date}
          onChange={updateField('purchase_date')}
          required
        />
      </div>

      <div className="holding-form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
