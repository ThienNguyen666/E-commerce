const express = require('express');
const router = express.Router({ mergeParams: true }); // to get :id from parent
const ctrl = require('../controllers/review.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.get('/',               ctrl.getProductReviews);
router.post('/',              authMiddleware, ctrl.createReview);
router.put('/:reviewId',      authMiddleware, ctrl.updateReview);
router.delete('/:reviewId',   authMiddleware, ctrl.deleteReview);

module.exports = router;