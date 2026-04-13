// backend/routes/product.route.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');
const { moderateLimiter, flexibleLimiter } = require('../middleware/rate_limiters.middleware');

router.get('/categories', moderateLimiter, productController.getCategories);
router.get('/', moderateLimiter, productController.getAllProducts);
router.get('/:id', moderateLimiter, productController.getProductById);
router.post('/', flexibleLimiter, authMiddleware, adminMiddleware, productController.createProduct);
router.put('/:id', flexibleLimiter, authMiddleware, adminMiddleware, productController.updateProduct);
router.delete('/:id', flexibleLimiter, authMiddleware, adminMiddleware, productController.deleteProduct);

module.exports = router;