const express = require('express');
const { body, param } = require('express-validator');
const holdingsController = require('../controllers/holdingsController');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const holdingBodyRules = [
  body('symbol')
    .trim()
    .notEmpty()
    .withMessage('Symbol is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Symbol must be 1-10 characters')
    .matches(/^[A-Za-z.]+$/)
    .withMessage('Symbol must contain only letters and dots'),
  body('quantity')
    .isFloat({ gt: 0 })
    .withMessage('Quantity must be a number greater than 0'),
  body('buy_price')
    .isFloat({ gt: 0 })
    .withMessage('Buy price must be a number greater than 0'),
  body('purchase_date')
    .isISO8601({ strict: true })
    .withMessage('Purchase date must be a valid date (YYYY-MM-DD)'),
];

router.use(requireAuth);

router.get('/', holdingsController.listHoldings);

router.post('/', holdingBodyRules, validate, holdingsController.createHolding);

router.put(
  '/:id',
  [param('id').isInt({ gt: 0 }).withMessage('Invalid holding id'), ...holdingBodyRules],
  validate,
  holdingsController.updateHolding
);

router.delete(
  '/:id',
  [param('id').isInt({ gt: 0 }).withMessage('Invalid holding id')],
  validate,
  holdingsController.deleteHolding
);

module.exports = router;
