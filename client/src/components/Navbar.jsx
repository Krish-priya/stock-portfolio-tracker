import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { connected } = useSocket();

  return (
    <header className="navbar">
      <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar-brand">
        <img src="/logo.png" alt="" />
        <span>Stock Portfolio Tracker</span>
      </Link>

      {isAuthenticated ? (
        <nav className="navbar-links">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/watchlist">Watchlist</NavLink>
          <span className={`live-pill ${connected ? 'on' : 'off'}`}>
            {connected ? 'Live' : 'Offline'}
          </span>
          <span className="navbar-user">{user?.name}</span>
          <button type="button" className="navbar-logout" onClick={logout}>
            Log out
          </button>
        </nav>
      ) : (
        <nav className="navbar-links">
          <Link to="/login">Log in</Link>
          <Link to="/signup" className="navbar-cta">
            Get started
          </Link>
        </nav>
      )}
    </header>
  );
}
