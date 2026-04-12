const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/order.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/',    ctrl.placeOrder);
router.get('/',     ctrl.getMyOrders);
router.get('/:id',  ctrl.getOrderById);

module.exports = router;