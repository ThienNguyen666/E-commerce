const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/voucher.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');

router.get('/',              authMiddleware, adminMiddleware, ctrl.getAllVouchers);
router.post('/validate',     authMiddleware, ctrl.validateVoucher);

module.exports = router;