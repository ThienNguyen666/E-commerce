const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');
const { moderateLimiter, flexibleLimiter } = require('../middleware/rate_limiters.middleware');

router.get('/', flexibleLimiter, authMiddleware, adminMiddleware, voucherController.getAllVouchers);
router.post('/validate', moderateLimiter, authMiddleware, voucherController.validateVoucher);

module.exports = router;