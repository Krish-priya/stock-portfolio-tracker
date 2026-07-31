# Stock Portfolio Tracker

Full-stack stock portfolio tracker with auth, holdings CRUD, live/demo prices, analytics charts, watchlist, and Socket.IO streaming.

## Tech Stack

- **Frontend:** React (Vite), React Router, Axios, Recharts, Socket.IO client
- **Backend:** Node.js, Express, Socket.IO
- **Database:** MySQL
- **Auth:** JWT + bcrypt
- **Prices:** Finnhub (or built-in demo prices when no API key is set)

## Live links

- **GitHub:** https://github.com/Krish-priya/stock-portfolio-tracker
- **Frontend (Vercel):** https://stock-portfolio-tracker-seven.vercel.app

> On Vercel, **Continue as guest** uses built-in browser demo mode (because the public site cannot call your local `localhost:5000` API). Locally, the React app still uses your real Express + MySQL backend.

## Local Setup

### 1. Database + seed

```bash
cd server
cp .env.example .env
npm install
npm run setup-db
npm run seed
```

Demo login: `alex@demo.com` / `password123`

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

```bash
cd server
npm run smoke-test
```

## Features

- JWT signup/login + guest preview account
- Holdings CRUD with gain/loss calculations
- Portfolio summary, allocation chart, value history, top movers
- Watchlist with live price updates
- Socket.IO price streaming with Live/Offline indicator
- Branded logo + tab title

## Production notes

- Deploy `client` to Vercel and set `VITE_API_BASE_URL` / `VITE_SOCKET_URL`
- Deploy `server` to a Node host with MySQL and set `CLIENT_ORIGIN` to your Vercel URL
