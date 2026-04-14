const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { moderateLimiter, strictLimiter } = require('../middleware/rate_limiters.middleware');

router.use(moderateLimiter);
router.use(authMiddleware);

router.post('/', strictLimiter, orderController.placeOrder);
router.get('/', moderateLimiter, orderController.getMyOrders);
router.get('/:id', moderateLimiter, orderController.getOrderById);

module.exports = router;