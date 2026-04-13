const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { moderateLimiter } = require('../middleware/rate_limiters.middleware');

router.use(authMiddleware);
router.use(moderateLimiter);

router.get('/',                    cartController.getCart);
router.post('/',                   cartController.addToCart);
router.delete('/clear',            cartController.clearCart);
router.delete('/:product_id',      cartController.removeFromCart);

module.exports = router;