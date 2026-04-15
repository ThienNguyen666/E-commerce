const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { moderateLimiter } = require('../middleware/rate_limiters.middleware');

router.get('/my', moderateLimiter, authMiddleware, reviewController.getUserReviews);
router.get('/to-review', moderateLimiter, authMiddleware, reviewController.getProductsToReview);

module.exports = router;