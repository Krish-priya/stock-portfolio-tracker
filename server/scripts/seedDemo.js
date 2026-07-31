require('dotenv').config();

const bcrypt = require('bcrypt');
const pool = require('../config/db');

const DEMO_PASSWORD = 'password123';

const demoUsers = [
  { name: 'Alex Morgan', email: 'alex@demo.com' },
  { name: 'Sam Rivera', email: 'sam@demo.com' },
];

const demoHoldings = {
  'alex@demo.com': [
    { symbol: 'AAPL', quantity: 15, buy_price: 148.5, purchase_date: '2024-03-12' },
    { symbol: 'MSFT', quantity: 8, buy_price: 320.0, purchase_date: '2024-05-20' },
    { symbol: 'GOOGL', quantity: 12, buy_price: 135.25, purchase_date: '2024-07-08' },
    { symbol: 'TSLA', quantity: 6, buy_price: 210.75, purchase_date: '2024-09-01' },
    { symbol: 'AMZN', quantity: 10, buy_price: 175.4, purchase_date: '2024-11-15' },
  ],
  'sam@demo.com': [
    { symbol: 'NVDA', quantity: 5, buy_price: 420.0, purchase_date: '2024-04-18' },
    { symbol: 'META', quantity: 7, buy_price: 290.5, purchase_date: '2024-06-22' },
    { symbol: 'NFLX', quantity: 4, buy_price: 380.0, purchase_date: '2024-08-30' },
  ],
};

const demoWatchlist = {
  'alex@demo.com': ['NVDA', 'META', 'AMD'],
  'sam@demo.com': ['AAPL', 'TSLA'],
};

async function upsertUser(user, passwordHash) {
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [user.email]);
  if (existing.length > 0) {
    await pool.query('UPDATE users SET name = ?, password_hash = ? WHERE id = ?', [
      user.name,
      passwordHash,
      existing[0].id,
    ]);
    return existing[0].id;
  }

  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [user.name, user.email, passwordHash]
  );
  return result.insertId;
}

function dateDaysAgo(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

async function seedSnapshots(userId, holdings) {
  await pool.query('DELETE FROM portfolio_snapshots WHERE user_id = ?', [userId]);
  const invested = holdings.reduce((sum, h) => sum + h.quantity * h.buy_price, 0);

  for (let daysAgo = 13; daysAgo >= 0; daysAgo -= 1) {
    const growth = 1 + (14 - daysAgo) * 0.012 + ((userId + daysAgo) % 5) * 0.004;
    const totalValue = Number((invested * growth).toFixed(2));
    await pool.query(
      `INSERT INTO portfolio_snapshots (user_id, total_value, snapshot_date)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE total_value = VALUES(total_value)`,
      [userId, totalValue, dateDaysAgo(daysAgo)]
    );
  }
}

async function seed() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const user of demoUsers) {
    const userId = await upsertUser(user, passwordHash);
    await pool.query('DELETE FROM holdings WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM watchlist WHERE user_id = ?', [userId]);

    const holdings = demoHoldings[user.email] || [];
    for (const holding of holdings) {
      await pool.query(
        `INSERT INTO holdings (user_id, symbol, quantity, buy_price, purchase_date)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, holding.symbol, holding.quantity, holding.buy_price, holding.purchase_date]
      );
    }

    const watchlist = demoWatchlist[user.email] || [];
    for (const symbol of watchlist) {
      await pool.query('INSERT INTO watchlist (user_id, symbol) VALUES (?, ?)', [userId, symbol]);
    }

    await seedSnapshots(userId, holdings);

    console.log(
      `Seeded ${user.email}: ${holdings.length} holdings, ${watchlist.length} watchlist, 14 snapshots (password: ${DEMO_PASSWORD})`
    );
  }

  console.log('Dummy data seed complete.');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
