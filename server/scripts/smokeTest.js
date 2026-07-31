/**
 * End-to-end API smoke test for Stock Tracker.
 * Usage: node scripts/smokeTest.js
 * Requires server running on PORT (default 5000) and MySQL configured.
 */
require('dotenv').config();

const BASE = `http://localhost:${process.env.PORT || 5000}/api`;

async function request(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const email = `smoke_${Date.now()}@example.com`;
  const password = 'password123';
  let passed = 0;

  console.log('1. Health check');
  let res = await request('GET', '/health');
  assert(res.status === 200 && res.data.status === 'ok', 'Health check failed');
  passed += 1;

  console.log('2. Signup');
  res = await request('POST', '/auth/signup', {
    body: { name: 'Smoke Tester', email, password },
  });
  assert(res.status === 201 && res.data.token, `Signup failed: ${JSON.stringify(res.data)}`);
  const token = res.data.token;
  passed += 1;

  console.log('3. Duplicate signup rejected');
  res = await request('POST', '/auth/signup', {
    body: { name: 'Smoke Tester', email, password },
  });
  assert(res.status === 409, `Expected 409, got ${res.status}`);
  passed += 1;

  console.log('4. Login');
  res = await request('POST', '/auth/login', { body: { email, password } });
  assert(res.status === 200 && res.data.token, 'Login failed');
  passed += 1;

  console.log('5. Me');
  res = await request('GET', '/auth/me', { token });
  assert(res.status === 200 && res.data.user.email === email, 'Me failed');
  passed += 1;

  console.log('6. Create holding');
  res = await request('POST', '/holdings', {
    token,
    body: {
      symbol: 'aapl',
      quantity: 5,
      buy_price: 100,
      purchase_date: '2024-06-15',
    },
  });
  assert(res.status === 201 && res.data.holding.symbol === 'AAPL', 'Create holding failed');
  assert(res.data.holding.current_price != null, 'Holding missing current_price');
  const holdingId = res.data.holding.id;
  passed += 1;

  console.log('7. List holdings with prices');
  res = await request('GET', '/holdings', { token });
  assert(res.status === 200 && res.data.holdings.length >= 1, 'List holdings failed');
  assert(res.data.holdings[0].gain_loss != null, 'Missing gain_loss');
  passed += 1;

  console.log('8. Portfolio summary');
  res = await request('GET', '/portfolio/summary', { token });
  assert(res.status === 200 && res.data.summary.holdings_count >= 1, 'Summary failed');
  passed += 1;

  console.log('9. Update holding');
  res = await request('PUT', `/holdings/${holdingId}`, {
    token,
    body: {
      symbol: 'AAPL',
      quantity: 8,
      buy_price: 100,
      purchase_date: '2024-06-15',
    },
  });
  assert(res.status === 200 && Number(res.data.holding.quantity) === 8, 'Update failed');
  passed += 1;

  console.log('10. Validation errors');
  res = await request('POST', '/holdings', {
    token,
    body: { symbol: '!!!', quantity: -1, buy_price: 0, purchase_date: 'bad' },
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  passed += 1;

  console.log('11. Unauthorized access');
  res = await request('GET', '/holdings');
  assert(res.status === 401, `Expected 401, got ${res.status}`);
  passed += 1;

  console.log('12. Delete holding');
  res = await request('DELETE', `/holdings/${holdingId}`, { token });
  assert(res.status === 200, 'Delete failed');
  res = await request('GET', '/holdings', { token });
  assert(res.data.holdings.every((h) => h.id !== holdingId), 'Holding still present after delete');
  passed += 1;

  console.log('13. Watchlist add/list/delete');
  res = await request('POST', '/watchlist', { token, body: { symbol: 'AMD' } });
  assert(res.status === 201 && res.data.item.symbol === 'AMD', 'Watchlist add failed');
  const watchId = res.data.item.id;
  res = await request('GET', '/watchlist', { token });
  assert(res.status === 200 && res.data.watchlist.some((item) => item.id === watchId), 'Watchlist list failed');
  res = await request('DELETE', `/watchlist/${watchId}`, { token });
  assert(res.status === 200, 'Watchlist delete failed');
  passed += 1;

  console.log('14. Portfolio history');
  res = await request('GET', '/portfolio/history', { token });
  assert(res.status === 200 && Array.isArray(res.data.history), 'History failed');
  passed += 1;

  console.log(`\nAll ${passed} checks passed.`);
}

run().catch((err) => {
  console.error('\nSmoke test failed:', err.message);
  process.exit(1);
});
