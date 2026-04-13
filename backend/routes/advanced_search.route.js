const express = require('express');
const router = express.Router();
const productController = require('../controllers/advanced_search.controller');
const validateSearchQuery = require('../middleware/validate_search_query.middleware');
const { moderateLimiter } = require('../middleware/rate_limiters.middleware');

router.get('/search', moderateLimiter, validateSearchQuery, productController.searchProducts);

module.exports = router;