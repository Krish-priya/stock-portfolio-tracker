const express = require('express');
const { body, param } = require('express-validator');
const watchlistController = require('../controllers/watchlistController');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(requireAuth);

router.get('/', watchlistController.listWatchlist);

router.post(
  '/',
  [
    body('symbol')
      .trim()
      .notEmpty()
      .withMessage('Symbol is required')
      .isLength({ min: 1, max: 10 })
      .withMessage('Symbol must be 1-10 characters')
      .matches(/^[A-Za-z.]+$/)
      .withMessage('Symbol must contain only letters and dots'),
  ],
  validate,
  watchlistController.addWatchlistItem
);

router.delete(
  '/:id',
  [param('id').isInt({ gt: 0 }).withMessage('Invalid watchlist id')],
  validate,
  watchlistController.removeWatchlistItem
);

module.exports = router;
