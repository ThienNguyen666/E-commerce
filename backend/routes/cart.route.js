const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/',                    ctrl.getCart);
router.post('/',                   ctrl.addToCart);
router.delete('/clear',            ctrl.clearCart);
router.delete('/:product_id',      ctrl.removeFromCart);

module.exports = router;