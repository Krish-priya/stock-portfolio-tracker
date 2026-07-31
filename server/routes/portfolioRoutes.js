const express = require('express');
const portfolioController = require('../controllers/portfolioController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/summary', portfolioController.getSummary);

module.exports = router;
