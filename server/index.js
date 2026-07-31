require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (no Origin header) and configured frontends
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

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Stock Tracker API listening on http://localhost:${PORT}`);
});
