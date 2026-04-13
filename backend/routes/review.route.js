const express = require('express');
const router = express.Router({ mergeParams: true }); // to get :id from parent
const reviewController = require('../controllers/review.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { moderateLimiter } = require('../middleware/rate_limiters.middleware');

router.get('/', moderateLimiter, reviewController.getProductReviews);
router.post('/', moderateLimiter, authMiddleware, reviewController.createReview);
router.put('/:reviewId', moderateLimiter, authMiddleware, reviewController.updateReview);
router.delete('/:reviewId', moderateLimiter, authMiddleware, reviewController.deleteReview);

module.exports = router;