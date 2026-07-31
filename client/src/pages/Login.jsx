import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';
import './Auth.css';

const DEMO_EMAIL = 'alex@demo.com';
const DEMO_PASSWORD = 'password123';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  async function authenticate(nextEmail, nextPassword) {
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: nextEmail, password: nextPassword });
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await authenticate(email, password);
  }

  async function handleGuestPreview() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    await authenticate(DEMO_EMAIL, DEMO_PASSWORD);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/logo.svg" alt="Stock Portfolio Tracker logo" />
          <span>Stock Portfolio Tracker</span>
        </div>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Log in to track your portfolio</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="auth-divider" aria-hidden="true">
          <span>or</span>
        </div>

        <section className="guest-preview" aria-label="Guest preview access">
          <div className="guest-preview-top">
            <div className="guest-avatar" aria-hidden="true">
              AM
            </div>
            <div className="guest-preview-copy">
              <p className="guest-preview-eyebrow">Guest preview</p>
              <h2>Explore a sample portfolio</h2>
              <p>
                Instantly view live holdings, prices, and gains — no signup required.
                On the live website, guest mode works with built-in demo data.
              </p>
            </div>
          </div>

          <div className="guest-access-details">
            <div className="guest-access-item">
              <span>Email</span>
              <strong>{DEMO_EMAIL}</strong>
            </div>
            <div className="guest-access-item">
              <span>Password</span>
              <strong>{DEMO_PASSWORD}</strong>
            </div>
          </div>

          <button
            type="button"
            className="guest-preview-button"
            onClick={handleGuestPreview}
            disabled={submitting}
          >
            {submitting ? 'Opening preview...' : 'Continue as guest'}
          </button>
        </section>

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}