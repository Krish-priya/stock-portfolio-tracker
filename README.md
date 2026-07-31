# Stock Portfolio Tracker

Full-stack stock portfolio tracker with auth, holdings CRUD, live/demo prices, and portfolio summary.

## Tech Stack

- **Frontend:** React (Vite), React Router, Axios
- **Backend:** Node.js, Express
- **Database:** MySQL
- **Auth:** JWT + bcrypt
- **Prices:** Finnhub (or built-in demo prices when no API key is set)

## Project Structure

```
stock-tracker/
  client/     React frontend
  server/     Express API
```

## Local Setup

### 1. Database

```bash
cd server
cp .env.example .env   # set DB_PASSWORD, JWT_SECRET, optional STOCK_API_KEY
npm install
npm run setup-db
```

### 2. Server

```bash
cd server
npm run dev
```

API: `http://localhost:5000`

### 3. Client

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

## Verify

With the server running:

```bash
cd server
npm run smoke-test
```

## Live links

- **GitHub:** https://github.com/Krish-priya/stock-portfolio-tracker
- **Frontend (Vercel):** https://stock-portfolio-tracker-seven.vercel.app

> Note: the Vercel frontend still needs a **public backend + MySQL** to log in / load data. Locally use `http://localhost:5000`. After you host the API, set `VITE_API_BASE_URL` on Vercel and `CLIENT_ORIGIN` on the server to the Vercel URL.

## Production notes

- **Frontend (Vercel):** deploy the `client` folder. Set:
  - `VITE_API_BASE_URL` = your public API URL ending in `/api`
  - `VITE_SOCKET_URL` = your public API origin (for later Socket.IO steps)
- **Backend:** needs a Node host (Render/Railway/etc.) with MySQL. Set `CLIENT_ORIGIN` to your Vercel URL (comma-separated if multiple).
- Never commit `.env` files.

## Status

- [x] Step 1: Scaffolding
- [x] Step 2: Database
- [x] Step 3: Auth backend
- [x] Step 4: Auth frontend
- [x] Step 5: Holdings CRUD backend
- [x] Step 6: Holdings UI
- [x] Step 7: Stock price integration
- [ ] Step 8: Real-time Socket.IO (backend)
- [ ] Step 9: Real-time updates (frontend)
- [ ] Step 10: Charts & analytics
- [ ] Step 11: Watchlist
- [ ] Step 12: Polish & deploy hardening
