const express = require('express');
const router = express.Router();
const productController = require('../controllers/advanced_search.controller');
const validateSearchQuery = require('../middleware/validate_search_query.middleware');

router.get('/search', validateSearchQuery, productController.searchProducts);

module.exports = router;