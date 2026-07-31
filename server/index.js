require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { initSocket } = require('./config/socket');
const { startPriceBroadcast, stopPriceBroadcast } = require('./services/priceBroadcastService');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Stock Tracker API is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/holdings', require('./routes/holdingsRoutes'));
app.use('/api/portfolio', require('./routes/portfolioRoutes'));
app.use('/api/watchlist', require('./routes/watchlistRoutes'));

app.use(notFoundHandler);
app.use(errorHandler);

initSocket(server, allowedOrigins);
startPriceBroadcast();

server.listen(PORT, () => {
  console.log(`Stock Tracker API listening on http://localhost:${PORT}`);
});

function shutdown() {
  stopPriceBroadcast();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
