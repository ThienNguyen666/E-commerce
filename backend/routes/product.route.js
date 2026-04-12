// backend/routes/product.route.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/product.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');

router.get('/categories', ctrl.getCategories);
router.get('/',    ctrl.getAllProducts);
router.get('/:id', ctrl.getProductById);
router.post('/',       authMiddleware, adminMiddleware, ctrl.createProduct);
router.put('/:id',     authMiddleware, adminMiddleware, ctrl.updateProduct);
router.delete('/:id',  authMiddleware, adminMiddleware, ctrl.deleteProduct);

module.exports = router;