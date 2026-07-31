import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Home.css';

const highlights = [
  {
    title: 'Live portfolio tracking',
    text: 'Watch holdings update with streamed market prices and clear gain/loss metrics.',
  },
  {
    title: 'Visual analytics',
    text: 'Allocation charts, value history, and top movers help you explain performance quickly.',
  },
  {
    title: 'Watchlist + auth',
    text: 'JWT-secured accounts, sample guest access, and a dedicated watchlist for tickers you follow.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Sign in or try guest preview',
    text: 'Use your account or jump in instantly with the demo credentials on the login page.',
  },
  {
    step: '02',
    title: 'Add your holdings',
    text: 'Track symbol, quantity, buy price, and purchase date for every position you own.',
  },
  {
    step: '03',
    title: 'Analyze performance',
    text: 'Review allocation, value history, and top movers while live prices stream in.',
  },
];

const stack = [
  { name: 'React + Vite', detail: 'Fast SPA with modern routing and component architecture' },
  { name: 'Express + Node', detail: 'REST APIs, validation, and JWT-protected endpoints' },
  { name: 'MySQL', detail: 'Relational storage for users, holdings, watchlist, and snapshots' },
  { name: 'Socket.IO', detail: 'Near real-time price updates without full page refresh' },
];

export default function Home() {
  return (
    <div className="home-page">
      <Navbar />
      <main>
        <section className="home-hero">
          <div className="home-hero-copy">
            <p className="home-eyebrow">Full-stack portfolio platform</p>
            <h1>Stock Portfolio Tracker</h1>
            <p className="home-lead">
              A resume-ready React + Express + MySQL app for managing holdings, streaming prices,
              and visualizing portfolio performance in real time.
            </p>
            <div className="home-actions">
              <Link to="/login" className="home-primary">
                Try guest preview
              </Link>
              <Link to="/signup" className="home-secondary">
                Create account
              </Link>
            </div>
          </div>
          <div className="home-hero-panel">
            <div className="home-logo-badge">
              <img src="/logo.svg" alt="Stock Portfolio Tracker logo" />
            </div>
            <h2 className="home-panel-title">Built for demos & interviews</h2>
            <p className="home-panel-text">
              One product that shows auth, CRUD, analytics, and live updates end to end.
            </p>
            <ul>
              <li>JWT authentication</li>
              <li>MySQL holdings CRUD</li>
              <li>Socket.IO live prices</li>
              <li>Charts + watchlist</li>
            </ul>
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-heading">
            <p className="home-eyebrow">Why it stands out</p>
            <h2>Everything a modern portfolio app needs</h2>
          </div>
          <div className="home-grid">
            {highlights.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-heading">
            <p className="home-eyebrow">How it works</p>
            <h2>From login to live insights in three steps</h2>
          </div>
          <div className="home-steps">
            {steps.map((item) => (
              <article key={item.step} className="home-step-card">
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-heading">
            <p className="home-eyebrow">Tech stack</p>
            <h2>Clean architecture you can explain in interviews</h2>
          </div>
          <div className="home-stack">
            {stack.map((item) => (
              <article key={item.name}>
                <h3>{item.name}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-cta">
          <div>
            <h2>Ready to explore the dashboard?</h2>
            <p>Open the guest preview and scroll through holdings, charts, movers, and insights.</p>
          </div>
          <Link to="/login" className="home-primary">
            Continue as guest
          </Link>
        </section>
      </main>

      <footer className="home-footer">
        <p>Stock Portfolio Tracker · React · Express · MySQL · Socket.IO</p>
      </footer>
    </div>
  );
}
