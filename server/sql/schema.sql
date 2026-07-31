-- Stock Portfolio Tracker schema

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS holdings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  buy_price DECIMAL(15,4) NOT NULL,
  purchase_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_holdings_user_id (user_id),
  INDEX idx_holdings_symbol (symbol)
);

CREATE TABLE IF NOT EXISTS watchlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_watchlist_user_id (user_id),
  INDEX idx_watchlist_symbol (symbol),
  UNIQUE KEY uq_watchlist_user_symbol (user_id, symbol)
);

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_value DECIMAL(18,2) NOT NULL,
  snapshot_date DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_snapshots_user_id (user_id),
  UNIQUE KEY uq_snapshot_user_date (user_id, snapshot_date)
);
