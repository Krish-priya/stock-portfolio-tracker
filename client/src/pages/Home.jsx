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
            <img src="/logo.png" alt="" />
            <ul>
              <li>JWT authentication</li>
              <li>MySQL holdings CRUD</li>
              <li>Socket.IO live prices</li>
              <li>Charts + watchlist</li>
            </ul>
          </div>
        </section>

        <section className="home-grid">
          {highlights.map((item) => (
            <article key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
